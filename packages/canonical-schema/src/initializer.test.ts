import { describe, expect, it } from "vitest";
import { createCanonicalSchemaInitializer } from "./initializer.js";

describe("canonical schema adapter", () => {
  it.todo("runs the current canonical migration and continuity materialization");

  it("exposes only the injected initializer seam during scaffolding", () => {
    expect(typeof createCanonicalSchemaInitializer).toBe("function");
  });
});
