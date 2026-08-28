import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  resolvePackageTypesEntryPoint,
  validateApiReflection,
} from "../src/api-docs.mjs";
import { discoverProductPackages } from "../src/workspace.mjs";

const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const packageNames = [
  "bootstrap-runtime",
  "bootstrap-state",
  "canonical-schema",
  "evidence",
  "execution-lineage",
  "foundation-contracts",
  "host-ownership",
  "persistence",
  "private-postgres",
  "runtime-kernel",
  "runtime-substrate",
  "schema-runtime",
  "signal",
  "time-service",
  "work-queue",
];

function expectedPackages() {
  return packageNames.map((directoryName) => ({
    packageName: `@heptalogos/${directoryName}`,
    directoryName,
    repositoryEntryPoint: `packages/${directoryName}/dist/index.d.ts`,
  }));
}

function reflectionFor(packages) {
  return {
    children: packages.map((packageInfo, index) => ({
      id: index + 1,
      name: `${packageInfo.directoryName}/dist`,
      kind: 2,
      sources: [{ fileName: packageInfo.repositoryEntryPoint }],
    })),
  };
}

describe("API documentation ownership", () => {
  it("resolves every discovered product package public declaration", async () => {
    const discovered = await discoverProductPackages({ root });
    const entrypoints = discovered.map((packageInfo) =>
      resolvePackageTypesEntryPoint({ root, packageInfo }),
    );

    expect(discovered).toHaveLength(15);
    expect(entrypoints).toHaveLength(15);
    expect(entrypoints.map(({ packageName }) => packageName)).toContain(
      "@heptalogos/bootstrap-runtime",
    );
    expect(entrypoints.every(({ entryPoint }) => entryPoint.endsWith(".d.ts"))).toBe(
      true,
    );
  });

  it("accepts one structured TypeDoc module for each discovered package", () => {
    const packages = expectedPackages();

    expect(
      validateApiReflection({ root, packages, reflection: reflectionFor(packages) }),
    ).toEqual([]);
  });

  it("fails closed when one of fifteen discovered packages is absent from TypeDoc", () => {
    const packages = expectedPackages();
    const reflection = reflectionFor(packages.slice(1));

    expect(validateApiReflection({ root, packages, reflection })).toEqual([
      expect.stringContaining(
        "TypeDoc reflection package count differs from product discovery: expected 15, actual 14",
      ),
      expect.stringContaining(
        "TypeDoc reflection is missing product package @heptalogos/bootstrap-runtime",
      ),
    ]);
  });

  it("rejects a package export map without a resolvable types entrypoint", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "heptalogos-api-docs-"));
    try {
      const packageDirectory = join(fixtureRoot, "packages", "example");
      await mkdir(packageDirectory, { recursive: true });
      await writeFile(
        join(packageDirectory, "package.json"),
        JSON.stringify({
          name: "@heptalogos/example",
          exports: { ".": { import: "./dist/index.js" } },
        }),
      );

      expect(() =>
        resolvePackageTypesEntryPoint({
          root: fixtureRoot,
          packageInfo: {
            directory: packageDirectory,
            directoryName: "example",
            manifestName: "@heptalogos/example",
          },
        }),
      ).toThrow('exports["."].types');
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("resolves the package-relative declaration selected by exports", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "heptalogos-api-docs-"));
    try {
      const packageDirectory = join(fixtureRoot, "packages", "example");
      const declaration = join(packageDirectory, "dist", "index.d.ts");
      await mkdir(join(packageDirectory, "dist"), { recursive: true });
      await writeFile(
        join(packageDirectory, "package.json"),
        JSON.stringify({
          name: "@heptalogos/example",
          exports: { ".": { types: "./dist/index.d.ts" } },
        }),
      );
      await writeFile(declaration, "export declare const example: true;\n");

      const entrypoint = resolvePackageTypesEntryPoint({
        root: fixtureRoot,
        packageInfo: {
          directory: packageDirectory,
          directoryName: "example",
          manifestName: "@heptalogos/example",
        },
      });

      expect(entrypoint.entryPoint).toBe(declaration);
      expect(entrypoint.repositoryEntryPoint).toBe(
        relative(fixtureRoot, declaration).replaceAll("\\", "/"),
      );
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});
