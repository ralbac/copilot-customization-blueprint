#!/usr/bin/env bash
# preToolUse guardrail: deny shell commands that are destructive and hard to undo.
#
# Contract for a preToolUse command hook:
#   * stdin carries a JSON object with camelCase keys: sessionId, timestamp, cwd, toolName, toolArgs.
#   * stdout must carry AT MOST ONE final JSON object: {"permissionDecision":"allow|deny|ask", ...}
#     Extra JSON objects on stdout concatenate into invalid JSON and the whole output is ignored.
#   * A non-zero exit, a crash, or exit 2 DENIES the call even if stdout says "allow".
#     Timeouts are the exception: they fail open and the call proceeds.
#   * Because of that fail-closed rule, this script exits 0 on every non-matching path and
#     expresses a denial through JSON, never through a non-zero exit code.
#
# Keep this script fast. Hook execution blocks the agent, and a timeout silently disables the
# guardrail you thought you had.
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
        // A malformed payload is not a reason to block every tool call for the rest of the
        // session. Stay out of the way and leave the call to the normal permission flow.
        process.stdout.write("allow:unreadable-payload");
        return;
      }

      const toolName = String(input.toolName ?? input.tool_name ?? "");
      const args = input.toolArgs ?? input.tool_input ?? {};

      // Only shell execution is in scope. Everything else falls through untouched.
      const isShell = /^(bash|shell|powershell|execute)$/i.test(toolName);
      if (!isShell) {
        process.stdout.write("allow:not-a-shell-tool");
        return;
      }

      const command = typeof args === "string" ? args : String(args.command ?? args.cmd ?? args.script ?? "");

      const rules = [
        { id: "force-push", re: /git\s+push\b[^\n]*(--force\b|--force-with-lease\b|\s-f\b)/i,
          reason: "Force-pushing rewrites published history. Ask a human to run this." },
        { id: "recursive-delete-root", re: /rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+(\/|\/\*|~|\$HOME)\s*$/i,
          reason: "Recursive delete of a root path is irreversible." },
        { id: "pipe-to-shell", re: /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba)?sh\b/i,
          reason: "Piping a download into a shell executes unreviewed code." },
        { id: "credential-exfiltration", re: /\b(cat|less|more|head|tail|strings)\b[^\n]*(\.env\b|id_rsa\b|\.pem\b|\.aws\/credentials)/i,
          reason: "Reading credential files into the transcript leaks them into the model context." },
        { id: "history-rewrite", re: /\bgit\s+(rebase\s+-i|filter-branch|commit\s+--amend\s+--no-edit\s+HEAD~)/i,
          reason: "Interactive history rewriting is a human decision, not an agent step." },
        { id: "database-drop", re: /\b(drop\s+database|drop\s+schema|truncate\s+table)\b/i,
          reason: "Destructive SQL requires an explicit human decision." },
        { id: "chmod-world", re: /\bchmod\s+(-R\s+)?777\b/i,
          reason: "World-writable permissions are a security defect, not a shortcut." },
        { id: "unprotected-secret-write", re: /\b(gh\s+secret\s+set|gh\s+variable\s+set)\b/i,
          reason: "Secrets are set by a human, from a human-controlled source." },
      ];

      for (const rule of rules) {
        if (rule.re.test(command)) {
          process.stdout.write("deny:" + rule.id + "|" + rule.reason);
          return;
        }
      }

      process.stdout.write("allow:no-rule-matched");
    });
  '
)"

verdict="${decision%%:*}"
detail="${decision#*:}"

if [ "$verdict" = "deny" ]; then
  rule="${detail%%|*}"
  reason="${detail#*|}"
  printf '{"permissionDecision":"deny","permissionDecisionReason":"[%s] %s"}\n' "$rule" "$reason"
fi

exit 0
