# Practice labs

Ten labs and a capstone that turn the theory track into procedures you execute in this
repository. Every lab ends with a check that produces an observable result, including at
least one deliberately wrong result so you can tell success from a plausible-looking failure.

## How a lab differs from a chapter

A chapter explains why a mechanism exists, when to reach for it, and how it fails; a lab is a
procedure you perform against the real files in this repository, and it is not finished until
you have observed the check. Chapters are read and contain the reasoning; labs are executed
and contain the exact commands, the exact text to paste, and the signal that proves the
mechanism worked. When a lab needs the explanation behind a step, it links to the chapter
rather than restating it, because two copies of an explanation drift and then disagree.

## Start here

If you have ninety minutes, do [lab 01](01-first-instruction.md), then
[lab 04](04-first-agent.md), then [lab 06](06-hooks.md). That is one lab per mechanism in
[the mental model](../docs/00-mental-model.md): always-on prompt injection, a capability
boundary, and a deterministic hook. Labs 01 and 04 need an IDE or Copilot CLI, and lab 06
needs only a shell, so the set is reproducible even if you lose access to Copilot halfway
through.

The full order is numeric, and later labs assume the files the earlier ones left in place:

1. [01 — First instruction](01-first-instruction.md)
2. [02 — Path-scoped instructions](02-path-scoped-instructions.md)
3. [03 — Prompt file](03-prompt-file.md)
4. [04 — First agent](04-first-agent.md)
5. [05 — First skill](05-first-skill.md)
6. [06 — Hooks](06-hooks.md)
7. [07 — MCP](07-mcp.md)
8. [08 — Agent environment](08-agent-environment.md)
9. [09 — Guardrails audit](09-guardrails.md)
10. [10 — Capstone](10-capstone.md)

## Prerequisites

| Requirement | Why | Check |
| --- | --- | --- |
| Node.js 20 or newer | The validator, the tests, and the hook scripts | `node --version` |
| This repository, cloned | Every lab names real files in it | `npm run check` exits 0 |
| A Copilot surface | Labs 01-05 and 07 need one; the surface decides what you can prove | See the per-lab table |
| A POSIX shell | Labs 06 and 09 run bash scripts | `bash --version` |

On Windows, labs 06 and 09 use the bash twins of the hook scripts. Run them in WSL or Git
Bash, or run the `.ps1` twin that sits beside each `.sh` file; the PowerShell scripts implement
the same decision contract.

## The ten labs

| Lab | What you prove | Surface needed | Time |
| --- | --- | --- | --- |
| [01](01-first-instruction.md) | A repository-wide instruction reaches the model in a fresh session | IDE, Copilot CLI, or github.com | 20 min |
| [02](02-path-scoped-instructions.md) | A quoted glob matches a `.ts` file and does not match a `.md` file | IDE | 25 min |
| [03](03-prompt-file.md) | A prompt file finds the fixture's authorization defect, and separates *missing* from *not verified* | IDE only — prompt files do not exist on github.com or in Copilot CLI | 25 min |
| [04](04-first-agent.md) | A tool grant is a capability boundary, not an instruction | IDE or Copilot CLI | 20 min |
| [05](05-first-skill.md) | Discovery reads `name` and `description`; effectiveness is a second, separate question | IDE, CLI, or github.com | 40 min |
| [06](06-hooks.md) | A `preToolUse` hook denies through JSON and exits 0, and stays silent otherwise | A shell. No Copilot surface at all | 15 min |
| [07](07-mcp.md) | The editor reads a committed file; the cloud reads repository settings and a secret prefix | VS Code, plus github.com for the cloud half | 30 min |
| [08](08-agent-environment.md) | Only a named job with honoured keys on the default branch changes the agent's environment | github.com, plus push access | 30 min |
| [09](09-guardrails.md) | A control is enforcement only when you can name the runtime that applies it | github.com settings, plus the clone | 40 min |
| [10](10-capstone.md) | A complete customization set that passes the validator with exit 0 | IDE and a terminal | 120 min |

The surface column is the part people skip and then debug for an hour. A prompt file that
works in VS Code is invisible in Copilot CLI, and a hook that denies an edit in the cloud agent
does nothing in an IDE build that does not load hooks. [The cheat sheet](../reference/cheat-sheet.md)
has the full matrix.

## Conventions these labs share

- Every command runs from the repository root, unless the step says otherwise.
- Every path is relative to the repository root.
- "Fresh session" means a new chat session. Copilot reads customization files when a session
  starts, so a chat that was open before your edit keeps the old context.
- `examples/shop-api/` is a fixed fixture. It contains a deliberate authorization defect in
  `src/api/orders.ts`, and no lab asks you to fix it. If a lab edit escapes, revert it.
- A lab that changes a file tells you how to revert it in its own **Clean up** section. Run
  `git status --short` before you move to the next lab, and expect it to be empty.
- The validator names the file and line of every problem. Run
  `node scripts/validate-customizations.mjs` after any edit under `.github/`; while you work,
  problems reported in files you did not touch belong to whatever else is in progress.

## When nothing works

Read the lab's own **If it does not work** table first; it lists the failures that actually
happen. If the symptom is "the file is correct and has no effect", the cause is usually
discovery rather than content: wrong path, wrong filename, wrong surface, or a session that
started before the file existed. [Verification](../docs/11-verification.md) is the chapter
for that order of questions.
