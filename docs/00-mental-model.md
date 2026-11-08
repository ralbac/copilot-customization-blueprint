# The mental model

You are about to build a set of files that change how GitHub Copilot behaves in a
repository. By the end of this chapter you will be able to look at any customization
request and say which of the available mechanisms it belongs to, and why.

Read this chapter before the others. Every later chapter assumes the three-part model below,
and confusion about Copilot customization is almost always confusion about which of the
three parts a given file belongs to.

## Three mechanisms, three different guarantees

Copilot customization looks like a pile of file types. It is not. It is three mechanisms,
and they fail in different ways.

### 1. Prompt injection — probabilistic

Most customization files are text that gets inserted into the model's context at some point.
Custom instructions, prompt files, custom agents, and skills are all prompt injection: they
are words the model reads and usually follows.

"Usually" is doing real work in that sentence. The official documentation says it plainly:
instructions guide the model and do not guarantee compliance. If you need a rule that cannot
be skipped, this is the wrong mechanism, and no amount of emphatic capital letters in a
Markdown file will change that.

### 2. Tool grants — capability

A custom agent's `tools` list, a skill's `allowed-tools`, and an MCP server's exposed tools
decide what the model is *able* to do. This is stronger than prompt injection because it does
not depend on the model agreeing with you.

A reviewer with `tools: ["read", "search"]` cannot edit a file. Not because it read a rule
and chose to obey it, but because there is no tool to do it with. That is the single most
effective guardrail available in this whole surface, and it costs one line of YAML.

### 3. Hooks — deterministic

A hook is a shell command that runs at a defined point in the agent's workflow. It does not
ask the model anything. Its decision is enforced by the runtime: when a `preToolUse` hook
denies a tool call, the call does not happen.

This is the only mechanism that produces a guarantee rather than an instruction. It is also
the only one that can break the agent entirely, because a `preToolUse` command hook is
fail-closed on a non-zero exit — a bug in your script denies every tool call in the session.

The practical consequence: express a preference as prompt injection, express a capability
boundary as a tool grant, and express a hard rule that must not be negotiable as a hook.

## The context budget

Every token of customization you write competes with the token the user's actual request
needs. Copilot loads customization content into a finite context window, and the more you
load unconditionally, the less room remains for the code, the diff, and the task.

This is why the file types are shaped the way they are. There is a deliberate ladder:

| Loading | Mechanism | Cost |
| --- | --- | --- |
| Every request, always | Repository-wide instructions, `AGENTS.md` | Paid on every single interaction |
| When a matching file is in play | Path-scoped instructions | Paid only for matching paths |
| When the model decides it is relevant | Skills — name and description only, then the body | Discovery is nearly free; the body is paid on use |
| When the user asks for it | Prompt files, custom agents | Paid only when selected |
| Never in context | Hooks, `copilot-setup-steps.yml` | No context cost; they are configuration, not prose |

Two rules follow, and they explain most of the guidance in this repository:

- Anything that applies to *almost every* task belongs in the always-on layer, and must be
  short.
- Anything that applies to *some* tasks belongs lower down, and may then be long.

A 900-line `copilot-instructions.md` is not thoroughness. It is a permanent tax on every
interaction in the repository, and most of it is irrelevant to whatever the user asked. That
content belongs in a skill.

## The surfaces, and why the same file behaves differently

A customization file does not have one behaviour. It has one behaviour per surface that
reads it. The main surfaces are:

- **VS Code**, **Visual Studio**, **JetBrains IDEs**, **Eclipse**, **Xcode** — IDE chat and
  agent mode. These read the most file types, including prompt files.
- **GitHub Copilot CLI** — terminal sessions. Reads instructions, agents and skills, not
  prompt files.
- **github.com** — Copilot Chat on the web.
- **Copilot cloud agent** — asynchronous work on an issue, running in a sandbox or in GitHub
  Actions.
- **Copilot code review** — reviews pull requests.

Prompt files are the sharpest example: they are available in VS Code, Visual Studio,
JetBrains IDEs and Xcode, and not on github.com or in Copilot CLI. If your team's work
happens in Copilot CLI, a `.prompt.md` file is invisible to them. A skill is not.

This asymmetry has one operational consequence worth internalising early: when a
customization appears not to work, the first question is not "is my file wrong?" but "does
this surface read this file type at all?" The feature matrix in
[the cheat sheet](../reference/cheat-sheet.md) answers that.

## The map

Here is the whole configuration surface in one view. Each entry links to the chapter that
covers it.

| File | Read by | What it changes |
| --- | --- | --- |
| `.github/copilot-instructions.md` | Most surfaces | Always-on repository context |
| `.github/instructions/*.instructions.md` | Most surfaces | Always-on context, scoped by path glob |
| `AGENTS.md` | VS Code, CLI, cloud agent, code review | Tool-neutral agent instructions |
| `REVIEW.md` | Copilot code review | What a reviewer should look for |
| `.github/prompts/*.prompt.md` | IDEs only | A reusable prompt you invoke |
| `.github/agents/*.agent.md` | Most surfaces | A specialist persona with its own tools |
| `.github/skills/<name>/SKILL.md` | Most surfaces | A procedure loaded on demand |
| `.github/hooks/*.json` | CLI, cloud agent, VS Code (preview) | Deterministic commands at lifecycle events |
| `.vscode/mcp.json` | VS Code | MCP servers available in the editor |
| Repository MCP settings | Cloud agent, code review | MCP servers available in the cloud |
| `.github/workflows/copilot-setup-steps.yml` | Cloud agent, code review on Actions | The environment the agent runs in |

And the layer that actually enforces anything:

| Control | Enforces |
| --- | --- |
| Repository rulesets | What can be merged and by whom |
| `CODEOWNERS` + "Require review from Code Owners" | That customization changes get reviewed |
| Content exclusion | What Copilot may read at all |
| Firewall settings | What the agent may reach on the network |
| Enterprise and organization policies | Which features exist for whom |

Chapter [09](09-policies-and-guardrails.md) covers that second table. It matters because a
`CODEOWNERS` file is a real gate and a `copilot-instructions.md` sentence is a suggestion,
and confusing the two is how teams end up believing they have governance they do not have.

## Where to go next

- If you have one hour and want to build something: read [01](01-custom-instructions.md) and
  [04](04-custom-agents.md), then do [labs 01](../labs/01-first-instruction.md) and
  [04](../labs/04-first-agent.md).
- If you are deciding what to adopt for a team: read this chapter, then
  [10](10-composition-patterns.md), then [09](09-policies-and-guardrails.md).
- If something you already built is not working: read
  [11](11-verification.md) before changing the file. Most "broken" customizations are
  discovered, not selected, and the two have different fixes.
