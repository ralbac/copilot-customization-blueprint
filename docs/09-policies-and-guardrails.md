# Policies and guardrails

Everything before this chapter tells the model what to do. This chapter is about the settings that
do not ask. By the end of it you will be able to classify any control by what it actually stops, and
say which of the controls you have adopted is enforcement and which is documentation that reads
like enforcement.

## Instructions are a suggestion

The distinction is worth restating in the chapter that depends on it most. A sentence in
[`copilot-instructions.md`](../.github/copilot-instructions.md) is prompt injection: the model
usually follows it, and "usually" is the whole guarantee. The mechanisms in this chapter are not
that.

| Mechanism | What it is | Failure mode |
| --- | --- | --- |
| Instructions, prompt files, skills | Text the model reads | Ignored, or partially followed, with no error |
| Tool grants, MCP tool lists | Capability boundaries | Absent capability, which fails visibly |
| Hooks | Deterministic decisions at lifecycle events | Fail-closed outage, or fail-open silence |
| Repository and organization settings | Gates enforced by GitHub | Not configured, or configured with the activating rule missing |

A team that writes "never commit secrets" in an instruction file and stops there has a preference.
A team that runs a `preToolUse` hook, denies force-pushes in a ruleset, and requires an owner
review on the hooks directory has a control.

## The controls, classified

| Control | Stops | Does not stop |
| --- | --- | --- |
| Path-scoped and repository instructions | Nothing; it shapes behaviour probabilistically | Any deliberate action by the model |
| An agent's `tools` list | The agent using a capability it was not granted | A different agent, or a session without that agent |
| A skill's `allowed-tools` | Confirmation prompts, which cuts both ways | Anything about what the model chooses to run |
| `preToolUse` hooks | The specific tool calls your script matches, deterministically | Tool calls your rules missed, and nothing at all on timeout |
| Repository rulesets | Merging without the required review or check, and rewriting protected history | What the agent does on a branch before a pull request exists |
| `CODEOWNERS` with "Require review from Code Owners" | Merging a customization change without an owner's approval | Reading, or using, an unreviewed file already on the default branch |
| Content exclusion | Copilot reading the excluded paths at all | Secrets the agent writes into a file it is allowed to read |
| Firewall settings | Network destinations outside the allowed set | Anything inside the repository |
| Enterprise managed settings | An operation, for every user, regardless of local configuration | Nothing below it; it is the top of the stack |
| Workflow-approval default | CI running on agent-authored pull requests before a human approves | The pull request existing |
| Agents secrets and variables | Secrets appearing in configuration text | The agent misusing a secret it is given |

The right-hand column is the important one. Most incidents attributed to "Copilot did something
unexpected" are a control that was never in place, described in the past tense because a file
mentioned the topic.

## Rulesets apply to the agent like any other actor

Copilot's work reaches a branch and a pull request like anyone else's, and repository rulesets
constrain it the same way. What that buys you:

- **Require a pull request before merging.** The agent cannot write to the default branch, so every
  change is a diff with an author, a description and a review.
- **Require review.** Agent-authored changes are reviewed by the same people as human changes.
  Review is where a plausible-looking change that quietly widens a permission gets caught, and no
  instruction file catches that.
- **Block force-pushes and deletion** on the branches that matter. This is the same rule you would
  write for people; it needs no agent-specific variation.

Rulesets also apply to tags, which is how a release tag written by an agent becomes an event a
human approved rather than one that appeared.

The adaptation for agents is not a different ruleset. It is the same ruleset with the realization
that the actor now works at machine speed and never gets tired, so a gap that a person closes by
judgement gets exercised every time.

## `CODEOWNERS`, and the rule that activates it

[`.github/CODEOWNERS`](../.github/CODEOWNERS) does two jobs:

1. It makes the customization surface review-critical. Copilot reads these files and then acts on
   what they say, so an unreviewed edit here is an unreviewed change to agent behaviour.
2. It routes areas that need domain review to the people who know them.

The file on its own is a suggestion. It becomes enforcement only when the branch rule **"Require
review from Code Owners"** is enabled. Without that rule, GitHub shows the suggested reviewers and
merges the change without them.

Two details decide whether the routing does anything:

- **Later patterns win.** The most specific rule goes last. A `*` default owner followed by
  `/.github/hooks/` and its owners is the shape that works; the reverse is a file where everything
  routes to the default owner.
- **Ownership follows the risk, not the directory tree.** `.github/hooks/` is routed to both the AI
  governance and security owners in this repository, because hooks are the one customization that
  executes commands without asking the model. `.github/prompts/` is routed to governance only.

## Content exclusion

Content exclusion keeps Copilot from reading the excluded paths at all. It is configured in
organization and repository settings rather than in a file, and it is the control you reach for
when a path must not enter a model's context even by accident: a directory of customer data, a
vendored secret store, a file of internal endpoints.

It is a different control from a `preToolUse` hook denying reads of `.env` files. The hook stops
one tool call in one session and relies on the script matching the path; exclusion stops the content
from being available at all, earlier and on every surface that honours it. Use both when the
material is genuinely sensitive: the hook for the session in progress, the exclusion for the policy.

## The firewall

Internet access from the agent is firewalled by default. The allow-list is configured in
organization and repository settings.

Copilot code review has its own firewall section, separate from the cloud agent's. Configuring one
and assuming the other is configured is the standard mistake, and it presents as a review that
cannot reach something the agent can.

The firewall is how you express "this environment reaches our package registry and nothing else".
It is not a substitute for reading code: it constrains the network, not the diff.

## Enterprise and organization settings

Enterprise managed settings sit above everything else. A managed-settings deny rule blocks an
operation for all users regardless of their local configuration, which is the only way to answer
"can a developer re-enable this for themselves?" with "no".

Below that, organization policies decide which features and models exist for members at all. Both
layers are configured outside the repository, and both are worth checking before you design around
a capability: a guardrail for a feature your organization has disabled is wasted work.

## Secrets and variables

Agents secrets and variables are configured at organization and repository level, and MCP
configuration reaches them through the `COPILOT_MCP_` prefix described in
[chapter 07](07-mcp.md#secrets).

The control is the prefix plus the scope. A secret that is available to every repository in the
organization is a different risk from one available to a single repository, and the prefix decides
which of them an MCP configuration can even name.

## Custom properties for targeting at scale

At organization scale, custom properties let you target repositories rather than enumerate them: a
policy applied to repositories whose custom property marks them as production, for instance,
instead of a list that goes stale the week after it is written.

The property is a targeting mechanism, not a control on its own. It decides which repositories a
ruleset or a policy covers, and its value depends on the property being maintained with the same
discipline as the policy it drives.

## Order of adoption

If you adopt four of these and not the rest, adopt them in this order. Each row assumes the ones
above it.

1. **Require a pull request and a review** on the default branch. Everything else assumes changes
   are reviewable.
2. **`CODEOWNERS` plus "Require review from Code Owners"** on the customization surface, so agent
   behaviour cannot be changed without the people accountable for it.
3. **Content exclusion** for the paths that must never enter a model's context.
4. **A `preToolUse` hook** for the two or three commands that are irreversible in your repository.
   Two or three, not twenty: every rule is a script that can deny every tool call if it breaks.

The rest — firewall, managed settings, custom properties, workflow approval — depend on how much
of the organization the rollout covers.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `CODEOWNERS` names reviewers and changes merge without them | "Require review from Code Owners" is not enabled | Enable it in the branch rule or ruleset |
| The most specific owner never gets the request | A broader pattern appears later in the file and wins | Put the specific pattern last |
| The agent merges its own change | No ruleset requires a pull request and a review | Require both on the branches that matter |
| A sensitive path appears in a model's answer | Exclusion does not cover it, or covers a different path | Exclude the directory, and add a hook for the session in progress |
| Review cannot reach a registry the agent reaches | The firewall is configured per surface and the review section was left alone | Configure both sections |
| A developer re-enables a blocked operation | The block is a policy or a setting, not a managed setting | Use enterprise managed settings for anything that must not be reversible |
| The MCP configuration cannot see an organization secret | The secret name lacks the `COPILOT_MCP_` prefix | Rename it with the prefix |
| A guardrail file exists and nothing is enforced | It was adopted as documentation | Pair every file with the setting that activates it, and write down which setting that is |

## Practice

[Lab 09](../labs/09-guardrails.md) has you enable a ruleset, route the customization surface through
`CODEOWNERS`, and prove that an unreviewed change to a hook script cannot merge.

Next: [composition patterns](10-composition-patterns.md), which turn these controls into four
concrete configurations for four kinds of team.
