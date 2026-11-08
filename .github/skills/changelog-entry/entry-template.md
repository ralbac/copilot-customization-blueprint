# Entry template

Copy this block into the matching section of `CHANGELOG.md`. Delete the sections you do not
use; an empty section with a heading is a promise you forgot to keep.

```markdown
### Added

- Add retry option to client factory ([#142](../../issues/142))

### Changed

- **Breaking:** `createClient()` returns `Promise<Client>` instead of `Client`. Await the
  call, or use `createClientSync()` for the previous behaviour ([#151](../../issues/151))

### Fixed

- Fix pagination returning the first page twice when `cursor` is empty ([#158](../../issues/158))

### Security

- Fix token leaking into debug logs when `DEBUG=1` is set. Upgrade to this release ([#163](../../issues/163))
```

## Notes on the shape

- `###` for the section, under an existing `## [Unreleased]`. Do not add a new `##`.
- Blank line before and after each section, and between entries is not needed: one entry per
  line, no blank lines between them.
- The link form `([#142](../../issues/142))` is relative and resolves on GitHub. Keep it
  relative; do not paste an absolute URL, which breaks on forks.
- Bold only on `**Breaking:**`. Bolding half the entries bolds nothing.
