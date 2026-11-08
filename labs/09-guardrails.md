# Lab 09 — Audit your guardrails

## Goal

You will be able to classify every control in this repository's customization set as an
instruction, a capability or enforcement, and to name the runtime that applies each one in your
own repository.

## What you need

- The clone, for the files.
- A browser with access to repository settings on github.com, for the half that cannot be read
  from the repository. If you are not an owner or maintainer you can read the files and audit a
  repository of your own for the settings part.

## Before you start

Open four files:

- `.github/CODEOWNERS`
- `.github/hooks/guardrails.json`
- `.github/agents/code-reviewer.agent.md`
- `.github/copilot-instructions.md`

The expected state: `CODEOWNERS` names the real owner `@ralbac` on every pattern, with a
comment above each one saying which concern it protects,
`guardrails.json` has a `sessionStart` entry, two `preToolUse` entries and a `sessionEnd` entry,
and `copilot-instructions.md` contains hard rules written in imperative prose. None of those
facts tells you whether anything is enforced, which is the point of the lab.

## Steps

1. Read the second paragraph of `.github/CODEOWNERS`. It states the rule this lab is about: pair
   the file with the "Require review from Code Owners" branch rule, otherwise it is documentation
   rather than enforcement.

2. Classify the controls in this repository. Fill in the table before reading the answers below,
   and mark each row `instruction`, `capability`, `enforcement`, or `neither`.

3. Compare against this worked classification:

   | Control | Where | Class | Applied by |
   | --- | --- | --- | --- |
   | "Never edit `examples/shop-api/` to make a check pass" | `.github/copilot-instructions.md` | Instruction | Nobody. The model usually complies |
   | Documentation voice and link rules | `.github/instructions/documentation.instructions.md` | Instruction, scoped | Nobody; loaded only for matching paths |
   | Reviewer `tools: ["read", "search"]` | `.github/agents/code-reviewer.agent.md` | Capability | The runtime's tool resolver |
   | Review prompt `tools: ["read", "search"]` | `.github/prompts/review-api-security.prompt.md` | Capability, per invocation | The tool resolver, for that call |
   | `allowed-tools: shell` | `.github/skills/dependency-audit/SKILL.md` | Capability, in the loosening direction | The permission service: it removes a confirmation step |
   | Force-push and `chmod` denials | `.github/hooks/guardrails.json`, `preToolUse` | Enforcement, shell tools only | The hook runtime, before the tool runs |
   | Secret-file denial | `protect-secret-files.sh` on `preToolUse` | Enforcement, file tools only | The hook runtime |
   | Session audit trail | `audit-session.sh` on `sessionStart` and `sessionEnd` | Neither: observability | Nothing; it records after the fact |
   | `CODEOWNERS` entries | `.github/CODEOWNERS` | Instruction until a rule requires code owner review | GitHub, only with that rule enabled |

4. For every row you classified as enforcement, name the runtime. If you cannot name one, the row
   is not enforcement, however strongly the file is worded. For this repository: the hook runtime
   for the two `preToolUse` entries, and GitHub's branch protection for `CODEOWNERS` if and only
   if the review requirement is on.

5. Read the scope limits of the enforcement you do have, because a control that is trusted beyond
   its scope is worse than no control. The dangerous-command hook only inspects `toolName` values
   matching `bash`, `shell`, `powershell` or `execute`, so a file write that achieves the same
   result is out of its reach. Its regex list is a denylist. A timeout fails open, so a slow
   script enforces nothing. The secret hook covers file tools only, and its patterns are a fixed
   list of likely paths.

6. Check the settings on github.com. Look at rulesets (branch rules), at whether code owner
   review is required, at content exclusion, and at the firewall, which has its own section for
   code review. The labels and the nesting of these pages differ by version; the question for
   each is the same: is this active, in evaluate or report-only mode, or off?

7. Check the one place where a matching file is not enough: `CODEOWNERS` patterns name teams that
   must exist **and** have write access. A pattern naming a team that does not exist matches
   nobody, and GitHub does not report it.

8. Now audit your own repository. Use this worksheet, one row per control you believe you have:

   | Control in your repository | Class today | The runtime that applies it | State |
   | --- | --- | --- | --- |
   | | | | Enforced, or aspiration |

   Then apply the rules of the audit:

   - An entry with no named runtime is an instruction, whatever the file is called.
   - A rule in evaluate mode reports; it does not block.
   - A rule with a bypass list for administrators is weaker than its name suggests.
   - A pattern whose owner does not exist enforces nothing.

9. Pick the one aspiration you care most about. Either make it enforcement — turn on the branch
   rule, enable content exclusion, add the missing secret prefix — or delete it, because a
   control nobody applies is a claim in a document. Record which you chose and why.

## Check

Success looks like this:

- Every row in your own-repository table names a runtime, or is marked instruction.
- At least one row changed classification once you looked at the settings page.
- You can state, in one sentence each, the scope limit of your two strongest controls.

Plausible-looking failures, all of which are common in real audits:

| What you see | What it means |
| --- | --- |
| "We have `CODEOWNERS`, so customization changes need approval" | Only if code owner review is required. Otherwise the merge button has no gate |
| "The hook stops destructive operations" | It stops the patterns it lists, for shell tools. A denylist is not a category |
| The audit log counted as a control | It records sessions. It stops nothing |
| A rule visible in settings and marked evaluate | It reports rather than blocks |
| A `CODEOWNERS` pattern with a plausible team name | If the team is missing or has no write access, the pattern matches nobody and nothing warns you |

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| Rulesets or branch rules are not visible | You are not an owner or maintainer | Audit a repository you administer, or ask an owner to walk through the settings |
| `CODEOWNERS` has no effect on merges | The review requirement is off, or the owners lack write access | Enable the rule and fix the owners |
| A team in `CODEOWNERS` matches nothing | The team does not exist at that path, or has read-only access | Use an existing team with write access |
| The hook denies locally and never fires in the cloud agent | The surface did not load it, or the file path is wrong | Check support first, then the path |
| You cannot tell whether a setting is on | The policy is inherited from the organization | Check organization-level policy before repository level |
| A control works in one repository and not another | Settings are per repository; only managed settings apply everywhere | Configure it per repository, or ask for an organization policy |

## Clean up

This lab changes nothing:

```bash
git status --short
```

Expected: no output. If you changed a setting while auditing, note it somewhere durable: an
unrecorded settings change is a future audit finding.

## What you just proved

The customization set and the enforcement layer are different systems that meet in one sentence:
a file under `.github/` influences the model, and a setting outside the repository constrains what
that influence can do. A hard rule written as prose has no guarantee, a tool grant removes a
capability, and a hook, ruleset, content exclusion or firewall is applied by a runtime that never
asks the model for permission. Auditing a guardrail is therefore one question repeated: what
applies this, and to what exactly?
