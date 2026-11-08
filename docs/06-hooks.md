# Hooks

A hook is a command that the runtime runs at a defined point in a session, and whose decision the
runtime enforces. By the end of this chapter you will be able to write a working `preToolUse`
guardrail, state exactly when it denies and when it stops enforcing, and avoid the two mistakes
that turn a guardrail into an outage.

## The only deterministic mechanism

Every other mechanism in this repository is prompt injection: words the model reads and usually
follows. A hook is not. When a `preToolUse` hook denies a tool call, the call does not happen, and
no amount of model enthusiasm changes that.

Hooks are **GA in Copilot CLI and the Copilot cloud agent**, and **in preview in VS Code**. That
split matters more than usual here, because a hook that enforces in the cloud and does nothing in
the editor is not an enforcement layer — it is a partial one, and you need to know which one you
have.

A hook file lives at `.github/hooks/NAME.json` and is JSON, not Markdown. Nothing in it is prose
the model reads, so it costs no context at all.

## The configuration

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/scripts/check.sh",
        "powershell": "./.github/hooks/scripts/check.ps1",
        "cwd": ".",
        "env": { "LOG_LEVEL": "INFO" },
        "timeoutSec": 5
      }
    ]
  }
}
```

| Property | Required | Notes |
| --- | --- | --- |
| `type` | Yes | Must be `"command"`. |
| `bash` | Yes on Unix | Script to run. |
| `powershell` | Yes on Windows | Script to run. |
| `cwd` | No | Working directory, relative to the repository root. |
| `env` | No | Extra environment variables merged with the existing environment. |
| `timeoutSec` | No | Default 30. Keep under 5 where possible. |
| `matcher` | No | Regex tested against the tool name, anchored as `^(?:PATTERN)$`. |

The top-level `version` is `1`, and the `hooks` object maps event names to arrays of entries. One
event can carry several entries, and all of them run. The reference configuration is
[`.github/hooks/guardrails.json`](../.github/hooks/guardrails.json), with three scripts under
[`.github/hooks/scripts/`](../.github/hooks/scripts).

## The events

| Event | Fires | Can decide |
| --- | --- | --- |
| `sessionStart` | A session begins or resumes | No |
| `sessionEnd` | A session completes or is terminated | No |
| `userPromptSubmitted` | The user submits a prompt | No |
| `preToolUse` | Before a tool runs | **Yes — allow or deny** |
| `postToolUse` | After a tool completes | No |
| `postToolUseFailure` | After a tool fails | No |
| `agentStop` | The main agent finishes responding | No |
| `subagentStop` | A subagent completes | No |
| `errorOccurred` | An error occurs during agent execution | No |
| `permissionRequest` | Before the permission service runs | No. **Copilot CLI only** |
| `notification` | A system notification fires | No. **Copilot CLI only** |
| `preCompact` | Context compaction is about to begin | No |

`preToolUse` is the enforcement point. Everything else observes, records or reacts, and an event
name that is not in this table never fires — the validator warns about it, because a hook that
never runs looks exactly like a hook that runs and approves.

## The decision contract

This is the part that gets the most mistakes, and the consequences are not symmetrical: a mistake
in the permissive direction disables the guardrail, and a mistake in the restrictive direction
disables the agent.

A `preToolUse` hook writes **exactly one JSON object** to stdout:

| Field | Values | Notes |
| --- | --- | --- |
| `permissionDecision` | `allow`, `deny`, `ask` | Empty output falls through to normal permission handling. |
| `permissionDecisionReason` | string | Required when denying. The agent reads it. |
| `modifiedArgs` | object | Substitute tool arguments. |

```json
{ "permissionDecision": "deny", "permissionDecisionReason": "Force-pushing rewrites published history. Ask a human to run this." }
```

Exactly one object, not one per line. Two objects on stdout concatenate into invalid JSON and the
whole output is discarded, which means the decision is discarded with it.

The reason is for the agent, not for a log. `deny-dangerous-command.sh` returns findings such as
"Reading credential files into the transcript leaks them into the model context", which tells the
agent what to do instead. "Blocked by policy" does not, and the agent will try a variation.

### Exit codes

| Exit | Effect on `preToolUse` |
| --- | --- |
| `0` | Use the stdout JSON, or fall through if there is none |
| `2` | **Deny**, merged with a deny decision even if stdout says `allow` |
| Other non-zero | **Deny** (fail-closed) |
| Crash | **Deny** (fail-closed) |
| Timeout | **Allow** (fail-open) |

Note what this table says as a whole. The default posture on failure is denial, and the single
exception is the timeout — which is also the failure a slow guardrail produces most often.

## The two traps

### Trap one: fail-closed on a non-zero exit

A script that exits `1` to mean "nothing to do" denies **every** tool call in the session. Not the
call it was considering. Every call, in every subsequent turn, until the session ends.

This is the most expensive bug you can ship in a hook, because it looks like a broken agent rather
than a broken guardrail, and the developer debugs the task instead of the script.

The fix is a rule with no exceptions:

- Exit `0` on every non-matching path.
- Express a denial through stdout JSON, never through an exit code.
- Exit `2` only when you deliberately want a denial you cannot express in JSON.

Both `preToolUse` scripts in this repository carry that rule in their header, and
`deny-dangerous-command.sh` implements it literally: it computes a verdict, prints a deny object
only when the verdict is a deny, and exits `0`.

### Trap two: fail-open on timeout

A hook that exceeds `timeoutSec` is killed, and the tool call proceeds. The guardrail silently
stops enforcing, with no error the user will notice.

Two habits protect against it:

- **Set `timeoutSec` explicitly.** The default is 30 seconds. A default that large means a hanging
  script keeps the agent waiting before the guardrail quietly disappears.
- **Keep the script fast.** A guardrail that reads the whole repository or calls a network service
  is not a guardrail, it is a delay. Both reference scripts parse one JSON object from stdin with a
  small Node program and match regular expressions against the command string.

Hooks run synchronously and block the agent. Every millisecond a `preToolUse` hook spends is a
millisecond of the session, and a slow hook is paid on every tool call, not once.

## What the runtime sends

The hook receives a JSON object on stdin. The key names depend on how the hook was configured:

| Configuration | Payload keys |
| --- | --- |
| `hooks` object with the native camelCase events | `sessionId`, `cwd`, `toolName`, `toolArgs` |
| PascalCase event names used by VS Code and Claude Code | `hook_event_name`, `tool_name`, `tool_input` |

A hook that must work across surfaces reads both shapes. The reference scripts do it in one
expression, `String(input.toolName ?? input.tool_name ?? "")`, and they normalize Windows path
separators for the same reason: the PowerShell hook sees paths the bash hook never sees.

A malformed payload is not a reason to deny every remaining tool call. `deny-dangerous-command.sh`
returns `allow` on an unreadable payload and lets the normal permission flow take over, which is a
deliberate trade: correctness of the guardrail against the availability of the session.

## Security rules for hook scripts

A hook script is privileged code. It runs with the repository's configuration, without asking the
model for permission, and its output goes into a decision the user may never inspect.

- **Never log secrets, tokens, or a full environment dump.** `audit-session.sh` records a
  timestamp, a phase, a working directory and the hook file name, and its header says why: those
  extra fields are exactly what turns an audit log into a data leak.
- **Never log prompt text.** It is the highest-value content in the session and the least
  necessary for an audit trail.
- **Keep the decision logic readable.** A guardrail nobody can review is a guardrail nobody can
  trust. Regular expressions with a named rule id and a stated reason are reviewable; a 200-line
  parser is not.
- **Treat the directory as security-owned.** [`.github/CODEOWNERS`](../.github/CODEOWNERS) routes
  `.github/hooks/` to both the AI governance and security owners, because this is the one
  customization that can act on its own.

## What the reference set does

| Hook | Event | Behaviour |
| --- | --- | --- |
| [`deny-dangerous-command.sh`](../.github/hooks/scripts/deny-dangerous-command.sh) | `preToolUse` | Denies force-pushes, recursive deletes of root paths, piping a download into a shell, credential reads, history rewrites, destructive SQL, `chmod 777`, and secret writes |
| [`protect-secret-files.sh`](../.github/hooks/scripts/protect-secret-files.sh) | `preToolUse` | Denies reading or writing `.env` files, private keys, SSH keys, cloud credentials, `.npmrc` and `.git/config` |
| [`audit-session.sh`](../.github/hooks/scripts/audit-session.sh) | `sessionStart`, `sessionEnd` | Appends a timestamped line with the phase and working directory |

Read them as templates, not as a complete policy. The rule list is a starting point you extend with
the commands that are destructive in *your* repository — a schema migration, a deploy, a package
publish.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Every tool call is denied, in every turn | The script exits non-zero on a non-matching path | Exit `0` always; deny through stdout JSON |
| Every tool call is denied after a file move | The configured script path no longer exists, so the hook crashes | Keep the path in the configuration and in the repository in step |
| The guardrail stops working after a few minutes of use | The script is slower than `timeoutSec`, and a timeout fails open | Set `timeoutSec` explicitly and make the script fast |
| A tool call is denied with a message that is not one of your reasons | The script exited `2` or another non-zero code, so the exit code decided instead of the JSON | Exit `0` on every path and deny through stdout JSON |
| The guardrail silently approves everything | stdout carried more than one JSON object, so the whole output was discarded | Print exactly one object, and keep logging off stdout |
| The hook never fires | The event name is misspelled, or the surface does not support hooks | Use an event from the table; check the surface's support |
| The hook works in the cloud and not in the editor | Hooks are in preview in VS Code and GA in CLI and the cloud agent | Verify on the surface you need before promising it |
| The deny reason is unhelpful and the agent retries | The reason names the policy instead of the consequence | State what goes wrong and what to do instead |

## Practice

[Lab 06](../labs/06-hooks.md) has you add a `preToolUse` rule, watch it deny, then break the exit
code on purpose and watch it deny everything — the failure that is impossible to forget once you
have caused it.

Next: [MCP](07-mcp.md), which is how the agent reaches tools that live outside the repository.
