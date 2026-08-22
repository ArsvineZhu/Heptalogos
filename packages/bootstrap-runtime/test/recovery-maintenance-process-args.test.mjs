import { describe, expect, it } from "vitest";

describe("recovery maintenance process argument contract", () => {
  it("distinguishes maintenance and recovery positional arguments by role", async () => {
    const parserModule =
      await import("./fixtures/recovery-maintenance-process-args.mjs").catch(
        () => ({}),
      );
    expect(typeof parserModule.parseRecoveryMaintenanceProcessArgs).toBe("function");
    if (typeof parserModule.parseRecoveryMaintenanceProcessArgs !== "function") return;

    const maintenance = parserModule.parseRecoveryMaintenanceProcessArgs([
      "/anchor",
      "maintenance",
      "/pg/bin",
      "55620",
      "POSTGRES_STOPPED",
    ]);
    expect(maintenance).toMatchObject({
      role: "maintenance",
      pgBin: "/pg/bin",
      portText: "55620",
      targetStage: "POSTGRES_STOPPED",
    });
    expect(maintenance.operationIdText).toBeUndefined();

    expect(
      parserModule.parseRecoveryMaintenanceProcessArgs([
        "/anchor",
        "recovery",
        "/pg/bin",
        "55620",
        "operation-id",
        "HOST_TOKEN_PUBLICATION_ARMED",
      ]),
    ).toMatchObject({
      role: "recovery",
      pgBin: "/pg/bin",
      portText: "55620",
      operationIdText: "operation-id",
      targetStage: "HOST_TOKEN_PUBLICATION_ARMED",
    });
  });
});
