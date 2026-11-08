#!/usr/bin/env node
/**
 * Validate this repository's Copilot customization set.
 *
 * Why this exists: a mistyped frontmatter key, a skill whose directory name does not match
 * its `name`, or a hook entry missing a shell script does not raise an error when Copilot
 * loads it. The customization is simply ignored. Silent ignoring is the failure mode this
 * script turns into a failing exit code.
 *
 * Dependency-free on purpose: it must run on a fresh clone with `node` and nothing else.
 *
 * Usage:
 *   node scripts/validate-customizations.mjs [--root <dir>] [--quiet]
 *
 * Exit codes:
 *   0  no errors (warnings may still have been printed)
 *   1  at least one error
 *   2  the script itself was misused
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------------------
// Frontmatter allow-lists. These mirror reference/frontmatter-reference.md. A property that
// is not listed here is rejected on purpose: unknown keys are either ignored or a parse
// failure, and both are invisible at runtime.
// ---------------------------------------------------------------------------------------

const AGENT_KEYS = new Set([
  "name",
  "description",
  "target",
  "tools",
  "model",
  "disable-model-invocation",
  "user-invocable",
  "infer",
  "mcp-servers",
  "metadata",
  // VS Code and other IDE agent profiles. Ignored by Copilot in the cloud, accepted here.
  "argument-hint",
  "handoffs",
]);

const AGENT_REQUIRED = ["description"];

const PROMPT_KEYS = new Set([
  "name",
  "description",
  "argument-hint",
  "agent",
  "model",
  "tools",
]);

const INSTRUCTION_KEYS = new Set(["applyTo", "excludeAgent", "description"]);
const INSTRUCTION_REQUIRED = ["applyTo"];

const SKILL_KEYS = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "argument-hint",
  "user-invocable",
  "disable-model-invocation",
  "context",
  // Provenance written by `gh skill install`.
  "source",
]);

const SKILL_REQUIRED = ["name", "description"];
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKILL_DESCRIPTION_MAX = 1024;
const SKILL_NAME_MAX = 64;
const AGENT_BODY_MAX = 30000;

const HOOK_EVENTS = new Set([
  "sessionStart",
  "sessionEnd",
  "userPromptSubmitted",
  "preToolUse",
  "postToolUse",
  "postToolUseFailure",
  "agentStop",
  "subagentStop",
  "errorOccurred",
  "permissionRequest",
  "notification",
  "preCompact",
]);

// ---------------------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------------------

const problems = [];

function error(file, line, message) {
  problems.push({ severity: "error", file, line, message });
}

function warn(file, line, message) {
  problems.push({ severity: "warning", file, line, message });
}

// ---------------------------------------------------------------------------------------
// A deliberately small YAML frontmatter reader.
//
// It handles the subset this repository uses: top-level scalars (quoted or bare), block
// sequences, and nested mappings. It does not implement anchors, flow mappings, multi-line
// scalars, or type coercion. Anything outside the subset is reported rather than guessed at,
// because a validator that silently mis-parses is worse than no validator.
// ---------------------------------------------------------------------------------------

function parseFrontmatter(text, file) {
  const lines = text.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return { present: false, keys: new Map(), bodyStart: 0, body: text };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }

  if (end === -1) {
    error(file, 1, "frontmatter opens with '---' but never closes");
    return { present: false, keys: new Map(), bodyStart: 0, body: text };
  }

  const keys = new Map();
  let current = null;

  for (let i = 1; i < end; i += 1) {
    const raw = lines[i];
    const lineNo = i + 1;
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;

    const indented = /^\s/.test(raw);

    if (!indented) {
      const match = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(raw);
      if (!match) {
        error(file, lineNo, `frontmatter line is not a 'key: value' pair: ${JSON.stringify(raw.trim())}`);
        current = null;
        continue;
      }
      const [, key, rest] = match;
      if (keys.has(key)) {
        error(file, lineNo, `duplicate frontmatter key '${key}'`);
      }
      const value = rest.trim();
      current = key;
      keys.set(key, {
        line: lineNo,
        raw: value,
        scalar: value === "" ? null : unquote(value),
        block: value === "",
      });
      continue;
    }

    // Indented content belongs to the previous key. Record that the key has a block, which
    // is all this validator needs to know about sequences and nested mappings.
    if (current === null) {
      error(file, lineNo, "indented frontmatter content with no parent key");
      continue;
    }
    const entry = keys.get(current);
    if (entry) entry.block = true;
  }

  return {
    present: true,
    keys,
    bodyStart: end + 1,
    body: lines.slice(end + 1).join("\n"),
  };
}

function unquote(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function scalarOf(frontmatter, key) {
  const entry = frontmatter.keys.get(key);
  if (!entry) return undefined;
  return entry.scalar ?? undefined;
}

// ---------------------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".copilot-audit"]);

function walk(root, dir = "", out = []) {
  const absolute = join(root, dir);
  let entries;
  try {
    entries = readdirSync(absolute, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const rel = dir ? posix.join(dir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(root, rel, out);
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

function readText(root, rel) {
  return readFileSync(join(root, rel), "utf8");
}

function lineOf(text, needle) {
  const index = text.indexOf(needle);
  if (index === -1) return 1;
  return text.slice(0, index).split(/\r?\n/).length;
}

// ---------------------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------------------

function checkContractPresence(root, files) {
  const required = [
    [".github/copilot-instructions.md", "repository-wide instructions"],
    ["AGENTS.md", "tool-neutral agent instructions"],
    [".github/CODEOWNERS", "review routing for the customization surface"],
  ];

  for (const [path, why] of required) {
    if (!existsSync(join(root, path))) {
      error(path, 1, `missing ${why}`);
    }
  }

  if (!files.some((f) => f.startsWith(".github/agents/"))) {
    warn(".github/agents/", 1, "no custom agents found");
  }
  if (!files.some((f) => f.startsWith(".github/skills/"))) {
    warn(".github/skills/", 1, "no skills found");
  }
}

function checkAgents(root, files) {
  for (const file of files.filter(
    (f) => f.startsWith(".github/agents/") && (f.endsWith(".agent.md") || f.endsWith(".md")),
  )) {
    const text = readText(root, file);
    const fm = parseFrontmatter(text, file);

    if (!fm.present) {
      error(file, 1, "agent profile has no YAML frontmatter");
      continue;
    }

    for (const [key, entry] of fm.keys) {
      if (!AGENT_KEYS.has(key)) {
        error(file, entry.line, `unknown agent property '${key}'`);
      }
    }

    for (const key of AGENT_REQUIRED) {
      if (!fm.keys.has(key)) {
        error(file, 1, `agent profile is missing required property '${key}'`);
      }
    }

    const description = scalarOf(fm, "description");
    if (fm.keys.has("description") && !description) {
      error(file, fm.keys.get("description").line, "'description' must be a non-empty scalar");
    }

    if (fm.body.trim().length === 0) {
      error(file, fm.bodyStart, "agent profile has an empty body");
    }
    if (fm.body.length > AGENT_BODY_MAX) {
      error(
        file,
        fm.bodyStart,
        `agent body is ${fm.body.length} characters, over the ${AGENT_BODY_MAX} limit`,
      );
    }

    const toolsLine = fm.keys.get("tools");
    if (toolsLine && /\bedit\b/.test(toolsLine.raw) && /review|audit/i.test(`${description ?? ""}`)) {
      warn(
        file,
        toolsLine.line,
        "a reviewer or auditor description grants the 'edit' tool; reviewers that can edit eventually do",
      );
    }

    // A file named NAME.agent.md and a NAME.md in the same directory collide at load time,
    // because the extension is stripped before deduplication.
    if (file.endsWith(".agent.md")) {
      const twin = file.replace(/\.agent\.md$/, ".md");
      if (files.includes(twin)) {
        error(file, 1, `both '${file}' and '${twin}' exist, and they deduplicate to the same name`);
      }
    }
  }
}

function checkPrompts(root, files) {
  for (const file of files.filter((f) => f.startsWith(".github/prompts/") && f.endsWith(".prompt.md"))) {
    const text = readText(root, file);
    const fm = parseFrontmatter(text, file);

    if (!fm.present) {
      error(file, 1, "prompt file has no YAML frontmatter");
      continue;
    }

    for (const [key, entry] of fm.keys) {
      if (!PROMPT_KEYS.has(key)) {
        error(file, entry.line, `unknown prompt property '${key}'`);
      }
    }

    const name = scalarOf(fm, "name");
    if (name !== undefined && !SKILL_NAME_RE.test(name)) {
      error(
        file,
        fm.keys.get("name").line,
        `prompt 'name' must be lowercase with hyphens, received ${JSON.stringify(name)}`,
      );
    }

    if (fm.body.trim().length === 0) {
      error(file, fm.bodyStart, "prompt file has an empty body");
    }
  }
}

function checkInstructions(root, files) {
  for (const file of files.filter(
    (f) => f.startsWith(".github/instructions/") && f.endsWith(".instructions.md"),
  )) {
    const text = readText(root, file);
    const fm = parseFrontmatter(text, file);

    if (!fm.present) {
      error(file, 1, "path-specific instruction file has no YAML frontmatter");
      continue;
    }

    for (const [key, entry] of fm.keys) {
      if (!INSTRUCTION_KEYS.has(key)) {
        error(file, entry.line, `unknown instruction property '${key}'`);
      }
    }

    for (const key of INSTRUCTION_REQUIRED) {
      if (!fm.keys.has(key)) {
        error(file, 1, `path-specific instruction file is missing required property '${key}'`);
      }
    }

    const applyTo = scalarOf(fm, "applyTo");
    if (applyTo !== undefined) {
      const patterns = applyTo.split(",").map((p) => p.trim()).filter(Boolean);
      if (patterns.length === 0) {
        error(file, fm.keys.get("applyTo").line, "'applyTo' lists no patterns");
      }
      for (const pattern of patterns) {
        // An unquoted leading '*' is a YAML alias and breaks the whole file.
        const entry = fm.keys.get("applyTo");
        if (entry.raw.startsWith("*") || entry.raw.startsWith("{")) {
          error(file, entry.line, `'applyTo' value must be quoted: ${entry.raw}`);
        }
        if (!/[*/[]/.test(pattern)) {
          // A literal path is legitimate when it names a real file, e.g. `AGENTS.md`.
          const literal = pattern.replace(/^\.\//, "");
          if (!files.includes(literal)) {
            warn(
              file,
              fm.keys.get("applyTo").line,
              `'applyTo' pattern ${JSON.stringify(pattern)} contains no glob and matches no file in the repository`,
            );
          }
        }
      }
    }
  }
}

function checkSkills(root, files) {
  const skillFiles = files.filter((f) => /^\.github\/skills\/[^/]+\/SKILL\.md$/.test(f));

  // A skill directory whose entry point is mis-cased is never discovered, and reports no
  // error. Catch the near-miss spellings rather than skipping them.
  for (const file of files.filter((f) => f.startsWith(".github/skills/") && /\.md$/i.test(f))) {
    const basename = posix.basename(file);
    if (basename.toLowerCase() === "skill.md" && basename !== "SKILL.md") {
      error(file, 1, "skill entry point must be named exactly SKILL.md (case-sensitive)");
    }
  }

  for (const file of skillFiles) {
    const dirName = file.split("/")[2];
    const text = readText(root, file);
    const fm = parseFrontmatter(text, file);

    if (!fm.present) {
      error(file, 1, "SKILL.md has no YAML frontmatter");
      continue;
    }

    for (const [key, entry] of fm.keys) {
      if (!SKILL_KEYS.has(key)) {
        error(file, entry.line, `unknown skill property '${key}'`);
      }
    }

    for (const key of SKILL_REQUIRED) {
      if (!fm.keys.has(key)) {
        error(file, 1, `SKILL.md is missing required property '${key}'`);
      }
    }

    const name = scalarOf(fm, "name");
    if (name !== undefined) {
      const nameLine = fm.keys.get("name").line;
      if (!SKILL_NAME_RE.test(name)) {
        error(
          file,
          nameLine,
          `skill 'name' must be lowercase letters, digits and hyphens, received ${JSON.stringify(name)}`,
        );
      }
      if (name.length > SKILL_NAME_MAX) {
        error(file, nameLine, `skill 'name' is ${name.length} characters, over ${SKILL_NAME_MAX}`);
      }
      if (name !== dirName) {
        error(
          file,
          nameLine,
          `skill 'name' is ${JSON.stringify(name)} but its directory is ${JSON.stringify(dirName)}; a mismatch makes the skill silently fail to load`,
        );
      }
      if (/[/:.]/.test(name)) {
        error(file, nameLine, "skill 'name' must not contain '/', ':' or '.', including namespace prefixes");
      }
    }

    const description = scalarOf(fm, "description");
    if (description !== undefined) {
      const descLine = fm.keys.get("description").line;
      if (description.length > SKILL_DESCRIPTION_MAX) {
        error(
          file,
          descLine,
          `skill 'description' is ${description.length} characters, over ${SKILL_DESCRIPTION_MAX}`,
        );
      }
      if (!/\buse when\b|\buse this\b|\buse before\b|\buse for\b/i.test(description)) {
        warn(
          file,
          descLine,
          "skill 'description' does not say when to use it; automatic selection matches on that string",
        );
      }
    }

    const context = scalarOf(fm, "context");
    if (context !== undefined && !["inline", "fork"].includes(context)) {
      error(file, fm.keys.get("context").line, `'context' must be 'inline' or 'fork', received ${JSON.stringify(context)}`);
    }

    const allowedTools = fm.keys.get("allowed-tools");
    if (allowedTools && /\b(shell|bash|execute)\b/i.test(allowedTools.raw)) {
      warn(
        file,
        allowedTools.line,
        "'allowed-tools' pre-approves shell execution, which removes the confirmation step for every command the skill runs",
      );
    }

    if (fm.body.trim().length === 0) {
      error(file, fm.bodyStart, "SKILL.md has an empty body");
    }
  }
}

function checkHooks(root, files) {
  for (const file of files.filter((f) => f.startsWith(".github/hooks/") && f.endsWith(".json"))) {
    let parsed;
    try {
      parsed = JSON.parse(readText(root, file));
    } catch (cause) {
      error(file, 1, `hook configuration is not valid JSON: ${cause.message}`);
      continue;
    }

    if (parsed.version !== 1) {
      error(file, lineOf(readText(root, file), '"version"'), `hook configuration 'version' must be 1, received ${JSON.stringify(parsed.version)}`);
    }

    if (typeof parsed.hooks !== "object" || parsed.hooks === null || Array.isArray(parsed.hooks)) {
      error(file, lineOf(readText(root, file), '"hooks"'), "hook configuration needs a 'hooks' object");
      continue;
    }

    for (const [event, entries] of Object.entries(parsed.hooks)) {
      if (!HOOK_EVENTS.has(event)) {
        warn(file, lineOf(readText(root, file), `"${event}"`), `unknown hook event '${event}'; it will never fire`);
        continue;
      }
      if (!Array.isArray(entries)) {
        error(file, lineOf(readText(root, file), `"${event}"`), `hook event '${event}' must be an array`);
        continue;
      }

      for (const [index, entry] of entries.entries()) {
        const where = lineOf(readText(root, file), `"${event}"`);
        if (entry.type !== "command") {
          error(file, where, `hook ${event}[${index}] must have type "command"`);
        }
        if (!entry.bash && !entry.powershell) {
          error(file, where, `hook ${event}[${index}] declares neither 'bash' nor 'powershell'`);
        }
        if (entry.timeoutSec !== undefined) {
          if (typeof entry.timeoutSec !== "number" || entry.timeoutSec <= 0 || entry.timeoutSec > 600) {
            error(file, where, `hook ${event}[${index}] has an invalid 'timeoutSec'`);
          }
          if (entry.timeoutSec > 10) {
            warn(
              file,
              where,
              `hook ${event}[${index}] allows ${entry.timeoutSec}s; hooks block the agent, and a timeout on preToolUse fails open`,
            );
          }
        } else if (event === "preToolUse") {
          warn(
            file,
            where,
            `hook ${event}[${index}] sets no 'timeoutSec'; the default is 30s and a preToolUse timeout silently lets the call through`,
          );
        }

        // Referenced scripts must exist. A missing script makes preToolUse fail closed and
        // deny every matching tool call, which looks like a broken agent rather than a
        // broken hook.
        for (const key of ["bash", "powershell"]) {
          const value = entry[key];
          if (typeof value !== "string") continue;
          const scriptPath = value.trim().split(/\s+/)[0];
          if (!scriptPath || !scriptPath.includes("/")) continue;
          const resolved = posix.normalize(scriptPath.replace(/^\.\//, ""));
          const base = entry.cwd ? posix.join(entry.cwd, resolved) : resolved;
          if (!files.includes(base)) {
            error(file, where, `hook ${event}[${index}] references a script that does not exist: ${base}`);
          }
        }
      }
    }
  }
}

function checkJsonFiles(root, files) {
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    try {
      JSON.parse(readText(root, file));
    } catch (cause) {
      error(file, 1, `invalid JSON: ${cause.message}`);
    }
  }
}

function checkYamlFiles(root, files) {
  // No YAML library is available without adding a dependency, so verify only the failure
  // modes that are cheap to detect and expensive to debug.
  for (const file of files.filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))) {
    const text = readText(root, file);
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (/^\s*\t/.test(line)) {
        error(file, index + 1, "tab character in YAML indentation");
      }
    }
    if (text.trim().length === 0) {
      error(file, 1, "YAML file is empty");
    }
  }
}

function githubSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

function collectAnchors(text) {
  const anchors = new Set();
  const seen = new Map();
  let inFence = false;

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^#{1,6}\s+(.*)$/.exec(line);
    if (!match) continue;
    const base = githubSlug(match[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function checkLinks(root, files) {
  const markdown = files.filter((f) => f.endsWith(".md"));
  const anchorsCache = new Map();

  for (const file of markdown) {
    const text = readText(root, file);
    const fromDir = posix.dirname(file);

    for (const match of text.matchAll(LINK_RE)) {
      const rawTarget = match[1];
      if (EXTERNAL.test(rawTarget) || rawTarget.startsWith("mailto:")) continue;

      const [target, fragment] = rawTarget.split("#");
      const line = lineOf(text, match[0]);

      // A link inside a fenced block is an example, not a link. Verified by checking how
      // many fences open before this offset; an odd count means we are inside one.
      const offset = text.indexOf(match[0]);
      const fencesBefore = (text.slice(0, offset).match(/^\s*(```+|~~~+)/gm) ?? []).length;
      if (fencesBefore % 2 === 1) continue;

      if (target === "") {
        // Same-file anchor.
        if (fragment) {
          const anchors = collectAnchors(text);
          if (!anchors.has(fragment.toLowerCase())) {
            warn(file, line, `anchor '#${fragment}' does not match a heading in this file`);
          }
        }
        continue;
      }

      const resolved = posix
        .normalize(posix.join(fromDir === "." ? "" : fromDir, target))
        .replace(/^\.\//, "")
        .replace(/\/+$/, "");
      const normalised = resolved.startsWith("..") || resolved === "" ? null : resolved;

      if (normalised === null || !files.includes(normalised)) {
        // A link to a directory is legitimate: GitHub renders the folder listing. Accept it
        // when the resolved path is a prefix of at least one tracked file.
        const isDirectory = normalised !== null && files.some((f) => f.startsWith(`${normalised}/`));
        if (!isDirectory) {
          error(file, line, `relative link does not resolve: ${rawTarget}`);
        }
        continue;
      }

      if (fragment && normalised.endsWith(".md")) {
        if (!anchorsCache.has(normalised)) {
          anchorsCache.set(normalised, collectAnchors(readText(root, normalised)));
        }
        if (!anchorsCache.get(normalised).has(fragment.toLowerCase())) {
          warn(file, line, `anchor '#${fragment}' does not match a heading in ${normalised}`);
        }
      }
    }
  }
}

function checkCodeFences(root, files) {
  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const text = readText(root, file);
    let open = null;
    let openLine = 0;
    let count = 0;

    for (const [index, line] of text.split(/\r?\n/).entries()) {
      const match = /^\s*(```+|~~~+)(.*)$/.exec(line);
      if (!match) continue;
      count += 1;
      if (open === null) {
        open = match[1][0].repeat(match[1].length);
        openLine = index + 1;
        if (match[2].trim() === "") {
          warn(file, index + 1, "code fence declares no language");
        }
      } else if (match[1][0] === open[0] && match[1].length >= open.length) {
        open = null;
      }
    }

    if (open !== null) {
      error(file, openLine, "code fence is never closed");
    }
  }
}

// ---------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------

function main(argv) {
  let root = HERE ? join(HERE, "..") : process.cwd();
  let quiet = false;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") {
      root = argv[++i];
    } else if (argv[i] === "--quiet") {
      quiet = true;
    } else {
      process.stderr.write(`validate-customizations: unknown argument ${JSON.stringify(argv[i])}\n`);
      process.exit(2);
    }
  }

  if (!root || !existsSync(root)) {
    process.stderr.write(`validate-customizations: root does not exist: ${root}\n`);
    process.exit(2);
  }

  if (!statSync(root).isDirectory()) {
    process.stderr.write(`validate-customizations: root is not a directory: ${root}\n`);
    process.exit(2);
  }

  const files = walk(root).map((f) => f.split(sep).join("/"));

  checkContractPresence(root, files);
  checkAgents(root, files);
  checkPrompts(root, files);
  checkInstructions(root, files);
  checkSkills(root, files);
  checkHooks(root, files);
  checkJsonFiles(root, files);
  checkYamlFiles(root, files);
  checkLinks(root, files);
  checkCodeFences(root, files);

  problems.sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file),
  );

  const errors = problems.filter((p) => p.severity === "error");
  const warnings = problems.filter((p) => p.severity === "warning");

  if (!quiet) {
    for (const problem of problems) {
      process.stdout.write(`${problem.file}:${problem.line}: ${problem.severity}: ${problem.message}\n`);
    }
  }

  process.stdout.write(
    `\n${errors.length} error(s), ${warnings.length} warning(s), ${files.length} file(s) inspected\n`,
  );

  process.exit(errors.length > 0 ? 1 : 0);
}

main(process.argv.slice(2));
