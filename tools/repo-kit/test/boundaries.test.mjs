import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const boundarySource = readFileSync(
  fileURLToPath(new URL("../../../scripts/verify/boundaries.mjs", import.meta.url)),
  "utf8",
);
const eslintSource = readFileSync(
  fileURLToPath(new URL("../../../eslint.config.mjs", import.meta.url)),
  "utf8",
);

describe("repository boundary ownership", () => {
  it("delegates generic import restrictions to Nx and ESLint", () => {
    expect(boundarySource).not.toMatch(
      /restrictedImports|restrictedSpecifiers|isRestrictedImportAllowed|isRestrictedSpecifierAllowed|isCrossWorkspaceRelativeImport|isAreaDependencyAllowed/u,
    );
    expect(eslintSource).toContain("no-restricted-imports");
    expect(eslintSource).toContain("@heptalogos/persistence/foundation-repository");
    expect(eslintSource).toContain("@nx/enforce-module-boundaries");
  });

  it("keeps Heptalogos-specific public and Authority checks in the custom gate", () => {
    expect(boundarySource).toContain("raw bootstrap/recovery Authority primitive");
    expect(boundarySource).toContain("HostOwnershipToken creation is outside");
    expect(boundarySource).toContain("repository tooling import must not enter source");
    expect(boundarySource).toContain("external import has no Corpus package identity");
  });

  it("encodes the WorkQueue runtime seam as a narrow Nx source tag", () => {
    expect(eslintSource).toContain('sourceTag: "area:work-queue"');
    expect(eslintSource).toContain('"area:runtime"');
    expect(eslintSource).toContain('"area:service"');
  });
});
