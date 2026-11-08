---
name: dependency-audit
description: Audits declared dependencies for abandoned packages, duplicate capabilities and version drift, producing a prioritised report. Use before a release, or when asked to review the dependency surface.
license: MIT
allowed-tools: shell
argument-hint: [manifest path, or empty for the whole repository]
---

# Dependency audit

A dependency audit answers three questions, in this order:

1. What do we depend on that nothing uses?
2. What do we depend on that is no longer maintained?
3. What do we depend on twice, for the same capability?

A vulnerability scan is a different job and does not replace this one. If the user asked
for CVEs, say so and point them at their scanner.

## Process

1. Find manifests: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`,
   `pom.xml`. Audit only the manifests in the path the user named, or the whole repository
   if none was named.
2. Run the inventory script from this skill's directory:

   ```bash
   ./scripts/inventory.sh <path-to-repo-root>
   ```

   It prints every declared dependency with its declared range, grouped by manifest. It
   makes no network calls and changes no files.
3. For each dependency, gather evidence. Do not guess maintenance status from the name:
   - Last release date and the age of the most recent commit, from the registry or the
     project's own repository.
   - Whether a declared major version is behind the current major.
   - Whether the package declares itself deprecated or archived.
4. Find duplicates by capability, not by name. Two HTTP clients, two date libraries and two
   test runners is three findings even if the packages differ.
5. Find unused dependencies: a declared dependency with no import anywhere in the source
   tree. Say "no import found in the paths I searched" rather than "unused", because a
   build script or a transitive re-export may use it.

## Report format

Group by action, not by manifest:

- **Remove** — nothing imports it, or a duplicate already covers the capability.
- **Upgrade** — maintained but behind by a major.
- **Replace** — unmaintained, with a named successor and its cost.
- **Watch** — maintained today, single maintainer, no release in twelve months.

Each line: the package, the version in use, the evidence, and the action. Evidence, not
adjectives: "last release 2023-04, 41 open issues, no commits since" is a finding;
"seems stale" is not.

## Boundaries

- Never edit a manifest or a lockfile as part of the audit. The report is the deliverable.
- Never run an install command. It mutates the workspace and the audit is read-only.
- If you cannot reach a registry to check release dates, say so and mark those rows
  **unverified** rather than inferring from the version number.
