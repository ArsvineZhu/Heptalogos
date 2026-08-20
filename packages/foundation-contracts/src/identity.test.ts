import { validate as validateUuid, version as uuidVersion } from "uuid";
import { describe, expect, it } from "vitest";
import { digestCanonicalJson } from "./digest.js";
import { asContentDigest, createUuidV7Id } from "./identity.js";

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
});
