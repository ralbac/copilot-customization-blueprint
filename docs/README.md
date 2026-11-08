# Theory

This is the theory track: thirteen chapters, numbered 00 to 12, that explain what each part of the
Copilot customization surface does, when to reach for it, and how it fails. Read them in numeric
order. Chapter [00](00-mental-model.md) introduces the model the other twelve depend on, and each
chapter that introduces a mechanism ends with a practice pointer and the next chapter.

Every behavioural claim here traces to an entry in [the sources](../reference/sources.md). Where a
feature is preview, experimental or available in one IDE only, the sentence that states it says so.

## Part one: foundations

The model, and the two instruction layers that most repositories need first.

| Chapter | What it covers | After it you can |
| --- | --- | --- |
| [00 Mental model](00-mental-model.md) | The three mechanisms — prompt injection, tool grants, hooks — and the context budget that decides where content belongs | Say which mechanism any customization request belongs to, and why |
| [01 Custom instructions](01-custom-instructions.md) | The four instruction scopes, what earns a place in the always-on layer, and the tool-neutral `AGENTS.md` split | Write a repository-wide instruction file that is short enough to be read |
| [02 Path-scoped instructions](02-path-scoped-instructions.md) | `applyTo` glob semantics, deliberate overlap, and the anti-pattern of a glob that matches everything | Split a bloated instruction file into scoped files whose globs fire when you expect |

## Part two: mechanisms you invoke

The file types a person or the model selects on purpose.

| Chapter | What it covers | After it you can |
| --- | --- | --- |
| [03 Prompt files](03-prompt-files.md) | Frontmatter, `${input:}`, `${selection}`, `#file:`, `#tool:`, the tool priority order, and the IDE-only limit | Write a reusable slash command with a fixed output shape and a pinned tool list |
| [04 Custom agents](04-custom-agents.md) | The full agent frontmatter, tool aliases, the four levels, deduplication, Git-SHA versioning, the body limit | Define a specialist and restrict it to the tools its job actually needs |
| [05 Skills](05-skills.md) | The open standard, `SKILL.md` limits, three-level loading, the name-must-match-directory rule, `allowed-tools`, `context: fork` | Write a procedure that loads on demand and is discovered reliably |

## Part three: environment and enforcement

What the agent runs in, and what the platform enforces rather than the prompt.

| Chapter | What it covers | After it you can |
| --- | --- | --- |
| [06 Hooks](06-hooks.md) | The event table, the JSON configuration, the decision contract, exit codes, and the fail-closed and fail-open traps | Write a `preToolUse` guardrail that denies what you meant and nothing else |
| [07 MCP](07-mcp.md) | The two configuration paths, the `mcpServers` shape, `COPILOT_MCP_` secrets, per-agent servers, tool selection | Connect an external system without committing a credential or granting every tool |
| [08 The agent environment](08-agent-environment.md) | `copilot-setup-steps.yml`: fixed path, default branch, honoured keys, runner limits, the review override | Write setup steps that run, and explain why agent-authored pull requests wait for approval |
| [09 Policies and guardrails](09-policies-and-guardrails.md) | Rulesets, `CODEOWNERS` and its activating rule, content exclusion, the firewall, managed settings, secrets, custom properties | Classify each control by what it stops, and stop calling a file a gate |

## Part four: synthesis

Combining the layers, proving the result, and keeping it when the host changes.

| Chapter | What it covers | After it you can |
| --- | --- | --- |
| [10 Composition patterns](10-composition-patterns.md) | A requirement-to-mechanism decision table, three composition rules, and four end-to-end recipes | Choose the smallest mechanism that satisfies a requirement, and defend the choice |
| [11 Verification](11-verification.md) | Discovery versus effectiveness, the signal per mechanism, the dry-run loop, what the validator proves | Prove a customization works, and tell "not loaded" from "loaded but not followed" |
| [12 Portability](12-portability.md) | The Agent Skills standard, `AGENTS.md`, the read aliases, what does not port, the neutral-core layout | Structure a repository so the shared part survives a change of host |

## The other two tracks

| Track | What it is | Start here |
| --- | --- | --- |
| Practice | One lab per mechanism, each with an observable check | [Labs](../labs/README.md) |
| Reference | Dense lookup material, not meant to be read front to back | [Cheat sheet](../reference/cheat-sheet.md), [frontmatter reference](../reference/frontmatter-reference.md), [sources](../reference/sources.md) |

The three tracks read in the same order: a chapter, then its lab, then the cheat sheet when you need
the exact property rather than the explanation.

## Shortest path for a specific goal

| If you want to | Read | Then do |
| --- | --- | --- |
| Build one thing today | [01](01-custom-instructions.md), [04](04-custom-agents.md) | [Lab 01](../labs/01-first-instruction.md), [lab 04](../labs/04-first-agent.md) |
| Decide what a team should adopt | [00](00-mental-model.md), [10](10-composition-patterns.md), [09](09-policies-and-guardrails.md) | [Lab 09](../labs/09-guardrails.md) |
| Fix something that stopped working | [11](11-verification.md) | [Lab 06](../labs/06-hooks.md) |
| Hand the configuration to another agent host | [12](12-portability.md) | [Lab 05](../labs/05-first-skill.md) |

## What this track does not do

It does not catalogue community agents, skills or prompts, and it does not rank models. Those
change faster than a chapter can be corrected, and a stale list teaches the wrong thing. The
mechanisms are the part that stays true long enough to be worth writing down.
