import { describe, expect, it } from "vitest";
import { validateVerifyWorkflow } from "../../../scripts/verify/repository.mjs";

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
