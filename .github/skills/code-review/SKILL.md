---
name: code-review
description: Reviews a pull request against this repository's blocking criteria and reports only findings that name a failure mode. Use when reviewing a change, a pull request or a diff.
license: MIT
argument-hint: [PR number, branch, or empty for the working tree]
context: fork
---

# Repository code review

The directory is named `code-review` on purpose. Copilot code review on GitHub reads
skills from `.github/skills/`, and a review-focused directory name makes it far more likely
that the reviewer loads this skill rather than a domain skill that happens to be adjacent.

`context: fork` runs the skill in its own subagent context, so reading many files during a
review does not consume the main conversation's context. Only the report comes back.

## Process

1. Establish intent before reading the diff: the PR description, the linked issue, or the
   commit message. A review without a stated goal drifts into style commentary.
2. Read the diff. Then read the code around each hunk — enough to know what the change
   affects. Judging a hunk in isolation produces findings about formatting and misses
   findings about behaviour.
3. Work through [the blocking checklist](./blocking-checklist.md) in order.
4. For each candidate finding, try to refute it. Ask: what would have to be true for this
   to be fine? Check that. Most candidate findings die here, and the ones that survive are
   worth the reader's attention.
5. Report.

## Report format

Group by severity: **Blocker**, **Should fix**, **Consider**.

Every finding contains:

- `path:line`
- The failure mode: what goes wrong, for whom, under which condition.
- The smallest change that fixes it.

A finding without a failure mode is not a finding. If you cannot complete that sentence, drop
it or downgrade it to a question you actually need answered.

## Rules

- Do not restate the diff. The author wrote it and has read it more recently than you.
- Do not open with praise and do not close with a summary of findings already listed.
- Do not request a change you would not make yourself in the same review.
- Silence is a valid review of a sound change: one line saying so, then stop.
- If the change touches a contract other code consumes, say who consumes it. That is the
  single most valuable thing a reviewer can add.
