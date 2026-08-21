import { describe, expect, it } from "vitest";
import { isRestrictedImportAllowed } from "../../../scripts/verify/boundaries.mjs";

describe("restricted repository imports", () => {
  it("allows bootstrap-runtime access to bootstrap-state", () => {
    expect(
      isRestrictedImportAllowed(
        "@heptalogos/bootstrap-state",
        "packages/bootstrap-runtime/src/bootstrap-state-access.ts",
      ),
    ).toBe(true);
  });

  it("rejects direct bootstrap-state access from future product code", () => {
    expect(
      isRestrictedImportAllowed(
        "@heptalogos/bootstrap-state",
        "packages/future-product/src/index.ts",
      ),
    ).toBe(false);
  });

  it("allows proper-lockfile only in its mechanics adapter", () => {
    expect(
      isRestrictedImportAllowed(
        "proper-lockfile",
        "packages/bootstrap-runtime/src/bootstrap-ownership.ts",
      ),
    ).toBe(true);
    expect(
      isRestrictedImportAllowed(
        "proper-lockfile",
        "packages/bootstrap-runtime/src/bootstrap-prelude.ts",
      ),
    ).toBe(false);
  });
});
