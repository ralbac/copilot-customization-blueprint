# Lab 02 — Path-scoped instructions

## Goal

You will be able to prove that a path-scoped instruction with `applyTo: "**/*.ts"` reaches
`examples/shop-api/src/api/orders.ts` and does not reach `examples/shop-api/README.md`.

## What you need

- An IDE that reads `.github/instructions/*.instructions.md`: VS Code, Visual Studio, JetBrains
  IDEs, or Xcode. The matching happens on the surface, so the second half of the check needs a
  Copilot session.
- Node.js 20 or newer for `node scripts/validate-customizations.mjs`, which is the first half
  of the check and needs no Copilot at all.

## Before you start

Open two files:

- `.github/instructions/typescript.instructions.md` — the existing scoped file. Its frontmatter
  is `applyTo: "**/*.ts,**/*.tsx"` and `description: "TypeScript conventions for this
  repository."`.
- `examples/shop-api/src/api/orders.ts` — the file you will prove a match against.

The expected state: `.github/instructions/` holds four files (`copilot-config`, `documentation`,
`tests`, `typescript`), and each one has a quoted `applyTo`. Before you write anything, predict
the answer to this question and write it down: does `applyTo: "**/*.ts"` match
`examples/shop-api/README.md`? The lab is more useful when you commit to a prediction first.

## Steps

1. Read the `applyTo` line of `typescript.instructions.md` and note that the glob is relative to
   the repository root, not to `.github/instructions/`. That single fact explains why
   `**/*.ts` matches a file four directories deep.

2. Create `.github/instructions/shop-api.instructions.md` and paste this content:

   ```markdown
   ---
   applyTo: "**/*.ts"
   description: "Lab 02 probe rules for TypeScript files."
   ---

   # shop-api probe instructions

   - The fixture under `examples/shop-api/` is fixed. Report a defect in it; do not change it.
   - Begin any answer about a matching file with the word `scoped`. This rule exists only for
     lab 02 and is deleted at the end of it.
   ```

   The `applyTo` value uses `**/*.ts` and not `examples/shop-api/**/*.ts` on purpose: you are
   proving the general glob, and a narrower glob would not demonstrate the matching rule.

3. Run the validator:

   ```bash
   node scripts/validate-customizations.mjs
   ```

   Expected: no line names `shop-api.instructions.md`, and the summary line reads
   `0 error(s), 1 warning(s), N file(s) inspected`. The one warning is about `allowed-tools` in
   `.github/skills/dependency-audit/SKILL.md` and has nothing to do with your file.

4. Break the glob on purpose. Remove the quotes so the line reads exactly:

   ```yaml
   applyTo: **/*.ts
   ```

   Run the validator again. Expected output, verbatim:

   ```text
   .github/instructions/shop-api.instructions.md:2: error: 'applyTo' value must be quoted: **/*.ts
   1 error(s), 1 warning(s), N file(s) inspected
   ```

   Restore the quotes before continuing. This is the failure the quoting rule prevents: an
   unquoted `*` starts a YAML alias, the frontmatter never parses, the file never applies, and
   nothing at runtime tells you.

5. Prove the match. Start a fresh session, open `examples/shop-api/src/api/orders.ts`, and ask:

   ```text
   Does getOrder check that the caller owns the order it returns?
   ```

6. Prove the non-match. In a fresh session, open `examples/shop-api/README.md` instead, and ask:

   ```text
   What does this fixture README say the labs use it for?
   ```

## Check

Success is asymmetric, and the asymmetry is the point:

| Question | `scoped` marker | Why |
| --- | --- | --- |
| About `orders.ts` | Present | `**/*.ts` matches a path that ends in `.ts` |
| About `README.md` | Absent | The path ends in `.md`, so no part of the glob matches |

The failure rows are the ones worth knowing by sight:

| What you see | What it means |
| --- | --- |
| Marker present for both files | The glob is too broad, most likely `"**"` or `"**/*"`. You have written a second repository-wide file with extra steps |
| Marker absent for both files | The file is unquoted, the `applyTo` key is missing, or the file is not under `.github/instructions/` |
| Marker absent for `orders.ts`, present nowhere | The session started before you created the file, or the surface does not read path-scoped files |
| Marker present for `orders.ts` in one workspace, absent in another | The workspace root is not the repository root, so the relative path is different |

Answering the two questions correctly does not prove anything, for the same reason as in
[lab 01](01-first-instruction.md): both answers are derivable from the files you attached. The
marker is the evidence, and the negative case is the one that proves the scoping.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| Validator reports `'applyTo' value must be quoted` | Unquoted leading `*`, which YAML reads as an alias | Quote the whole value |
| Validator reports no problem and the file never applies | The file name lacks the `.instructions.md` suffix, or it sits outside `.github/instructions/` | Rename and move it; the suffix is part of discovery |
| The marker appears when you attach the whole `examples/` folder | The surface treats the folder as context and matches some file inside it | Attach one file at a time to make the test meaningful |
| The marker never appears in Copilot CLI | Supported there, but only for matching files in the working tree | Check the file is committed or at least on disk, and that you are in the repository root |
| Two files apply and the answers conflict | Two overlapping globs with contradictory rules | Give each rule one owner; overlap is for shared rules only |

The validator is deliberately limited: it proves the frontmatter parses and the glob is quoted.
It cannot prove that your glob matches the files you had in mind. That half is the two-file
test above, which is why both halves are in this lab.

## Clean up

Delete `.github/instructions/shop-api.instructions.md`, then:

```bash
git status --short
```

Expected: no output. If you left the unquoted version behind in another file, the validator
names it; if you deleted the wrong file, `git diff` names that too.

## What you just proved

`applyTo` is evaluated against the repository-relative path of the files in play, and it decides
whether the file enters the context at all, so a scoped file is a saving on context and not a
different mechanism. A scoped file that never matches is indistinguishable from a file that does
not exist: both produce silence, and neither produces an error. The marker plus the deliberate
non-match is what turns "my instruction does nothing" from a guess into an observation.
[Path-scoped instructions](../docs/02-path-scoped-instructions.md) explains the rest of the
matching rules, including overlap and `excludeAgent`.
