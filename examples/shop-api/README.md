# shop-api — fixed fixture

A toy service used by the labs. **It is not a runnable application**: there is no server, no
build, and no dependency list. It exists so that path-scoped instructions have real files to
match and so that the review prompts have something concrete to find.

Two rules apply to this directory:

1. Do not modernise it. The labs depend on its current shape, including its flaws.
2. Do not fix the security issue in `src/api/orders.ts`. It is the subject of
   [the security review prompt](../../.github/prompts/review-api-security.prompt.md) and of
   [lab 03](../../labs/03-prompt-file.md). Fixing it silently breaks both.

## Layout

```text
examples/shop-api/
├── README.md                      you are here
└── src/
    ├── models.ts                  types and the validation boundary
    ├── repositories/
    │   └── orders.ts              in-memory store
    └── api/
        ├── orders.ts              request handlers
        └── orders.test.ts         tests, intentionally thin
```

## What the labs use it for

| Lab | Uses this fixture to |
| --- | --- |
| [01](../labs/01-first-instruction.md) | confirm that a repository-wide instruction reaches Copilot |
| [02](../labs/02-path-scoped-instructions.md) | show `applyTo` matching `src/**/*.ts` but not `README.md` |
| [03](../labs/03-prompt-file.md) | give the security review prompt a real defect to find |
| [04](../labs/04-first-agent.md) | give the read-only reviewer something to report |
| [05](../labs/05-first-skill.md) | show a skill that must inspect several files |
| [06](../labs/06-hooks.md) | show a hook denying an edit to a protected path |
