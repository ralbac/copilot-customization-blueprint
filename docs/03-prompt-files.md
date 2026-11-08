# Prompt files

A prompt file is a saved prompt you invoke on purpose, by name, instead of retyping it. By the
end of this chapter you will be able to write one with typed inputs and a pinned tool list,
know exactly which surfaces read it, and decide whether what you are writing belongs in a
prompt file or in a skill.

## Invoked, not always-on

Every mechanism so far has been content you receive. A prompt file is content you ask for.

The file lives at `.github/prompts/NAME.prompt.md` and appears as the slash command `/NAME` in
the chat input. Prompt files are **GA in VS Code, Visual Studio, JetBrains IDEs and Xcode, and
are not available on github.com or in Copilot CLI** — that limitation is the first design
constraint, not a footnote, because a prompt file is invisible to a teammate whose work happens
in a terminal.

The reference examples in this repository are in
[`.github/prompts/`](../.github/prompts):

| File | Invoked as | What it does |
| --- | --- | --- |
| [`review-api-security.prompt.md`](../.github/prompts/review-api-security.prompt.md) | `/review-api-security` | Audits an API surface for authentication, authorization, validation and data exposure |
| [`triage-issue.prompt.md`](../.github/prompts/triage-issue.prompt.md) | `/triage-issue` | Classifies a bug report and produces a reproduction plan, without editing code |
| [`write-adr.prompt.md`](../.github/prompts/write-adr.prompt.md) | `/write-adr` | Drafts an Architecture Decision Record in the repository's existing ADR format |

## The frontmatter

| Property | Type | Purpose |
| --- | --- | --- |
| `name` | string | The slash-command name. Defaults to the filename. Lowercase, hyphens. |
| `description` | string | Shown in the picker; used for recommendations. |
| `argument-hint` | string | Placeholder shown in the chat input, e.g. `[path to the file]`. |
| `agent` | string | `ask`, `agent`, `plan`, or the name of a custom agent. Defaults to the current agent; if `tools` is set, the default becomes `agent`. |
| `model` | string | Model to run the prompt with. Defaults to the currently selected model. |
| `tools` | list | Tools available to this prompt. Accepts `<server>/*` to include every tool from an MCP server. Overrides the agent's tool list. |

Every property is optional, which is why a prompt file with a mistyped key produces no error:
the key is ignored and the prompt runs with a default you did not choose. Keep to the six above.

`argument-hint` describes the *shape* of the argument, not its purpose. `[path to the API folder
or file]` tells the reader what to type. `[what you want reviewed]` does not.

## The in-body syntax

The body is the prompt itself, and four substitutions are available inside it:

| Syntax | Meaning |
| --- | --- |
| `${input:name}` | Prompt the user for a value |
| `${input:name:placeholder}` | Same, with placeholder text |
| `${selection}` | The current editor selection |
| `#file:path` | Reference a file |
| `#tool:name` | Reference a tool |

`${selection}` is what makes a prompt file feel different from a saved paragraph: you select the
function, then invoke the prompt, and the selection travels with it. A prompt that uses
`${selection}` should say what it expects to receive, because it also runs when nothing is
selected.

`#file:` and `#tool:` are references, not inclusions you control at authoring time. If the file
matters to the outcome, name it in prose as well ("read the two most recent files in the ADR
directory"), so the prompt still works when the reference resolves to something unexpected.

## Tool resolution priority

Three lists can apply to one invocation, and they resolve in this order:

1. `tools` in the prompt file.
2. The `tools` of the agent named in `agent`.
3. The defaults of the agent selected in the UI.

Two consequences follow. First, adding `tools` to a prompt changes the default agent to `agent`
mode, which is the opposite of what most authors expect when they are narrowing a prompt down.
Second, a prompt that pins `tools: ["read", "search"]` cannot edit a file even if the surrounding
session could — which is why the security review prompt in this repository pins exactly that list.

That is the same principle as [custom agents](04-custom-agents.md): the tool list is a boundary,
not a suggestion. If a prompt must not write, remove the writing tools rather than asking the
model politely to hold back.

## Prompt file or skill

Both are content you invoke. The difference is who can invoke it, and on which surface.

| Dimension | Prompt file | Skill |
| --- | --- | --- |
| Surface | VS Code, Visual Studio, JetBrains IDEs, Xcode | Most surfaces, including github.com, Copilot CLI and code review |
| Selection | You, by typing `/NAME` | You by slash command, or the model when the description matches |
| Cost when unused | None, the file is never loaded | Discovery reads only `name` and `description` |
| Bundled files | None; reference files with `#file:` | Sibling scripts and documents the body links to |
| Frontmatter | Prompt properties only | Skill properties, including `allowed-tools` and `context` |
| Good for | A repeatable request with an argument and a fixed output shape | A procedure that must apply on every surface, or that carries its own scripts |

The decision rule: if a Copilot CLI user or a code review must be able to do this, it is a skill.
If it is a request a human types in an editor, a prompt file costs nothing when unused and gives
you a slash command with a typed argument.

For a fuller comparison, including subagents and MCP servers, read entry S2 in
[the sources](../reference/sources.md).

## What a reusable prompt must contain

Read [`review-api-security.prompt.md`](../.github/prompts/review-api-security.prompt.md) as a
worked example. Five properties make it survive reuse:

- **It handles a missing argument.** "If the argument is empty, ask which folder or file to
  review. Do not guess and do not review the whole repository." A prompt invoked without its
  argument is the normal case, not an error.
- **It states the order of work.** The numbered list is a procedure, so two runs on the same code
  produce comparable reports.
- **It names the output shape.** A grouped checklist with a severity order, then a section for
  what passed. Without this, the format changes every run and you cannot diff two reviews.
- **It forbids the failure you know about.** "Never claim a control exists unless the code you
  read demonstrates it. Write **not verified**." That sentence exists because the failure mode —
  a confident passing report based on a framework's reputation — is the expensive one.
- **It separates findings that need different follow-up.** "Missing" and "not verified" are
  different lines because they route to different work.

A prompt that produces a different shape each run is not reusable, however good one run was.

## Keep the argument the only variable

A prompt file is a saved experiment, and an experiment with two changing variables teaches
nothing. Everything that is not the argument should be fixed by the prompt body: the order of the
checks, the output sections, the file the result is written to, the rules that apply.

That is why the security review prompt asks which folder to review and then decides everything
else itself. Two runs with the same argument produce comparable reports, and a change in the
report is evidence of a change in the code rather than a change in the prompt.

When a prompt starts needing a second and third argument, the shape is usually wrong. Either the
inputs belong in a configuration file the prompt reads, or the prompt is covering two jobs and
should be split, or the procedure belongs in a [skill](05-skills.md) that bundles its own
reference material.

## Guarding the blast radius

`triage-issue.prompt.md` sets `agent: ask` and then says in the body: "You are not allowed to
change code in this task. The output is a plan." Both are deliberate. The `ask` mode keeps the
prompt in a conversational mode, and the sentence covers the case where someone runs it in agent
mode anyway.

`write-adr.prompt.md` does the opposite: it grants `read`, `search` and `edit`, because a decision
record has to be written to a file, and it constrains the *content* instead ("Do not record a
decision that has not been made").

Match the grant to the job. A prompt that needs to write one document gets `edit` and a rule
about what it may write. A prompt that only classifies or reviews does not need it at all.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/NAME` never appears in the chat input | The file is not at `.github/prompts/`, or its name does not end in `.prompt.md` | Move and rename it; the filename is the default command name |
| The prompt works in the editor and does nothing for a teammate | They work in Copilot CLI or on github.com, and prompt files are IDE-only | Convert the procedure to a skill |
| The prompt edits files after you told it not to | `tools` was set, which moves the default agent to `agent` mode | Grant only `read` and `search`, and set `agent: ask` where it fits |
| The prompt cannot find a tool you named | The tool is not in the resolved list, or the MCP server is not configured on that surface | Check the priority order; name MCP tools as `<server>/<tool>` |
| The output format changes on every run | The body names no output shape | Add an explicit structure with sections and their order |
| The prompt misspells a property and behaves as if it were absent | Unknown prompt properties are ignored without a message | Keep to the six documented properties and run `npm run validate` |

## Practice

[Lab 03](../labs/03-prompt-file.md) has you write a prompt file, pin its tools, run it twice on
the same input, and compare the two reports.

Next: [custom agents](04-custom-agents.md), where a persona, a tool grant and a filename carry
the same discipline further.
