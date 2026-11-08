---
name: changelog-entry
description: Writes a changelog entry for user-visible changes, following Keep a Changelog sections and this repository's link conventions. Use when a change affects behaviour a consumer can observe.
license: MIT
---

# Changelog entries

Use this skill when a change alters behaviour someone outside the change can observe: a
public function, a command, an output format, a configuration key, or documentation that
changes what a reader will do.

Do not use it for refactors, internal renames, test-only changes, or lint fixes. A changelog
that lists invisible work trains readers to ignore it.

## Process

1. Read the change. Identify the smallest set of behaviour that a consumer would notice.
2. Locate `CHANGELOG.md` at the repository root. If it does not exist, ask before creating
   it: a new changelog is a new commitment.
3. Match the existing format exactly. The structure below is the fallback for a new file,
   not a licence to restructure an existing one.
4. Decide the section by asking **what the reader must do**, not what you did:
   - `Added` — new capability. Reader can adopt it.
   - `Changed` — existing behaviour differs. Reader may need to adjust.
   - `Deprecated` — still works, will stop. Reader should plan.
   - `Removed` — no longer works. Reader must act.
   - `Fixed` — a defect is gone. Reader can stop working around it.
   - `Security` — a vulnerability is addressed. Reader should upgrade.
5. Write the entry with [the entry template](./entry-template.md).
6. Put it under `## [Unreleased]`. Never invent a version number or a date; those are set at
   release time by whoever cuts the release.

## Entry rules

- One line, imperative or noun phrase, ending without a period. Compare:
  `Add "retry" option to the client factory.` → too long, has a period, and restates the
  code. `Add retry option to client factory` → correct shape.
- Name the thing the reader uses, not the internal type. `Add retry option to client
  factory`, never `Add RetryPolicy to ClientFactoryImpl`.
- A breaking change carries a `**Breaking:**` prefix and states the migration in the same
  line. Burying the migration in a linked PR is how releases break quietly.
- Reference the issue or pull request with a link, not a bare number.

## Anti-patterns

- An entry per commit. The changelog tracks released behaviour, not work.
- `Various fixes and improvements`. This is a decision not to communicate.
- Duplicating the same user-visible change for every module it touched. One entry, one
  consequence.

## Supporting files

- [entry-template.md](./entry-template.md) — the exact block to paste.
