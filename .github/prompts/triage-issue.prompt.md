---
name: triage-issue
description: Classify a bug report and produce a reproduction plan before anyone edits code.
argument-hint: [issue number or issue text]
agent: ask
---

Triage the issue described by the user, or issue `#` given as argument.

You are not allowed to change code in this task. The output is a plan.

## Steps

1. **Restate the defect** in one sentence, in terms of observable behaviour. If the report
   describes an implementation instead of a behaviour, say so: reports written as
   "the function should call X" are one proposed fix, not a defect.
2. **Extract the reproduction**. What exact input, state, or sequence triggers it? If the
   report does not contain one, the first work item is "obtain a reproduction", not "fix".
3. **Locate the surface**. Use search to name the files and functions plausibly involved.
   Do not read everything; stop when you can name the boundary.
4. **Classify**:
   - `bug` — behaviour contradicts the documented or tested contract.
   - `regression` — behaviour worked in an earlier tag or commit. Name the commit you
     believe introduced it, or say you could not establish one.
   - `missing feature` — no contract exists to violate.
   - `documentation` — the code is right and the explanation is wrong.
   - `not a defect` — working as designed; say which design decision makes it so.
5. **Estimate blast radius**: what else consumes the code you named? A defect in a shared
   helper is not a one-line fix.

## Output

- Classification and one-line justification.
- The reproduction as numbered steps, or the exact information still missing.
- Files and functions to touch, with `path:line`.
- The smallest test that would have caught this.
- Open questions, if any, as a short list. Ask at most three.
