# Composition patterns

The mechanisms are separate on purpose, and a working configuration is a small number of them
chosen deliberately. By the end of this chapter you will be able to take a requirement and name the
smallest mechanism that satisfies it, and you will have four worked configurations to compare your
own against.

## One requirement, one mechanism

The decision table below maps a requirement to the smallest mechanism that satisfies it. Read it
from left to right: if a smaller mechanism satisfies the requirement, the larger one is a cost you
did not need to pay.

| Requirement | Smallest mechanism | Why not the alternative |
| --- | --- | --- |
| The model should always know what this project is | [Repository instructions](01-custom-instructions.md) | A skill is not loaded until something matches it |
| These rules apply only to these paths | [Path-scoped instructions](02-path-scoped-instructions.md) | Repository instructions spend context on every request |
| A person should be able to invoke a repeated request | [Prompt file](03-prompt-files.md) in an IDE, [skill](05-skills.md) everywhere | A prompt file costs nothing unused but is invisible on github.com and in Copilot CLI |
| A procedure should load when it is relevant | [Skill](05-skills.md) | Instructions cannot be conditional on relevance |
| A role with a fixed tool set and its own instructions | [Custom agent](04-custom-agents.md) | A prompt file inherits the session's tools unless it overrides them |
| This procedure needs a script and reference files | [Skill with siblings](05-skills.md#bundled-scripts-and-files) | An agent body is capped at 30,000 characters |
| This rule must not be skippable | [Hook](06-hooks.md) | Every text mechanism is a suggestion |
| The agent must not be able to do this | Tool grant: `tools`, `allowed-tools`, MCP `tools` | A rule the model can read is a rule the model can weigh |
| The agent needs a system outside the repository | [MCP server](07-mcp.md) with a named tool list | A skill cannot reach a service on its own |
| The command must exist before the agent starts | [`copilot-setup-steps.yml`](08-agent-environment.md) | An instruction telling the model to install it is a hope |
| This change must be reviewed by its owner | [`CODEOWNERS`](09-policies-and-guardrails.md) plus the activating rule | A review request in a comment is not a gate |
| The model must not read this path | [Content exclusion](09-policies-and-guardrails.md) | A hook can be evaded by a tool call it does not match |

If two rows look like they both fit, the requirement is two requirements. Write both down and
satisfy each with its own mechanism; a single file that tries to do both is how a rule ends up with
two owners and two versions.

## Three rules of composition

### One owner per rule

A rule stated in two places will eventually be stated two ways. The failure is slow and the
symptom is confusing: the model follows one version in the IDE and the other in code review, and
nobody can tell which file won.

The pattern this repository uses: `AGENTS.md` holds the tool-neutral baseline,
[`copilot-instructions.md`](../.github/copilot-instructions.md) holds the Copilot-specific
conventions and links to `AGENTS.md` for the rest, and path-scoped files hold what depends on the
file being edited. Each rule appears once.

### The narrowest scope that works

Scope is a running cost. Repository instructions are paid on every request, path-scoped
instructions only when a matching file is in play, skills only when selected (plus their
description at discovery), prompts and agents only when invoked. The
[context budget](00-mental-model.md#the-context-budget) is the reason.

So: prefer a skill to an instruction file when the content only matters sometimes; prefer a
path-scoped file to the repository-wide file when the rule depends on which file is open; prefer a
prompt to a skill when only humans will ever invoke it.

### Prompt for preference, grant for capability, hook for guarantee

This is the mental model restated as an instruction to the author. For each rule you are about to
write, decide which of three things it is:

| You want | Write it as | Because |
| --- | --- | --- |
| The model usually does X | Prose in an instruction, prompt, agent or skill | Preference is what prompt injection is for |
| The model cannot do Y | A tool list that omits Y | A missing tool does not need agreement |
| Z never happens | A `preToolUse` hook, and a ruleset where the action is a merge | Determinism is the only mechanism that produces a guarantee |

Most bad customizations are one of these written as another. A capability boundary written as a
polite paragraph is the most common; a guarantee written as a paragraph is the most expensive.

## Recipe: a backend team standardizing review

**Context.** Eight engineers, one service, reviews that vary by reviewer. The team wants the same
things checked every time, and it wants the result to appear in the place reviews already happen.

**Composition.**

| Layer | File or setting | Job |
| --- | --- | --- |
| Reviewer persona | [`code-reviewer.agent.md`](../.github/agents/code-reviewer.agent.md) | A read-only reviewer, so a review cannot become a refactor |
| Procedure | [`code-review/SKILL.md`](../.github/skills/code-review/SKILL.md) with `context: fork` | A blocking checklist, loaded on review, in its own context |
| Review conventions | [`REVIEW.md`](../REVIEW.md) | What a finding must contain in this repository |
| Enforcement | Ruleset requiring a review; `CODEOWNERS` on the API surface | The review is a gate, not an offer |

**Why this shape.** The agent supplies the persona and the tool boundary, the skill supplies the
depth without costing context on every request, and `REVIEW.md` states the house rules once. The
ruleset is what makes the outcome independent of whether anyone remembered to ask for a review.

**What verifies it.** A pull request with a planted contract break produces a finding that names
the failure mode and a `path:line`; an unplanted pull request produces one line saying the change
is sound. Chapter [11](11-verification.md) turns that into a repeatable check.

## Recipe: a platform team distributing a bundle through a plugin

**Context.** A platform team owns the conventions for forty repositories. Copying `.github/` into
each one produces forty divergent copies within a quarter.

**Composition.** A bundle that keeps the neutral parts shareable and the host-specific parts thin:

| Layer | What it holds | Why it is where it is |
| --- | --- | --- |
| `AGENTS.md` | The tool-neutral baseline any agent reads | Read by Copilot and by other hosts, so it survives a host change |
| `.github/skills/` | The procedures, each with its own siblings | The open standard, and the only content that loads on demand |
| `.github/prompts/` | The IDE-only slash commands | Cheap to distribute, and the consumers are all in editors |
| `.github/agents/` | Personas and tool grants | Copilot-specific frontmatter, so they stay in the host layer |

**Distributing it.** Two mechanisms are documented: `gh skill publish` and `gh skill install`, which
is **in preview** and requires GitHub CLI 2.90.0 or later, or a plugin, which supplies its content
under its own namespace — a plugin install adds a prefix to a skill's name automatically, so do not
prefix names yourself. Plugin-supplied hooks are documented for the GitHub Copilot desktop app.

The plugin manifest format and the installation flow are outside the sources this repository
cites, so verify them against current documentation before you build the bundle around them. What
this repository can tell you is the constraint that matters at design time: because the installer
owns the namespace, the neutral skills must not encode a plugin name, and because a plugin can
supply hooks, its review process has to be at least as strict as yours.

**What verifies it.** Install into a scratch repository, run one skill, and diff the installed
`SKILL.md` against the source. A prefix that appears in one place and not another is the failure
you are looking for.

## Recipe: a regulated team that needs deterministic guardrails

**Context.** A team whose changes are audited, in an organization where "the model was told not to"
is not an answer.

**Composition.**

| Layer | File or setting | Job |
| --- | --- | --- |
| Prohibitions that must hold | [`guardrails.json`](../.github/hooks/guardrails.json) with the two `preToolUse` scripts | Denies force-pushes, credential reads, destructive SQL and history rewrites |
| Audit trail | [`audit-session.sh`](../.github/hooks/scripts/audit-session.sh) on `sessionStart` and `sessionEnd` | Records that a session happened, when, and where, and records no prompt text |
| Environment | [`copilot-setup-steps.yml`](../.github/workflows/copilot-setup-steps.yml) with pinned versions | The commands the review depends on exist |
| Blocked paths | Content exclusion in repository settings | Material that must not enter a model's context at all |
| Network | Firewall allow-list, both the agent section and the review section | What the session can reach |
| Review | `CODEOWNERS` on `.github/hooks/` and `.github/agents/`, with "Require review from Code Owners" | A guardrail cannot be weakened without its owners |

**Why this shape, and not more.** Five of these are settings, not files, and settings are where the
guarantees live. The temptation in a regulated environment is to add rules to instructions until
the file is unreadable. That produces a longer suggestion. The hooks stay small — the reference set
is eight rules — because a hook that breaks denies every tool call in the session, which is the one
outage this surface can cause.

**What verifies it.** Attempt each denied command in a fresh session and confirm the refusal names
the rule. Then break a hook script on purpose and confirm you can tell a halting guardrail from a
working one.

## Recipe: a documentation repository

**Context.** A repository like this one: Markdown is the product, there is no runtime, and the
reviewers care about prose and links.

**Composition.**

| Layer | File or setting | Job |
| --- | --- | --- |
| Always-on rules | [`AGENTS.md`](../AGENTS.md) and [`copilot-instructions.md`](../.github/copilot-instructions.md) | What the repository is, the hard rules, the verification command |
| Editorial contract | [`documentation.instructions.md`](../.github/instructions/documentation.instructions.md) with `applyTo` on Markdown paths | Voice, structure, prohibited words, link rules |
| Contract for the customization set | [`copilot-config.instructions.md`](../.github/instructions/copilot-config.instructions.md) | Schema rules that fire only when editing `.github/**` |
| Writer persona | [`docs-writer.agent.md`](../.github/agents/docs-writer.agent.md) | A writer that reads the two nearest exemplars first |
| Skeleton for a decision | [`write-adr.prompt.md`](../.github/prompts/write-adr.prompt.md) | A slash command that matches the existing ADR format |
| Mechanical check | `npm run check` in CI and in the setup steps | Broken links and invalid frontmatter fail the build |

**Why this shape.** Two path-scoped files carry most of the value, because the editorial rules and
the schema rules are genuinely different concerns that fire on different paths. Nothing here needs
a hook: a documentation repository has no irreversible command, and adding a guardrail you do not
need is how guardrails get a reputation for being noise.

**What verifies it.** Break a relative link and a frontmatter key, and confirm the validator fails
on both. Then ask the writer agent for the same paragraph twice and compare.

## Composition smells

| Symptom | Cause | Fix |
| --- | --- | --- |
| The same rule appears in three files | Each new mechanism was an addition rather than a move | Give the rule one owner and delete the copies |
| The instruction file is the longest file in the repository | Preference, capability and guarantee were all written as prose | Split by mechanism: keep prose, add tool lists, add hooks |
| Nobody can say which mechanism applies to a request | The mapping was never written down | Use the decision table and record the answer next to the file |
| A new repository copies everything and drops half | The bundle mixed host-specific and neutral content | Separate the neutral core from the host layer, as in the plugin recipe |
| Adding a mechanism broke an existing one | Two mechanisms now decide the same outcome | Choose the stronger one for the outcome and remove the weaker |
| A hook exists for a command nobody has ever run | Guardrails were added against a hypothetical | Remove it; every rule is a failure mode of its own |

## Practice

The practice track reads in the same order as this chapter, and each mechanic has its own lab:
[lab 09](../labs/09-guardrails.md) builds the regulated composition's enforcement,
[lab 04](../labs/04-first-agent.md) builds the reviewer persona, and
[lab 05](../labs/05-first-skill.md) builds the review skill. The
[labs index](../labs/README.md) lists them all.

Next: [verification](11-verification.md), which is how you find out whether any of this actually
composes.
