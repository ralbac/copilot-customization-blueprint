# Lab 10 — Capstone: a complete customization set

## Goal

You will be able to ship a customization set for a repository you choose — instruction file,
path-scoped file, prompt file, read-only agent, skill with a sibling resource, and one hook — and
prove it with `node scripts/validate-customizations.mjs` exiting 0.

## What you need

- A repository you own, with write access and real code to write rules about; Node.js 20 or newer.
- An IDE with Copilot for the behavioural checks, and a shell for the pipe test.

## Before you start

Copy `scripts/validate-customizations.mjs` from this repository into your repository's `scripts/`
directory, then run it. It is dependency-free, and it keeps the set valid after you stop looking at
it. The expected state is a failing run, because three required files do not exist yet:

```text
.github/CODEOWNERS:1: error: missing review routing for the customization surface
.github/copilot-instructions.md:1: error: missing repository-wide instructions
AGENTS.md:1: error: missing tool-neutral agent instructions

3 error(s), 2 warning(s), 1 file(s) inspected
```

The two warnings say no agents and no skills were found; steps 5 and 6 clear them.

## Steps

1. Write `.github/copilot-instructions.md` with no frontmatter and under 60 lines. The sections,
   in order: project shape, hard rules, style, commands, and what to do when unsure.

   ```markdown
   # <Project> Copilot instructions

   <What the project is, in two sentences. Name the stack.>

   ## Project shape

   - `src/` — <main modules, one line each>

   ## Hard rules

   - <A rule a reviewer would reject a change for>
   - <A prohibition specific to this repository>
   ```

   Add `## Commands` with the exact command that verifies a change, and `## When you are unsure`
   with an escalation line. Check the budget, which the validator does not:
   `wc -l .github/copilot-instructions.md`.

2. Write `AGENTS.md` as the tool-neutral baseline, and `.github/CODEOWNERS` with owners that exist
   and have write access. Each rule has exactly one home across the two.

3. Add `.github/instructions/<topic>.instructions.md`. Quote the glob, keep it narrow, and justify
   the scope in one sentence. `"**"` or `"**/*"` is a second repository-wide file.

   ```yaml
   ---
   applyTo: "src/<area>/**/*.ts"
   description: "<Topic> rules for <area>."
   ---
   ```

4. Add `.github/prompts/<task>.prompt.md` for a task you repeat. Keep the frontmatter to `name`,
   `description`, `argument-hint` (the shape of the argument, not its purpose) and
   `tools: ["read", "search"]`, and state the output shape in the body.

5. Add `.github/agents/<name>.agent.md`. `description` is required and drives automatic selection,
   so it names the role and the boundary. Grant the smallest tool set.

   ```yaml
   ---
   description: "<Role and boundary>. Read-only: never edits files."
   tools: ["read", "search"]
   disable-model-invocation: true
   ---
   ```

6. Add `.github/skills/<name>/SKILL.md` plus a sibling it uses, for example `template.md`. The
   `name` property equals the directory name, the `description` says when to use the skill, and the
   body links the sibling or it never loads.

7. Add `.github/hooks/<name>.json`: `version: 1`, a `hooks` object, and an entry with
   `type: "command"`, a script path and an explicit `timeoutSec`. The script exits 0 on every path
   and denies through JSON only.

   ```bash
   #!/usr/bin/env bash
   set -uo pipefail
   payload="$(cat)"
   case "$payload" in *REPLACE_ME*)
     printf '%s\n' '{"permissionDecision":"deny","permissionDecisionReason":"REPLACE_ME is not allowed."}' ;;
   esac
   exit 0
   ```

   Test it as [lab 06](06-hooks.md) does: pipe a payload in. A match prints one JSON object and
   exits 0; a non-match prints nothing and exits 0.

8. Run the validator until it passes, fixing errors in file order:

   ```bash
   node scripts/validate-customizations.mjs; echo "exit=$?"
   ```

   Then prove what it cannot check: select the agent, ask it to edit a file, and confirm it refuses
   with `git status --short` clean. Invoke the prompt by its slash command and compare the output
   shape with what its body promises.

9. Self-review before you open a pull request:

   | Item | Pass condition |
   | --- | --- |
   | Instruction file | Under 60 lines; every rule is one a reviewer would reject a change for |
   | Path-scoped file | One sentence justifies the glob; not `"**"` or `"**/*"` |
   | Prompt file | Narrow `tools`; `argument-hint` describes shape; body states output shape |
   | Agent | `description` names role and boundary; `tools` excludes `edit` |
   | Skill | `name` equals directory; `description` says when to use it; sibling linked |
   | Hook | Exits 0 on every path; denies through JSON; `timeoutSec` set; tested by pipe |
   | Ownership | `CODEOWNERS` names real teams with write access; review required |
   | Validator | Exits 0 with no errors |

## Check

Success is four observations, and the validator covers only the first: it exits 0; the hook denies
a matching payload and prints nothing with exit 0 otherwise; the agent refuses an edit and the tree
stays clean; the skill is offered as `/<name>`, its sibling referenced. Plausible failures:

| What you see | What it means |
| --- | --- |
| `0 error(s)` and a 200-line instruction file | The validator checks the schema, not the context budget |
| `0 error(s)` with `applyTo: "**"` | Valid, quoted, and a second repository-wide file |
| A hook that ends `exit 1` on the non-matching path | A live session denies every tool call |

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| `missing repository-wide instructions` | The file does not exist | Create `.github/copilot-instructions.md` |
| `skill 'name' is "x" but its directory is "y"` | The two disagree | Rename one; lowercase, digits and hyphens |
| `relative link does not resolve` | The target is missing, or the path resolves from another file | Resolve from the linking file |
| `hook ... references a script that does not exist` | Path wrong, or not relative to the repository root | Use `./.github/hooks/scripts/<name>.sh` |

## Clean up

The capstone lives in your own repository, so there is nothing to revert here. Keep the copied
validator and run it in CI: a set validated on every change is a contract. In this repository,
`git status --short` prints nothing.

## What you just proved

Each component exists because one mechanism does something the others cannot: an instruction
shapes every request, a scoped glob shapes only requests involving those paths, a prompt is invoked
deliberately with its own tool grant, an agent's `tools` list removes a capability, a skill loads a
procedure and its assets on demand, and a hook is applied by the runtime instead of trusted to the
model. The validator closes the loop, because every one of these files fails by being silently
ignored, and a schema check is the only thing that turns silence into an error.
