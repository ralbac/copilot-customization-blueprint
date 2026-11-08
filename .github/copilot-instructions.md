# Repository-wide Copilot instructions

This file is loaded into every Copilot interaction that happens in the context of this
repository. It is the widest, always-on layer. Everything that only applies to part of the
codebase belongs in `.github/instructions/` instead, and anything that only matters for one
kind of task belongs in a skill or a prompt file.

The tool-neutral baseline lives in `AGENTS.md`. This file adds the Copilot-specific
conventions and the hard rules that must not drift.

## Project shape

- `docs/` — theory track, read in numeric order.
- `labs/` — practice track, one directory per lab, each with an observable check.
- `reference/` — dense lookup material; not meant to be read front to back.
- `.github/` — the reference customization set. It is live: this repository uses the
  customizations it documents.
- `examples/shop-api/` — a toy fixture the labs operate on. It is not a runnable
  application, and it is never the subject of a refactor.
- `scripts/` — tooling that validates this repository.

## Hard rules

- Never invent a Copilot file location, frontmatter property, or behaviour. If you are not
  certain, check `reference/frontmatter-reference.md` and `reference/sources.md`.
- Never describe a preview or experimental feature as generally available. Label it.
- Never edit a file under `examples/shop-api/` to make a check pass. The fixture is fixed
  on purpose; the lab is what should change.
- Never copy content from `docs/` into `labs/`. Labs link to chapters. Duplicated
  explanation drifts and then contradicts itself.
- Do not add a dependency to run the validator. `npm run check` must work on a fresh clone
  with `node` and nothing else.

## Style

- Prose: second person, present tense, active voice, short sentences. Contractions are
  fine. Marketing adjectives are not.
- No emoji in prose. Emoji are acceptable only inside a table cell in `reference/`.
- Headings use sentence case.
- One H1 per Markdown file, and it matches the file's purpose, not its filename.
- Tables over bullet lists when the reader is comparing more than three things.

## Commands

```bash
npm run validate   # frontmatter and link contract for the whole repository
npm test           # validator tests
npm run check      # both, in order
```

If you add a rule to the validator, add the failing case to `scripts/test/` in the same
change. A validator rule without a failing fixture is a rule nobody has proven.

## When you are unsure

Ask. A wrong instruction file is worse than a missing one, because it silently changes
every future interaction instead of failing visibly.
