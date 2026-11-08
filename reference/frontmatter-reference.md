# Frontmatter reference

Every customization file is machine-read. This page is the single source of truth for the
properties this repository uses, and it is the list the validator enforces. A property not on
this page is not used anywhere in the repository, by design: an unknown property is silently
ignored or a parse failure, and neither produces an error message you will see.

Status labels used below:

- **GA** — generally available.
- **Preview** — public preview, subject to change.
- **IDE-only** — accepted by VS Code and other IDEs, ignored by Copilot on github.com and by
  the cloud agent.

Always confirm against [sources](sources.md) for the surface you are targeting. Behaviour
changes faster than reference pages.

## Custom instructions

### `.github/copilot-instructions.md`

No frontmatter. Plain Markdown. Loaded on every request in the repository's context.

| Property | Required | Notes |
| --- | --- | --- |
| — | — | This file has no configuration surface. Its only lever is length. |

### `.github/instructions/NAME.instructions.md`

Path-scoped instructions. Status: **GA**.

| Property | Type | Required | Purpose |
| --- | --- | --- | --- |
| `applyTo` | string | Yes | Comma-separated glob patterns, relative to the repository root. Must be quoted. |
| `description` | string | No | Used for task-based discovery on some surfaces. Not an extra restriction on `applyTo`. |
| `excludeAgent` | string | No | Excludes a named agent from reading the file. Verify per surface before relying on it. |

```yaml
---
applyTo: "**/*.ts,**/*.tsx"
description: "TypeScript conventions for this repository."
---
```

Failure modes: unquoted `applyTo` breaks the YAML; a missing `applyTo` means the file never
applies; both are silent.

### `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `REVIEW.md`

Agent instructions. No frontmatter. `AGENTS.md` and the other tool-convention files are read
by VS Code, Copilot CLI, the cloud agent and Copilot code review. `REVIEW.md` is read by
Copilot code review. Support differs by surface — see [sources](sources.md).

## Prompt files

### `.github/prompts/NAME.prompt.md`

Status: **GA in VS Code, Visual Studio, JetBrains IDEs, Xcode**. Not available on github.com
or in Copilot CLI.

| Property | Type | Required | Purpose |
| --- | --- | --- | --- |
| `name` | string | No | The slash-command name. Defaults to the filename. Lowercase, hyphens. |
| `description` | string | No | Shown in the picker; used for recommendations. |
| `argument-hint` | string | No | Placeholder shown in the chat input, e.g. `[path to the file]`. |
| `agent` | string | No | `ask`, `agent`, `plan`, or the name of a custom agent. Defaults to the current agent; if `tools` is set, the default becomes `agent`. |
| `model` | string | No | Model to run the prompt with. Defaults to the currently selected model. |
| `tools` | list | No | Tools available to this prompt. Accepts `<server>/*` to include every tool from an MCP server. Overrides the agent's tool list. |

In-body syntax:

| Syntax | Meaning |
| --- | --- |
| `${input:name}` | Prompt the user for a value |
| `${input:name:placeholder}` | Same, with placeholder text |
| `${selection}` | The current editor selection |
| `#file:path` | Reference a file |
| `#tool:name` | Reference a tool |

Tool resolution priority: prompt file `tools`, then the tools of the agent named in `agent`,
then the selected agent's defaults.

## Custom agents

### `.github/agents/NAME.agent.md`

Also accepted as `NAME.md` in the same directory. Status: **GA** on github.com, Copilot CLI
and VS Code; **preview** in JetBrains IDEs, Eclipse and Xcode.

| Property | Type | Required | Purpose |
| --- | --- | --- | --- |
| `name` | string | No | Display name. |
| `description` | string | **Yes** | The agent's purpose. Required, and the field that drives automatic selection. |
| `target` | string | No | `vscode` or `github-copilot`. Defaults to both. |
| `tools` | list or string | No | Tool names or aliases. Unset means all tools; `[]` means none. |
| `model` | string | No | Model for this agent. Defaults to the inherited model. |
| `disable-model-invocation` | boolean | No | `true` prevents the cloud agent from selecting this agent automatically. Default `false`. |
| `user-invocable` | boolean | No | `false` hides the agent from manual selection. Default `true`. |
| `infer` | boolean | No | **Retired.** Use `disable-model-invocation` and `user-invocable`. |
| `mcp-servers` | object | No | MCP servers for this agent. Not used in VS Code. |
| `metadata` | object | No | String name/value annotations. Not used in VS Code. |
| `argument-hint` | string | No | **IDE-only.** Ignored on github.com. |
| `handoffs` | list | No | **IDE-only.** Ignored on github.com. |

Body limit: 30,000 characters. If you approach it, the procedure belongs in a skill.

Tool aliases, case-insensitive:

| Alias | Also accepts | Purpose |
| --- | --- | --- |
| `execute` | `shell`, `Bash`, `powershell` | Run a command |
| `read` | `Read`, `NotebookRead` | Read file contents |
| `edit` | `Edit`, `MultiEdit`, `Write`, `NotebookEdit` | Modify files |
| `search` | `Grep`, `Glob` | Search files and text |
| `agent` | `custom-agent`, `Task` | Delegate to another custom agent |
| `web` | `WebSearch`, `WebFetch` | Fetch URLs and search the web |
| `todo` | `TodoWrite` | Manage a structured task list |

Namespaced MCP tools: `<server>/<tool>` or `<server>/*`. Out-of-the-box servers available to
the cloud agent include `github` and `playwright`.

### Locations and precedence

| Level | Location |
| --- | --- |
| Repository | `.github/agents/` |
| Organization | `agents/` in the organization's `.github` or `.github-private` repository |
| Enterprise | `agents/` in a designated `.github-private` repository |
| User | User profile directory (VS Code, Copilot CLI) |

Deduplication uses the filename with `.md` or `.agent.md` stripped. The lowest level wins, so
a repository agent overrides an organization agent of the same name. Two files in the same
directory that strip to the same name are a clash — the validator rejects it.

Versioning follows the Git commit SHA of the agent file. When an agent opens a pull request,
interactions inside that pull request keep using the same version.

## Agent skills

### `.github/skills/<name>/SKILL.md`

Status: **GA**. Agent Skills is an open standard, also read from `.claude/skills/` and
`.agents/skills/`.

| Property | Type | Required | Purpose |
| --- | --- | --- | --- |
| `name` | string | **Yes** | Identifier. Lowercase letters, digits and hyphens only. Max 64 characters. **Must equal the directory name.** |
| `description` | string | **Yes** | What the skill does *and when to use it*. Max 1024 characters. |
| `license` | string | No | Licence applying to the skill. |
| `allowed-tools` | string or list | No | Tools pre-approved without a confirmation prompt. |
| `argument-hint` | string | No | Placeholder shown when invoked as a slash command. |
| `user-invocable` | boolean | No | `false` hides it from the `/` menu while still allowing automatic loading. Default `true`. |
| `disable-model-invocation` | boolean | No | `true` requires manual invocation via `/`. Default `false`. |
| `context` | string | No | `inline` (default) or `fork` to run in a dedicated subagent context. |
| `source` | string | No | Provenance written by `gh skill install`. |

The access matrix from the official documentation:

| Configuration | Slash command | Auto-loaded |
| --- | --- | --- |
| Both omitted | Yes | Yes |
| `user-invocable: false` | No | Yes |
| `disable-model-invocation: true` | Yes | No |
| Both set | No | No |

Loading is progressive, in three levels: discovery reads only `name` and `description`; the
`SKILL.md` body loads when the skill is selected or matched; sibling files load only when the
body references them. That is why a skill may carry a large reference document without
costing context on every request.

Hard constraints that fail silently:

- The file must be named exactly `SKILL.md`, case-sensitive.
- The `name` must match its parent directory.
- No `/`, `:` or `.` in `name`, including namespace prefixes. A plugin install adds its own
  prefix automatically.

### Locations

| Scope | Paths |
| --- | --- |
| Project | `.github/skills/<name>/`, `.claude/skills/<name>/`, `.agents/skills/<name>/` |
| Personal | `~/.copilot/skills/<name>/`, `~/.agents/skills/<name>/` |

For Copilot code review, a review-focused directory name such as `code-review` makes the
skill more likely to be loaded during a review.

Management: `gh skill search`, `gh skill preview`, `gh skill install`, `gh skill update`,
`gh skill publish`. Status: **preview**, requires GitHub CLI 2.90.0 or later.

## Hooks

### `.github/hooks/NAME.json`

Status: **GA in Copilot CLI and the cloud agent**; **preview in VS Code**.

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

Events:

| Event | Fires |
| --- | --- |
| `sessionStart` | A session begins or resumes |
| `sessionEnd` | A session completes or is terminated |
| `userPromptSubmitted` | The user submits a prompt |
| `preToolUse` | Before a tool runs; **can allow or deny** |
| `postToolUse` | After a tool completes |
| `postToolUseFailure` | After a tool fails |
| `agentStop` | The main agent finishes responding |
| `subagentStop` | A subagent completes |
| `errorOccurred` | An error occurs during agent execution |
| `permissionRequest` | Before the permission service runs. **Copilot CLI only.** |
| `notification` | A system notification fires. **Copilot CLI only.** |
| `preCompact` | Context compaction is about to begin |

Hooks run synchronously and block the agent.

### The `preToolUse` decision contract

This is the part that is easy to get wrong, and getting it wrong has consequences.

Output exactly one JSON object on stdout:

| Field | Values | Notes |
| --- | --- | --- |
| `permissionDecision` | `allow`, `deny`, `ask` | Empty output falls through to normal permission handling. |
| `permissionDecisionReason` | string | Required when denying; the agent reads it. |
| `modifiedArgs` | object | Substitute tool arguments. |

Exit codes:

| Exit | Effect on `preToolUse` |
| --- | --- |
| `0` | Use the stdout JSON, or fall through if there is none |
| `2` | **Deny**, merged with a deny decision even if stdout says `allow` |
| Other non-zero | **Deny** (fail-closed) |
| Crash | **Deny** (fail-closed) |
| Timeout | **Allow** (fail-open) — the guardrail silently disappears |

Two consequences worth internalising:

1. A script that exits non-zero to mean "nothing to do" denies every tool call in the session.
   Always exit `0` and deny through JSON.
2. A slow script that exceeds `timeoutSec` stops enforcing anything, without an error the user
   will notice. Keep hook scripts fast and set `timeoutSec` explicitly.

Input payload keys are camelCase for the native format (`sessionId`, `cwd`, `toolName`,
`toolArgs`). Hooks configured under the PascalCase event names used by VS Code and Claude
Code receive snake_case keys (`hook_event_name`, `tool_name`, `tool_input`) instead, so read
both shapes if the hook must work across surfaces.

## MCP

Two different formats, and neither is a committed file for the cloud surfaces.

| Surface | How it is configured |
| --- | --- |
| VS Code | `.vscode/mcp.json`, committed, uses a `servers` object |
| Cloud agent | Repository settings on github.com, `Settings` → `Copilot` → `MCP servers`, a `mcpServers` object pasted into the UI. Not a file. |
| Copilot code review | Shares the repository-level configuration; can be disabled separately |
| A single custom agent | `mcp-servers` property in that agent's frontmatter |

Repository-level JSON shape:

```json
{
  "mcpServers": {
    "example": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@example/mcp-server"],
      "tools": ["*"],
      "env": { "EXAMPLE_TOKEN": "$COPILOT_MCP_EXAMPLE_TOKEN" }
    }
  }
}
```

Secrets and variables must be Agents secrets or variables whose names are prefixed with
`COPILOT_MCP_`. Supported reference syntax: `$COPILOT_MCP_X`, `${COPILOT_MCP_X}`,
`${COPILOT_MCP_X:-default}`, and in agent YAML also `${{ secrets.COPILOT_MCP_X }}` and
`${{ vars.COPILOT_MCP_X }}`.

`stdio` and `local` are the same type under different names.

## Coding agent environment

### `.github/workflows/copilot-setup-steps.yml`

Status: **GA**. Applies only to sessions running on GitHub Actions, not to cloud sandboxes.

| Constraint | Detail |
| --- | --- |
| Path | Fixed at `.github/workflows/copilot-setup-steps.yml` |
| Branch | Must be on the default branch, or it is inert |
| Jobs | Exactly one, and it must be named `copilot-setup-steps` |
| Honoured job keys | `steps`, `permissions`, `runs-on`, `services`, `snapshot`, `timeout-minutes` (max 59) |
| Ignored | Every other job key, silently |
| `fetch-depth` | Overridden on `actions/checkout` so the agent can roll back commits |
| Runners | Ubuntu x64 Linux and Windows 64-bit only; macOS unsupported |

### `.github/workflows/copilot-code-review.yml`

Overrides the environment for Copilot code review only. Same single-job shape, and the job
keeps the name `copilot-setup-steps`. When absent, review reuses
`copilot-setup-steps.yml`.

## Related controls that are not customization files

| Control | Where |
| --- | --- |
| `CODEOWNERS` | `.github/CODEOWNERS`, combined with the "Require review from Code Owners" rule |
| Content exclusion | Organization and repository settings, not a file |
| Firewall | Organization and repository settings; code review has its own section |
| Rulesets | Repository settings; Copilot is subject to them like any developer |
| Agents secrets and variables | Organization and repository settings, `COPILOT_MCP_` prefix for MCP |

Chapter [09](../docs/09-policies-and-guardrails.md) explains which of these actually enforce
something.
