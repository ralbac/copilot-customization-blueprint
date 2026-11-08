# Lab 06 — Exercise a hook directly

## Goal

You will be able to prove that the `preToolUse` guardrail in `.github/hooks/guardrails.json`
expresses a denial as one JSON object on stdout with exit code 0, and produces no output at all
for a command that matches no rule.

## What you need

- A POSIX shell: bash on macOS or Linux, WSL or Git Bash on Windows.
- Node.js 20 or newer on `PATH`. The hook scripts shell out to `node` to parse the payload.
- No Copilot surface, no model, and no network. This is the most reliably reproducible lab in
  the track: it runs the same script the runtime runs, with the same input contract, so the
  result does not depend on a version of an IDE or on a session.

## Before you start

Open `.github/hooks/guardrails.json` and `.github/hooks/scripts/deny-dangerous-command.sh`.
The expected state:

- `preToolUse` holds two command entries, both with `cwd: "."` and `timeoutSec: 5`: the
  dangerous-command guard and the secret-file guard.
- The script's header states the contract: one JSON object at most on stdout, `exit 0` on every
  non-matching path, and a non-zero exit or exit 2 denies the call regardless of stdout.
- The script's last line is `exit 0`.

## Steps

1. Read the payload contract in the script header. `stdin` carries a JSON object with camelCase
   keys — `sessionId`, `cwd`, `toolName`, `toolArgs` — and the script only inspects `toolName`
   and `toolArgs`.

2. Run the pipeline with a placeholder as the command. The payload never executes anything: the
   hook reads it as data and prints a decision.

   ```bash
   printf '%s' '{"sessionId":"lab-06","cwd":".","toolName":"bash","toolArgs":{"command":"REPLACE_ME_WITH_A_DENIED_COMMAND"}}' \
     | ./.github/hooks/scripts/deny-dangerous-command.sh; echo "exit=$?"
   ```

   Expected output: no output from the hook, then `exit=0`. No rule matches a placeholder, so
   the script falls through silently, which is the correct behaviour.

3. Now put a denied command inside the payload. Replace `REPLACE_ME_WITH_A_DENIED_COMMAND` with
   the text `git push --force origin main` and run the same pipeline. The text stays inside the
   quotes: if you ever paste it into a shell as a command, it will do what it says, and this lab
   never asks you to do that.

   Expected output, verbatim:

   ```text
   {"permissionDecision":"deny","permissionDecisionReason":"[force-push] Force-pushing rewrites published history. Ask a human to run this."}
   exit=0
   ```

4. Repeat with a different rule, to show that the rule identifier is in the message. Replace the
   payload's command with `chmod -R 777 /srv/app`:

   ```text
   {"permissionDecision":"deny","permissionDecisionReason":"[chmod-world] World-writable permissions are a security defect, not a shortcut."}
   exit=0
   ```

5. Run the non-matching case with a command you use constantly:

   ```bash
   printf '%s' '{"sessionId":"lab-06","cwd":".","toolName":"bash","toolArgs":{"command":"git status --short"}}' \
     | ./.github/hooks/scripts/deny-dangerous-command.sh; echo "exit=$?"
   ```

   Expected: `exit=0` and nothing before it. "Nothing" is easy to mistake for "nothing visible",
   so prove it:

   ```bash
   out="$(printf '%s' '{"toolName":"bash","toolArgs":{"command":"git status --short"}}' \
     | ./.github/hooks/scripts/deny-dangerous-command.sh)"
   if [ -z "$out" ]; then echo "empty output"; fi
   ```

   Expected: `empty output`.

6. Exercise the second guard, which covers file tools rather than shell tools. Send a `read`
   payload for an environment file:

   ```bash
   printf '%s' '{"toolName":"read","toolArgs":{"path":"config/.env.local"}}' \
     | ./.github/hooks/scripts/protect-secret-files.sh; echo "exit=$?"
   ```

   Expected output:

   ```text
   {"permissionDecision":"deny","permissionDecisionReason":"Environment files hold live credentials. Read the .env.example template instead."}
   exit=0
   ```

   Then send a payload for a documentation file. Expected: no output, `exit=0`.

7. Read the exit-code rules once more, because they are the part that bites. Exit 0 uses the
   stdout JSON, or falls through when there is none. Exit 2 denies, merged with a deny even if
   stdout says `allow`. Any other non-zero exit, or a crash, denies. A timeout **allows** the
   call: the guardrail silently disappears. That asymmetry is why a hook script must always exit
   0 and deny through JSON, and why `timeoutSec` is set to 5 rather than left at the default 30.

## Check

Success is the exact output of steps 3, 4, 5 and 6. Three plausible-looking failures:

| What you see | What it means |
| --- | --- |
| The deny case prints nothing and exits 0 | `node` is not on `PATH`, so the decision string is empty and the script falls through to allow. In a live session the guardrail silently stops existing |
| Two JSON objects, or JSON plus a log line, on stdout | The output is not one JSON object, so it is ignored and the call proceeds. Debug output belongs on stderr or in a log file |
| `exit=1`, `exit=2` or `exit=126` on any case above | The script failed or was not executable. In a live `preToolUse` hook, that denies **every** tool call in the session |

The first row is the one to internalise: a guardrail that fails silently in the permissive
direction looks identical to a guardrail that is working, because the visible symptom of a
working allow path is also silence.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Permission denied` when running the script | The executable bit is missing after a copy or a Windows checkout | `chmod +x .github/hooks/scripts/*.sh`, or run `bash ./.github/hooks/scripts/deny-dangerous-command.sh` |
| The deny case prints nothing and exits 0 | `node` is missing from the hook's `PATH` | Install Node.js 20 or newer; a hook runs in the shell the runtime starts, which may not be your login shell |
| Output is valid JSON but the session still runs the command | The hook is not loaded by that surface | Hooks are generally available in Copilot CLI and the cloud agent and in preview in VS Code; check the surface, then the file path |
| Every tool call is denied after you edit the script | A path you added exits non-zero or crashes | Exit 0 and deny through JSON |
| A command you expected to be denied runs | The rule list is a denylist and no pattern matched | Add the pattern, and add a case to `scripts/test/hooks.test.mjs` in the same change |
| The script is slow and the deny stops working | It exceeded `timeoutSec`, and a timeout fails open | Keep the script fast; raise `timeoutSec` only as a last resort |

## Clean up

Nothing in the repository changed:

```bash
git status --short
```

Expected: no output. Starting a real session later makes the `sessionStart` hook append to
`.copilot-audit/session.log`; that path is ignored by git, so it will not appear here.

## What you just proved

A hook is the only customization mechanism that produces a guarantee rather than an instruction,
because the runtime applies the decision and the model never sees it. The decision travels as
exactly one JSON object on stdout, and the exit code is a second, coarser channel that can only
deny — which is why a script that exits non-zero to mean "nothing to do" disables the session,
and a script that times out enforces nothing. The other half of the lesson is scope: a denylist
covers the patterns it lists, over the tool names it matches, and this guard covers shell
execution only.
