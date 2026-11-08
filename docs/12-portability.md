# Portability

A configuration you cannot move is a configuration you will rewrite. By the end of this chapter you
will be able to separate what this repository's customization set shares with other agents from what
is Copilot-specific, and structure a repository so the shared part is the large part.

## The shared format

Agent Skills is an open standard: a directory containing a `SKILL.md` file with a name and a
description, plus optional sibling files. Copilot implements the standard and reads skills from
three project locations:

| Location | Notes |
| --- | --- |
| `.github/skills/<name>/` | The Copilot project path |
| `.claude/skills/<name>/` | Also read by Copilot: the standard's format under another host's directory name |
| `.agents/skills/<name>/` | Also read by Copilot: the neutral directory name |

All three are read by Copilot, and the second and third exist because other hosts read them too.
Which host reads which path is a question for that host's documentation, and it is the reason the
neutral directory name is worth preferring over the product-specific one.

Personal skills follow the same split: `~/.copilot/skills/<name>/` and `~/.agents/skills/<name>/`.

This is the one part of the configuration where the file you write for Copilot today is the file
another host reads tomorrow, and it is the reason to invest in skills before investing in anything
else. A prompt file is a Copilot-IDE artifact; a skill is a directory that follows a published
standard.

The format is shared. The property set is not uniform: the standard defines the entry point and its
core fields, and each host adds its own properties on top. Treat `name`, `description` and
`license` as the portable core, and confirm `allowed-tools`, `context`, `user-invocable` and
`disable-model-invocation` against the host you are moving to rather than assuming they travel.

## `AGENTS.md` is the cross-tool instruction layer

`AGENTS.md` is a convention, not a Copilot file. Copilot reads it from VS Code, Copilot CLI, the
cloud agent and Copilot code review, and other agent hosts that adopted the convention read it too.

`CLAUDE.md` and `GEMINI.md` are read by Copilot as well, as aliases in the same family. Their
support differs by surface, which is why the reference layer in this repository keeps the
tool-neutral content in `AGENTS.md` and puts only Copilot-specific conventions in
[`copilot-instructions.md`](../.github/copilot-instructions.md).

That split is the portability decision that costs nothing when it is made early and is expensive
to reverse. If `AGENTS.md`
holds the tool-neutral baseline — what the project is, the editorial and process rules, the
verification command — then another host gets the useful part for free. If the same content lives
in `copilot-instructions.md`, another host gets nothing.

## What does not port

| Mechanism | Ports? | Why, and what to do |
| --- | --- | --- |
| `.github/skills/` | Yes, as a format | The standard; keep the body free of Copilot-only references |
| `AGENTS.md` | Yes | A cross-tool convention; keep it host-neutral |
| `.github/prompts/NAME.prompt.md` | No | A prompt file is not runnable by other harnesses; it is also unavailable on github.com and in Copilot CLI. Convert it to a skill if it must travel |
| `.github/agents/NAME.agent.md` | Partly | The body travels as instructions; `target`, `mcp-servers`, `metadata`, `argument-hint` and `handoffs` are Copilot properties |
| `.github/hooks/NAME.json` | Partly | The events and the JSON shape are Copilot's. A hook that must work elsewhere reads both payload shapes |
| `.github/workflows/copilot-setup-steps.yml` | No | The path, the job name and the honoured keys are a Copilot contract |
| Repository MCP settings | No | Entered in the repository settings UI; another host has its own configuration |
| Content exclusion, firewall, rulesets | No | GitHub settings, not files |

Four of these deserve a sentence each, because each is a place where a team discovers the boundary
late.

**Prompt files.** The relationship between a prompt file and a skill is asymmetric: a skill can be
invoked as a slash command in hosts that support it, while a prompt file is a file type other
harnesses do not run. When a procedure matters beyond the editor, write it as a skill and let the
slash command come from there.

**Agent files.** An agent's value on another host is its body: the role, the boundaries, the order
of work. The frontmatter around that body is Copilot's, and only `description` carries over with
certainty.

**Hooks.** The reference scripts in this repository already read two payload shapes —
`input.toolName ?? input.tool_name` — because the PascalCase event names used by VS Code and Claude
Code deliver snake_case keys. That habit is what makes a hook portable: read both shapes, and keep
the decision logic separate from the payload parsing. Two events, `permissionRequest` and
`notification`, are Copilot CLI only, so a hook on those does not travel at all.

**The environment file.** `copilot-setup-steps.yml` is a workflow with a fixed path, a fixed job
name and a list of honoured keys. Its content — checkout, install, prove — is the portable part; the
wrapper is not.

## Structure for portability

The pattern that survives a host change is a neutral core with a thin host layer on top:

```text
repository/
├── AGENTS.md                        neutral: what the project is, the rules, the commands
├── .github/
│   ├── skills/                      neutral format: the procedures, with their siblings
│   │   └── <name>/SKILL.md
│   ├── copilot-instructions.md      host layer: Copilot-specific conventions only
│   ├── prompts/                     host layer: IDE-only slash commands
│   ├── agents/                      host layer: personas and tool grants
│   ├── hooks/                       host layer: Copilot's hook shape
│   └── workflows/                   host layer: the Copilot environment contract
└── .agents/skills/                  shared with hosts that use the .agents convention
```

Three rules keep the boundary honest:

- **A skill body names no Copilot file.** A procedure that says "read
  `.github/copilot-instructions.md`" is a procedure about this host. Say "read the repository-wide
  instructions" and let the host resolve it.
- **The host layer contains only what the host adds.** A rule that any agent would need belongs in
  `AGENTS.md`, not in the file whose name carries the product.
- **Nothing in the neutral core depends on a frontmatter property the standard does not define.**
  A skill whose behaviour depends on `context: fork` is portable in format and not in behaviour,
  which is a distinction worth telling a reader about rather than discovering during a migration.

If you want both locations populated, `.agents/skills/` and `.github/skills/` can hold the same
content — but a copy is a second version, and the second version drifts. Choose one location, and
let the host-specific layer point at it.

## Migrating a repository

The order that avoids rework:

1. **Move the neutral rules into `AGENTS.md`.** Anything a different agent would need.
2. **Convert the procedures into skills**, one directory each, with the body free of host-specific
   paths.
3. **Delete what duplicates.** If `AGENTS.md` and `copilot-instructions.md` state the same rule,
   the rule has two owners and will disagree with itself within a quarter.
4. **Keep the host layer thin**, and write down what it contains and why. A host layer that is
   visibly the smaller half is one that can be rewritten in an afternoon.
5. **Re-verify on the host you moved to.** A skill that loads from `.claude/skills/` is discovered
   by filename and directory; a description that names the wrong occasion still fails, in the same
   way and in the same silence as it did before.

## When not to port

A neutral core is worth paying for when the host is going to change, or when more than one host is
already in use. It is not free: it costs a decision per rule, because every rule has to be
classified as neutral or host-specific, and a rule that is neither sits in the wrong place until
someone notices.

For a repository whose whole team works in one IDE, the thin host layer is overhead. Write the
material where it loads today, keep the skills in the standard format so the door stays open, and
skip the migration.

The signal to revisit the decision is operational rather than philosophical: a teammate starts using
a different host, an agent-authored change is reviewed on github.com, or a second repository needs
the same conventions. One of those happening is the moment to move the neutral rules out, and doing
it then is cheaper than doing it after the copies have drifted.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| A prompt file is invisible to half the team | They work in Copilot CLI or on github.com, where prompt files are unavailable | Write the procedure as a skill |
| Another host reads the skill and ignores its behaviour | The behaviour depended on a property that host does not implement | State the behaviour in the body, or verify the property per host |
| The same rule exists in two files after a migration | Content was copied rather than moved | Delete one copy and link to the survivor |
| A hook stops enforcing after a host change | The payload key shape differs, so the script reads nothing | Read both shapes, as the reference scripts do |
| A new repository has a `.github/` nobody understands | The host layer grew without a written boundary | Split neutral from host-specific and say which is which |
| The environment is not ready in the new host | `copilot-setup-steps.yml` is not a portable contract | Port the content: checkout, install, prove |

## Practice

The [labs index](../labs/README.md) lists the practice track. Do [lab 05](../labs/05-first-skill.md)
twice: once with the skill in `.github/skills/`, once moved to `.agents/skills/`, and confirm that
the procedure behaves the same.

Next: the [theory index](README.md) puts the chapters in order, and
[the cheat sheet](../reference/cheat-sheet.md) is the lookup page for everything above.
