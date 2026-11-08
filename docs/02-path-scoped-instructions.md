# Path-scoped instructions

Path-scoped instructions are always-on context that only applies when the files in play match
a glob. By the end of this chapter you will be able to split a bloated repository-wide
instruction file into scoped files, and know the exact matching rules so your globs fire when
you expect.

## The file

One file per concern, under `.github/instructions/`, with the `.instructions.md` extension:

```text
.github/instructions/
├── typescript.instructions.md
├── tests.instructions.md
├── documentation.instructions.md
└── copilot-config.instructions.md
```

The reference files for this repository are in
[`.github/instructions/`](../.github/instructions/). Each one is short on purpose: a scoped
file should hold the rules for its own concern and nothing else.

## The frontmatter

Two properties matter. `applyTo` is required, and it is the whole mechanism. `description` is
optional and is used for task-based discovery in some IDEs.

```yaml
---
applyTo: "**/*.ts,**/*.tsx"
description: "TypeScript conventions for this repository."
---
```

A file with no `applyTo` never applies, and reports no error. That is the failure mode this
chapter exists to prevent.

## How `applyTo` matches

Three details decide whether your glob fires, and all three bite people:

**1. Globs are relative to the repository root, not to the instructions directory.** A file
at `.github/instructions/tests.instructions.md` with `applyTo: "**/*.test.ts"` matches
`examples/shop-api/src/api/orders.test.ts`. It does not match
`.github/instructions/**/*.test.ts`, because that is a different path.

**2. Quote the value.** An unquoted `*` at the start of a YAML scalar is an alias indicator,
and the file fails to parse. `applyTo: **/*.ts` is broken. `applyTo: "**/*.ts"` is not. This
is the single most common reason a scoped instruction file silently does nothing, and
[the validator](../scripts/validate-customizations.mjs) rejects it.

**3. Multiple patterns are comma-separated in one string.**
`applyTo: "docs/**/*.md,*.md"` is the form to use. One `applyTo` key, one string.

## Overlap is allowed, and the overlap should be deliberate

Two files can match the same path. A `.test.ts` file matches both
[`typescript.instructions.md`](../.github/instructions/typescript.instructions.md) and
[`tests.instructions.md`](../.github/instructions/tests.instructions.md), so Copilot receives
both.

That is a feature: shared language conventions stay in one file, test conventions in another,
and a test file gets both without either file repeating the other. It becomes a problem only
when the two files disagree, because then you have two rules and no resolution order.

The discipline: in an overlapping file, state only what applies to the narrower set. The
`tests.instructions.md` file does not restate TypeScript rules — it says so explicitly and
then adds test-specific ones.

## What actually belongs here

The test is: *does this rule depend on which file is open?* If yes, scope it.

Good candidates:

- Language and framework conventions. `**/*.ts` gets TypeScript rules; `**/*.py` gets Python.
- Test conventions for test files only.
- Migration files, generated code, vendored directories — each with its own stricter or
  looser rules.
- Documentation files, whose editorial rules are nothing like the code rules.
- The customization files themselves. This is a genuinely useful one: a rule set that fires
  only when editing `.github/agents/**` or `.github/skills/**` can warn about the schema.

Bad candidates:

- Anything you would want applied to a pull request as a whole. Scoped instructions fire on
  the *files in play*, so they do not fire when the task is "review this diff".
- A single rule that applies to one file. Put it in that file as a comment, or in the
  repository-wide file.

## The anti-pattern: a glob that matches everything

If your `applyTo` is `"**"` or `"**/*"`, you have written a second repository-wide
instruction file with extra steps. It costs the same context and is harder to find. Either
narrow the glob or merge it into `.github/copilot-instructions.md`.

The same applies to a set of scoped files whose globs are so broad that every request loads
all of them. You have rebuilt the monolithic file you were trying to escape.

## `excludeAgent`

Some surfaces support an `excludeAgent` property to exclude a specific agent from reading the
file — most usefully, to keep a path-scoped file away from Copilot code review when its rules
are about authoring code rather than reviewing it. Treat it as surface-dependent: verify it
against the support reference for the surface you care about before relying on it, because a
silently ignored property changes nothing and tells you nothing.

## Support differs from the repository-wide file

Path-scoped instructions are read by more surfaces than they used to, but not by all of them.
The notable gap: on Copilot code review in VS Code, only the repository-wide file applies,
whereas code review on github.com reads path-scoped files too. Verify against
[the cheat sheet](../reference/cheat-sheet.md) before you assume a scoped file governs review.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Scoped file never applies | Unquoted glob, so the YAML never parsed | Quote the value; run `npm run validate` |
| Scoped file applies too widely | `applyTo` matches the whole repository | Narrow the glob |
| Two scoped files fight | Overlapping globs with contradictory rules | Give each rule one owner |
| Works in the editor, not in the cloud agent | The surface does not read path-scoped files | Check support, or move the rule to the repository-wide file |

## Practice

[Lab 02](../labs/02-path-scoped-instructions.md) has you add a scoped file, prove it matches
TypeScript sources, and prove it does *not* match the fixture's README.

Next: [prompt files](03-prompt-files.md), the first mechanism you invoke deliberately rather
than receive.
