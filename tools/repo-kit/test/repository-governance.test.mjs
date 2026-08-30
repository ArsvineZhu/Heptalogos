import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  findSourceTestFiles,
  validateVerifyWorkflow,
} from "../../../scripts/verify/repository.mjs";
import {
  CURRENT_MACHINE_AUTHORITIES,
  discoverResponsibilityRoots,
  validateRootPackageIdentity,
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
  "verification-script: |",
  "  process.env.DISPATCHED_SHA",
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
  it("requires the private root workspace to use the current repository identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-root-identity-"));
    try {
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({ name: "heptalogos-clean-room", private: true }),
      );
      expect(validateRootPackageIdentity({ root })).toEqual([
        expect.stringContaining("current repository identity"),
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({ name: "heptalogos", private: true }),
      );
      expect(validateRootPackageIdentity({ root })).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("finds product package tests that remain under src", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-repository-governance-"));
    try {
      const source = join(root, "packages", "example", "src");
      await mkdir(source, { recursive: true });
      const testPath = join(source, "left-behind.test.ts");
      await writeFile(testPath, "export {}\n");
      expect(
        await findSourceTestFiles({
          root,
          productPackages: [
            {
              directory: join(root, "packages", "example"),
              directoryName: "example",
              manifestName: "@heptalogos/example",
              workspacePackage: {
                name: "@heptalogos/example",
                path: join(root, "packages/example"),
              },
            },
          ],
        }),
      ).toEqual([testPath]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("discovers responsibility roots and requires only global index coverage", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-root-topology-"));
    try {
      const roots = [
        ".agents",
        ".github",
        "docs",
        "packages",
        "project",
        "scripts",
        "specs",
        "tests",
        "tools",
      ];
      for (const directory of roots) {
        await mkdir(join(root, directory), { recursive: true });
      }
      expect(discoverResponsibilityRoots({ root })).toEqual(roots);
      await writeFile(
        join(root, "INDEX.md"),
        roots.map((name) => "[" + name + "](./" + name + "/)").join("\n"),
      );
      await mkdir(join(root, "apps"), { recursive: true });
      expect(validateRootTopology({ root })).toEqual([expect.stringContaining("apps")]);
      await writeFile(
        join(root, "INDEX.md"),
        roots
          .concat("apps")
          .map((name) => "[" + name + "](./" + name + "/)")
          .join("\n"),
      );
      expect(validateRootTopology({ root })).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("uses the new typed machine Authority homes", () => {
    expect(CURRENT_MACHINE_AUTHORITIES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "compatibility-obligations",
          path: "project/governance/compatibility-obligations.json",
        }),
        expect.objectContaining({
          id: "dependency-routing",
          path: "project/dependencies/dependency-routing.json",
        }),
        expect.objectContaining({
          id: "qualification-status",
          kind: "CURRENT_EVIDENCE_PROJECTION",
          path: "project/qualification/results/qualification-status.json",
        }),
      ]),
    );
  });

  it("allows machine-internal base_sha outputs while rejecting no inputs", () => {
    const errors = validateVerifyWorkflow(
      workflowPrefix + "jobs:\n  resolve-candidate:\n    outputs:\n" + baseOutput,
    );
    expect(errors).toEqual([]);
  });

  it("validates reusable workflow job-level uses pins", () => {
    const unpinned = validateVerifyWorkflow(
      workflowPrefix +
        "jobs:\n  reusable:\n    uses: owner/repo/.github/workflows/verify.yml@main\n",
    );
    expect(unpinned).toContain(
      "GitHub Action must be pinned to a full commit SHA: owner/repo/.github/workflows/verify.yml@main",
    );

    const pinned = validateVerifyWorkflow(
      workflowPrefix +
        "jobs:\n  reusable:\n    uses: owner/repo/.github/workflows/verify.yml@0123456789abcdef0123456789abcdef01234567\n",
    );
    expect(pinned).toEqual([]);
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
        "  " + trigger + ": {}\n  workflow_dispatch:\n",
      ) + "jobs:\n  verify:\n    runs-on: ubuntu-latest\n",
    );
    expect(errors).toContain("verify workflow must not auto-trigger via " + trigger);
  });
});
