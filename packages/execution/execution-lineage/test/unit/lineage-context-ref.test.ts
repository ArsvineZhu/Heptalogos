import {
  createActivityId,
  createContinuityEpochId,
  createInstanceId,
} from "@heptalogos/foundation-contracts";
import { describe, expect, it } from "vitest";
import { decodeLineageContextRef, encodeLineageContextRef } from "../../src/index.js";

describe("LineageContextRef V1", () => {
  it("validates without mutating and returns the canonical V1 shape", () => {
    const input = {
      schemaVersion: 1,
      sourceActivityId: createActivityId(),
      sourceInstanceId: createInstanceId(),
      sourceContinuityEpochId: createContinuityEpochId(),
    };
    const before = structuredClone(input);

    const decoded = decodeLineageContextRef(input);
    const encoded = encodeLineageContextRef(decoded);

    expect(input).toEqual(before);
    expect(encoded).toEqual(input);
    expect(Object.isFrozen(encoded)).toBe(true);
  });

  it("rejects unsupported versions and unknown fields", () => {
    expect(() => decodeLineageContextRef({ schemaVersion: 2 })).toThrow();
    expect(() =>
      decodeLineageContextRef({
        schemaVersion: 1,
        sourceActivityId: createActivityId(),
        sourceInstanceId: createInstanceId(),
        sourceContinuityEpochId: createContinuityEpochId(),
        unexpectedBootId: "x",
      }),
    ).toThrow();
  });
});
