---
name: write-adr
description: Draft an Architecture Decision Record from the change being discussed, in the repository's ADR format.
argument-hint: [short decision title]
agent: agent
tools: ["read", "search", "edit"]
---

Draft an Architecture Decision Record for the decision the user names.

## Before writing

1. Find the existing ADRs. Search for a directory named `adr`, `adrs`, or `decisions`, and
   read the two most recent files.
2. Match their format exactly: heading structure, numbering scheme, filename pattern, and
   frontmatter if present. A new ADR that looks different from the last five is a new
   convention nobody agreed to.
3. If there are no existing ADRs, ask the user where they belong before creating the
   directory. Do not invent a location.

## Required sections

- **Status** — one of `proposed`, `accepted`, `superseded by ADR-NNN`, `deprecated`.
- **Context** — the forces in play: constraints, the problem, what is true today. No
  solution language here.
- **Decision** — what is being done, in the active voice, one paragraph.
- **Consequences** — what becomes easier, what becomes harder, and what is now excluded.
  An ADR with no stated cost is marketing.
- **Alternatives considered** — at least two, each with the reason it lost. "We did not
  consider alternatives" is itself an alternative that was rejected.

## Constraints

- Do not record a decision that has not been made. If the discussion is still open, write
  the ADR with status `proposed` and list the open questions as a section.
- Do not restate the code. Reference the files the decision touches with `path:line`.
- Length: under 60 lines of prose. If it needs more, the decision is actually several
  decisions and should be split.
