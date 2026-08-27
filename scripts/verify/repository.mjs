import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverProductPackages,
  findRepositoryFiles,
  parseYaml,
  validateMachineAuthorityConsumers,
  validatePackageDocumentation,
  validatePackageIndex,
  validateRootPackageIdentity,
  validateRootTopology,
} from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export async function findSourceTestFiles({ root, productPackages } = {}) {
  const packages = productPackages ?? (await discoverProductPackages({ root }));
  if (packages.length === 0) return [];
  return findRepositoryFiles({
    root: join(resolve(root), "packages"),
    patterns: packages.map(
      ({ directoryName }) => `${directoryName}/src/**/*.test.{ts,tsx}`,
    ),
  });
}

function workflowUses(workflow) {
  const uses = [];
  for (const job of Object.values(workflow?.jobs ?? {})) {
    if (!job || typeof job !== "object" || !Array.isArray(job.steps)) continue;
    for (const step of job.steps) {
      if (step && typeof step === "object" && typeof step.uses === "string") {
        uses.push(step.uses);
      }
    }
  }
  return uses;
}

function normalizeGitHubExpressionsForYaml(workflow) {
  return workflow.replace(
    /(:\s*)\$\{\{[^}\r\n]*\}\}(?=\s*(?:#.*)?$)/gmu,
    '$1"__github_expression__"',
  );
}

export function validateVerifyWorkflow(workflow) {
  const errors = [];
  const fail = (message) => errors.push(message);

  let document;
  try {
    document = parseYaml(
      normalizeGitHubExpressionsForYaml(workflow),
      "verify workflow",
    );
  } catch (error) {
    fail(`verify workflow YAML is invalid: ${error.message}`);
    return errors;
  }

  const workflowOn = document?.on;
  if (!workflowOn || typeof workflowOn !== "object" || Array.isArray(workflowOn)) {
    fail("verify workflow must expose workflow_dispatch");
  }
  const onDirectKeys = new Set(Object.keys(workflowOn ?? {}));
  if (!onDirectKeys.has("workflow_dispatch")) {
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
    if (onDirectKeys.has(trigger)) {
      fail(`verify workflow must not auto-trigger via ${trigger}`);
    }
  }

  const inputs = workflowOn?.workflow_dispatch?.inputs;
  for (const input of ["pr_number", "reason"]) {
    if (!inputs || typeof inputs !== "object" || !Object.hasOwn(inputs, input)) {
      fail(`verify workflow missing manual input: ${input}:`);
    }
  }
  for (const input of ["base_sha", "target_sha"]) {
    if (inputs && typeof inputs === "object" && Object.hasOwn(inputs, input)) {
      fail(`verify workflow must not expose revision input: ${input}:`);
    }
  }

  if (!/^\s+DISPATCHED_SHA:\s*\$\{\{\s*github\.sha\s*\}\}\s*$/mu.test(workflow)) {
    fail("verify workflow must bind the candidate to github.sha at dispatch");
  }
  if (!workflow.includes("process.env.DISPATCHED_SHA")) {
    fail("verify workflow must validate the dispatch-bound candidate revision");
  }

  for (const use of workflowUses(document)) {
    const separator = use.lastIndexOf("@");
    const action = separator > 0 ? use.slice(0, separator) : use;
    const ref = separator > 0 ? use.slice(separator + 1) : "";
    if (!/^[0-9a-f]{40}$/u.test(ref)) {
      fail(`GitHub Action must be pinned to a full commit SHA: ${action}@${ref}`);
    }
  }

  return errors;
}

async function main() {
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

  for (const error of validateRootPackageIdentity({ root })) fail(error);

  const forbiddenLockfiles = new Set([
    "package-lock.json",
    "yarn.lock",
    "npm-shrinkwrap.json",
    "bun.lock",
    "bun.lockb",
  ]);

  for (const path of await findRepositoryFiles({
    root,
    patterns: [...forbiddenLockfiles].map((name) => `**/${name}`),
    ignore: [
      ".git/**",
      ".nx/**",
      ".pnpm-store/**",
      ".vite/**",
      ".cache/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "tmp/**",
    ],
  })) {
    fail(`forbidden second package-resolution file: ${path}`);
  }

  for (const path of await findSourceTestFiles({ root })) {
    fail(`package test must live under a package test plane, not src: ${path}`);
  }

  for (const error of (await validatePackageDocumentation({ root })).errors)
    fail(error);
  try {
    const packageIndex = join(root, "packages", "INDEX.md");
    if (existsSync(packageIndex)) {
      for (const error of await validatePackageIndex({
        root,
        text: readFileSync(packageIndex, "utf8"),
      })) {
        fail(error);
      }
    }
  } catch (error) {
    fail(`package index validation failed: ${error.message}`);
  }
  for (const error of validateRootTopology({ root })) fail(error);
  for (const error of validateMachineAuthorityConsumers({ root })) fail(error);

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
  main().catch((error) => {
    console.error(`FAIL repository verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}
