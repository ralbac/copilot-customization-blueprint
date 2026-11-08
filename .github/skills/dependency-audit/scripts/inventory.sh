#!/usr/bin/env bash
# Print every declared dependency grouped by manifest.
#
# Read-only: this script reads manifests and writes to stdout. It performs no network
# access and modifies no file. Keep it that way: a skill that mutates the workspace
# cannot be safely run just to look.
set -euo pipefail

root="${1:-.}"

if [ ! -d "$root" ]; then
  printf 'inventory: not a directory: %s\n' "$root" >&2
  exit 2
fi

found=0

report() {
  found=$((found + 1))
  printf '\n## %s\n\n' "$1"
}

walk() {
  # Skip vendor and build output; a dependency inside node_modules is not a declared one.
  find "$root" \
    -type d \( -name node_modules -o -name .git -o -name vendor -o -name dist -o -name build \) -prune \
    -o -type f -name "$1" -print
}

# --- npm ---------------------------------------------------------------------------
while IFS= read -r manifest; do
  [ -n "$manifest" ] || continue
  report "$manifest"
  node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const deps = p[field] || {};
      for (const [name, range] of Object.entries(deps).sort()) {
        console.log(`${name}\t${range}\t${field}`);
      }
    }
  ' "$manifest" || printf '(could not parse %s)\n' "$manifest"
done < <(walk package.json)

# --- Python ------------------------------------------------------------------------
while IFS= read -r manifest; do
  [ -n "$manifest" ] || continue
  report "$manifest"
  grep -E '^[A-Za-z0-9_.\-]+' "$manifest" | grep -vE '^\s*(#|\[)' || printf '(no dependency lines found)\n'
done < <(walk pyproject.toml)

# --- Go ----------------------------------------------------------------------------
while IFS= read -r manifest; do
  [ -n "$manifest" ] || continue
  report "$manifest"
  grep -E '^\s+[a-z0-9.\-]+\.[a-z]+/' "$manifest" || printf '(no dependency lines found)\n'
done < <(walk go.mod)

# --- Rust --------------------------------------------------------------------------
while IFS= read -r manifest; do
  [ -n "$manifest" ] || continue
  report "$manifest"
  sed -n '/^\[.*dependencies\]/,/^\[/p' "$manifest" | grep -E '=' || printf '(no dependency lines found)\n'
done < <(walk Cargo.toml)

if [ "$found" -eq 0 ]; then
  printf 'inventory: no manifests found under %s\n' "$root" >&2
  exit 1
fi

printf '\nTotal manifests: %s\n' "$found"
