import { describe, expect, it } from "vitest";
import {
  isCrossWorkspaceRelativeImport,
  isRestrictedImportAllowed,
} from "../../../scripts/verify/boundaries.mjs";

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

  it("allows same-workspace relative imports", () => {
    expect(
      isCrossWorkspaceRelativeImport({
        sourcePackageName: "@heptalogos/bootstrap-runtime",
        targetPackageName: "@heptalogos/bootstrap-runtime",
      }),
    ).toBe(false);
  });

  it("rejects bootstrap-runtime to bootstrap-state relative imports", () => {
    expect(
      isCrossWorkspaceRelativeImport({
        sourcePackageName: "@heptalogos/bootstrap-runtime",
        targetPackageName: "@heptalogos/bootstrap-state",
      }),
    ).toBe(true);
  });

  it("rejects future product to bootstrap-state relative imports", () => {
    expect(
      isCrossWorkspaceRelativeImport({
        sourcePackageName: "@heptalogos/future-product",
        targetPackageName: "@heptalogos/bootstrap-state",
      }),
    ).toBe(true);
  });
});
