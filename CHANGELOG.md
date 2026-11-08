# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project does not
yet follow semantic versioning, because it is a course rather than a library; entries are
grouped by release date instead.

Consumers of the template copy `.github/` wholesale, so a change to a frontmatter contract or a
file location is a breaking change for them and is labelled as such.

## [Unreleased]

### Added

- Customization validator with 36 tests, wired into CI, covering frontmatter allow-lists for
  agents, prompt files, path-scoped instructions and skills, hook configuration including
  referenced-script existence, JSON and YAML parse failures, relative link resolution, and code
  fence balance
- Theory track: thirteen chapters under `docs/`
- Reference track: a comparison cheat sheet, a complete frontmatter reference, and the source
  list every claim traces to
- Practice track: ten labs plus a capstone under `labs/`, each with an observable check
- `llms.txt`, a machine-readable index of the repository
- Discussion of policy controls — rulesets, `CODEOWNERS`, content exclusion, the firewall and
  managed settings — separated from the customization files that merely suggest behaviour

### Notes

- `examples/shop-api/` contains a deliberate authorization defect in `getOrder`. It is the
  subject of lab 03 and is documented as intentional in the fixture README. Do not report it.
