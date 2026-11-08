# Cheat sheet

Dense lookup, not a read-through. Every row here is expanded in a chapter under
[`docs/`](../docs/README.md) and verified against [sources](sources.md).

## The whole surface in one table

| Feature | File | Trigger | Best for | IDEs | github.com | CLI |
| --- | --- | --- | --- | :---: | :---: | :---: |
| Repository instructions | `.github/copilot-instructions.md` | Automatic, always | Conventions that apply to almost every task | Yes | Yes | Yes |
| Path-scoped instructions | `.github/instructions/*.instructions.md` | Automatic, when the file glob matches | Language, framework and directory conventions | Yes | Yes | Yes |
| Agent instructions | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Automatic | Tool-neutral project rules | Yes | Yes | Yes |
| Review instructions | `REVIEW.md` | Automatic in code review | What a reviewer must look for | — | Yes | — |
| Prompt file | `.github/prompts/*.prompt.md` | Manual, `/name` | One focused task you run repeatedly | Yes | No | No |
| Custom agent | `.github/agents/*.agent.md` | Manual selection, or automatic | A specialist role with its own tools | Yes | Yes | Yes |
| Skill | `.github/skills/<name>/SKILL.md` | Automatic on relevance, or `/name` | A multi-step procedure with bundled assets | Yes | Yes | Yes |
| Hooks | `.github/hooks/*.json` | Automatic at lifecycle events | Rules that must not be negotiable | Preview | Yes | Yes |
| MCP — editor | `.vscode/mcp.json` | Automatic, or by tool name | External tools in your editor | Yes | No | No |
| MCP — repository | Repository settings UI (not a file) | Automatic | External tools in cloud sessions and review | No | Yes | No |
| Agent environment | `.github/workflows/copilot-setup-steps.yml` | Before a cloud session | Deterministic dependency setup | — | Yes | — |
| Review environment | `.github/workflows/copilot-code-review.yml` | Before a review | Review-specific runner or toolchain | — | Yes | — |
| Subagents | Runtime, not a file | Automatic delegation | Isolating a subtask's context | Yes | No | Yes |
| Plugins | Marketplace / `plugin.json` | Install | Distributing a bundle to a team | Yes | Yes | Yes |

## The three mechanisms

The distinction that prevents most mistakes. See
[the mental model](../docs/00-mental-model.md).

| Mechanism | Examples | Guarantee | Failure mode |
| --- | --- | --- | --- |
| Prompt injection | Instructions, prompts, agents, skills | None. The model usually complies | Silently ignored; no error |
| Tool grant | Agent `tools`, skill `allowed-tools`, MCP tool selection | The model cannot use what it was not granted | Over-granting removes the boundary |
| Deterministic | Hooks, rulesets, CODEOWNERS, firewall, content exclusion | Enforced by the runtime | A broken hook blocks everything |

## Choosing the mechanism

| Requirement | Start with |
| --- | --- |
| Copilot should follow our repository conventions | Repository instructions |
| These rules only matter for TypeScript files | Path-scoped instructions |
| I need this one task done the same way every time | Prompt file or skill |
| I need a specialist with a restricted toolset | Custom agent |
| The procedure is long, or bundles scripts and templates | Skill |
| It must work in Copilot CLI too | Skill (prompt files do not exist there) |
| This rule cannot be left to the model's judgement | Hook |
| Copilot needs data from outside the repository | MCP server |
| Copilot needs the right dependencies installed before it starts | `copilot-setup-steps.yml` |
| A change to agent behaviour must be reviewed by a specific team | `CODEOWNERS` |
| Copilot must not read a path at all | Content exclusion |
| Nothing reaches the default branch unreviewed | Ruleset |

## Context cost ladder

| Loading | Paid |
| --- | --- |
| Always-on instructions | Every request |
| Path-scoped instructions | Every request involving a matching file |
| Skill discovery (`name` + `description`) | Every request, cheaply |
| Skill body | When selected or matched |
| Skill sibling files | Only when the body references them |
| Prompt file, custom agent | When invoked |
| Hook, setup steps | Never — they are configuration, not context |

## Prompt file versus skill

The question that comes up most, because both look like reusable procedures.

| | Prompt file | Skill |
| --- | --- | --- |
| Invoked by | The user, as `/name` | The model on relevance, or the user as `/name` |
| Available on github.com | No | Yes |
| Available in Copilot CLI | No | Yes |
| Can bundle scripts and templates | Yes, by relative link | Yes, discovered with the directory |
| Can pre-approve tools | No | Yes, via `allowed-tools` |
| Can run in a forked context | No | Yes, `context: fork` |
| Ports to other agents | No | Yes, open standard |
| Reach for it when | You always want a human to pull the trigger, in an IDE | You want the model to pick it up on its own, across surfaces |

If a workflow must work in the terminal and on github.com, it is a skill.

## Enforcement ladder

Ordered by what actually stops something. Chapter
[09](../docs/09-policies-and-guardrails.md) expands this.

| Control | Stops | Does not stop |
| --- | --- | --- |
| Enterprise managed settings | The operation, for everyone | — |
| Content exclusion | Copilot reading the path | A human reading it |
| Firewall | Outbound network access | Repository operations |
| Ruleset | Merge, push, branch deletion | A local commit |
| `CODEOWNERS` + require review | Merge without the owner's approval | A local commit |
| Hook `preToolUse` deny | The tool call | A different tool doing the same thing |
| Agent `tools` list | The model using an ungranted tool | Prompt-level workarounds inside the granted tools |
| A sentence in an instructions file | Nothing | — |

That last row is the point of the table.

## Frontmatter, one line each

Full field tables, limits and status labels: [frontmatter reference](frontmatter-reference.md).

```yaml
# .github/instructions/NAME.instructions.md
applyTo: "**/*.ts"            # required, quoted, comma-separated globs
description: "…"              # optional, task discovery

# .github/prompts/NAME.prompt.md
name: do-thing                # slash command
description: "…"
argument-hint: "[target]"
agent: agent                  # ask | agent | plan | <custom agent name>
tools: ["read", "search"]

# .github/agents/NAME.agent.md
description: "…"              # required
tools: ["read", "search"]     # unset = all, [] = none
disable-model-invocation: false
user-invocable: true

# .github/skills/<name>/SKILL.md   <- directory must equal `name`
name: my-skill                # lowercase, hyphens, max 64
description: "… Use when …"   # required, max 1024, states the trigger
allowed-tools: shell          # warning: removes confirmation
context: fork                 # inline | fork
```

## Hook decision contract

The rules that are easy to get wrong. Full table:
[frontmatter reference](frontmatter-reference.md).

| You do this | Result |
| --- | --- |
| Exit 0, no stdout | Fall through to normal permission handling |
| Exit 0, one JSON object with `permissionDecision: "deny"` | Denied, reason shown to the agent |
| Exit 0, two JSON objects on stdout | Both ignored — concatenated output is not valid JSON |
| Exit 1 / exit 2 / crash | **Denied.** Fail-closed, even if stdout says allow |
| Exceed `timeoutSec` | **Allowed.** Fail-open — your guardrail silently disappears |

So: always exit `0`, deny through JSON, keep the script fast, and set `timeoutSec`.

## Minimal viable set

Five files, in priority order, if you are adding this to a repository today.

1. `.github/copilot-instructions.md` — the project shape, the stack, the verification commands.
2. `.github/instructions/` — one file per concern that is not repository-wide.
3. `.github/agents/` — one read-only reviewer. Highest value per line of YAML in this whole surface.
4. `.github/skills/` — one skill for the procedure your team explains most often.
5. `.github/CODEOWNERS` + the require-review-from-code-owners rule, so that edits to the four items above get reviewed.

Hooks, MCP and the agent environment come later, when you have a specific reason.

## Common mistakes

| Mistake | Consequence |
| --- | --- |
| Unquoted `applyTo: **/*.ts` | The YAML never parses; the file never applies, silently |
| Skill `name` that differs from its directory | The skill never loads, silently |
| `SKILL.md` written as `Skill.md` | Same, on case-sensitive filesystems |
| Prompt file expected to work in Copilot CLI | It does not exist there |
| `copilot-setup-steps.yml` on a feature branch | Inert until it is on the default branch |
| Job in `copilot-setup-steps.yml` not named `copilot-setup-steps` | Ignored |
| Job key outside the honoured list | Silently dropped |
| Repository MCP config expected as a committed file | It lives in repository settings, not a file |
| `exit 1` from a `preToolUse` script meaning "nothing to do" | Denies every tool call in the session |
| Reviewer agent granted `edit` | It will eventually edit |
| A 900-line instruction file | A permanent context tax on every request |
| Same rule in `AGENTS.md` and `copilot-instructions.md` | They drift and then contradict |
| Assuming an instruction is a policy | It enforces nothing |

## Verify

```bash
npm run validate   # frontmatter, hooks, links, code fences
npm test           # the validator's own tests
npm run check      # both
```

Discovery is not effectiveness. Appearing in the `/` menu proves the file was found and
proves nothing about behaviour. Chapter
[11](../docs/11-verification.md) has the per-mechanism verification table.
