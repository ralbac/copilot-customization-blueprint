# Skills

A skill is a procedure that the model loads when it decides the procedure is relevant. By the end
of this chapter you will be able to write a `SKILL.md` that is discovered reliably, understand why
progressive loading changes what you can afford to write, and recognize the three silent failures
that make a skill do nothing at all.

## The open standard, and the locations it enables

Agent Skills is an open standard: a directory containing a `SKILL.md` file, with optional sibling
files. Copilot implements it, which is why skills are read from more than one location:

| Scope | Paths |
| --- | --- |
| Project | `.github/skills/<name>/`, `.claude/skills/<name>/`, `.agents/skills/<name>/` |
| Personal | `~/.copilot/skills/<name>/`, `~/.agents/skills/<name>/` |

That table is the most portable thing in this repository. A skill in `.claude/skills/` is read by
Copilot, and a skill in `.github/skills/` follows a standard that other hosts implement. Chapter
[12](12-portability.md) covers the consequences; here, note only that the format is not
Copilot-specific, which is why the investment pays back outside Copilot.

The reference skills in this repository are in [`.github/skills/`](../.github/skills):

| Skill | Why it is shaped that way |
| --- | --- |
| [`code-review`](../.github/skills/code-review/SKILL.md) | `context: fork`, a `blocking-checklist.md` sibling, and a review-focused directory name |
| [`changelog-entry`](../.github/skills/changelog-entry/SKILL.md) | An `entry-template.md` sibling loaded only when the body references it |
| [`dependency-audit`](../.github/skills/dependency-audit/SKILL.md) | A bundled `scripts/inventory.sh` and `allowed-tools: shell` |

## The frontmatter

| Property | Type | Purpose |
| --- | --- | --- |
| `name` | string | **Required.** Lowercase letters, digits and hyphens only, max 64 characters. Must equal the directory name. |
| `description` | string | **Required.** What the skill does *and* when to use it. Max 1024 characters. |
| `license` | string | Licence applying to the skill. |
| `allowed-tools` | string or list | Tools pre-approved without a confirmation prompt. |
| `argument-hint` | string | Placeholder shown when the skill is invoked as a slash command. |
| `user-invocable` | boolean | `false` hides it from the `/` menu while still allowing automatic loading. Default `true`. |
| `disable-model-invocation` | boolean | `true` requires manual invocation through `/`. Default `false`. |
| `context` | string | `inline` (default) or `fork` to run in a dedicated subagent context. |
| `source` | string | Provenance written by `gh skill install`. |

Two limits are enforced and both are enforced silently: a `name` over 64 characters, and a
`description` over 1024 characters. The validator rejects both, but the loader does not tell you
why the skill stopped appearing.

## Progressive loading, and why it changes what you can write

Loading happens in three levels:

1. **Discovery** reads only `name` and `description`, for every installed skill.
2. **The body** loads when the skill is selected by the model or invoked by a human.
3. **Sibling files** load only when the body references them.

This is the whole economic argument for skills. A skill may carry a large reference document, a
checklist, or a script, and none of it costs context on a request that never touches the skill. The
always-on layer could never hold that material; the [context budget](00-mental-model.md#the-context-budget)
would not survive it.

Two consequences for authoring:

- Put the trigger information in `description`, because that is all the model sees before it
  decides. A description that describes the content but not the situation is invisible at
  discovery time.
- Put depth in siblings, and reference them from the body with a relative link.
  `code-review/SKILL.md` links to `./blocking-checklist.md`; `changelog-entry/SKILL.md` links to
  `./entry-template.md`. The link is what loads the file, so an unlinked sibling is dead weight
  that nothing reads.

## The name must match the directory

This is the classic silent failure. Three rules, each of which fails without a message:

- The file is named exactly `SKILL.md`, case-sensitively. `skill.md` and `Skill.md` are never
  discovered.
- `name` equals the parent directory name. `.github/skills/code-review/SKILL.md` with
  `name: code_review` is never loaded.
- `name` contains no `/`, `:` or `.`, including a namespace prefix. A plugin install adds its own
  prefix automatically, so a name you prefixed yourself becomes `plugin/plugin-name`.

The validator checks all three, and it also catches the near-miss spellings of the entry point.
That check exists because there is nothing else to notice the problem: no error, no warning, no
missing menu entry you can distinguish from a dozen other causes.

## `description` is the discovery trigger

```yaml
description: Reviews a pull request against this repository's blocking criteria and reports only
  findings that name a failure mode. Use when reviewing a change, a pull request or a diff.
```

The first sentence says what it does. The second says when to use it, and starts with "Use when" —
which is the phrasing that makes the trigger explicit rather than implied. Compare a description
that stops after the first sentence: the model knows a review procedure exists and never learns
that a review is the occasion for it.

Descriptions also compete. With ten skills installed, discovery sees ten descriptions and picks
none, one, or several. A description that overlaps three others makes that choice worse, so write
each one to claim a distinct occasion.

## Bundled scripts and files

A skill directory can hold anything the procedure needs:

```text
.github/skills/dependency-audit/
├── SKILL.md
└── scripts/
    └── inventory.sh
```

`dependency-audit/SKILL.md` runs its script by path from the skill directory, and the body states
the script's properties where the reader meets it: it makes no network calls and changes no files.
That sentence is not documentation for its own sake. A skill that executes a script inside a
session is asking for trust, and the reader needs to know what the script does before granting it.

State the same for anything you bundle: what it reads, what it writes, and what it reaches.

## The `allowed-tools` risk

`allowed-tools` pre-approves tools so the skill runs without a confirmation prompt. It is a
convenience that removes a check, and it should be read as such.

`dependency-audit` sets `allowed-tools: shell`, because the inventory script cannot run otherwise.
The cost is explicit in the body: "Never run an install command. It mutates the workspace and the
audit is read-only." A pre-approved shell plus a permission-hungry model is a combination you have
to reason about once, in the skill, where the reasoning is reviewable.

The validator warns on `allowed-tools` containing `shell`, `bash` or `execute`. Treat the warning
as a prompt to write down why the grant is necessary, not as noise to silence.

## `context: fork`

By default a skill runs inline, in the conversation. `context: fork` runs it in a dedicated
subagent context.

`code-review/SKILL.md` uses `fork` for a stated reason: a review reads many files, and reading them
in the main conversation spends the context the rest of the task needs. Forked, the reading happens
elsewhere and the report comes back.

Fork is the right choice for a procedure that reads widely and reports narrowly. It is the wrong
choice for a procedure that must see the conversation's history, because the forked context is not
the conversation.

## Who may invoke a skill

| Configuration | Slash command | Auto-loaded |
| --- | --- | --- |
| Both omitted | Yes | Yes |
| `user-invocable: false` | No | Yes |
| `disable-model-invocation: true` | Yes | No |
| Both set | No | No |

`disable-model-invocation: true` is for a procedure with side effects — a release, a migration —
where automatic selection is a hazard and a human decision is the point.

## The `code-review` naming hint

Copilot code review reads skills from `.github/skills/`. A review-focused directory name makes it
more likely that the reviewer loads that skill rather than a domain skill that happens to be
adjacent.

The directory here is named `code-review` for that reason, and the fact is written in the skill
body so nobody renames it as a tidy-up. Naming a skill well is part of making it fire; the
mechanics are documented behaviour, and the effect on selection is probabilistic, which is why it
is a hint rather than a rule.

## Managing skills with `gh skill`

GitHub CLI provides a skill command surface: `gh skill search`, `gh skill preview`,
`gh skill install`, `gh skill update` and `gh skill publish`. This surface is **in preview** and
requires GitHub CLI 2.90.0 or later.

`gh skill install` writes a `source` property into the installed skill's frontmatter. That is how a
vendored skill records where it came from, and it is the first thing to read when a third-party
skill behaves differently from its upstream.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| The skill never appears, and nothing errors | `name` does not match the directory, or the entry point is not `SKILL.md` | Rename the directory or the file; run `npm run validate` |
| The skill exists but is never selected | `description` says what it contains and not when to use it | Add an explicit "Use when ..." sentence |
| The skill is selected for the wrong tasks | The description overlaps another skill's occasion | Give each skill a distinct occasion |
| A sibling file is never used | The body does not reference it | Link it from the body with a relative Markdown link |
| The skill asks for confirmation on every command | `allowed-tools` does not include the tool the procedure needs | Grant the narrowest tool that works, and record why in the body |
| The skill's `name` is rejected after installation | A namespace prefix was added to a name you already prefixed | Let the installer add the prefix |
| A review skill spends the whole context on file reads | The skill runs inline | Set `context: fork` |

## Practice

[Lab 05](../labs/05-first-skill.md) has you write a skill, break its `name` on purpose, confirm
that the validator catches what the loader does not, and prove the skill loads on demand.

Next: [hooks](06-hooks.md), the one mechanism in this chapter sequence that produces a guarantee
instead of a suggestion.
