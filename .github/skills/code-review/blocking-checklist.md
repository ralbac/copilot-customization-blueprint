# Blocking checklist

Work top to bottom. Stop at the first blocker category that applies, report it, and continue
to the next category: a change can have more than one.

## 1. Contract breaks

- A function signature, return shape, error type, CLI flag, config key, or output format
  changed, and a consumer the diff does not update relies on the old shape. Name the
  consumer.
- A default changed. Defaults are contracts that nobody writes down.
- A required field became optional, or the reverse, without a migration note.

## 2. Missing behaviour

- A new code path has no test that fails when the path is removed.
- An error branch was added with no test proving the error is raised and its message is
  useful.
- A boundary value that the rule itself implies is untested: the limit, one below, one
  above.

## 3. Silent failure

- A caught error is discarded, logged at debug level, or converted into a default value the
  caller cannot distinguish from success.
- A validation can be bypassed by a path the change introduces.
- A retry, timeout, or fallback turned a deterministic failure into an intermittent one.

## 4. Unverified claims

- A comment, docstring, or documentation sentence asserts behaviour the code does not
  demonstrate.
- A test claims to cover a case it does not exercise.
- A benchmark or performance claim with no measurement next to it.

## 5. This repository specifically

- A Markdown relative link that does not resolve.
- A structural claim about Copilot behaviour with no entry in `reference/sources.md`.
- A preview or experimental feature described as generally available.
- Frontmatter that the validator would reject: missing required keys, a skill `name` that
  does not match its directory, an unknown property.
- Code in `docs/` or `labs/` that would fail if a reader copied it and is not labelled as
  illustrative.

## Not blocking

Formatting, wrapping, whitespace, naming preferences, missing tests for prose, and any
suggestion whose failure mode you cannot state. These are comments at most.
