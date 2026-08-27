import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  findSourceTestFiles,
  validateVerifyWorkflow,
} from "../../../scripts/verify/repository.mjs";
import {
  validateMachineAuthorityConsumers,
  validateRootTopology,
} from "../src/repository-governance.mjs";

const workflowPrefix = [
  "name: verify-manual",
  "",
  "on:",
  "  workflow_dispatch:",
  "    inputs:",
  "      pr_number:",
  "        required: true",
  "      reason:",
  "        required: true",
  "",
  "permissions:",
  "  contents: read",
  "",
  "DISPATCHED_SHA: $" + "{{ github.sha }}",
  "process.env.DISPATCHED_SHA",
  "",
].join("\n");
const baseOutput = "      base_sha: $" + "{{ steps.resolve.outputs.base_sha }}\n";
const forbiddenTriggers = [
  "push",
  "pull_request",
  "pull_request_target",
  "schedule",
  "repository_dispatch",
  "merge_group",
  "workflow_call",
];

describe("repository workflow governance", () => {
  it("finds package tests that remain under src", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-repository-governance-"));
    try {
      const source = join(root, "example", "src");
      await mkdir(source, { recursive: true });
      const testPath = join(source, "left-behind.test.ts");
      await writeFile(testPath, "export {}\n");
      expect(findSourceTestFiles(root)).toEqual([testPath]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a new responsibility root without a topology update", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-root-topology-"));
    try {
      for (const directory of [
        ".agents",
        ".github",
        "docs",
        "packages",
        "scripts",
        "tests",
        "tools",
      ]) {
        await mkdir(join(root, directory), { recursive: true });
      }
      await mkdir(join(root, "docs", "engineering"), { recursive: true });
      await mkdir(join(root, "apps"));
      await writeFile(
        join(root, "docs", "engineering", "README.md"),
        [
          "# Engineering knowledge",
          "",
          "## Current responsibility roots",
          "",
          "```text",
          ".agents/",
          ".github/",
          "docs/",
          "packages/",
          "scripts/",
          "tests/",
          "tools/",
          "```",
          "",
        ].join("\n"),
      );

      expect(validateRootTopology({ root })).toEqual([expect.stringContaining("apps")]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("proves every retained machine Authority has a current consumer", () => {
    expect(validateMachineAuthorityConsumers({ root: resolve(".") })).toEqual([]);
  });

  it("allows machine-internal base_sha outputs while rejecting no inputs", () => {
    const errors = validateVerifyWorkflow(
      workflowPrefix + "jobs:\n  resolve-candidate:\n    outputs:\n" + baseOutput,
    );

    expect(errors).toEqual([]);
  });

  it("rejects base_sha and target_sha workflow-dispatch inputs", () => {
    const errors = validateVerifyWorkflow(
      workflowPrefix.replace(
        "      reason:",
        "      base_sha:\n        required: true\n      target_sha:\n        required: true\n      reason:",
      ) +
        "jobs:\n  resolve-candidate:\n    outputs:\n" +
        baseOutput,
    );

    expect(errors).toEqual([
      "verify workflow must not expose revision input: base_sha:",
      "verify workflow must not expose revision input: target_sha:",
    ]);
  });

  it.each(forbiddenTriggers)("rejects a %s trigger beneath on", (trigger) => {
    const errors = validateVerifyWorkflow(
      workflowPrefix.replace(
        "  workflow_dispatch:\n",
        `  ${trigger}: {}\n  workflow_dispatch:\n`,
      ) + "jobs:\n  verify:\n    runs-on: ubuntu-latest\n",
    );

    expect(errors).toContain(`verify workflow must not auto-trigger via ${trigger}`);
  });
});
