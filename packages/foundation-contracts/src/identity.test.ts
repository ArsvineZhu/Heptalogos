import { validate as validateUuid, version as uuidVersion } from "uuid";
import { describe, expect, it } from "vitest";
import { digestCanonicalJson } from "./digest.js";
import {
  asContentDigest,
  createUuidV7Id,
  parseContentDigest,
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

  it("parses only lowercase SHA-256 content digest values", () => {
    const digest = digestCanonicalJson("product-generation/v1", { manifest: "x" });

    expect(parseContentDigest("ProductGenerationId", digest.hex)).toBe(digest.hex);
    expect(parseContentDigest("ProductGenerationId", "A".repeat(64))).toBeUndefined();
    expect(parseContentDigest("ProductGenerationId", "banana")).toBeUndefined();
  });
});
