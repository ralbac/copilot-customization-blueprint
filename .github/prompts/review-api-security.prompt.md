---
name: review-api-security
description: Review an API surface for authentication, authorization, input validation and data-handling risks.
argument-hint: [path to the API folder or file]
agent: agent
tools: ["read", "search"]
---

Review the API implementation identified by the user.

If the argument is empty, ask which folder or file to review. Do not guess and do not
review the whole repository.

## What to check

Work through these in order and record an answer for each, including the ones that pass.

1. **Authentication** — is each entry point reachable without a verified identity?
2. **Authorization** — does each entry point check that *this* caller may act on *this*
   resource, or only that the caller is logged in? The second is not authorization.
3. **Input validation** — is untrusted input parsed into a validated type at the boundary,
   or does raw input flow inward?
4. **Data exposure** — does any response include a field the caller has no need for
   (internal ids, other users' data, full error objects)?
5. **Rate limiting and abuse** — is there any ceiling on repeated calls to an expensive or
   state-changing endpoint?
6. **Logging** — are security-relevant events recorded, and are secrets or tokens recorded
   along with them?

## Rules for the report

- Never claim a control exists unless the code you read demonstrates it. "The framework
  probably handles this" is not a finding and not a pass; write **not verified**.
- Cite `path:line` for every observation, including the passes.
- Separate **missing** from **not verified**. They need different follow-up.

## Output

A Markdown checklist grouped by severity: **High**, **Medium**, **Low**, then a
**Verified as present** section.

For each item: the risk in one sentence, the `path:line` that demonstrates it, and the
smallest change that removes the risk. If a category has no findings, say what you checked
so the reader knows the check happened.
