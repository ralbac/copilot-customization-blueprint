---
applyTo: "**/*.test.ts,**/*.spec.ts"
description: "Test conventions for this repository."
---

# Test instructions

This file overlaps `typescript.instructions.md` on purpose: both match a `.test.ts` file.
Copilot combines applicable path-specific files rather than picking one, so a test file
receives both sets of rules. Keep overlap to genuinely shared rules only.

## Shape

- One `describe` per unit of behaviour, named after the behaviour, not the function. A
  reader should understand what the code guarantees from the test titles alone.
- `it` states the guarantee in the present tense: `returns an empty list when the store is
  empty`. Never `should work correctly`.
- Arrange, act, assert, in that order, separated by a blank line where it aids reading. Do
  not label the sections with comments; the shape is conventional.

## What a test must assert

- Every observable effect of the rule under test: the returned value, the thrown error and
  its message, and any state the rule promises to leave untouched.
- A rejection case also asserts that the rejected input changed nothing.
- The boundary values the rule itself implies. If a rule names a limit, test the limit,
  one below it, and one above it.

## What a test must not do

- Do not assert on internal storage, private fields, or call counts of internal helpers.
  Test through the public interface, so a refactor does not force a test rewrite.
- Do not assert on the current date, a random value, or a locale-dependent format without
  injecting the value.
- Do not write a test that passes when the implementation is deleted. If removing the
  behaviour keeps the test green, the test asserts nothing.

## Naming the failure

When a test fails, its output must identify the input. Assert messages include the
offending value. A failure that reads `expected true to be false` costs a debugging
session; a failure that reads `expected 4 items, received 3 for order "o-17"` does not.
