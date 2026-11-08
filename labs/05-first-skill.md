# Lab 05 — Use a skill, then judge it

## Goal

You will be able to prove that `.github/skills/changelog-entry/SKILL.md` is discovered from its
`name` and `description` alone, and will be able to tell a skill that loads from a skill that
produces the right result.

## What you need

- A surface that reads skills: VS Code, Copilot CLI, or github.com, where skills are generally
  available, unlike prompt files. Node.js 20 or newer for the validator, and a shell for `git
  status`.

## Before you start

Open `.github/skills/changelog-entry/SKILL.md`, its sibling
`.github/skills/changelog-entry/entry-template.md`, and
`examples/shop-api/src/api/orders.test.ts`. The expected state:

- The skill's frontmatter has `name: changelog-entry`, which matches its directory, and a
  `description` ending in a clause that says when to use it.
- The body links the template file beside it, `entry-template.md`, so the sibling loads only
  when the skill does.
- This repository has **no** `CHANGELOG.md`. The skill tells the reader to ask before creating
  one, so "correct" here includes stopping.
- The test file's header lists four gaps, and three of them are real.

## Steps

1. Read the skill body's process. Step 4 of it maps a change to a changelog section by asking
   what the reader must do, and the entry rules require one line, no trailing period, no invented
   version or date.

2. Invoke the skill explicitly as a slash command, `/changelog-entry`, with this request:

   ```text
   Write the changelog entry for the change that added the preToolUse guardrail in
   .github/hooks/scripts/deny-dangerous-command.sh.
   ```

3. Check the answer against the template, not against your taste. The entry is one line, it sits
   under a `## [Unreleased]` heading and a `### Security` or `### Added` section, it has no
   trailing period, and it does not invent a version number or a date. Then check what it did
   about the missing `CHANGELOG.md`: creating one without asking is the failure mode, and the
   skill's own text says to ask.

4. Now test discovery rather than invocation. Start a fresh session, do **not** type a slash
   command, and ask:

   ```text
   A consumer-visible bug was just fixed. Write the changelog entry for it.
   ```

   Record whether the skill was loaded. Discovery matches on the `description` string, which is
   a probabilistic selection, so a miss on the first attempt is a result to record rather than a
   bug to fix.

5. Prove the failure the loader never reports. Create a trial copy with a mismatched name:

   ```bash
   mkdir -p .github/skills/lab-05-trial
   ```

   Paste this into `.github/skills/lab-05-trial/SKILL.md`:

   ```markdown
   ---
   name: changelog-entry
   description: "Trial copy for lab 05. Use when testing the skill name rule."
   ---

   # Trial

   This file exists only to be rejected by the validator.
   ```

   Run `node scripts/validate-customizations.mjs`. Expected error, verbatim:

   ```text
   .github/skills/lab-05-trial/SKILL.md:2: error: skill 'name' is "changelog-entry" but its directory is "lab-05-trial"; a mismatch makes the skill silently fail to load
   ```

   Delete the trial directory before continuing. Nothing at runtime would have reported this:
   the skill would never load, and nothing reports it.

6. Switch to the `test-specialist` agent and hand it the fixture's gaps:

   ```text
   Add the missing test cases listed in the header of examples/shop-api/src/api/orders.test.ts.
   Do not change any file under examples/shop-api/src except the test file. The fixture contains
   a deliberate defect; report it, do not fix it.
   ```

7. Read the header of the test file before you trust it. It claims four gaps; one of them,
   `updateStatus rejects a caller who is not staff`, already exists at line 72 of the same file.
   An out-of-date gap list is a finding in its own right.

## Check

Success is three separate observations, because they fail separately:

- **Discovery.** The skill is offered as `/changelog-entry`, and in step 4 the model either loaded
  it or did not. Both outcomes are evidence; write down which one you got.
- **Effectiveness.** The entry matches the template's shape, and the skill stopped rather than
  creating `CHANGELOG.md` unasked.
- **Authoring contract.** The validator error in step 5 names your trial file and line 2, and the
  directory is gone afterwards.
- **Coverage.** `git status --short` shows only `examples/shop-api/src/api/orders.test.ts`
  modified, and it contains three new cases: a non-staff caller creating an order for someone
  else, another customer's read of an order, and a rejected status update leaving the stored
  order unchanged. The fourth claimed gap is the one at line 72.

The new `getOrder` case asserts a 403 for another customer. `getOrder` returns
`{ status: 200, body: order }` at `examples/shop-api/src/api/orders.ts:65` for any caller, so the
test describes the intended contract and would fail against the fixture. That failure is the
deliverable.

The fixture ships TypeScript with no build step and no dependency manifest, and its README says
it is not a runnable application, so you cannot run these tests with `node --test` here. The
observable result is the test content and the agent's report; do not claim a green run.

| What you see | What it means |
| --- | --- |
| The agent writes `assert.equal(response.status, 200)` for the cross-customer case | It documented the bug as intended behaviour. A test that passes by asserting the defect is worse than no test |
| `git status` lists `examples/shop-api/src/api/orders.ts` | The agent fixed the fixture. Revert it; later labs depend on the defect |
| Four "new" cases, one of which is line 72's existing test | The gap list was trusted instead of checked |
| The skill produces an entry and creates `CHANGELOG.md` | It followed the format and ignored the instruction to ask. Effectiveness is not the same as compliance |

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/changelog-entry` is not offered | `SKILL.md` is mis-cased, or `name` does not match the directory | Fix the name; the validator names the mismatch |
| The skill loads and ignores `entry-template.md` | The body does not reference the sibling file, so it is never loaded | Link it from the body |
| The skill is never discovered without the slash command | The `description` says what it contains rather than when to use it | Add an explicit "Use when ..." clause |
| `test-specialist` edits production code | Its `edit` grant is not scoped by path; the boundary is in the prompt, which is an instruction | Revert, and state the boundary in the request |

## Clean up

Remove the trial directory and revert the fixture's test file:

```bash
rm -r .github/skills/lab-05-trial
git restore examples/shop-api/src/api/orders.test.ts
git status --short
```

Expected: no output. If you created a `CHANGELOG.md`, delete it too: the skill was right to ask
before adding one, and the repository does not use one.

## What you just proved

Discovery and effectiveness are different mechanisms with different evidence. Discovery reads
only `name` and `description`, so a skill whose name does not match its directory is invisible
without an error, and the validator is the only thing here that reports it. An agent that can
write tests is a second boundary problem: its grant allows edits everywhere, its body restricts
them to tests, and only the grant is enforced — which is why you reviewed the file instead of
trusting the report. [Skills](../docs/05-skills.md) covers the access matrix, sibling loading,
and `context: fork`.
