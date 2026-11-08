# copilot-customization-blueprint

Didactic GitHub repository teaching how to build Copilot customization under `.github/`
(instructions, prompts, agents, skills, hooks, MCP, environment, guardrails), with a
copy-paste-ready template plus a validated reference implementation.

## Specs

- **S1** — Deep web research: "Haz un deep Research en Internet sobre GitHub Copilot y como
  crear agentes y skills con él." Every structural claim in the repository traces to an
  official source listed in `reference/sources.md`.
- **S2** — Coverage: "Quiero que incluya como generar los componentes que se suelen crear
  dentro de la carpeta .github que suelen ser prompt templates, comandos predefinidos,
  skills, guardarrailes y politicas, agentes en formato .md, etc...incluye más si me
  olvido de algo". Required set: custom instructions (repo-wide, path-scoped, agent),
  prompt files, custom agents (`.md`), agent skills, hooks, MCP configuration, coding-agent
  environment, policies and guardrails. Additional components the user did not name but
  that belong to the same surface: `AGENTS.md`, `REVIEW.md`, `CODEOWNERS`, issue and pull
  request templates, `copilot-code-review.yml`, plugins, and cross-host portability.
- **S3** — Deliverable shape: "estructura la en formato repositorio github con su README, su
  parte teórica y su parte practica para publicarlo de forma didáctica". README plus a
  theory track (`docs/`) and a practice track (`labs/`), publishable as-is.
- **S4** — Repository language: English (user-selected).
- **S5** — Practical depth: full course plus a usable example repository, i.e. a real,
  functional `.github/` that can be copied wholesale into another repository.
- **S6** — Evidence standard: official documentation is the source of truth (user-selected).
  Preview, experimental, and IDE-specific behaviour must be labelled as such at the point
  where it is stated, never silently presented as generally available.

## Tasks

- [x] T1 Scaffold repository: git, license, gitignore, directory layout — `a25b1c7`
- [x] T2 Template `.github/` instructions layer (`AGENTS.md`, `copilot-instructions.md`,
  `REVIEW.md`, `.github/instructions/*`) — `b7ba94d`
- [x] T3 Template `.github/` prompt files and custom agents — `8747770`
- [x] T4 Template `.github/` skills, hooks, CODEOWNERS, templates — `f9aab85`
- [x] T5 Template environment and CI (`copilot-setup-steps.yml`, `copilot-code-review.yml`,
  validate workflow) — `f84a1ae`
- [x] T6 Theory chapters 00-05 — `b12af62`
- [x] T7 Theory chapters 06-12 — `e6d4f5f`
- [x] T8 Practice labs and capstone — `dec18a1`
- [x] T9 Reference: cheat sheet, frontmatter reference, sources — `c3d5eda`
- [x] T10 README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT — `737e592`
- [x] T11 Validator script plus tests, wired into CI — `master` (final)
- [x] T12 Final verification: validator, tests, link check, and SPEC coverage — `master` (final)

Route: inline parent (single knowledge base already in context; delegating would require
re-transmitting the research with more loss than gain). Commit convention: one work unit
per slice of roughly 400 authored lines, on `feature/copilot-customization-blueprint`.

## Log

**L1** (verbatim user request):

> Haz un deep Research en Internet sobre GitHub Copilot y como crear agentes y skills con
> él. Quiero que incluya como generar los componentes que se suelen crear dentro de la
> carpeta .github que suelen ser prompt templates, comandos predefinidos, skills,
> guardarrailes y politicas, agentes en formato .md, etc...incluye más si me olvido de algo
>
> Cuando hayas recopilado toda la información estructurala en formato repositorio github
> con su README, su parte teórica y su parte practica para publicarlo de forma didáctica.
> Seguro que no es una idea original y hay muchos repositorios publicos ya así, pero quiero
> tener el mio propio. Inspirate en los que veas que ya existen tambien.
>
> Si tienes alguna duda preguntame

**L2** — User answered the scoping questionnaire: repository language **English**; practical
depth **full course plus usable example repository**; evidence standard **official docs as
source of truth**.

**L3** — Reference repositories surveyed for structure and editorial approach:
`github/awesome-copilot` (flat resource-type directories, `llms.txt`, Learning Hub,
plugins) and `microsoft/wil` (`.github/skills/README.md` documenting the skill layout).
Neither is copied; the shape here is a course plus a template, not a catalogue.

**L4** — Verified facts pinned during research (official docs, retrieved in this session):
`.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` (`applyTo`),
`AGENTS.md`/`CLAUDE.md`/`GEMINI.md`/`REVIEW.md`, `.github/prompts/*.prompt.md`,
`.github/agents/NAME.agent.md`, `.github/skills/<name>/SKILL.md`, `.github/hooks/*.json`,
`.github/workflows/copilot-setup-steps.yml` (only `steps`, `permissions`, `runs-on`,
`services`, `snapshot`, `timeout-minutes` ≤ 59 are honoured; default branch only),
`copilot-code-review.yml`, repository-level MCP config entered in the repository settings UI
(not a committed file), `.vscode/mcp.json` for VS Code, `COPILOT_MCP_` secret prefix,
`gh skill` CLI, rulesets/CODEOWNERS/content-exclusion/firewall as the actual enforcement
layer.
