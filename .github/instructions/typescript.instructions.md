---
applyTo: "**/*.ts,**/*.tsx"
description: "TypeScript conventions for this repository."
---

# TypeScript instructions

Loaded only for TypeScript files. The `applyTo` glob is relative to the repository root,
not to `.github/instructions/`, so `**/*.ts` matches `examples/shop-api/src/api/orders.ts`.

## Types

- Enable `strict`. Do not weaken it per file with `// @ts-ignore`. If a type is genuinely
  unknowable at a boundary, model it as `unknown` and narrow it explicitly.
- Prefer `type` for unions and object shapes, `interface` for anything a consumer will
  extend. Do not mix the two for the same concept in the same directory.
- Do not export a type only to satisfy a test. Export the narrowest signature that callers
  need.
- Derive types from values where possible (`typeof`, `ReturnType`, `as const`) instead of
  writing a parallel declaration that can drift.

## Boundaries

- Parse untrusted input once, at the edge, into a validated type. Everything behind the
  edge receives the parsed type, not the raw payload.
- Do not add a validation library to this repository. The fixture demonstrates the shape
  of a boundary with plain narrowing.

## Functions

- One responsibility per function. If the name needs "and", split it.
- Prefer an explicit return type on exported functions. It makes the contract reviewable
  without opening the body.
- Early return over nested conditionals.
- No default export except where a framework requires it.

## Errors

- Throw `Error` with a message that names the operation and the offending value. Do not
  throw strings.
- Do not catch and swallow. If a caller cannot act on a failure, log it once at the
  boundary and return a typed result.

## Imports

- Use `import type` for type-only imports so the emitted output does not carry them.
- Keep import order stable: Node built-ins, external packages, then relative paths.
