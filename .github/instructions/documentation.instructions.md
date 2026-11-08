---
applyTo: "docs/**/*.md,labs/**/*.md,reference/**.md,*.md"
description: "Documentation and editorial conventions for this repository."
---

# Documentation instructions

This repository is documentation. These rules are stricter than the repository-wide ones
because a stylistic slip here is a product defect, not a nitpick.

## Voice

- Second person. Address the reader as "you", never "the developer" or "one".
- Present tense. "The validator fails" not "the validator will fail".
- Active voice. If you cannot name the actor, the sentence is describing magic and needs
  rewriting.
- Cut these on sight: *simply*, *just*, *obviously*, *of course*, *easy*, *powerful*,
  *seamless*, *robust*, *leverage*. Each one either insults the reader or claims something
  unproven.
- No rhetorical questions as headings. A heading is a label.

## Structure

- One H1 at the top. It names the topic, not the file.
- Never skip a heading level. `###` under an `##` without an intervening context is a
  rendering bug waiting to happen.
- A chapter opens with two or three sentences saying what the reader will be able to do
  afterwards. No table of contents inside a chapter; the site navigation covers that.
- Tables for anything the reader compares across three or more dimensions.
- Every code block declares a language. Use `text` for file trees and output.

## Claims

- A statement about Copilot behaviour carries its status in the same sentence. If it is
  preview, experimental, or only available in one IDE, say so there.
- Cite the source by link to `reference/sources.md`'s entry, not by pasting a URL that
  will rot in a chapter.
- Do not describe a feature you have not verified exists. An aspirational chapter is worse
  than a short chapter, because a reader will configure something and then lose an hour.

## Links

- Relative links only, with `.md` extensions, resolved from the file that contains them.
- Link to a heading by its exact text, lowercased, spaces to hyphens, punctuation removed.
- `npm run validate` fails on an unresolved relative link. Broken prose is survivable; a
  broken link is a check failure.

## Examples

- An example inside a fenced block is illustrative unless the surrounding text says it is
  runnable.
- A runnable example states its command and its expected output.
- Never use `example.com` secrets, real tokens, or plausible-looking API keys. Use
  `${{ secrets.EXAMPLE_TOKEN }}` or `REPLACE_ME`.
