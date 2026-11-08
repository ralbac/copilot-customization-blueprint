# Custom agents

A custom agent is a named persona with its own instructions, its own tool list and, optionally,
its own model. By the end of this chapter you will be able to define one, restrict its tools to
the smallest set that does the job, and predict which of the four levels wins when two agents
share a name.

## The file

Two filenames work, in the same directory:

```text
.github/agents/code-reviewer.agent.md   ← preferred
.github/agents/code-reviewer.md         ← also accepted
```

Custom agents are **GA on github.com, in Copilot CLI and in VS Code; preview in JetBrains IDEs,
Eclipse and Xcode**. The extension is stripped before the agent is named, which is why the two
filenames above are the same agent and cannot both exist in one directory.

The reference agents in this repository are in [`.github/agents/`](../.github/agents):

| Agent | Tools | Why it exists |
| --- | --- | --- |
| [`code-reviewer.agent.md`](../.github/agents/code-reviewer.agent.md) | `read`, `search` | Reviews a change and cannot edit one |
| [`planner.agent.md`](../.github/agents/planner.agent.md) | `read`, `search`, `edit` | Produces a plan; `edit` exists only to write the plan to a file |
| [`test-specialist.agent.md`](../.github/agents/test-specialist.agent.md) | `read`, `search`, `edit`, `execute` | Adds and repairs tests, and runs them |
| [`docs-writer.agent.md`](../.github/agents/docs-writer.agent.md) | `read`, `search`, `edit` | Writes documentation in the repository's voice |

Four agents, four different tool lists. That is the pattern, not a coincidence.

## The frontmatter

| Property | Type | Purpose |
| --- | --- | --- |
| `name` | string | Display name. |
| `description` | string | **Required.** The agent's purpose, and the field that drives automatic selection. |
| `target` | string | `vscode` or `github-copilot`. Defaults to both. |
| `tools` | list or string | Tool names or aliases. Unset means all tools; `[]` means none. |
| `model` | string | Model for this agent. Defaults to the inherited model. |
| `disable-model-invocation` | boolean | `true` prevents the cloud agent from selecting this agent automatically. Default `false`. |
| `user-invocable` | boolean | `false` hides the agent from manual selection. Default `true`. |
| `mcp-servers` | object | MCP servers for this agent. Not used in VS Code. |
| `metadata` | object | String name/value annotations. Not used in VS Code. |
| `argument-hint` | string | **IDE-only.** Ignored on github.com. |
| `handoffs` | list | **IDE-only.** Ignored on github.com. |

`description` is the only required property, and it does double duty: it is what a human reads in
the picker and what the model matches on when it decides to delegate. Write it as a role plus a
boundary — "Reviews a change for correctness, contract breaks and missing tests. Read-only: never
edits files" — rather than as a personality.

`infer` is retired. Files written against older documentation set it, and it does nothing. Use
`disable-model-invocation` and `user-invocable` instead.

## Tool aliases and least privilege

`tools` accepts aliases, case-insensitively. The aliases exist because the same capability is
named differently across hosts:

| Alias | Also accepts | Purpose |
| --- | --- | --- |
| `execute` | `shell`, `Bash`, `powershell` | Run a command |
| `read` | `Read`, `NotebookRead` | Read file contents |
| `edit` | `Edit`, `MultiEdit`, `Write`, `NotebookEdit` | Modify files |
| `search` | `Grep`, `Glob` | Search files and text |
| `agent` | `custom-agent`, `Task` | Delegate to another custom agent |
| `web` | `WebSearch`, `WebFetch` | Fetch URLs and search the web |
| `todo` | `TodoWrite` | Manage a structured task list |

Two values behave differently from anything else you might expect:

- **Unset `tools` means every tool.** Omitting the key is not a conservative default.
- **`[]` means no tools.** An empty list is a real choice: an agent that produces prose from the
  conversation and reads nothing.

The tool grant is the strongest guardrail in the whole customization surface. A rule in prose
asks the model to hold back; a missing tool removes the option. `code-reviewer` demonstrates the
consequence: a review cannot turn into a refactor, because `edit` is not on the list, and the
agent's own body says "The `tools` list is the boundary, not a suggestion."

That is why [`copilot-config.instructions.md`](../.github/instructions/copilot-config.instructions.md)
tells authors to restrict `tools` to the smallest set that does the job, and why the validator
warns when a description containing "review" or "audit" is paired with `edit`. Reviewers that can
edit eventually edit.

Namespaced MCP tools use `<server>/<tool>`, and `<server>/*` includes every tool from that server.
Chapter [07](07-mcp.md) covers the servers themselves.

## Four levels, and deduplication by filename

Agents are discovered at four levels:

| Level | Location |
| --- | --- |
| Repository | `.github/agents/` |
| Organization | `agents/` in the organization's `.github` or `.github-private` repository |
| Enterprise | `agents/` in a designated `.github-private` repository |
| User | User profile directory (VS Code, Copilot CLI) |

Deduplication uses the filename with `.md` or `.agent.md` stripped. **The lowest level wins**, so
a repository agent overrides an organization agent of the same name — the behaviour you want:
the repository knows its own conventions better than the organization does.

Two files in the same directory that strip to the same name are a clash rather than a precedence
question. `code-reviewer.agent.md` and `code-reviewer.md` in `.github/agents/` are the same agent
defined twice, and the validator rejects the pair.

## Versioning follows the Git commit SHA

An agent's version is the commit SHA of its file, not a number you write in the frontmatter. When
an agent opens a pull request, interactions inside that pull request keep using the same version
of the agent even if the file changes on the default branch.

Two operational consequences:

- A behaviour change in an agent is a reviewable diff, and `git log .github/agents/` is the
  change history. There is nowhere else to record it.
- Editing an agent to fix a bad run does not change the run that is already in progress. The fix
  applies to new sessions.

## The 30,000-character body limit

An agent body is capped at 30,000 characters. The cap is not a style preference; it is the point
at which the file stops being a persona and starts being a document.

When a body approaches the cap, the agent is hiding a procedure. Extract it into a
[skill](05-skills.md) and have the agent invoke the skill. The agent keeps its role, its
boundaries and its tool list; the long procedure becomes load-on-demand content that is not paid
for on every session that selects the agent.

## `disable-model-invocation` and `user-invocable`

These two properties control who may select the agent, and they are independent:

| Configuration | Model may select it | Human may select it |
| --- | --- | --- |
| Both omitted | Yes | Yes |
| `disable-model-invocation: true` | No | Yes |
| `user-invocable: false` | Yes | No |
| Both set | No | No |

`disable-model-invocation: true` is what `code-reviewer` uses, with the reason stated in the file:
a review is requested, never inferred. An agent that reviews is a second opinion, and a second
opinion the model assigned to itself is not a second opinion.

`user-invocable: false` is for the opposite case: an agent that should only be reached by
delegation, because invoking it directly skips the context it expects.

## IDE-only properties

Two properties are accepted by the IDE and ignored on github.com:

- **`argument-hint`** — the placeholder shown in the input box.
- **`handoffs`** — the button that offers the next agent.

`planner.agent.md` uses `handoffs` to offer `test-specialist` after a plan is accepted, and its
own body states the limitation: "The handoff is available in VS Code; on GitHub.com it is
ignored, so paste the plan instead."

That sentence is the pattern to copy. An IDE-only property that silently does nothing is a
workflow that silently stops one step early, so name the limitation where the reader meets it.

## `mcp-servers`

An agent can carry its own MCP servers, so a specialist that needs a browser or a tracker does not
give those tools to every session:

```yaml
---
description: "Reproduces a reported UI defect by driving the page and reporting the steps."
tools: ["read", "search", "playwright/*"]
mcp-servers:
  playwright:
    type: local
    command: npx
    args: ["-y", "@playwright/mcp@latest", "--headless"]
---
```

The `mcp-servers` property is not used in VS Code: the editor reads [`.vscode/mcp.json`](../.vscode/mcp.json)
instead. Two configurations for one capability is the usual outcome of getting this wrong, so
decide which surfaces you care about before splitting a server across both. Chapter
[07](07-mcp.md) covers the configuration shape and secrets.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| The agent never appears in the picker | The file is outside `.github/agents/`, or the extension is wrong | Use `NAME.agent.md` inside `.github/agents/` |
| The agent is never selected automatically | `description` is vague or empty | State the role and the boundary in `description` |
| A repository agent is ignored in favour of an organization one | The filenames differ, so they are two agents rather than one override | Give the repository file the same name |
| The agent edits files despite the instructions forbidding it | `tools` is unset, which grants every tool | List the tools explicitly; use `[]` for none |
| The agent behaves differently on github.com | `argument-hint` or `handoffs` is being relied on, and both are IDE-only | Do the step manually there; say so in the body |
| An agent edit fixes nothing during the current session | The running session keeps the agent version from its opening commit | Start a new session |
| A long agent body drifts from the procedure it describes | The body is approaching 30,000 characters | Move the procedure into a skill |

## Practice

[Lab 04](../labs/04-first-agent.md) has you add a read-only reviewer, prove that it cannot edit,
and confirm that `disable-model-invocation` keeps it out of automatic selection.

Next: [skills](05-skills.md), the layer that loads a procedure on demand instead of on selection.
