import {
  createBootId,
  createContinuityEpochId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createMicroSystemId,
  createMicroSystemInstanceId,
  parseContentDigest,
  parseInstant,
} from "@heptalogos/foundation-contracts";
import { createFakeTimeService } from "@heptalogos/time-service";
import { describe, expect, it } from "vitest";
import {
  createExecutionContextRuntime,
  type ActivityRequest,
  type HostExecutionOrigin,
} from "./index.js";
import {
  bindRuntimeExecutionOrigin,
  type RuntimeExecutionOrigin,
} from "./runtime-kernel.js";

const origin: HostExecutionOrigin = {
  installationId: createInstallationId(),
  instanceId: createInstanceId(),
  bootId: createBootId(),
  continuityEpochId: createContinuityEpochId(),
  hostOwnershipToken: createHostOwnershipToken(),
};

const time = createFakeTimeService(parseInstant("2026-08-25T15:00:00.123Z")!);

const request: ActivityRequest = {
  kind: "runtime.test",
  importance: "diagnostic",
  retentionClass: "ephemeral",
  sensitivity: "operational",
};

const productGenerationId = parseContentDigest("ProductGenerationId", "a".repeat(64))!;

function runtimeOrigin(): RuntimeExecutionOrigin {
  return {
    productGenerationId,
    microSystemId: createMicroSystemId("system.runtime-test"),
    microSystemInstanceId: createMicroSystemInstanceId(),
  };
}

describe("restricted runtime execution-origin bridge", () => {
  it("adds runtime provenance to the existing ExecutionContext and ALS current value", async () => {
    const runtime = createExecutionContextRuntime(origin, time);
    const bound = bindRuntimeExecutionOrigin(runtime, runtimeOrigin());

    await bound.runActivity(request, async (context) => {
      expect(context.origin).toMatchObject({
        ...origin,
        runtime: {
          productGenerationId,
          microSystemId: "system.runtime-test",
        },
      });
      expect(runtime.current()?.origin.runtime).toEqual(context.origin.runtime);
    });
  });

  it("preserves the existing parent and causation chain through nested runtime Activities", async () => {
    const runtime = createExecutionContextRuntime(origin, time);
    const bound = bindRuntimeExecutionOrigin(runtime, runtimeOrigin());

    await bound.runActivity(request, async (parent) => {
      await bound.runActivity(
        { ...request, kind: "runtime.test.child" },
        async (child) => {
          expect(child.parentActivityId).toBe(parent.activityId);
          expect(child.causationActivityId).toBeUndefined();
          expect(child.origin.runtime).toEqual(parent.origin.runtime);
        },
      );
    });
  });

  it("rejects half-present runtime identity and package generation without product generation", () => {
    const runtime = createExecutionContextRuntime(origin, time);

    expect(() =>
      bindRuntimeExecutionOrigin(runtime, {
        productGenerationId,
        microSystemId: createMicroSystemId("system.runtime-test"),
      } as unknown as RuntimeExecutionOrigin),
    ).toThrow();

    expect(() =>
      bindRuntimeExecutionOrigin(runtime, {
        packageGenerationId: productGenerationId,
      } as unknown as RuntimeExecutionOrigin),
    ).toThrow();
  });

  it("keeps the ordinary runtime parent store free of runtime provenance", async () => {
    const runtime = createExecutionContextRuntime(origin, time);
    const bound = bindRuntimeExecutionOrigin(runtime, runtimeOrigin());

    await bound.runActivity(request, async () => undefined);
    await runtime.runActivity(request, async (context) => {
      expect(context.origin.runtime).toBeUndefined();
    });
  });
});
