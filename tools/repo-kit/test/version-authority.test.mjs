import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  readPackageManagerBaseline,
  readNodeVersionProjections,
  readWorkspaceCatalog,
  readWorkspaceSection,
  validateNodeVersionProjections,
  resolveExpectedInstalledPackageVersions,
} from "../src/version-authority.mjs";

async function fixtureTree(setup) {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-version-authority-"));
  try {
    await mkdir(root, { recursive: true });
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        packageManager: "pnpm@11.22.0",
        engines: { node: "24.19.0" },
      }),
    );
    await writeFile(
      join(root, "pnpm-workspace.yaml"),
      [
        "catalog:",
        "  nx: 23.1.1",
        '  "@typescript/native": "npm:typescript@7.0.2"',
        '  typescript: "npm:@typescript/typescript6@6.0.2"',
        "  vitest: 4.1.11",
        "allowBuilds:",
        "  nx: true",
        "overrides:",
        '  "@types/node": 24.13.3',
      ].join("\n"),
    );
    return await setup(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("repository version Authorities", () => {
  it("reads the exact Node and package-manager baseline from package.json", async () => {
    await fixtureTree(async (root) => {
      expect(readPackageManagerBaseline({ root })).toEqual({
        node: "24.19.0",
        packageManager: "pnpm@11.22.0",
        packageManagerName: "pnpm",
        packageManagerVersion: "11.22.0",
      });
    });
  });

  it("requires Node version-manager projections to match package.json", async () => {
    await fixtureTree(async (root) => {
      await writeFile(join(root, ".node-version"), "24.19.0\n");
      await writeFile(join(root, ".nvmrc"), "24.19.0\n");
      expect(readNodeVersionProjections({ root })).toEqual({
        ".node-version": "24.19.0",
        ".nvmrc": "24.19.0",
      });
      expect(validateNodeVersionProjections({ root })).toEqual([]);

      await writeFile(join(root, ".nvmrc"), "24.19.1\n");
      expect(validateNodeVersionProjections({ root })).toEqual([
        ".nvmrc must match package.json engines.node (24.19.0); got 24.19.1",
      ]);
    });
  });

  it("reads catalog values without confusing aliases with installed versions", async () => {
    await fixtureTree(async (root) => {
      expect(readWorkspaceCatalog({ root })).toEqual({
        nx: "23.1.1",
        "@typescript/native": "npm:typescript@7.0.2",
        typescript: "npm:@typescript/typescript6@6.0.2",
        vitest: "4.1.11",
      });
      expect(readWorkspaceSection({ root, section: "overrides" })).toEqual({
        "@types/node": "24.13.3",
      });
      expect(
        resolveExpectedInstalledPackageVersions({
          root,
          packageNames: ["nx", "@typescript/native", "typescript"],
        }),
      ).toEqual({
        nx: "23.1.1",
        "@typescript/native": "7.0.2",
        typescript: "6.0.2",
      });
    });
  });
});
