# The agent environment

The cloud agent and Copilot code review run somewhere, and the files in this chapter decide what
"somewhere" contains. By the end of this chapter you will be able to write
`copilot-setup-steps.yml` so that its steps actually run, know which job keys are honoured and
which are silently dropped, and explain why an agent-authored pull request waits for a human
before CI starts.

## What the file does

`.github/workflows/copilot-setup-steps.yml` prepares the environment an agent session runs in when
that session runs on GitHub Actions. It is a workflow file with a fixed contract:

| Constraint | Detail |
| --- | --- |
| Path | Fixed at `.github/workflows/copilot-setup-steps.yml` |
| Branch | Must be on the default branch, or it is inert |
| Jobs | Exactly one, and it must be named `copilot-setup-steps` |
| Honoured job keys | `steps`, `permissions`, `runs-on`, `services`, `snapshot`, `timeout-minutes` (max 59) |
| Ignored | Every other job key, silently |
| `fetch-depth` | Overridden on `actions/checkout` so the agent can roll back commits |
| Runners | Ubuntu x64 Linux and Windows 64-bit only; macOS unsupported |

Every row of that table is a way to configure something that does nothing. The file is not
validated with a warning: a misnamed job, a missing default-branch merge, or a job key outside the
list has no effect, and the agent then spends its budget discovering that the toolchain is
absent.

The reference file is
[`.github/workflows/copilot-setup-steps.yml`](../.github/workflows/copilot-setup-steps.yml).

## Actions or cloud sandbox

The file applies only to sessions that run on GitHub Actions. A session that runs in a cloud
sandbox does not read it, so nothing in this chapter changes that environment.

The practical consequence: an install step you add here is not a guarantee about every agent
session. It is a guarantee about the sessions that run where you configured it, and the honest way
to describe it to a team is with that qualifier attached, not stripped off.

## The honoured keys, one at a time

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
```

- **`steps`** — the work. Keep it to setup: check out, install the toolchain, install dependencies,
  prove the result runs.
- **`permissions`** — applies to *your* setup steps, not to Copilot's work. Copilot gets its own
  token. Keep this block minimal: if the only reason for it is a checkout, `contents: read` is the
  whole grant.
- **`runs-on`** — the runner. The choice is part of the security surface, not only a performance
  decision: a self-hosted runner is a machine you own, with access you granted it.
- **`services`** — service containers, for a setup that needs a database or a cache.
- **`snapshot`** — honoured, and worth knowing about only when you need a prepared image.
- **`timeout-minutes`** — capped at 59. A setup that hangs is a session that hangs, so set it.

Every other job key — `env`, `needs`, `strategy`, `if`, `environment` — is dropped without a
message. Do not put security-critical configuration in one of them; it will not be there.

`fetch-depth` is the one input in your file that the platform overrides. The agent needs the
history to roll back commits on request, so a shallow checkout is not an option you get to choose.

## Runner limits

Ubuntu x64 Linux and Windows 64-bit runners are supported. macOS is not. A team whose tests need
macOS cannot run those tests in the agent's environment, and the fix is to reduce what the setup
step claims to do rather than to write a macOS runner and hope.

## Proving the environment works

The reference file ends with a step that runs the repository's own checks:

```yaml
      - name: Prove the toolchain works before the agent relies on it
        run: |
          node --version
          npm run check
```

A setup step that silently produces a broken environment is worse than no setup step. Without a
proof step, the agent's first failure is a confusing one — it tries to run the tests the
instructions told it to run, and they fail for a reason that has nothing to do with the task.

Three rules for the steps themselves:

- **Pin the toolchain.** `node-version: "22"` rather than `latest`. The agent's environment should
  be as reproducible as the one CI uses for human pull requests.
- **Install from the lockfile.** A resolving install lets the agent's environment choose dependency
  versions, and makes its failures irreproducible.
- **Do not install what you do not use.** Every step is time on every session, and a step that adds
  nothing is a step that can break.

## Code review's own environment

`.github/workflows/copilot-code-review.yml` overrides the environment for Copilot code review only.
The shape mirrors the setup file, and the job keeps the name `copilot-setup-steps`, because the
name is what the platform looks for. When the file is absent, review reuses
`copilot-setup-steps.yml`.

The reason to have both is that the two jobs need different things. A review needs to read the
change and run a linter or a validator. It does not need to build an application. The reference
[`copilot-code-review.yml`](../.github/workflows/copilot-code-review.yml) installs Node and runs
`npm run check`, and stops there.

A misnamed job in the review file does not fail loudly. Review falls back to the setup file, which
is a working environment, so nothing looks broken and the override you wrote is not in effect.

## The workflow-approval default

GitHub blocks workflows from running automatically in a pull request created by Copilot until
someone with write access approves the run.

This is a guardrail, and it reads as an inconvenience the first time it happens. Its effect is that
no CI result can appear on agent-authored code without a human having looked at the change first.
An administrator can change the default per repository, and doing so removes a review gate from
every agent-produced change in that repository.

Before you change it, decide what replaces it. If the answer is "nothing", the default is the
control.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| The setup steps are ignored | The file exists only on a feature branch | Merge it to the default branch |
| The steps exist and never run | The job has a different name | Name the job `copilot-setup-steps` |
| A setting in the file has no effect | The key is not in the honoured list | Move the work into `steps`, or drop the key |
| The agent cannot run the tests the instructions name | The setup step installs nothing, or installs something else | Add the install and a proof step that runs the command |
| The setup hangs and the session is lost | No `timeout-minutes`, or a step that waits for input | Set the timeout and remove interactive steps |
| Review uses the wrong environment | The review file's job is misnamed, so review falls back silently | Keep the job name `copilot-setup-steps` |
| CI does not start on an agent-authored pull request | The workflow-approval default requires approval by someone with write access | Approve the run, and do not disable the default without a replacement gate |
| Tests pass locally and fail in the agent session | The environment differs: different Node major, different dependency resolution | Pin versions and install from the lockfile |

## Practice

[Lab 08](../labs/08-agent-environment.md) has you add a step, prove it runs, and then rename the
job to watch the file go inert without an error.

Next: [policies and guardrails](09-policies-and-guardrails.md), where the settings that actually
enforce something live.
