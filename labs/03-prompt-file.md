# Lab 03 — Run a prompt file

## Goal

You will be able to prove that `.github/prompts/review-api-security.prompt.md` finds the
deliberate authorization defect in `getOrder`, and that its report keeps a control it could not
verify separate from a control that is missing.

## What you need

- An IDE that reads prompt files: VS Code, Visual Studio, JetBrains IDEs, or Xcode. Prompt files
  are generally available in those four.
- **Not** github.com and **not** Copilot CLI. Prompt files do not exist on either surface, so if
  those are the only Copilot surfaces you have, this lab is not runnable and
  [lab 05](05-first-skill.md) teaches the same review with a mechanism that does work there.

## Before you start

Open `.github/prompts/review-api-security.prompt.md` and
`examples/shop-api/src/api/orders.ts`. The expected state:

- The prompt's frontmatter is `name: review-api-security`, `agent: agent`, and
  `tools: ["read", "search"]`.
- `orders.ts` has four handlers: `createOrder` at line 27, `getOrder` at line 55, `listOrders` at
  line 74, and `updateStatus` at line 90.
- `getOrder` returns `{ status: 200, body: order }` at line 65, after checking only that a caller
  exists.

The defect is intentional. Every lab in this track depends on it, and the fixture's own comments
say twice not to fix it.

## Steps

1. Read the prompt's body, and in particular check 2:

   > **Authorization** — does each entry point check that *this* caller may act on *this*
   > resource, or only that the caller is logged in? The second is not authorization.

   Read check 6 and the closing rules as well. The prompt tells the model to write **not
   verified** rather than guess when it cannot see a control, and to separate **missing** from
   **not verified**.

2. Note what the `tools` list does here. The prompt grants `read` and `search`, which overrides
   the tool list of the agent named in `agent:` for this invocation, so the review can read the
   fixture and cannot change it. This is the same boundary [lab 04](04-first-agent.md) proves for
   a custom agent.

3. Invoke the prompt by name. Type `/review-api-security` in the chat input; the slash-command
   list shows it under its `name`. The exact picker label differs by version. Supply the
   argument when the input asks for it:

   ```text
   examples/shop-api/src/api/orders.ts
   ```

4. Compare the report against the output contract in the prompt: a Markdown checklist grouped
   **High**, **Medium**, **Low**, then a **Verified as present** section, with `path:line` for
   every observation including the passes.

5. Run the same invocation a second time, in a new session, with the same argument. Keep both
   reports side by side. Two runs on the same input do not produce identical text, and the
   difference is data: note which findings appear in both, which in one, and whether the
   discrepancy is a wording difference or a missing finding.

6. Do not edit `orders.ts`. If the report says the file is fine, the finding is about the review,
   not about the code: line 65 returns any order to any caller.

## Check

Success looks like this:

- An Authorization item cites a line inside `getOrder`, between line 55 and line 65, and states
  the failure mode: an authenticated caller can read another customer's order.
- The **Verified as present** section cites `listOrders`, around line 78, as the contrast case
  where the ownership check is implemented.
- **Missing** and **not verified** appear as different labels. Rate limiting is the clearest
  example: the fixture implements none, so a correct report either calls it missing or says it
  could not verify it from the files it read, never "handled by the framework".

Three plausible-looking failures, and what each means:

| What you see | What it means |
| --- | --- |
| "Authorization is likely handled by the framework" under **Verified as present** | An unverified guess promoted to a pass. The prompt forbids it; rerun and read the rule with the model |
| A report with no `path:line` anywhere | You ran a general chat review, not this prompt. Check that you invoked `/review-api-security` |
| Findings about naming and formatting | Same cause. The prompt's six checks are not visible in the output, so the prompt was not the input |

There is no marker trick in this lab, so read the report itself. The verifiable part is the
location: the finding either points inside `getOrder` or it does not.

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/review-api-security` is not in the slash list | The file is not under `.github/prompts/`, or its name does not end in `.prompt.md` | Move and rename it; the filename is the default command name |
| The prompt is offered but the IDE reports it cannot be found on disk | The workspace root is not the repository root | Open the repository folder |
| The command runs and asks which file to review | No argument was supplied | Pass `examples/shop-api/src/api/orders.ts` |
| The report is generic and has no `path:line` | A prose request was sent instead of the prompt, or another prompt was selected | Invoke the slash command explicitly |
| The prompt works in one IDE and is absent in another | The surface does not read prompt files, or its version predates them | Check the surface; convert the procedure to a skill if it must run everywhere |
| The model reports rate limiting as present | It inferred a control it cannot see | Rerun; require **not verified**, and treat a repeated guess as a prompt-compliance limit, not a code finding |

## Clean up

Nothing in this lab changes a file, so:

```bash
git status --short
```

Expected: no output. If a diff appears — the model edited something, or you did — discard it. The
defect in `getOrder` must still be there, because [lab 05](05-first-skill.md) depends on it.

## What you just proved

A prompt file is invoked and not always-on: it costs context only when you call it, and it
carries its own tool grant, so the same mechanism that produces a report also bounds what the
run can touch. The load-bearing distinction is between missing and not verified, because the
first is work someone has to do and the second is a check nobody has done; promoting the second
to a pass is how an unverified control becomes a believed control. Running the prompt twice also
shows the honest limit of the mechanism: the structure is reliable, the findings are not
identical, and the check is whether the defect appears in both reports.
[Prompt files](../docs/03-prompt-files.md) covers the frontmatter and the `${input:}` syntax this
file does not need.
