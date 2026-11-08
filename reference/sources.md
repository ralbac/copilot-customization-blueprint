# Sources

Every structural claim in this repository traces to one of the sources below. Official
product documentation is the source of truth; community repositories are listed only as
material worth reading, never as authority for behaviour.

Retrieved and verified while writing this repository. Product behaviour changes, so treat
this page as the audit trail rather than a guarantee: if a statement here disagrees with the
current documentation, the documentation is right and this page is a bug.

## Official documentation

| ID | Source | Establishes |
| --- | --- | --- |
| S1 | [Copilot customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet) | The file-to-feature map, filename and location table, trigger model, and the IDE and surface support matrix including which features are preview |
| S2 | [Comparing Copilot customization features](https://docs.github.com/en/copilot/concepts/customizations/comparing-customizations) | The distinction between instructions, skills, tools, MCP servers, hooks, subagents, custom agents, extensions and plugins, and when to choose each |
| S3 | [Custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions) | The three instruction scopes, precedence on github.com, what makes instructions effective or ineffective, and that code review reads instructions from the head branch |
| S4 | [Support for different types of custom instructions](https://docs.github.com/en/copilot/reference/custom-instructions-support) | Exactly which instruction types each surface reads, per IDE and per feature, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and `REVIEW.md` |
| S5 | [Use custom instructions in VS Code](https://code.visualstudio.com/docs/agent-customization/custom-instructions) | `applyTo` glob semantics, that patterns are relative to the workspace root, and that project instruction files need no frontmatter |
| S6 | [Prompt files for GitHub Copilot](https://docs.github.com/en/copilot/concepts/prompting-and-context/prompt-files) | What a prompt file is, where it lives, and that it is invoked rather than always-on |
| S7 | [Use prompt files in VS Code](https://code.visualstudio.com/docs/agent-customization/prompt-files) | The prompt frontmatter table, `${input:}`, `${selection}`, `#file:` and `#tool:` syntax, the tool priority order, and the fact that a `.prompt.md` file is not runnable by other harnesses |
| S8 | [Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration) | The full agent frontmatter table, tool aliases, `mcp-servers`, the 30,000-character body limit, the deduplication rule, Git-SHA versioning, and which IDE-only properties are ignored on github.com |
| S9 | [Using custom agents in your IDE](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/use-copilot-agents/use-custom-agents) | The workspace versus user-profile creation flow and the `.github/agents` location |
| S10 | [Creating custom agents for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli) | `.agent.md` as the definition format and the project versus personal agent directories |
| S11 | [Custom agent file reference (VS Code)](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference) | The IDE-side agent file structure and the `argument-hint` and `handoffs` properties |
| S12 | [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) | Agent Skills as an open standard, the surfaces that read skills, and the provenance of shared skill collections |
| S13 | [Adding agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) | The `SKILL.md` requirements, the lowercase-hyphen name rule, `allowed-tools` and its risk, the `code-review` naming hint, and the `gh skill` command surface |
| S14 | [Use Agent Skills in VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills) | The `SKILL.md` frontmatter table with limits, the `name`-must-match-directory rule, progressive three-level loading, `context: fork`, the access matrix, and the full skill location table |
| S15 | [Agent Skills specification](https://agentskills.io/specification) | The open standard the skill format implements |
| S16 | [Hooks for GitHub Copilot](https://docs.github.com/en/copilot/concepts/customizations/hooks) | What hooks are, the event list, the JSON configuration shape, `preToolUse` as the enforcement point, and the security and performance guidance |
| S17 | [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference) | The decision contract: `permissionDecision`, `permissionDecisionReason`, `modifiedArgs`; the exit-code table; the fail-closed versus fail-open semantics; the one-JSON-object stdout rule; and the camelCase versus snake_case payload shapes |
| S18 | [Model Context Protocol (MCP) for Copilot](https://docs.github.com/en/copilot/concepts/customizations/mcp) | MCP as the mechanism for external tools, and which surfaces support it |
| S19 | [Configure MCP servers for your repository](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers) | That repository-level MCP configuration is entered in the repository settings UI rather than committed, the `mcpServers` JSON shape, the `COPILOT_MCP_` secret prefix, and the migration notes from `.vscode/mcp.json` |
| S20 | [Configure the development environment for agents on GitHub Actions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment) | The `copilot-setup-steps.yml` path and default-branch requirement, the single `copilot-setup-steps` job, the exact list of honoured job keys, the `fetch-depth` override, the `copilot-code-review.yml` override, and the runner OS limits |
| S21 | [Building a secure cloud environment for agents](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails) | The real guardrail set: rulesets, CODEOWNERS for customization files, Agents secrets and variables, runner choice, and the workflow-approval default |
| S22 | [Customizing or disabling the firewall for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall) | That internet access is firewalled by default, and that code review has an independent firewall section |
| S23 | [Excluding content from GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot) | Content exclusion as the mechanism for preventing Copilot from reading paths at all |
| S24 | [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) | How rulesets constrain branch and tag interaction |
| S25 | [Maintaining codebase standards in a Copilot rollout](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/maintain-codebase-standards) | Requiring pull requests and reviews for agent-authored changes, and targeting repositories by custom property |
| S26 | [Enterprise managed settings](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings) | That a managed-settings deny rule blocks an operation for all users regardless of local configuration |
| S27 | [Managing policies and features for Copilot in an organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies) | Where organization policies and model availability are configured |
| S28 | [Customizing the GitHub Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app) | Repository hooks and plugin-supplied hooks in the desktop app |
| S29 | [Use GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review) | How review is requested, and the separately customisable review environment |
| S30 | [Configure secrets and variables for Copilot cloud agent](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/configure-secrets-and-variables) | Agents secrets and variables at organization and repository level, and the `COPILOT_MCP_` prefix requirement |

## Community reference material

Read these for shape and breadth, not for authority. Nothing in the chapters above cites them
for a behavioural claim.

| Source | Why it is worth reading |
| --- | --- |
| [github/awesome-copilot](https://github.com/github/awesome-copilot) | A large community collection organised by resource type (`agents/`, `instructions/`, `skills/`, `hooks/`, `plugins/`, `workflows/`), with a searchable site, a Learning Hub, and a machine-readable `llms.txt`. The flat resource-type layout is the main structural idea borrowed here |
| [microsoft/wil `.github/skills/`](https://github.com/microsoft/wil/blob/main/.github/skills/README.md) | A production example of a repository documenting its own skill layout and discovery rules in-tree |
| [anthropics/skills](https://github.com/anthropics/skills) | Reference implementations of the Agent Skills standard, useful as a quality bar for `SKILL.md` structure |
| [Awesome Copilot Index](https://pez.github.io/awesome-copilot-index/) | A generated index with counts per resource type; useful for judging what the ecosystem actually produces |
| [timheuer/vscode-awesome-copilot](https://github.com/timheuer/vscode-awesome-copilot) | A browser for the above, as an example of tooling built on top of a customization collection |

## Not used as sources

Anything else. In particular, blog posts, generated summaries and third-party study guides
were not used to establish behaviour, and where one was consulted to locate a primary source,
only the primary source is cited here. This matters more than it sounds: several widely
shared articles describe preview features as generally available, and a repository that
inherits that error teaches it.
