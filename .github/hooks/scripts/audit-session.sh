#!/usr/bin/env bash
# sessionStart / sessionEnd audit trail.
#
# This hook demonstrates the logging use of hooks: it records that a session happened, when,
# and where. It deliberately records no prompt text and no environment dump, because those
# are exactly the things that turn an audit log into a data leak.
#
# A hook's non-zero exit is logged and skipped for session events, but keep the exit code
# honest anyway: a broken log should be visible, not silent.
set -uo pipefail

phase="${1:-unknown}"
log="${AUDIT_LOG:-.copilot-audit/session.log}"

# stdin carries the session payload. Keep it out of the log; only the timestamp and cwd are
# recorded, and only when the payload parses.
payload="$(cat)"
cwd="$(printf '%s' "$payload" | node -e '
  let raw = "";
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    try {
      const i = JSON.parse(raw);
      process.stdout.write(String(i.cwd ?? ""));
    } catch {
      process.stdout.write("");
    }
  });
' 2>/dev/null || true)"

mkdir -p "$(dirname "$log")" 2>/dev/null || exit 0

printf '%s\t%s\t%s\t%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$phase" \
  "${cwd:-unknown}" \
  "hooks=guardrails.json" >>"$log" 2>/dev/null || exit 0

exit 0
