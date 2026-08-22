import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUuidV7Id } from "@heptalogos/foundation-contracts";
import type { BootstrapRecoveryInspection } from "./bootstrap-recovery.js";

const mocks = vi.hoisted(() => ({
  inspect: vi.fn(),
  recover: vi.fn(),
}));

vi.mock("./bootstrap-recovery.js", async () => {
  const actual = await vi.importActual<typeof import("./bootstrap-recovery.js")>(
    "./bootstrap-recovery.js",
  );
  return { ...actual, inspectBootstrapRecovery: mocks.inspect };
});

vi.mock("./host-maintenance-recovery.js", async () => {
  const actual = await vi.importActual<typeof import("./host-maintenance-recovery.js")>(
    "./host-maintenance-recovery.js",
  );
  return { ...actual, recoverInterruptedHostMaintenance: mocks.recover };
});

const { executeBootstrapRecoveryCommand, parseBootstrapRecoveryCommand } =
  await import("./bootstrap-recovery-command.js");

const operationId = createUuidV7Id("MaintenanceOperationId");
const inspection = {
  disposition: "INCOMPLETE_MAINTENANCE",
  operationId,
} as BootstrapRecoveryInspection;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inspect.mockResolvedValue(inspection);
});

describe("bounded bootstrap recovery commands", () => {
  it("supports read-only INSPECT without an execution context", async () => {
    await expect(
      executeBootstrapRecoveryCommand("/installation", { kind: "INSPECT" }),
    ).resolves.toEqual({ kind: "INSPECTED", inspection });
    expect(mocks.recover).not.toHaveBeenCalled();
  });

  it("rejects an expected operation mismatch before dispatching recovery", async () => {
    await expect(
      executeBootstrapRecoveryCommand(
        "/installation",
        {
          kind: "RECOVER",
          expectedOperationId: createUuidV7Id("MaintenanceOperationId"),
        },
        {
          recovery: {} as never,
        },
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.recovery.operation_mismatch" },
    });
    expect(mocks.recover).not.toHaveBeenCalled();
  });

  it("dispatches only the fixed RECOVER operation with its expected identity", async () => {
    mocks.recover.mockResolvedValue({ kind: "STOPPED" });
    const context = { recovery: { principal: {} } } as never;

    await expect(
      executeBootstrapRecoveryCommand(
        "/installation",
        { kind: "RECOVER", expectedOperationId: operationId },
        context,
      ),
    ).resolves.toMatchObject({
      kind: "RECOVERED",
      operationId,
      result: { kind: "STOPPED" },
    });
    expect(mocks.recover).toHaveBeenCalledWith({
      principal: {},
      anchorRoot: "/installation",
      expectedOperationId: operationId,
    });
  });

  it("rejects unsupported force, shell, SQL, and destructive verbs", () => {
    for (const kind of [
      "FORCE_UNLOCK",
      "EXEC_SQL",
      "EXEC_SHELL",
      "DELETE_PATH",
      "REINITIALIZE_POSTGRES",
      "REPLACE_CLUSTER",
      "DISABLE_FENCE",
    ]) {
      let thrown: unknown;
      try {
        parseBootstrapRecoveryCommand({ kind });
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toMatchObject({
        problem: { problemCode: "bootstrap.recovery.command_invalid" },
      });
    }
  });
});
