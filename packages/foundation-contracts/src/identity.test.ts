import { validate as validateUuid, version as uuidVersion } from "uuid";
import { describe, expect, it } from "vitest";
import { digestCanonicalJson } from "./digest.js";
import {
  asContentDigest,
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  parseContentDigest,
  parseBootId,
  parseHostOwnershipToken,
  parseInstallationId,
  parseInstanceId,
  parseUuidV7Id,
} from "./identity.js";

describe("identity primitives", () => {
  it("creates RFC 9562 UUIDv7 generated identities", () => {
    const id = createUuidV7Id("ActivityId");
    expect(validateUuid(id)).toBe(true);
    expect(uuidVersion(id)).toBe(7);
  });

  it("represents content generation as a digest rather than generating a UUID", () => {
    const digest = digestCanonicalJson("product-generation/v1", { manifest: "x" });
    const generation = asContentDigest("ProductGenerationId", digest);
    expect(generation).toBe(digest.hex);
    expect(validateUuid(generation)).toBe(false);
  });

  it("parses only RFC 9562 UUIDv7 values at a runtime boundary", () => {
    const id = createUuidV7Id("BootId");

    expect(parseUuidV7Id("BootId", id)).toBe(id);
    expect(parseUuidV7Id("BootId", "00000000-0000-4000-8000-000000000000")).toBe(
      undefined,
    );
    expect(parseUuidV7Id("BootId", "banana")).toBeUndefined();
  });

  it("parses HostOwnershipToken at a runtime boundary", () => {
    const token = createHostOwnershipToken();

    expect(parseHostOwnershipToken(token)).toBe(token);
    expect(parseHostOwnershipToken("00000000-0000-4000-8000-000000000000")).toBe(
      undefined,
    );
  });

  it("parses only lowercase SHA-256 content digest values", () => {
    const digest = digestCanonicalJson("product-generation/v1", { manifest: "x" });

    expect(parseContentDigest("ProductGenerationId", digest.hex)).toBe(digest.hex);
    expect(parseContentDigest("ProductGenerationId", "A".repeat(64))).toBeUndefined();
    expect(parseContentDigest("ProductGenerationId", "banana")).toBeUndefined();
  });

  it("keeps installation, instance, and boot identities distinct while using UUIDv7", () => {
    const installationId = createInstallationId();
    const instanceId = createInstanceId();
    const bootId = createBootId();

    expect(parseInstallationId(installationId)).toBe(installationId);
    expect(parseInstanceId(instanceId)).toBe(instanceId);
    expect(parseBootId(bootId)).toBe(bootId);
    expect(new Set([installationId, instanceId, bootId]).size).toBe(3);
    expect(uuidVersion(installationId)).toBe(7);
    expect(uuidVersion(instanceId)).toBe(7);
    expect(uuidVersion(bootId)).toBe(7);
  });

  it("creates a fresh UUIDv7 HostOwnershipToken for every acquisition", () => {
    const first = createHostOwnershipToken();
    const second = createHostOwnershipToken();

    expect(first).not.toBe(second);
    expect(validateUuid(first)).toBe(true);
    expect(uuidVersion(first)).toBe(7);
    expect(uuidVersion(second)).toBe(7);
  });

  it("rejects malformed or non-v7 typed identity values", () => {
    expect(parseInstallationId("banana")).toBeUndefined();
    expect(parseInstanceId("00000000-0000-4000-8000-000000000000")).toBeUndefined();
    expect(parseBootId(null)).toBeUndefined();
  });
});
