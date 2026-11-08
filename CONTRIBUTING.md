# Contributing

This repository documents GitHub Copilot behaviour. That makes two kinds of contribution
valuable and one kind dangerous.

## The contribution that matters most

**A correction.** If a statement here contradicts the current official documentation, that is
a bug, and it is worth more than any new chapter. Open an issue with the quote from this
repository, the behaviour you observe, the surface and version, and a link to the page that
establishes the correct answer.

Preview features move. A behaviour that was accurate when a chapter was written may be
generally available now, or removed. Reporting that is a real contribution, not a nitpick.

## Before you write

Read [`AGENTS.md`](AGENTS.md),
[`REVIEW.md`](REVIEW.md), and
[`.github/instructions/documentation.instructions.md`](.github/instructions/documentation.instructions.md).
They are the editorial contract, and a pull request that ignores them will be asked to
change before it is reviewed on content.

Then read two files of the same kind as the one you are about to write. A new chapter that
reads unlike the others is a new convention, and conventions are not adopted by accident.

## What is welcome

| Kind | Where it goes |
| --- | --- |
| A corrected claim, with a source | Any chapter |
| A new lab with an observable check | `labs/` |
| A new frontmatter property, once it is documented officially | `reference/frontmatter-reference.md` and a validator rule |
| A new validator rule, with a failing fixture | `scripts/` and `scripts/test/` |
| A new official source | `reference/sources.md` |
| A clearer explanation of an existing mechanism | Any chapter |

## What is not welcome

- A new dependency. `npm run check` must work on a fresh clone with `node` and nothing else.
  This is not minimalism for its own sake: the repository's claim is that the configuration
  contract is checkable, and requiring a toolchain to check it weakens the claim.
- Content duplicated from `docs/` into `labs/`. Link instead. Duplicated prose drifts and
  then contradicts the original.
- A chapter that describes a feature nobody has verified exists. An aspirational chapter is
  worse than a short one, because a reader will configure something and then lose an hour.
- Changes to `examples/shop-api/`. The fixture's flaws are the labs' subject matter. In
  particular, the authorization defect in `getOrder` is intentional.
- Generated prose, restated bullet lists, and summaries of a chapter's own summary.
- Emoji, marketing adjectives, and rhetorical-question headings.

## The change process

1. Open an issue first for anything larger than a correction. It saves you writing a chapter
   that does not fit the track.
2. Work on a branch. Do not push to the default branch.
3. Keep each commit one reviewable concern, with tests and documentation alongside the
   behaviour they describe.
4. Run `npm run check` before you push. A pull request that leaves the validator failing is
   not ready for review.
5. Fill in the pull request template, especially "Review notes". Naming the part you are least
   sure about is the single most useful thing you can tell a reviewer.

## Adding a validator rule

The validator exists because every file in `.github/` fails silently when malformed. A new
rule follows the same pattern as the existing ones:

1. Write the failing fixture first, in `scripts/test/validate-customizations.test.mjs`. It
   must fail for the reason you expect, not because of a typo in the fixture.
2. Add the rule.
3. Confirm the fixture now fails for the intended reason, and that the good-path test still
   passes.
4. Add the property or constraint to `reference/frontmatter-reference.md` in the same commit.
   A rule the reference does not mention is a rule that will surprise the next contributor.

## Reporting a security issue

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

By participating you agree to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Contributions are accepted under the [MIT License](LICENSE).
