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

- [x] T1 Scaffold repository: git, license, gitignore, directory layout — `277e826`
- [x] T2 Template `.github/` instructions layer (`AGENTS.md`, `copilot-instructions.md`,
  `REVIEW.md`, `.github/instructions/*`) — `277e826`
- [x] T3 Template `.github/` prompt files and custom agents — `d9258e4`
- [x] T4 Template `.github/` skills, hooks, CODEOWNERS, templates — `cae5408`
- [x] T5 Template environment and CI (`copilot-setup-steps.yml`, `copilot-code-review.yml`,
  validate workflow) — `f1ff39a`; fixture and `.vscode/mcp.json` — `b8232fb`
- [x] T6 Theory chapters 00-02 — `4bd0861`
- [x] T7 Theory chapters 03-12 and the theory index — `f081fbb`
- [x] T8 Practice labs and capstone — `eba9877`; fixture gap-list correction —
  `aa1453a`
- [x] T9 Reference: cheat sheet, frontmatter reference, sources — `4bd0861`
- [x] T10 README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT — `4bd0861`; `llms.txt` and
  `CHANGELOG.md` — `6b6a9e0`
- [x] T11 Validator script plus tests, wired into CI — `8d1ab0c`; directory-link fix —
  `30ad85a`
- [x] T12 Final verification: validator 0 errors, 38/38 tests, no unresolved links,
  every S# covered, published to `ralbac/copilot-customization-blueprint`

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
> tener el mio propio. Inspírate en los que veas que ya existen también.
>
> Si tienes alguna duda pregúntame

**L2** — User answered the scoping questionnaire: repository language **English**; practical
depth **full course plus usable example repository**; evidence standard **official docs as
source of truth**.

**L3** — Reference repositories surveyed for structure and editorial approach:
`github/awesome-copilot` (flat resource-type directories, `llms.txt`, Learning Hub, plugins)
and `microsoft/wil` (`.github/skills/README.md` documenting the skill layout in-tree). Neither
is copied; the shape here is a course plus a template, not a catalogue.

**L4** — Verified facts pinned during research, from official documentation retrieved in this
session: `.github/copilot-instructions.md`; `.github/instructions/**/*.instructions.md` with
`applyTo`; `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `REVIEW.md`;
`.github/prompts/*.prompt.md`; `.github/agents/NAME.agent.md`;
`.github/skills/<name>/SKILL.md`; `.github/hooks/*.json`;
`.github/workflows/copilot-setup-steps.yml` (only `steps`, `permissions`, `runs-on`,
`services`, `snapshot`, `timeout-minutes` ≤ 59 are honoured, default branch only);
`copilot-code-review.yml`; repository-level MCP configuration entered in the repository
settings UI rather than committed; `.vscode/mcp.json` for VS Code; the `COPILOT_MCP_` secret
prefix; the `gh skill` CLI; and rulesets, CODEOWNERS, content exclusion and the firewall as
the only layer that actually enforces anything.

**L5** — Execution note: the theory and practice tracks were written by two background workers
with disjoint edit surfaces (`docs/03-12` plus the index; `labs/`), while the parent owned the
factual backbone (`reference/frontmatter-reference.md`, `reference/sources.md`), chapters
00-02, the README and the governance files. Both workers received `reference/` as the only
permitted factual basis, so no chapter could invent a property or a file location.

**L6** — Two validator rules were mis-calibrated on first run and corrected: relative links
inside fenced code blocks were being treated as real links, and a link to an existing
directory was reported as unresolved whether or not it carried a trailing slash. Both now
have tests. A third rule was relaxed deliberately: an `applyTo` literal path is a warning
only when it names no existing file.
