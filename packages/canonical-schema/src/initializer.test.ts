import { describe, expect, it } from "vitest";
import { createCanonicalSchemaInitializer } from "./initializer.js";
import {
  canonicalMigrationNames,
  canonicalMigrationProvider,
} from "./migration-provider.js";
import { verifyObservedContinuityRow } from "./continuity.js";
import {
  createContinuityEpochId,
  createInstanceId,
} from "@heptalogos/foundation-contracts";

describe("canonical schema adapter", () => {
  it("publishes exactly one static migration without a filesystem provider", async () => {
    expect(canonicalMigrationNames).toEqual(["0001_foundation_baseline"]);
    await expect(canonicalMigrationProvider.getMigrations()).resolves.toEqual(
      expect.objectContaining({
        "0001_foundation_baseline": expect.objectContaining({
          up: expect.any(Function),
        }),
      }),
    );
  });

  it("exposes only the injected initializer seam during scaffolding", () => {
    expect(typeof createCanonicalSchemaInitializer).toBe("function");
  });

  it("accepts an exact continuity row and rejects identity mismatches", () => {
    const instanceId = createInstanceId();
    const epoch = createContinuityEpochId();
    expect(() =>
      verifyObservedContinuityRow(
        { singleton: true, instance_id: instanceId, continuity_epoch_id: epoch },
        instanceId,
        epoch,
      ),
    ).not.toThrow();

    const instanceMismatch = () =>
      verifyObservedContinuityRow(
        {
          singleton: true,
          instance_id: createInstanceId(),
          continuity_epoch_id: epoch,
        },
        instanceId,
        epoch,
      );
    expect(instanceMismatch).toThrow();
    try {
      instanceMismatch();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "canonical-schema.continuity_instance_mismatch" },
      });
    }

    const epochMismatch = () =>
      verifyObservedContinuityRow(
        {
          singleton: true,
          instance_id: instanceId,
          continuity_epoch_id: createContinuityEpochId(),
        },
        instanceId,
        epoch,
      );
    expect(epochMismatch).toThrow();
    try {
      epochMismatch();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "canonical-schema.continuity_epoch_mismatch" },
      });
    }
  });
});
