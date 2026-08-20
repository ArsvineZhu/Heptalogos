import { describe, expect, it } from "vitest";
import { canonicalizeJson } from "./canonical-json.js";

describe("canonicalizeJson", () => {
  it("produces identical bytes for semantically identical object member ordering", () => {
    const a = canonicalizeJson({ z: 1, a: { y: true, x: "v" } });
    const b = canonicalizeJson({ a: { x: "v", y: true }, z: 1 });
    expect(a).toBe(b);
  });

  it("rejects values outside the supported canonical JSON domain", () => {
    expect(() => canonicalizeJson({ value: Number.NaN })).toThrow();
  });
});
