# Lab 01 — Write a repository-wide instruction

## Goal

You will be able to prove that an instruction in `.github/copilot-instructions.md` reaches the
model, and tell a stale session apart from a file that is not being read.

## What you need

- One surface that reads `.github/copilot-instructions.md`: VS Code with Copilot Chat, Copilot
  CLI, or Copilot Chat on github.com. All three read this file; the steps below use VS Code and
  work unchanged in the other two.
- Node.js 20 or newer only if you want to run the validator at the end. Nothing else in this
  lab needs a build.

## Before you start

Open `.github/copilot-instructions.md`. The current expected state:

- The first line is `# Repository-wide Copilot instructions`.
- There is no YAML frontmatter. The file has no configuration surface, so its only lever is
  length.
- The sections are `## Project shape`, `## Hard rules`, `## Style`, `## Commands`, and
  `## When you are unsure`, in that order.

Read the five sections now. The check in this lab depends on you knowing what the file already
says, so that an answer drawn from the file is distinguishable from an answer drawn from
general knowledge.

## Steps

1. Add a probe section at the end of the file. Paste it exactly, including the blank line
   before the heading:

   ```markdown
   ## Lab probe

   - When you answer a question about this repository, begin the answer with the word
     `anchor`. This rule exists only for lab 01 and is deleted at the end of it.
   ```

2. Save the file and confirm the edit is only what you pasted:

   ```bash
   git diff --stat .github/copilot-instructions.md
   ```

   Expected output: one file changed, five insertions. A different count means you changed
   something else as well; undo it before continuing.

3. Start a fresh session. In VS Code that is the new-session control in the Chat view; the
   exact label differs by version. Do not reuse a chat that was open before step 1.

4. Ask a question that only the file answers:

   ```text
   Which directory holds the customization files this repository actually uses, and which
   files are loaded on every request?
   ```

5. Read the first word of the answer before you read the rest. That word is the check.

## Check

Success looks like this: the answer begins with `anchor`, and it names `.github/` as the
customization directory, with `.github/copilot-instructions.md` as the always-on file and
`AGENTS.md` as the tool-neutral baseline.

Three plausible-looking failures, and what each one means:

| What you see | What it means |
| --- | --- |
| The answer describes `.github/` correctly but does not begin with `anchor` | The file was not in this session's context. Either the path is wrong, or the session started before your edit. |
| The answer begins with `anchor` because you pasted the rule into your prompt | You proved nothing about the file. The rule has to arrive from the file, not from the message. |
| The answer begins with `anchor` and then misdescribes the project shape | The injection worked and the content is wrong. Fix the `## Project shape` section, not the probe. |

The middle row is the one that catches people. A model that answers a repository question
correctly is not evidence that it read your file, because much of what the file says is also
what a competent answer looks like. The marker is evidence; a good answer is not.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| No `anchor` in a session you just created | The file is not at `.github/copilot-instructions.md`, or it is named `copilot_instructions.md` or `copilot-instruction.md` | Rename it; the path and the filename are fixed, and a misspelling produces no error |
| No `anchor` in VS Code, but the answer is right in a new chat on github.com | github.com reads the file from the branch in context, and your edit is not on that branch | Commit and push, or select the branch that holds the edit |
| `anchor` appears, but a hard rule is ignored | The file is long and the rules are buried, or two sections give conflicting instructions | Shorten it and move task-specific content into a skill |
| The rule applies in one folder and not another | You opened a different folder, or a multi-root workspace whose root is elsewhere | Open the repository folder itself so `.github/` is at the workspace root |
| The answer reads the probe but not `AGENTS.md` | That surface does not read `AGENTS.md`, which is not required for this lab | Check the surface against [the cheat sheet](../reference/cheat-sheet.md) |

## Clean up

Delete the `## Lab probe` section and save. Then:

```bash
git diff --stat .github/copilot-instructions.md
```

Expected output: nothing, because the file matches the commit again. If you already committed
the probe, remove it in a new commit rather than rewriting history: the commit is the record of
what you did, and this repository does not ask you to rewrite it.

## What you just proved

The repository-wide file is prompt injection at the widest scope: every request made in this
repository's context receives it, which is why its length is a cost paid on every interaction.
The marker is evidence of injection and its absence is evidence about the session, not about
the file, because a session that predates your edit can answer from the old context with
complete confidence. That is why proving a customization works always starts with a fresh
session, and why "the model ignored my rule" is usually a discovery question rather than a
prompt-writing question. [Custom instructions](../docs/01-custom-instructions.md) covers where
each kind of rule belongs; [lab 02](02-path-scoped-instructions.md) narrows the same mechanism
to a set of paths.
