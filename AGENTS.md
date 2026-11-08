# AGENTS.md

Tool-neutral project instructions. Read by GitHub Copilot (VS Code, Copilot CLI, Copilot
cloud agent, Copilot code review) and by other agents that adopt the `AGENTS.md`
convention.

Keep this file short. It is loaded on every task, and every line spends context that the
actual request needs.

## What this repository is

A teaching repository. It contains a reference GitHub Copilot customization set under
`.github/`, a theory track under `docs/`, a practice track under `labs/`, and a lookup
reference under `reference/`. There is no application runtime here.

## Rules

- Documentation is the product. Correct a wrong statement immediately; never leave a
  known-wrong claim in place because rewriting is inconvenient.
- Every structural claim about Copilot behaviour must be traceable to an entry in
  `reference/sources.md`. If a behaviour is preview, experimental, or IDE-specific, say so
  in the sentence that states it.
- Examples must be runnable or explicitly labelled as illustrative. A snippet that would
  fail if a reader copied it needs a label, not silence.
- Frontmatter in `.github/**` is machine-read. Never add a property that is not in
  `reference/frontmatter-reference.md`.
- Prose is English, second person, present tense, active voice. No marketing adjectives.
- Code blocks declare a language. Shell examples use POSIX syntax unless a file is
  explicitly labelled PowerShell.
- File and directory names inside `.github/` are part of the contract. Renaming one breaks
  discovery, so treat a rename as a breaking change.

## Verification before you call work done

```bash
npm run check
```

That runs the customization validator and its tests. A change that edits frontmatter and
leaves `npm run check` failing is not done.
