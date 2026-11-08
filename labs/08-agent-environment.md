# Lab 08 — Audit the agent environment

## Goal

You will be able to review `.github/workflows/copilot-setup-steps.yml` against the honoured-keys
contract, and prove the workflow's effect only after it exists on the default branch.

## What you need

- The clone, and a browser with access to the repository's Actions tab.
- Permission to push to the default branch, or a fork of your own to experiment in.
- No YAML linter. This lab deliberately does not use `actionlint` or any other linter, because
  the rules below are not schema validity: a perfectly valid workflow can be entirely ignored.

## Before you start

Open `.github/workflows/copilot-setup-steps.yml`. The expected state:

- One job, named `copilot-setup-steps`, on `ubuntu-latest`, with `permissions: contents: read`,
  `timeout-minutes: 20`, and four steps: checkout, `setup-node` on Node 22, a commented-out
  install, and a step that runs `node --version` and `npm run check`.
- Triggers on `workflow_dispatch` and on pushes and pull requests that touch this exact file.
  Those triggers exist so the file can be validated as an ordinary workflow.
- A header comment stating the contract, including that the file is inert on a feature branch.

## Steps

1. Read the header comment and the job as written. The contract has four parts: the path is
   fixed, the file must be on the default branch, there is exactly one job and its name is
   `copilot-setup-steps`, and of all the keys a job accepts only `steps`, `permissions`,
   `runs-on`, `services`, `snapshot` and `timeout-minutes` (maximum 59) are honoured.

2. List the job's own keys and check each one against that list:

   ```bash
   awk '/^jobs:/{f=1} f' .github/workflows/copilot-setup-steps.yml | grep '^    [a-z-]*:'
   ```

   Expected output, four lines, each indented four spaces in the file:

   ```text
   runs-on: ubuntu-latest
   permissions:
   timeout-minutes: 20
   steps:
   ```

   Every one of them is on the honoured list, and none exceeds its limit. A fifth line here — for
   example `env:` or `strategy:` — is a key the platform silently drops.

3. Notice what the file does **not** contain, because those omissions are decisions: no job-level
   `env`, no matrix, no second job, no `fetch-depth` on the checkout. The reference states that
   `fetch-depth` is overridden so the agent can roll back commits, so setting it is wasted work
   as well as a misleading comment.

4. Check the steps themselves. A setup step that installs into a path the agent does not inherit,
   or that succeeds while producing a broken toolchain, is worse than no setup step: the agent
   then spends its session debugging the environment. The final step exists for that reason and
   prints the tool versions it depends on.

5. Test the silent-drop rule. Add a job-level key that is not on the list:

   ```yaml
   env:
     NODE_OPTIONS: --max-old-space-size=4096
   ```

   placed at the job's own indentation level, beside `runs-on` and `steps`.

   Push it to a branch and watch the workflow run normally. It is valid YAML and it is a working
   GitHub Actions workflow; the cloud agent still never sees the variable. Remove the key before
   you continue. This is the failure mode the checklist exists for: nothing errors, nothing warns,
   and the configuration you wrote is not in effect.

6. Merge or push the file to the default branch, then open the repository's Actions tab. The
   workflow appears as `Copilot Setup Steps`, and `workflow_dispatch` lets you run it by hand.
   Run it and confirm the job is named `copilot-setup-steps` and that the last step prints a Node
   version and a validator summary.

7. Start a cloud agent session — assign an issue to Copilot, or start one from the Copilot page;
   the exact entry point differs by version. Open the session log and find the setup phase before
   the agent's first action. That is where your steps run, and it is the only place the effect
   exists.

## Check

Success is a review plus a run:

- The four keys in step 2 are on the honoured list, with `timeout-minutes` at or below 59.
- The file is on the default branch, and the workflow run in the Actions tab is green.
- The cloud session log shows the setup steps running before any agent action, with the tool
  versions the last step printed.

The failures that matter, and what they look like:

| What you see | What it means |
| --- | --- |
| The workflow is green, run from a feature branch, and the session shows no setup | Expected. The file is inert off the default branch, and nothing in the UI tells you |
| The workflow runs and the agent ignores it | The job is not named exactly `copilot-setup-steps`. This is the most common cause, and it produces no error |
| A job-level `env` holds a token the agent needs | Silently dropped, so the agent never sees it and nothing fails |
| A second job runs a matrix build for the agent | It is ignored. Only `copilot-setup-steps` is read |
| `timeout-minutes: 90` | Outside the documented maximum of 59. Treat it as a defect to fix, not a value to test in production |
| The steps run for the agent but not for review | Review uses `copilot-code-review.yml` when that file exists, and it keeps the same job name |

Feature-branch-only is worth stating plainly, because it is the failure people lose an afternoon
to: a file that exists only on your branch appears to do nothing at all, and the reason is that
the platform looks for it on the default branch. There is no per-session override.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| The agent never runs your setup steps | The file is on a feature branch | Merge it to the default branch |
| The steps run for the cloud agent but not for review | `copilot-code-review.yml` exists and its job is misnamed | Name that job `copilot-setup-steps` too |
| A step passes locally and fails in the session | The session runs on a clean GitHub Actions runner; anything from your machine is absent | Pin versions, commit the lockfile, install inside the step |
| `npm ci` fails with no lockfile | A lockfile install replaced a resolving one | Commit a lockfile, or choose `npm install` deliberately and say why |
| The job is green and the tool is missing later | The installation path is not on `PATH` for the agent's shell | Print the tool version in the setup step so the break is visible |
| The workflow cannot be dispatched | The triggers were removed from the file | Keep `workflow_dispatch`; it is how you validate the file itself |

## Clean up

Remove the experimental `env` key from step 5 and revert any test commit you made on your own
branch. In this repository:

```bash
git status --short
```

Expected: no output. The lab changes nothing that stays changed.

## What you just proved

This is the one customization file that changes the machine rather than the prompt, and it is
found by name and location rather than by content, which makes its contract unusually strict. The
honoured-keys rule means a workflow can be valid, green and irrelevant: everything outside the
six keys is dropped in silence, so the checklist is a reading exercise and not a lint. The
default-branch rule means the effect is invisible until the file is merged, and silence before
that point is not evidence that anything is wrong.
