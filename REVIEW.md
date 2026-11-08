# Code review instructions

This file is an agent-instructions source for Copilot code review. Copilot code review
reads `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and `REVIEW.md` in addition to
`.github/copilot-instructions.md` and the path-scoped files under `.github/instructions/`.

Use it for what a reviewer should look for in *this* repository. Do not repeat general
engineering advice: the reviewer already knows it, and generic review instructions waste
attention on rules that nothing in this repository can violate.

## What a finding must contain

A finding is only actionable if it names the file, the line, what breaks, and what you
would do instead. Reject your own finding before you publish it if you cannot state the
failure mode. "Consider refactoring this" is not a finding.

## What blocks this repository

- A Markdown relative link that does not resolve. Documentation is the product; a broken
  link is a broken build.
- A structural claim about Copilot behaviour with no source in `reference/sources.md`.
- A preview or experimental feature described as generally available.
- Frontmatter that the Copilot SDK would not parse: missing required keys, a skill `name`
  that does not match its directory, an unknown property.
- Code in `docs/` or `labs/` that would fail if a reader copied it, and is not labelled as
  illustrative.
- A duplicated explanation: the same rule stated in two places that could drift apart.

## What does not block, but is worth a comment

- A chapter that grew past roughly 400 lines. Long chapters hide their own contradictions.
- A lab with no observable check. "You should see it working" verifies nothing.
- An example that uses a deprecated API shape, when a current one is available.
- A heading level skipped in a document outline.

## What to ignore

- Formatting, wrapping, and whitespace. There is no formatter, deliberately: this
  repository is Markdown and YAML, and a formatter that reflows prose creates noise that
  obscures real review findings.
- Suggestions to add a test for prose.
- Requesting that `examples/shop-api/` be modernized. It is a fixed fixture.

## Tone

Report the problem, then the fix. Do not open with praise, do not close with a summary of
what you just said, and do not ask a question you could answer by reading the file.
