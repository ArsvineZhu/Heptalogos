import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePackageDocumentation } from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function workflowDispatchInputs(workflow) {
  const lines = workflow.split(/\r?\n/u);
  const dispatchIndex = lines.findIndex((line) =>
    /^ {2}workflow_dispatch:\s*$/u.test(line),
  );
  if (dispatchIndex < 0) return "";
  const inputsIndex = lines.findIndex(
    (line, index) => index > dispatchIndex && /^ {4}inputs:\s*$/u.test(line),
  );
  if (inputsIndex < 0) return "";

  const block = [];
  for (const line of lines.slice(inputsIndex + 1)) {
    if (line.length > 0 && !/^\s/u.test(line)) break;
    block.push(line);
  }
  return block.join("\n");
}

function workflowOnDirectKeys(workflow) {
  const lines = workflow.split(/\r?\n/u);
  const onIndex = lines.findIndex((line) => /^on:\s*(?:#.*)?$/u.test(line));
  if (onIndex < 0) return [];

  const keys = [];
  for (const line of lines.slice(onIndex + 1)) {
    if (line.length > 0 && !/^\s/u.test(line)) break;
    const match = line.match(/^ {2}([A-Za-z0-9_-]+):(?:\s.*)?$/u);
    if (match !== null) keys.push(match[1]);
  }
  return keys;
}

export function validateVerifyWorkflow(workflow) {
  const errors = [];
  const fail = (message) => errors.push(message);

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

  const onDirectKeys = new Set(workflowOnDirectKeys(workflow));
  for (const trigger of forbiddenTriggers) {
    if (onDirectKeys.has(trigger)) {
      fail(`verify workflow must not auto-trigger via ${trigger}`);
    }
  }

  for (const input of ["pr_number:", "reason:"]) {
    if (!workflow.includes(input)) {
      fail(`verify workflow missing manual input: ${input}`);
    }
  }
  const inputsBlock = workflowDispatchInputs(workflow);
  for (const input of ["base_sha", "target_sha"]) {
    if (new RegExp(`^ {6}${input}:`, "mu").test(inputsBlock)) {
      fail(`verify workflow must not expose revision input: ${input}:`);
    }
  }

  if (!/^\s+DISPATCHED_SHA:\s*\$\{\{\s*github\.sha\s*\}\}\s*$/mu.test(workflow)) {
    fail("verify workflow must bind the candidate to github.sha at dispatch");
  }
  if (!workflow.includes("process.env.DISPATCHED_SHA")) {
    fail("verify workflow must validate the dispatch-bound candidate revision");
  }

  const usesLines = [...workflow.matchAll(/^\s*-\s+uses:\s+([^@\s]+)@([^\s]+)\s*$/gmu)];
  for (const [, action, ref] of usesLines) {
    if (!/^[0-9a-f]{40}$/u.test(ref)) {
      fail(`GitHub Action must be pinned to a full commit SHA: ${action}@${ref}`);
    }
  }

  return errors;
}

function main() {
  const errors = [];
  const fail = (message) => errors.push(message);

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
    if (!existsSync(join(root, file)))
      fail(`required repository file missing: ${file}`);
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

  for (const error of validatePackageDocumentation({ root }).errors) fail(error);

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
    for (const error of validateVerifyWorkflow(
      readFileSync(verifyWorkflowPath, "utf8"),
    )) {
      fail(error);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL ${error}`);
    process.exitCode = 1;
  } else {
    console.log("PASS repository correctness");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
