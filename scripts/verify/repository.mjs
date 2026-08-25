import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const errors = [];

function fail(message) {
  errors.push(message);
}

function normalizePath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

try {
  const top = resolve(
    execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );
  if (top !== root) fail(`git top-level is not current repository: ${top}`);
} catch (error) {
  fail(`git repository check failed: ${error.message}`);
}

for (const file of ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"]) {
  if (!existsSync(join(root, file))) fail(`required repository file missing: ${file}`);
}

const ignoredDirectories = new Set([
  ".git",
  ".nx",
  ".pnpm-store",
  ".vite",
  ".cache",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
  "tmp",
]);
const forbiddenLockfiles = new Set([
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "bun.lock",
  "bun.lockb",
]);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(path);
    } else if (forbiddenLockfiles.has(entry.name)) {
      fail(`forbidden second package-resolution file: ${path}`);
    }
  }
}
walk(root);

function wordCount(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function requireHeadings(file, headings, label) {
  if (!existsSync(file)) return;
  const source = readFileSync(file, "utf8");
  for (const heading of headings) {
    if (
      !new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "mu").test(
        source,
      )
    ) {
      fail(`${label}: missing heading "${heading}"`);
    }
  }
}

for (const workspaceRootName of ["packages", "tools"]) {
  const workspaceRoot = join(root, workspaceRootName);
  if (!existsSync(workspaceRoot)) continue;
  for (const entry of readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(workspaceRoot, entry.name);
    if (!existsSync(join(directory, "package.json"))) continue;

    const readme = join(directory, "README.md");
    const agents = join(directory, "AGENTS.md");
    if (!existsSync(readme)) fail(`${normalizePath(directory)}: README.md is missing`);
    if (!existsSync(agents)) fail(`${normalizePath(directory)}: AGENTS.md is missing`);

    requireHeadings(
      readme,
      [
        "Purpose",
        "Owns",
        "Does not own",
        "Public surface",
        "Dependencies and boundaries",
        "Verification",
        "Architecture references",
      ],
      `${normalizePath(readme)}`,
    );
    requireHeadings(
      agents,
      ["Scope", "Read first", "Local rules", "Verification", "Stop"],
      `${normalizePath(agents)}`,
    );
    if (existsSync(agents) && wordCount(readFileSync(agents, "utf8")) > 300) {
      fail(`${normalizePath(agents)}: AGENTS.md exceeds 300 words`);
    }
  }
}

const implementationFiles = ["package.json", "pnpm-workspace.yaml"];
for (const relativePath of implementationFiles) {
  const source = readFileSync(join(root, relativePath), "utf8");
  for (const reference of ["Heptalogos_Archived", "Heptalogos_Architecture_Corpus"]) {
    if (source.includes(reference))
      fail(`${relativePath}: forbidden donor reference ${reference}`);
  }
}

const verifyWorkflowPath = join(root, ".github", "workflows", "verify.yml");

if (!existsSync(verifyWorkflowPath)) {
  fail("manual verify workflow missing: .github/workflows/verify.yml");
} else {
  const workflow = readFileSync(verifyWorkflowPath, "utf8");

  if (!/^\s{2}workflow_dispatch:\s*$/mu.test(workflow)) {
    fail("verify workflow must expose workflow_dispatch");
  }

  const forbiddenTriggers = [
    "push",
    "pull_request",
    "pull_request_target",
    "schedule",
    "repository_dispatch",
    "merge_group",
    "workflow_call",
  ];

  for (const trigger of forbiddenTriggers) {
    const pattern = new RegExp(`^\\s{2}${trigger}:`, "mu");
    if (pattern.test(workflow)) {
      fail(`verify workflow must not auto-trigger via ${trigger}`);
    }
  }

  for (const input of ["pr_number:", "reason:"]) {
    if (!workflow.includes(input)) {
      fail(`verify workflow missing manual input: ${input}`);
    }
  }
  for (const input of ["base_sha:", "target_sha:"]) {
    if (workflow.includes(input)) {
      fail(`verify workflow must not expose revision input: ${input}`);
    }
  }

  const usesLines = [...workflow.matchAll(/^\s*-\s+uses:\s+([^@\s]+)@([^\s]+)\s*$/gmu)];
  for (const [, action, ref] of usesLines) {
    if (!/^[0-9a-f]{40}$/u.test(ref)) {
      fail(`GitHub Action must be pinned to a full commit SHA: ${action}@${ref}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log("PASS repository correctness");
}
