import { describe, expect, it } from "vitest";
import { createCanonicalSchemaInitializer } from "./initializer.js";
import {
  canonicalMigrationNames,
  canonicalMigrationProvider,
} from "./migration-provider.js";

describe("canonical schema adapter", () => {
  it("publishes exactly one static migration without a filesystem provider", async () => {
    expect(canonicalMigrationNames).toEqual(["0001_foundation_continuity"]);
    await expect(canonicalMigrationProvider.getMigrations()).resolves.toEqual(
      expect.objectContaining({
        "0001_foundation_continuity": expect.objectContaining({
          up: expect.any(Function),
        }),
      }),
    );
  });

  it("exposes only the injected initializer seam during scaffolding", () => {
    expect(typeof createCanonicalSchemaInitializer).toBe("function");
  });
});
