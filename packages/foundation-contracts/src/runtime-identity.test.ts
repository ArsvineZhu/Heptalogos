import { describe, expect, it } from "vitest";
import {
  createCapabilityId,
  createMicroSystemId,
  createMicroSystemInstanceId,
  createProviderId,
  createServiceId,
  parseCapabilityId,
  parseMicroSystemId,
  parseMicroSystemInstanceId,
  parseProviderId,
  parseServiceId,
} from "./index.js";

describe("runtime identity primitives", () => {
  it("creates and parses the canonical runtime namespaced IDs", () => {
    const microSystemId = createMicroSystemId("foundation.runtime-kernel");
    const serviceId = createServiceId("foundation.persistence");
    const capabilityId = createCapabilityId("ai.text-generation");
    const providerId = createProviderId("provider.synthetic-a");

    expect(parseMicroSystemId(microSystemId)).toBe(microSystemId);
    expect(parseServiceId(serviceId)).toBe(serviceId);
    expect(parseCapabilityId(capabilityId)).toBe(capabilityId);
    expect(parseProviderId(providerId)).toBe(providerId);
  });

  it("rejects invalid, non-lowercase, oversized, and separator-only names", () => {
    const invalid = [
      "Foundation.persistence",
      "foundation_runtime",
      "foundation..persistence",
      "foundation.",
      ".foundation",
      "1foundation.persistence",
      "a".repeat(129),
      "",
    ];
    for (const value of invalid) {
      expect(parseServiceId(value)).toBeUndefined();
    }
    expect(() => createServiceId("Foundation.persistence")).toThrow(TypeError);
  });

  it("creates a UUIDv7 MicroSystemInstanceId distinct from semantic IDs", () => {
    const instanceId = createMicroSystemInstanceId();
    expect(parseMicroSystemInstanceId(instanceId)).toBe(instanceId);
    expect(parseMicroSystemId(instanceId)).toBeUndefined();
  });
});
