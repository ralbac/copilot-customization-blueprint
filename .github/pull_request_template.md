<!--
Pull request template.

Keep this short. A template long enough to be skipped is worse than no template, because it
teaches reviewers that the fields do not matter.
-->

## What changes

<!-- One sentence. Observable behaviour, not implementation. -->

## Why

<!-- The problem this solves. Link the issue if there is one. -->

Closes #

## How it was verified

<!--
Not "tests pass". Name the command and what it proved. If a check was not run, say so here
rather than leaving the reviewer to discover it.
-->

- [ ] `npm run check` passes
- [ ] Documented behaviour matches the code

## Type

- [ ] Documentation
- [ ] Customization contract change (`frontmatter`, file location, hook script)
- [ ] Tooling (`scripts/`)

## Checklist

- [ ] Every relative link resolves
- [ ] New Copilot behaviour claims have an entry in `reference/sources.md`
- [ ] Preview or experimental behaviour is labelled where it is stated
- [ ] `examples/shop-api/` was not modified to make a check pass

## Review notes

<!--
Where should the reviewer spend attention? Name the file or decision you are least sure
about. This is the most useful field in the template; leaving it empty wastes a review.
-->
