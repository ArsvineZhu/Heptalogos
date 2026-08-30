import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  collectPackageIndex,
  renderPackageIndex,
  validatePackageIndex,
} from "../src/package-index.mjs";
import { discoverProductPackages } from "../src/workspace.mjs";

const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

describe("generated package index", () => {
  it("discovers product packages from the workspace boundary", async () => {
    const packages = await discoverProductPackages({ root });

    expect(packages.every((entry) => entry.directoryName.length > 0)).toBe(true);
    expect(new Set(packages.map((entry) => entry.directoryName)).size).toBe(
      packages.length,
    );
    expect(packages.map((entry) => entry.manifestName)).toContain(
      "@heptalogos/foundation-contracts",
    );
  });

  it("collects every pnpm workspace package under packages", async () => {
    const model = await collectPackageIndex({ root });

    expect(model.packages.map((entry) => entry.name)).toContain(
      "@heptalogos/foundation-contracts",
    );
    expect(model.packages.every((entry) => entry.tags.includes("kind:product"))).toBe(
      true,
    );
  });

  it("renders package ownership, purpose, boundaries, and secondary tags", async () => {
    const model = await collectPackageIndex({ root });
    const text = renderPackageIndex(model);

    expect(text).toContain(
      "[@heptalogos/foundation-contracts](./foundation-contracts/README.md)",
    );
    expect(text).toContain("kind:product, area:shared");
    expect(text).toContain("low-level shared vocabulary for Foundation packages");
    expect(text).toContain(
      "Branded IDs and parsing/formatting for Foundation identities",
    );
    expect(text).toContain("Higher packages may depend on these primitives");
    expect(text).not.toContain("...");
  });

  it("accepts the rendered current package index", async () => {
    const model = await collectPackageIndex({ root });

    await expect(
      validatePackageIndex({ root, text: renderPackageIndex(model) }),
    ).resolves.toEqual([]);
  });

  it("rejects any non-rendered package index", async () => {
    const model = await collectPackageIndex({ root });
    const rendered = renderPackageIndex(model);
    const changed = rendered.replace("# Package index", "# Stale package index");
    await expect(validatePackageIndex({ root, text: changed })).resolves.toEqual([
      expect.stringContaining("packages/INDEX.md is stale"),
    ]);
  });

  it("rejects README Purpose drift even when the old index row remains", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "heptalogos-package-index-"));
    try {
      const directory = join(fixtureRoot, "packages", "example");
      await mkdir(directory, { recursive: true });
      await writeFile(
        join(directory, "package.json"),
        JSON.stringify({ name: "@heptalogos/example" }),
      );
      await writeFile(
        join(directory, "project.json"),
        JSON.stringify({ tags: ["kind:product"] }),
      );
      const readme = ["# Example", "", "## Purpose", "Original purpose.", ""].join(
        "\n",
      );
      await writeFile(join(directory, "README.md"), readme);
      const productPackages = [
        {
          directory,
          directoryName: "example",
          manifestName: "@heptalogos/example",
        },
      ];
      const initial = renderPackageIndex(
        await collectPackageIndex({ root: fixtureRoot, productPackages }),
      );
      await writeFile(
        join(directory, "README.md"),
        readme.replace("Original", "Changed"),
      );
      await expect(
        validatePackageIndex({ root: fixtureRoot, text: initial, productPackages }),
      ).resolves.toEqual([expect.stringContaining("packages/INDEX.md is stale")]);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});
