# Custom instructions

Custom instructions are the always-on layer: text that Copilot receives with every request
in a given scope. By the end of this chapter you will be able to write a repository-wide
instruction file that earns its context cost, and know when a rule belongs somewhere else
instead.

## The four scopes

Instructions are not one file. They are a set of files at different scopes, and which ones
apply depends on the surface.

| Scope | Where it lives | Applies to |
| --- | --- | --- |
| Organization | Organization settings on GitHub | Members' sessions on github.com and Copilot code review |
| Repository-wide | `.github/copilot-instructions.md` | Every request in the repository's context |
| Path-specific | `.github/instructions/*.instructions.md` | Requests involving files matching `applyTo` |
| Agent instructions | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `REVIEW.md` | Tool-neutral agent context |
| Personal | `~/.copilot/copilot-instructions.md`, or the UI on github.com | Only you |

Precedence is surface-specific, and the honest summary is: most surfaces *combine* the
applicable files rather than resolving a winner. On Copilot Chat on github.com the documented
order from highest to lowest is personal, then path-specific, then repository-wide, then
agent instructions, then organization. Treat that as the exception rather than the rule. If
you need two rules to not conflict, the reliable fix is to delete one of them, not to rely on
precedence.

## What belongs in the always-on layer

The test is one sentence: *would a new contributor need this on their first day, for almost
every task?* If yes, it belongs. If it depends on the task, it does not.

Belongs:

- What the project is, in two or three sentences.
- The stack, named concretely, with versions that matter.
- Conventions that a reviewer would actually reject a change for.
- The commands that verify a change.
- Hard prohibitions — the things that are wrong here specifically, not in general.

Does not belong:

- Anything only relevant to one directory. That is a
  [path-scoped instruction](02-path-scoped-instructions.md).
- Anything only relevant to one kind of task. That is a [skill](05-skills.md).
- General engineering advice. "Write clean code" and "add tests" are not repository-specific,
  so they spend context to tell the model something it already weights heavily.
- Long procedural documents. A procedure is a skill.

## A structure that survives review

The reference file for this repository is
[`.github/copilot-instructions.md`](../.github/copilot-instructions.md). It uses five
sections, in this order, and the order is not arbitrary:

1. **Project shape** — the directory map. This is the highest value-per-token content in the
   file, because it stops the model from searching for structure it could have been told.
2. **Hard rules** — the things that are wrong here. Imperative, specific, short.
3. **Style** — only the parts a reviewer enforces.
4. **Commands** — the exact verification commands. Never make the model guess how to run
   your tests.
5. **When you are unsure** — the escalation rule.

Sections three and four are where most files bloat. Keep them to what a reviewer would
actually raise.

## Writing rules that change behaviour

Vague rules produce vague behaviour and cannot be reviewed. Compare:

```markdown
<!-- Produces nothing you can check -->
Be careful with error handling and follow best practices.

<!-- Produces something a reviewer can verify -->
- Never catch an error and discard it. If a caller cannot act on a failure, log it once at
  the boundary and return a typed result.
- Do not throw strings. Throw `Error` with a message naming the operation and the value.
```

The second version works for three reasons: it names a specific construct to avoid, it names
the alternative, and a reviewer can point at a line and say "this violates the rule". Write
rules that fail visibly.

## What official guidance warns against

The documentation is explicit that some instruction types work poorly in large or diverse
repositories:

- Telling Copilot to consult an external document when answering. It often will not, and you
  cannot tell from the output whether it did.
- Style-only instructions in a large repository, because the repository has no single style.
- Fixed response-length or tone constraints, which fight every task that needs length.

If you find yourself writing "always answer in fewer than 1000 characters", you are
configuring a chatbot, not a coding agent. Remove it.

## `AGENTS.md` and the tool-neutral layer

`AGENTS.md` is a cross-tool convention that Copilot also reads. Two files could hold the same
rules, and if they do, they will eventually disagree.

The pattern this repository uses: `AGENTS.md` holds the tool-neutral baseline — what the
project is, the editorial and process rules, the verification command. The
Copilot-specific file adds only what is Copilot-specific, and links to `AGENTS.md` for the
rest. One owner per rule.

## Organization and personal instructions

Organization instructions are set in organization settings and apply to members' sessions on
github.com and to Copilot code review. They are currently supported only for organizations on
Copilot Business or Copilot Enterprise, and they are not supported in local client sessions.
Use them for compliance language, an internal knowledge base pointer, or a mandated response
convention — not for project conventions, which belong in the repository.

Personal instructions follow the individual. They are the right place for "respond in
Portuguese" and the wrong place for anything a team depends on, because nothing about them is
reviewable.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Copilot ignores a rule | The file is at the wrong path, or the surface does not read it | Check the surface's support in [the cheat sheet](../reference/cheat-sheet.md) |
| Copilot follows some rules, drops others | The file is long and the important rules are buried | Move task-specific content into skills; keep this file short |
| Two rules contradict | Duplicated ownership between `AGENTS.md` and the Copilot file | Delete one; give each rule a single home |
| Rules apply in the IDE but not in code review | Code review reads the file from the pull request's head branch, and support differs per surface | Test the rule in the surface you actually need |

## Practice

[Lab 01](../labs/01-first-instruction.md) walks through writing a repository-wide instruction
and proving it reaches the model. [Lab 02](../labs/02-path-scoped-instructions.md) does the
same for the path-scoped layer.

Next: [path-scoped instructions](02-path-scoped-instructions.md), which is where most of the
content you were tempted to put in this file actually belongs.
