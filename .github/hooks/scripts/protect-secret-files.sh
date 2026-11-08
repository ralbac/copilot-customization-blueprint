#!/usr/bin/env bash
# preToolUse guardrail: deny reading or writing likely-secret files.
#
# Same contract as deny-dangerous-command.sh: exit 0 always, deny through stdout JSON only.
set -uo pipefail

payload="$(cat)"

decision="$(
  printf '%s' "$payload" | node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c));
    process.stdin.on("end", () => {
      let input;
      try {
        input = JSON.parse(raw);
      } catch {
        process.stdout.write("allow:unreadable-payload");
        return;
      }

      const toolName = String(input.toolName ?? input.tool_name ?? "");
      const args = input.toolArgs ?? input.tool_input ?? {};

      const isFileAccess = /^(view|read|edit|write|multiedit|str_replace|create)$/i.test(toolName);
      if (!isFileAccess) {
        process.stdout.write("allow:not-a-file-tool");
        return;
      }

      const rawPath =
        typeof args === "string"
          ? args
          : String(args.path ?? args.filePath ?? args.file_path ?? args.file ?? "");

      // Normalise separators so the Windows paths a PowerShell hook sees match too.
      const path = rawPath.replace(/\\/g, "/").toLowerCase();

      const blocked = [
        { re: /(^|\/)\.env(\.|$)/, reason: "Environment files hold live credentials. Read the .env.example template instead." },
        { re: /\.(pem|key|pfx|p12)$/, reason: "Private keys must not enter the model context." },
        { re: /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/, reason: "SSH private keys must not enter the model context." },
        { re: /(^|\/)\.aws\/credentials$/, reason: "Cloud credentials must not enter the model context." },
        { re: /(^|\/)\.npmrc$/, reason: "The npmrc may carry a publish token. Ask a human to check it." },
        { re: /(^|\/)\.git\/config$/, reason: "Repository config changes are a human decision." },
      ];

      for (const rule of blocked) {
        if (rule.re.test(path)) {
          process.stdout.write("deny:" + rule.reason);
          return;
        }
      }

      process.stdout.write("allow:no-rule-matched");
    });
  '
)"

if [ "${decision%%:*}" = "deny" ]; then
  printf '{"permissionDecision":"deny","permissionDecisionReason":"%s"}\n' "${decision#*:}"
fi

exit 0
