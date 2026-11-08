# Security policy

## What this repository contains

Documentation, configuration files, and two small shell scripts. There is no application, no
service, and no runtime. The realistic security surface is therefore narrow but specific:

- **Hook scripts** under `.github/hooks/scripts/`. These execute shell commands at points in an
  agent's workflow. A malicious change here would run on a contributor's machine.
- **The configuration that grants capability**: agent `tools` lists, skill `allowed-tools`, and
  MCP server definitions. A change here alters what an agent can do, not just what it says.
- **`.github/workflows/`**. These run in CI with repository permissions.
- **`.vscode/mcp.json`**. A tampered MCP server definition is code execution by proxy.
- **Prompt-injection content.** A skill or instruction file can contain text designed to make
  an agent do something other than what the reader intends. This repository ships such text
  deliberately, in the guardrail hooks and the review prompts, which is exactly why the
  approval path for `.github/hooks/` and `.github/skills/` is worth enforcing through
  [`CODEOWNERS`](.github/CODEOWNERS).

## Reporting a vulnerability

Do not open a public issue.

Use GitHub's private vulnerability reporting on this repository: **Security** tab →
**Report a vulnerability**. If that is unavailable, contact a maintainer directly and say the
report is security-related so it is handled privately.

Include:

- What is affected: file path, and whether it is the documentation, a script, or a workflow.
- What an attacker gains. "A hook that runs on every session" is not the impact; the impact is
  what the hook could exfiltrate or destroy.
- Reproduction steps, if the issue is in executables rather than prose.
- Whether a public disclosure deadline matters to you.

You will get an acknowledgement, and a statement of whether the report is accepted. This
repository is maintained on a best-effort basis, so no fixed SLA is promised.

## Scope

In scope:

- A hook script that can be made to execute something other than what it claims.
- A workflow with more permission than its steps require.
- A documented configuration that would grant broader access than the documentation says.
- Prose that instructs a reader to do something unsafe — for example, committing a token.

Out of scope:

- Vulnerabilities in GitHub Copilot itself, or in VS Code. Report those to GitHub or Microsoft.
- The intentional defects in [`examples/shop-api/`](examples/shop-api/README.md). That fixture
  is deliberately flawed and is not deployed anywhere.
- Findings from a scanner that only apply if the fixture were a real service.
- Missing hardening headers, cookie flags, or TLS configuration. There is no HTTP surface.

## Working with this repository safely

- Never commit a credential. The `.gitignore` excludes `.env` and local Copilot state, and
  `.vscode/mcp.json` prompts for a token rather than storing one.
- Review any change under `.github/hooks/` before running a Copilot session. Hooks execute
  without asking the model for permission; that is the whole point of them, and it is also the
  risk.
- Review any change under `.github/skills/` before installing it elsewhere. A skill can carry
  scripts, and `allowed-tools: shell` removes the confirmation step.
- Skills and agents from third parties are not verified by anyone. Read them before use.
