import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateCorpus } from "../../../scripts/verify/corpus-structure.mjs";

async function fixtureTree(setup) {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-corpus-"));
  try {
    await mkdir(join(root, "Architecture_Corpus/qualification/results"), {
      recursive: true,
    });
    await mkdir(join(root, "Architecture_Corpus/references"), { recursive: true });
    await writeFile(join(root, "Architecture_Corpus/README.md"), "# Corpus\n");
    await writeFile(
      join(root, "Architecture_Corpus/INDEX.md"),
      "[00](00-项目宪法与工程宪法.md)\n[26](26-开发阶段闭包-稳定化与兼容性治理.md)\n",
    );
    await writeFile(
      join(root, "Architecture_Corpus/00-项目宪法与工程宪法.md"),
      "# 00\n",
    );
    await writeFile(
      join(root, "Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md"),
      "# 26\n",
    );
    await writeFile(
      join(root, "Architecture_Corpus/qualification/results/README.md"),
      "[Q](Q-runtime.md)\n",
    );
    await writeFile(
      join(root, "Architecture_Corpus/qualification/results/Q-runtime.md"),
      "# Q\n",
    );
    await writeFile(
      join(root, "Architecture_Corpus/references/compatibility-obligations.json"),
      JSON.stringify({
        schemaVersion: 1,
        compatibilityEpoch: "PRE_PRODUCTION",
        obligations: [],
      }),
    );
    await setup(root);
    return validateCorpus({ root });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("Corpus structural verification", () => {
  it("fails a broken Corpus local link", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "Architecture_Corpus/README.md"),
        "[missing](does-not-exist.md)\n",
      );
    });
    expect(
      result.errors.some((error) => error.includes("broken local Markdown link")),
    ).toBe(true);
  });

  it("fails when an existing top-level normative document is omitted from INDEX", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(join(root, "Architecture_Corpus/01-unindexed.md"), "# 01\n");
    });
    expect(
      result.errors.some((error) =>
        error.includes("INDEX.md does not link top-level normative document"),
      ),
    ).toBe(true);
  });

  it("fails a local Markdown link that escapes Architecture_Corpus", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "docs"), { recursive: true });
      await writeFile(join(root, "docs/foo.md"), "# outside\n");
      await writeFile(
        join(root, "Architecture_Corpus/README.md"),
        "[outside](../docs/foo.md)\n",
      );
    });
    expect(
      result.errors.some((error) =>
        error.includes("local Markdown link escapes Architecture_Corpus"),
      ),
    ).toBe(true);
  });

  it("fails malformed Corpus JSON", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "Architecture_Corpus/references/bad.json"),
        "{ malformed\n",
      );
    });
    expect(result.errors.some((error) => error.includes("invalid JSON"))).toBe(true);
  });

  it("fails when a self-hash artifact is reintroduced", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(join(root, "Architecture_Corpus/manifest.json"), "{}\n");
    });
    expect(
      result.errors.some((error) => error.includes("forbidden Corpus artifact")),
    ).toBe(true);
  });

  it("passes a valid minimal Corpus graph", async () => {
    const result = await fixtureTree(async () => {});
    expect(result.errors).toEqual([]);
  });
});
