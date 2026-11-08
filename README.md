# copilot-customization-blueprint

A course and a working template for customizing GitHub Copilot through the `.github`
directory: instructions, prompt files, custom agents, skills, hooks, MCP, the agent
environment, and the policies that actually enforce something.

Built for people who are past the hello-world stage and want the real contract — what each
file is, which surface reads it, what happens when it is wrong, and why most "my instruction
is ignored" problems are discovery problems rather than prompt problems.

## Why another one

There are excellent community collections of Copilot customizations. This is not one of
them, and it is not a competitor to them. Those catalogue files you can copy. This teaches
the system those files live in, and ships a validated reference implementation you can read
end to end.

Three things are different here:

- **It is a course, not a catalogue.** Every mechanism gets a chapter on why it exists and a
  lab where you prove it works.
- **Status is stated, not implied.** Preview, experimental, and IDE-only features are
  labelled in the sentence that states the behaviour. Where a surface does not read a file
  type, the chapter says so.
- **The template is machine-checked.** A dependency-free validator enforces the frontmatter
  contract, because every file here fails silently when it is wrong: no error, no warning,
  just a customization that does nothing.

## What is inside

| Track | Directory | What it gives you |
| --- | --- | --- |
| Theory | [`docs/`](docs/README.md) | Thirteen chapters, from the mental model to portability across agents |
| Practice | [`labs/`](labs/README.md) | Ten labs plus a capstone, each with an observable check |
| Reference | [`reference/`](reference/cheat-sheet.md) | A cheat sheet, a complete frontmatter reference, and the source list |
| Template | [`.github/`](.github/) | A live, working customization set you can copy wholesale |
| Fixture | [`examples/shop-api/`](examples/shop-api/README.md) | A deliberately flawed toy service the labs operate on |

The `.github/` directory in this repository is not a sample. It is the configuration this
repository actually uses, and `npm run check` verifies it on every change.

## Quick start

### I want to add this to my repository

Copy `.github/` into your repository, then delete what does not apply. Start with these four
files, in this order, and add the rest when you have a reason:

1. `.github/copilot-instructions.md` — project shape, stack, verification commands.
2. `.github/instructions/` — one file per concern that is not repository-wide.
3. `.github/agents/code-reviewer.agent.md` — a read-only reviewer. Highest value per line.
4. `.github/CODEOWNERS` — so edits to the three above get reviewed.

Then enable the "Require review from Code Owners" rule on your default branch, or the fourth
item is documentation rather than a gate.

### I want to learn the system

Read [`docs/00-mental-model.md`](docs/00-mental-model.md), then do
[lab 01](labs/01-first-instruction.md) and [lab 04](labs/04-first-agent.md). That is about
ninety minutes and it covers the two mechanisms that carry most of the value.

### I know what I want and I need the exact field

[`reference/frontmatter-reference.md`](reference/frontmatter-reference.md) has every property,
its type, whether it is required, which surface ignores it, and the silent failure it causes.
[`reference/cheat-sheet.md`](reference/cheat-sheet.md) is the one-page version.

## The model in one table

Customization is three mechanisms, not a pile of file types. Confusing them is the source of
most bad configuration.

| Mechanism | Examples | Guarantee | When it fails |
| --- | --- | --- | --- |
| **Prompt injection** | Instructions, prompt files, agents, skills | None. The model usually complies | Silently ignored, no error |
| **Tool grant** | Agent `tools`, skill `allowed-tools`, MCP tool selection | The model cannot use what it was not granted | Over-granting removes the boundary |
| **Deterministic** | Hooks, rulesets, `CODEOWNERS`, content exclusion, firewall | Enforced by the runtime | A broken hook blocks every tool call |

The practical rule: write a preference as an instruction, a capability boundary as a tool
grant, and a hard rule as a hook.

[Chapter 00](docs/00-mental-model.md) expands this, including why the same file behaves
differently in VS Code, in Copilot CLI, and in code review.

## Contents

**Foundations**

- [00 — The mental model](docs/00-mental-model.md)
- [01 — Custom instructions](docs/01-custom-instructions.md)
- [02 — Path-scoped instructions](docs/02-path-scoped-instructions.md)

**Mechanisms**

- [03 — Prompt files](docs/03-prompt-files.md)
- [04 — Custom agents](docs/04-custom-agents.md)
- [05 — Skills](docs/05-skills.md)

**Environment and enforcement**

- [06 — Hooks](docs/06-hooks.md)
- [07 — MCP](docs/07-mcp.md)
- [08 — The coding agent environment](docs/08-agent-environment.md)
- [09 — Policies and guardrails](docs/09-policies-and-guardrails.md)

**Synthesis**

- [10 — Composition patterns](docs/10-composition-patterns.md)
- [11 — Verification](docs/11-verification.md)
- [12 — Portability](docs/12-portability.md)

**Practice**

- [Lab 01 — First instruction](labs/01-first-instruction.md)
- [Lab 02 — Path-scoped instructions](labs/02-path-scoped-instructions.md)
- [Lab 03 — Prompt file](labs/03-prompt-file.md)
- [Lab 04 — First agent](labs/04-first-agent.md)
- [Lab 05 — First skill](labs/05-first-skill.md)
- [Lab 06 — Hooks](labs/06-hooks.md)
- [Lab 07 — MCP](labs/07-mcp.md)
- [Lab 08 — Agent environment](labs/08-agent-environment.md)
- [Lab 09 — Guardrails audit](labs/09-guardrails.md)
- [Lab 10 — Capstone](labs/10-capstone.md)

**Reference**

- [Cheat sheet](reference/cheat-sheet.md)
- [Frontmatter reference](reference/frontmatter-reference.md)
- [Sources](reference/sources.md)

## Requirements

Node.js 20 or newer, and nothing else. There are no dependencies to install, on purpose: a
repository that teaches a configuration contract should not need a toolchain to verify its own
contract.

```bash
git clone https://github.com/your-org/copilot-customization-blueprint.git
cd copilot-customization-blueprint
npm run check
```

`npm run check` runs the customization validator and its 36 tests. It exits non-zero on a
broken link, an unknown frontmatter property, a skill whose name does not match its
directory, a hook pointing at a missing script, or an unclosed code fence.

## Accuracy policy

Official documentation is the source of truth. Every structural claim in this repository
traces to an entry in [`reference/sources.md`](reference/sources.md), and community
repositories are listed there as reading material rather than as authority.

Copilot changes quickly. Where a behaviour is in preview, experimental, or available only in
some surfaces, the text says so at the point where the behaviour is described. If you find a
statement here that the current documentation contradicts, that is a bug — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

The structure borrows from two places worth reading in their own right:
[`github/awesome-copilot`](https://github.com/github/awesome-copilot), whose flat
resource-type layout is the clearest way to organise a customization collection, and
`microsoft/wil`'s in-tree [`.github/skills/README.md`](https://github.com/microsoft/wil/blob/main/.github/skills/README.md),
which documents its own skill discovery rules where a contributor will find them.

Neither is copied. The shape here is a course plus a template.

## License

[MIT](LICENSE).
