---
applyTo: ".github/agents/**,.github/skills/**,.github/prompts/**,.github/hooks/**,.github/instructions/**,AGENTS.md,REVIEW.md"
description: "Contract rules for editing the Copilot customization set itself."
---

# Customization configuration instructions

These files are machine-read. A typo does not produce an error message; it produces a
silently ignored customization. Treat every edit here as a schema edit.

## Frontmatter

- Use only properties listed in `reference/frontmatter-reference.md`. An unknown property
  is not "extra documentation"; it is either ignored or a parse failure.
- Quote every glob and every value containing `:`, `*`, `{`, or `[`. Unquoted `*` at the
  start of a YAML scalar is a parse error.
- Keep the YAML block first in the file. No blank line before the opening `---`.

## Skills

- The directory name and the `name` property must match, lowercase, hyphens only. If they
  diverge, the skill silently fails to load and gives no error.
- `description` must state both what the skill does and when to use it. Discovery matches
  on that string alone; a description that only says what the skill is will never be
  selected automatically.
- Keep the body under roughly 500 lines. Move depth into sibling files that the body links
  to; the loader reads those only when the body references them.

## Agents

- `description` is required. Name the role and the task boundary, not the personality.
- Restrict `tools` to the smallest set that does the job. A reviewer with `edit` is a
  reviewer that will eventually edit.
- Keep the body under the 30,000-character limit. If it approaches that, the agent is
  hiding a skill: extract the procedure into a skill the agent invokes.

## Prompts

- `argument-hint` describes the shape of the argument, not its purpose.
- Reference other files by relative Markdown link so the reader of the prompt can follow
  it. Do not inline a document that already exists.

## Hooks

- `version` is `1`. The top-level key is `hooks`.
- Every entry has `type: "command"` and at least one of `bash` or `powershell`. Provide
  both when the repository is used on more than one operating system.
- Set `timeoutSec`. The default is 30 seconds and hooks block the agent while they run.
- Never echo secrets, tokens, or full environment dumps to a log.
