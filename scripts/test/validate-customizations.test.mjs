/**
 * Tests for scripts/validate-customizations.mjs
 *
 * Each test builds a throwaway repository in the OS temp directory, runs the validator
 * against it with --root, and asserts on the exit code and the reported message. Nothing
 * here touches this repository's own files, and the validator never writes.
 *
 * Every rule in the validator has at least one failing case below. A rule without a failing
 * case is a rule nobody has proven fires.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VALIDATOR = join(HERE, "..", "validate-customizations.mjs");

/** Files every fixture needs so that the "contract presence" rule stays quiet. */
const BASE = {
  "AGENTS.md": "# AGENTS\n\nProject instructions.\n",
  "REVIEW.md": "# Review\n\nReview instructions.\n",
  ".github/copilot-instructions.md": "# Copilot\n\nRepository instructions.\n",
  ".github/CODEOWNERS": "* @org/maintainers\n",
};

function fixture(extra) {
  const root = mkdtempSync(join(tmpdir(), "copilot-validate-"));
  const files = { ...BASE, ...extra };

  for (const [rel, content] of Object.entries(files)) {
    const absolute = join(root, rel);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }

  return root;
}

function run(root, args = []) {
  const result = spawnSync(process.execPath, [VALIDATOR, "--root", root, ...args], {
    encoding: "utf8",
  });
  return {
    code: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Recursively hash a directory so a test can prove the validator wrote nothing. */
function fingerprint(root) {
  const hash = createHash("sha256");

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) {
        hash.update(`d:${absolute}\n`);
        walk(absolute);
      } else {
        hash.update(`f:${absolute}:`);
        hash.update(readFileSync(absolute));
        hash.update("\n");
      }
    }
  }

  walk(root);
  return hash.digest("hex");
}

const GOOD_AGENT = `---
description: Reviews changes without editing them.
tools: ["read", "search"]
---

Review the change and report findings.
`;

const GOOD_SKILL = `---
name: sample-skill
description: Does a sample thing. Use when the sample needs doing.
---

# Sample

Do the thing.
`;

describe("validator: acceptance", () => {
  test("a well-formed set passes with exit 0", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": GOOD_AGENT,
      ".github/skills/sample-skill/SKILL.md": GOOD_SKILL,
      ".github/prompts/do-thing.prompt.md": `---
name: do-thing
description: Does the thing.
argument-hint: [target]
---

Do the thing described above.
`,
      ".github/instructions/ts.instructions.md": `---
applyTo: "**/*.ts"
---

TypeScript rules.
`,
      ".github/hooks/guardrails.json": JSON.stringify(
        {
          version: 1,
          hooks: {
            preToolUse: [
              { type: "command", bash: "./.github/hooks/scripts/a.sh", timeoutSec: 5 },
            ],
          },
        },
        null,
        2,
      ),
      ".github/hooks/scripts/a.sh": "#!/usr/bin/env bash\nexit 0\n",
    });

    const { code, stdout } = run(root);

    assert.equal(code, 0, `expected exit 0, got ${code}\n${stdout}`);
    assert.match(stdout, /0 error\(s\)/);
  });

  test("a relative link that resolves passes", () => {
    const root = fixture({
      "docs/one.md": "# One\n\nSee [two](../docs/two.md).\n",
      "docs/two.md": "# Two\n\nContent.\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, stdout);
  });

  test("a link inside a fenced block is an example, not a link", () => {
    const root = fixture({
      "docs/one.md": [
        "# One",
        "",
        "Copy this into CHANGELOG.md:",
        "",
        "```markdown",
        "- Fix a thing ([#142](../../issues/142))",
        "```",
        "",
      ].join("\n"),
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, `a fenced link must not be checked\n${stdout}`);
  });
});

describe("validator: skills", () => {
  test("a name that does not match the directory fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: other-name
description: Does a thing. Use when the thing needs doing.
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /silently fail to load/);
  });

  test("a missing description fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: sample-skill
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /missing required property 'description'/);
  });

  test("an unknown property fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: sample-skill
description: Does a thing. Use when needed.
namespace: org
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /unknown skill property 'namespace'/);
  });

  test("a description over 1024 characters fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: sample-skill
description: ${"x".repeat(1030)}. Use when needed.
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /over the? ?1024|over 1024/);
  });

  test("a mis-cased entry point fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/Skill.md": `---
name: sample-skill
description: Does a thing. Use when needed.
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /must be named exactly SKILL\.md/);
  });

  test("an invalid context value fails", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: sample-skill
description: Does a thing. Use when needed.
context: subprocess
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /'context' must be 'inline' or 'fork'/);
  });

  test("a missing 'when to use' clause warns without failing", () => {
    const root = fixture({
      ".github/skills/sample-skill/SKILL.md": `---
name: sample-skill
description: A skill about samples.
---

Body.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /does not say when to use it/);
  });
});

describe("validator: agents", () => {
  test("a missing description fails", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": `---
name: reviewer
---

Review.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /missing required property 'description'/);
  });

  test("an unknown property fails", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": `---
description: Reviews.
temperature: 0.2
---

Review.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /unknown agent property 'temperature'/);
  });

  test("mirrored NAME.md and NAME.agent.md fail as a deduplication clash", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": GOOD_AGENT,
      ".github/agents/reviewer.md": GOOD_AGENT,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /deduplicate to the same name/);
  });

  test("no frontmatter fails", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": "Review the change.\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /no YAML frontmatter/);
  });
});

describe("validator: instructions and prompts", () => {
  test("an instruction file without applyTo fails", () => {
    const root = fixture({
      ".github/instructions/ts.instructions.md": `---
description: TypeScript rules.
---

Rules.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /missing required property 'applyTo'/);
  });

  test("an unquoted leading glob in applyTo fails", () => {
    const root = fixture({
      ".github/instructions/ts.instructions.md": `---
applyTo: **/*.ts
---

Rules.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /must be quoted/);
  });

  test("a prompt with an unknown property fails", () => {
    const root = fixture({
      ".github/prompts/do.prompt.md": `---
name: do
description: Does.
mode: agent
---

Do.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /unknown prompt property 'mode'/);
  });
});

describe("validator: hooks", () => {
  test("a reference to a missing script fails", () => {
    const root = fixture({
      ".github/hooks/guardrails.json": JSON.stringify({
        version: 1,
        hooks: {
          preToolUse: [{ type: "command", bash: "./.github/hooks/scripts/absent.sh", timeoutSec: 5 }],
        },
      }),
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /references a script that does not exist/);
  });

  test("a wrong version fails", () => {
    const root = fixture({
      ".github/hooks/guardrails.json": JSON.stringify({ version: 2, hooks: {} }),
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /'version' must be 1/);
  });

  test("an entry with no shell fails", () => {
    const root = fixture({
      ".github/hooks/guardrails.json": JSON.stringify({
        version: 1,
        hooks: { sessionStart: [{ type: "command", timeoutSec: 2 }] },
      }),
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /neither 'bash' nor 'powershell'/);
  });

  test("an unknown event warns without failing", () => {
    const root = fixture({
      ".github/hooks/guardrails.json": JSON.stringify({
        version: 1,
        hooks: { beforeEverything: [{ type: "command", bash: "echo hi", timeoutSec: 2 }] },
      }),
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /unknown hook event 'beforeEverything'/);
  });

  test("invalid JSON fails", () => {
    const root = fixture({
      ".github/hooks/guardrails.json": "{ this is not json }",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /not valid JSON/);
  });
});

describe("validator: markdown", () => {
  test("a link to an existing directory resolves, with or without a trailing slash", () => {
    const root = fixture({
      "docs/one.md": "# One\n\nSee [a](../.github/instructions) and [b](../.github/instructions/).\n",
      ".github/instructions/ts.instructions.md": `---
applyTo: "**/*.ts"
---

Rules.
`,
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, `a directory link must resolve\n${stdout}`);
  });

  test("a link to a directory that does not exist fails", () => {
    const root = fixture({
      "docs/one.md": "# One\n\nSee [gone](../missing/).\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /relative link does not resolve: \.\.\/missing\//);
  });

  test("a broken relative link fails", () => {
    const root = fixture({
      "docs/one.md": "# One\n\nSee [gone](./two.md).\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /relative link does not resolve: \.\/two\.md/);
  });

  test("an unclosed code fence fails", () => {
    const root = fixture({
      "docs/one.md": "# One\n\n```ts\nconst a = 1;\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /code fence is never closed/);
  });

  test("a code fence with no language warns without failing", () => {
    const root = fixture({
      "docs/one.md": "# One\n\n```\nplain\n```\n",
    });

    const { code, stdout } = run(root);
    assert.equal(code, 0, stdout);
    assert.match(stdout, /declares no language/);
  });
});

describe("validator: contract presence and process behaviour", () => {
  test("a missing repository-wide instructions file fails", () => {
    const root = mkdtempSync(join(tmpdir(), "copilot-validate-"));
    writeFileSync(join(root, "AGENTS.md"), "# AGENTS\n", "utf8");
    mkdirSync(join(root, ".github"), { recursive: true });
    writeFileSync(join(root, ".github", "CODEOWNERS"), "* @org/x\n", "utf8");

    const { code, stdout } = run(root);
    assert.equal(code, 1);
    assert.match(stdout, /missing repository-wide instructions/);
  });

  test("the validator writes nothing", () => {
    const root = fixture({
      ".github/agents/reviewer.agent.md": GOOD_AGENT,
      ".github/skills/sample-skill/SKILL.md": GOOD_SKILL,
      ".github/hooks/guardrails.json": JSON.stringify({
        version: 1,
        hooks: { preToolUse: [{ type: "command", bash: "./.github/hooks/scripts/a.sh" }] },
      }),
      ".github/hooks/scripts/a.sh": "exit 0\n",
    });

    const before = fingerprint(root);
    run(root);
    const after = fingerprint(root);

    assert.equal(after, before, "the validator must not modify the tree it inspects");
  });

  test("a missing root exits 2 rather than reporting a clean repository", () => {
    const { code, stderr } = run(join(tmpdir(), "copilot-validate-does-not-exist-xyz"));
    assert.equal(code, 2);
    assert.match(stderr, /root does not exist/);
  });

  test("an unknown argument exits 2", () => {
    const root = fixture({});
    const { code, stderr } = run(root, ["--frobnicate"]);
    assert.equal(code, 2);
    assert.match(stderr, /unknown argument/);
  });
});
