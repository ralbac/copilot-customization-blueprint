# Lab 04 — Select a read-only agent

## Goal

You will be able to prove that `.github/agents/code-reviewer.agent.md` cannot edit a file, and
that the tool grant rather than the prose in its body is what stops it.

## What you need

- A surface with a custom-agent picker. Custom agents are generally available in VS Code, Copilot
  CLI and on github.com, and in preview in JetBrains IDEs, Eclipse and Xcode. This lab uses VS
  Code and works in the CLI if you are willing to map the picker to `/agent`.
- The clone, because the check runs `git status`.

## Before you start

Open `.github/agents/code-reviewer.agent.md`. The expected frontmatter:

```yaml
---
name: code-reviewer
description: Reviews a change for correctness, contract breaks and missing tests. Read-only: never edits files.
tools: ["read", "search"]
disable-model-invocation: true
---
```

Confirm the working tree is clean before you start, so that anything you see afterwards is
attributable to this lab:

```bash
git status --short
```

Expected: no output.

## Steps

1. Read the second paragraph of the agent's body: "The `tools` list is the boundary, not a
   suggestion: `read` and `search` only, so a review can never quietly turn into a refactor."
   Then read the `tools` line again. The body explains the grant; the grant is the mechanism.

2. Select the agent. In VS Code, the Chat view has an agent selector beside the model picker; the
   exact label and position differ by version. Select `code-reviewer`. The screenshot you are
   looking for is the chat header or picker showing `code-reviewer` as the active agent — if it
   still shows the default agent, nothing that follows is a test of this file.

3. Ask it to do exactly what it must not do:

   ```text
   Fix the authorization defect in examples/shop-api/src/api/orders.ts so that getOrder
   rejects a caller reading another customer's order.
   ```

4. Read the answer, then check the file:

   ```bash
   git status --short
   ```

5. Now ask it to review something, so you see the grant used rather than merely refused. Make a
   small change somewhere harmless — for example add a blank line to a file you own — and ask:

   ```text
   Review the change in the working tree.
   ```

   Expected shape: findings with `path:line`, one line per finding, severity first, no restating
   of the diff.

## Check

Success has two parts, and the second is the one that counts:

- The answer states that it has no tool to edit files, and it may still show you a patch as
  text.
- `git status --short` prints only the file you touched in step 5. `examples/shop-api/src/api/orders.ts`
  does not appear.

The nuance matters: a read-only agent can write code into the chat. The grant removes the ability
to write it to disk, not the ability to suggest it. If your standard for "read-only" is "cannot
propose an edit", no tool grant delivers that; if it is "cannot change the repository", this one
does.

| What you see | What it means |
| --- | --- |
| The answer refuses, and `git status` shows the file unchanged | The boundary holds |
| A diff appears in the editor and `git status` lists `orders.ts` | `tools` is unset, or includes `edit`, in the version of the file you ran. An unset `tools` grants every tool |
| The refusal quotes the sentence from the body and says nothing about tools | Inconclusive. Ask it to delete a file: refusing for lack of a tool looks different from refusing because a paragraph told it to |
| A different agent answers | You switched agents mid-session, or the IDE kept the previous selection; restart the session and reselect |
| `code-reviewer` is never selected for review work automatically | Expected: `disable-model-invocation: true` keeps Copilot from assigning review work to it |

That last row is a feature, not a defect. A review should be requested. If you want automatic
selection, the property to change is `disable-model-invocation`, and the cost is that the agent
starts appearing in work nobody asked it to do.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| `code-reviewer` is not in the agent list | The file is outside `.github/agents/`, or the extension is not `.md` or `.agent.md` | Move it and use `code-reviewer.agent.md` |
| The agent appears but edits files | `tools` is unset or includes `edit` | Restore `tools: ["read", "search"]` and start a new session |
| The agent appears on github.com but not in the IDE, or the reverse | The file is only on one branch, or `target` restricts it | Push the branch, or remove `target` |
| An edit made by the agent does not take effect in the open session | The session keeps the agent version from the commit it opened with | Start a new session |
| The IDE shows `code-reviewer` but answers as a general assistant | The picker shows the agent from a different workspace folder | Close other folders; a multi-root workspace can select per root |

## Clean up

Revert the harmless change from step 5:

```bash
git restore <the file you changed>
git status --short
```

Expected: no output. If `examples/shop-api/src/api/orders.ts` shows a modification, restore it as
well. The defect is deliberate and later labs depend on it.

## What you just proved

A tool grant is a capability boundary enforced by the runtime: the reviewer does not avoid editing
because it read a rule, it cannot edit because there is no tool to do it with. That is the
strongest cheap guardrail in the whole customization surface, and it is one line of YAML — but
only when the list is explicit, because an unset `tools` grants everything. `disable-model-invocation`
is a separate and weaker control: it changes who may select the agent, not what the agent can do,
and it is a property of automatic selection rather than a guarantee.
[Custom agents](../docs/04-custom-agents.md) covers the rest of the frontmatter.
