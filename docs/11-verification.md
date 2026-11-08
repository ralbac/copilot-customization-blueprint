# Verification

A customization that appears in a menu has been discovered. It has not been shown to change
anything. By the end of this chapter you will be able to separate those two facts, name the
observable signal that proves each mechanism works, and run a loop that tells you which of your
files is responsible for the behaviour you got.

## Discovery is not effectiveness

Two questions get answered by the same shrug:

- **Discovery** — was the file found? A slash command in the `/` menu, an agent in the picker, a
  skill in the list, a hook that fired. This proves the path and the filename are right.
- **Effectiveness** — did the content change the outcome? This proves the content is any good.

Appearing in the `/` menu proves the first and says nothing about the second. A prompt file that
renders correctly and produces an unusable report is discovered and ineffective, and the two
diagnoses have nothing in common: discovery failures are file paths and schemas, effectiveness
failures are wording and context.

The habit worth building: for every customization you add, write down the observable signal for
each of the two questions *before* you test it. If you cannot name the effectiveness signal, you
have not decided what the file is supposed to do.

## The signal per mechanism

| Mechanism | Discovery signal | Effectiveness signal |
| --- | --- | --- |
| Repository instructions | Nothing visible; it is loaded silently | The same request, run with and without the file, produces different behaviour |
| Path-scoped instructions | Nothing visible | The behaviour changes for a matching file and does not change for a non-matching one |
| Prompt file | The command appears in the `/` menu | The invocation produces the sections and order the body specifies |
| Custom agent | The agent appears in the picker | It refuses the action its tool list omits; it is absent from automatic selection when `disable-model-invocation: true` |
| Skill | The skill is listed, with its description | The model selects it for the occasion its description names, and the procedure's output shape appears |
| Hook | The event fires at all | The denied call is denied, with your reason echoed into the session |
| MCP server | The server's tools appear in the tool list | A call returns data from the external system, and a tool you excluded is not offered |
| `copilot-setup-steps.yml` | The setup workflow run appears in the Actions tab | A command the setup installs runs in the agent session |
| Ruleset, `CODEOWNERS` | The rule shows as active, the owners show as requested | The merge is blocked when the condition is unmet |

Two rows deserve their own sentence. Repository instructions have no discovery signal at all: there
is nothing to see, which is why people believe such a file works without ever testing it.
`CODEOWNERS` has a discovery signal that looks like an effectiveness signal — the owners appear as
requested reviewers whether or not the activating rule is enabled — and chapter
[09](09-policies-and-guardrails.md#codeowners-and-the-rule-that-activates-it) covers that trap.

## The dry-run loop

One change, one variable, one comparison:

1. **Write the request down.** The exact prompt you will send, verbatim, and the file you will have
   open when you send it. A request you paraphrase on the second run is a different experiment.
2. **Capture the baseline in a fresh session.** Record what the answer looks like: which rules it
   followed, which sections it produced, which commands it ran.
3. **Change one rule.** One sentence, one property, one hook rule. Two changes and a changed result
   tell you nothing about either.
4. **Re-run the identical request in a fresh session**, with the same file open, on the same
   surface.
5. **Compare the two answers, not the two runs.** Name what changed. If nothing changed, the rule
   is loaded-but-not-followed or not loaded — and the next section separates those.

Step 3 is where the discipline lives. The temptation when a customization disappoints is to rewrite
the file, add three sentences, and try again. That produces an improvement you cannot attribute,
which you can neither keep nor explain.

## Why a fresh session matters

A session that already contains the old rules and the old answer is not a comparison. The
conversation holds the previous result as context, so a difference in the new answer has at least
two candidate causes: your change, or the model continuing a pattern it already established.

A fresh session removes one of them. The only thing that differs between the two runs is the file
you edited.

This is also why an agent edit can appear to do nothing: an in-progress session keeps using the
agent version it started with, which for an agent opened in a pull request is the version at that
commit. Editing the file and re-asking inside the same session tests nothing.

## What `npm run validate` proves

The validator is a schema and link check, and being precise about its scope is what makes it
useful. It proves:

- Every file it knows about parses, and frontmatter keys are on the allow-list for that file type.
- Required properties are present, and skill `name` values match their directory, satisfy the
  character rule, and stay within the length limits.
- A skill description is not over 1024 characters, and an agent body is not over 30,000.
- Hook configuration is valid JSON with `version: 1`, known event names, `type: "command"`, at least
  one shell script per entry, a valid `timeoutSec`, and scripts that exist at the configured paths.
- Every relative Markdown link resolves to an existing file or directory in the repository, and
  every code fence is closed. An unlabelled code fence is a warning rather than an error, so it
  fails review rather than the build.
- The files the contract depends on are present: `copilot-instructions.md`, `AGENTS.md`, and
  `CODEOWNERS`.

It does not prove:

- That any surface reads the file. A correct file in a location Copilot does not scan passes.
- That the model follows it. Nothing static can prove that.
- That an `applyTo` glob matches the file you meant. The validator warns only when a pattern
  contains no glob and names no existing file.
- That a hook's rules match the commands you care about, or that a hook script behaves correctly.
  The validator never executes a hook.
- That a reviewer is following `REVIEW.md`, or that the environment installs what the tests need.

So the validator catches the failures that are invisible at runtime — a mistyped property, a skill
whose name disagrees with its directory, a hook pointing at a script that was renamed — and leaves
the behavioural half to the dry-run loop.

## Not loaded, or loaded but not followed

The distinction is the one that decides which file you edit next. A file that was never loaded and
a file whose rules were ignored have the same symptom: nothing happened.

| Symptom | How to tell which it is | Fix |
| --- | --- | --- |
| A section heading that only your file contains never appears | Ask the model to quote the applicable rule for the file you have open; no rule to quote suggests it was not in context | Fix the location, the extension or the `applyTo` glob |
| The rule is quoted and still not followed | Ask for the request the rule forbids and watch it happen anyway | Rewrite the rule as a specific, checkable instruction; consider a tool grant |
| A hook never denies anything | Run the denied command yourself and read the output; no output means the hook is not running | Check the event name, the script path and the surface's hook support |
| A hook denies everything | The script exits non-zero on a non-matching path | Exit `0` and deny through stdout JSON |
| A skill never loads | Check whether the name matches the directory, then whether the description names the occasion | Rename, or rewrite the description |
| An agent is available but ignores its own body | Compare the behaviour in a fresh session | A stale session keeps the version it started with |

The middle row is the honest one. A rule that is in context and still ignored is a rule the model
weighs against everything else it knows, and the fix is not emphasis — it is a narrower rule, or a
mechanism that does not depend on agreement.

## Record what you verified

Keep the verification record next to the customization, not in a chat log:

| Field | Example |
| --- | --- |
| Request | `Run the tests for the orders module.` |
| Surface | VS Code agent mode, `orders.ts` open |
| File changed | `tests.instructions.md`, one rule added |
| Expected | The new rule's requirement appears in the report |
| Observed | The requirement is met in all three test files |
| Not proven | Nothing about github.com or Copilot CLI |

The last row is not pedantry. Most "it works" claims are true on one surface and untested on the
others, and the difference shows up in code review, which is where the claim gets tested by
someone else.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| The customization "works" because it is in the menu | Discovery was mistaken for effectiveness | Name the effectiveness signal and test it |
| Two changes, one unclear result | The rule and something else changed together | Revert one and re-run |
| A fix appears to work in the session where the file was edited | The session kept its earlier state | Repeat in a fresh session |
| The validator passes and the file still does nothing | The file is valid and in a location the surface does not read | Check surface support before editing the content |
| A rule is quoted back and then broken | The rule is a preference, and the model weighed it | Narrow the rule, or move it to a tool grant or hook |
| A check that passed yesterday fails today | A file was renamed and a link, a hook path or a glob moved with it | Run `npm run check` before every review |

## Practice

[Lab 03](../labs/03-prompt-file.md) and [lab 06](../labs/06-hooks.md) each end with a two-run
comparison, and the [labs index](../labs/README.md) lists the rest. Run one of them with the
verification record above filled in.

Next: [portability](12-portability.md), which is about keeping this work when the host changes.
