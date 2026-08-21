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

  it("allows execa only in the private-postgres process adapter", () => {
    expect(
      isRestrictedImportAllowed(
        "execa",
        "packages/private-postgres/src/process-adapter.ts",
      ),
    ).toBe(true);
    expect(
      isRestrictedImportAllowed(
        "execa",
        "packages/bootstrap-runtime/src/private-postgres-bootstrap.ts",
      ),
    ).toBe(false);
    expect(
      isRestrictedImportAllowed("execa", "packages/future-product/src/index.ts"),
    ).toBe(false);
  });

  it("allows private-postgres only through its package and bootstrap-runtime", () => {
    expect(
      isRestrictedImportAllowed(
        "@heptalogos/private-postgres",
        "packages/private-postgres/src/controller.ts",
      ),
    ).toBe(true);
    expect(
      isRestrictedImportAllowed(
        "@heptalogos/private-postgres",
        "packages/bootstrap-runtime/src/private-postgres-bootstrap.ts",
      ),
    ).toBe(true);
    expect(
      isRestrictedImportAllowed(
        "@heptalogos/private-postgres",
        "packages/future-product/src/index.ts",
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

  it("rejects a cross-workspace relative import into private-postgres internals", () => {
    expect(
      isCrossWorkspaceRelativeImport({
        sourcePackageName: "@heptalogos/bootstrap-runtime",
        targetPackageName: "@heptalogos/private-postgres",
      }),
    ).toBe(true);
  });
});
