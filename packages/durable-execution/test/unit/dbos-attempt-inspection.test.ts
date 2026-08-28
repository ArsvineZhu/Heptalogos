import {
  createMicroSystemId,
  createWorkItemId,
  parseDurableCodeVersion,
  type DurableCodeVersion,
} from "@heptalogos/foundation-contracts";
import {
  createDispatchAttemptId,
  type DurableAttemptInspectionRequest,
  type WorkQueueProfileId,
} from "@heptalogos/work-queue";
import { describe, expect, it } from "vitest";
import {
  createDbosAttemptInspectionPortForTests,
  type DbosWorkflowStatus,
  type DbosWorkflowStatusDriver,
} from "../../src/dbos-attempt-inspection.js";

const parsedDurableCodeVersion = parseDurableCodeVersion("a".repeat(64));
if (parsedDurableCodeVersion === undefined) {
  throw new Error("Test durable code version is invalid");
}
const durableCodeVersion: DurableCodeVersion = parsedDurableCodeVersion;

const workItemId = createWorkItemId();
const dispatchRevision = 4;
const queueProfileId = createMicroSystemId(
  "inspection-default",
) as unknown as WorkQueueProfileId;
const request: DurableAttemptInspectionRequest = {
  workItemId,
  dispatchRevision,
  dispatchAttemptId: createDispatchAttemptId(workItemId, dispatchRevision),
  queueProfileId,
};

function driver(status: DbosWorkflowStatus | null): {
  readonly driver: DbosWorkflowStatusDriver;
  readonly workflowIDs: string[];
} {
  const workflowIDs: string[] = [];
  return {
    workflowIDs,
    driver: {
      async getWorkflowStatus(workflowID) {
        workflowIDs.push(workflowID);
        return status;
      },
    },
  };
}

function inspectWith(status: DbosWorkflowStatus | null) {
  const fixture = driver(status);
  const port = createDbosAttemptInspectionPortForTests(
    { durableCodeVersion },
    fixture.driver,
  );
  return { fixture, port };
}

describe("DBOS attempt inspection", () => {
  it.each(["PENDING", "ENQUEUED", "DELAYED"])(
    "normalizes %s to an active engine projection",
    async (status) => {
      const { fixture, port } = inspectWith({
        status,
        applicationVersion: durableCodeVersion,
      });

      await expect(port.inspect(request)).resolves.toEqual({
        kind: "ACTIVE",
        applicationVersion: durableCodeVersion,
      });
      expect(fixture.workflowIDs).toEqual([
        `heptalogos.work.${request.dispatchAttemptId}`,
      ]);
    },
  );

  it("reports an absent workflow without exposing vendor status", async () => {
    const { port } = inspectWith(null);
    const result = await port.inspect(request);

    expect(result).toEqual({ kind: "ABSENT" });
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("workflowID");
  });

  it.each([
    ["SUCCESS", "ENGINE_SUCCESS"],
    ["ERROR", "ENGINE_ERROR"],
    ["CANCELLED", "ENGINE_CANCELLED"],
    ["MAX_RECOVERY_ATTEMPTS_EXCEEDED", "RECOVERY_EXHAUSTED"],
  ] as const)("normalizes %s to %s", async (status, kind) => {
    const { port } = inspectWith({
      status,
      applicationVersion: durableCodeVersion,
    });

    await expect(port.inspect(request)).resolves.toEqual({
      kind,
      applicationVersion: durableCodeVersion,
    });
  });

  it("keeps a different or missing application version fenced", async () => {
    const different = inspectWith({
      status: "PENDING",
      applicationVersion: "b".repeat(64),
    });
    await expect(different.port.inspect(request)).resolves.toEqual({
      kind: "VERSION_MISMATCH",
      applicationVersion: "b".repeat(64),
    });

    const missing = inspectWith({ status: "PENDING" });
    await expect(missing.port.inspect(request)).resolves.toEqual({
      kind: "VERSION_MISMATCH",
      applicationVersion: "",
    });
  });

  it("treats an unknown DBOS status as a non-authoritative engine error", async () => {
    const { port } = inspectWith({
      status: "UNEXPECTED_STATUS",
      applicationVersion: durableCodeVersion,
    });

    await expect(port.inspect(request)).resolves.toEqual({
      kind: "ENGINE_ERROR",
      applicationVersion: durableCodeVersion,
    });
  });

  it("rejects malformed attempt identity and normalizes lookup failures", async () => {
    const { port } = inspectWith({
      status: "PENDING",
      applicationVersion: durableCodeVersion,
    });
    await expect(
      port.inspect({
        ...request,
        dispatchAttemptId: createDispatchAttemptId(workItemId, 5),
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "durable.execution.inspection.invalid_request" },
    });

    const failingDriver: DbosWorkflowStatusDriver = {
      async getWorkflowStatus() {
        throw new Error("status unavailable");
      },
    };
    const failingPort = createDbosAttemptInspectionPortForTests(
      { durableCodeVersion },
      failingDriver,
    );
    await expect(failingPort.inspect(request)).rejects.toMatchObject({
      problem: { problemCode: "durable.execution.inspection.failed" },
    });
  });
});
