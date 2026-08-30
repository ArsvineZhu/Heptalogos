import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { validatePackageIndex } from "../src/package-index.mjs";
import { discoverProductPackages } from "../src/workspace.mjs";

const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

async function fixtureTree(setup) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "heptalogos-package-index-"));
  const productPackages = [
    {
      directory: join(fixtureRoot, "packages", "alpha"),
      directoryName: "alpha",
      manifestName: "@heptalogos/alpha",
    },
    {
      directory: join(fixtureRoot, "packages", "beta"),
      directoryName: "beta",
      manifestName: "@heptalogos/beta",
    },
  ];
  try {
    for (const packageInfo of productPackages) {
      await mkdir(packageInfo.directory, { recursive: true });
      await writeFile(join(packageInfo.directory, "README.md"), "# Package\n");
    }
    await setup(fixtureRoot, productPackages);
    return validatePackageIndex({ root: fixtureRoot, productPackages });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

describe("package retrieval index", () => {
  it("discovers current workspace packages dynamically", async () => {
    const packages = await discoverProductPackages({ root });
    expect(packages.every((entry) => entry.directoryName.length > 0)).toBe(true);
    expect(new Set(packages.map((entry) => entry.directoryName)).size).toBe(
      packages.length,
    );
    expect(packages.map((entry) => entry.manifestName)).toContain(
      "@heptalogos/foundation-contracts",
    );
  });

  it("accepts the deliberate current package projection", async () => {
    await expect(validatePackageIndex({ root })).resolves.toEqual([]);
  });

  it("does not compare explanatory prose with generated README text", async () => {
    const source = await readFile(join(root, "packages", "INDEX.md"), "utf8");
    const text = source + "\nA maintainer may add retrieval guidance here.\n";
    await expect(validatePackageIndex({ root, text })).resolves.toEqual([]);
  });

  it("rejects omitted current packages", async () => {
    const errors = await fixtureTree(async (fixtureRoot) => {
      await writeFile(
        join(fixtureRoot, "packages", "INDEX.md"),
        "[alpha](./alpha/README.md)\n",
      );
    });
    expect(errors).toEqual([
      "packages/INDEX.md must link package README exactly once: beta (found 0)",
    ]);
  });

  it("rejects duplicate and unknown package entries", async () => {
    const errors = await fixtureTree(async (fixtureRoot) => {
      await writeFile(
        join(fixtureRoot, "packages", "INDEX.md"),
        [
          "[alpha](./alpha/README.md)",
          "[alpha again](./alpha/README.md)",
          "[missing](./missing/README.md)",
          "",
        ].join("\n"),
      );
    });
    expect(errors).toEqual([
      "packages/INDEX.md links nonexistent package: missing",
      "packages/INDEX.md must link package README exactly once: alpha (found 2)",
      "packages/INDEX.md must link package README exactly once: beta (found 0)",
    ]);
  });
});
