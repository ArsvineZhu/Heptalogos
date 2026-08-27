import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateDocumentation } from "../src/documentation.mjs";

const areaTargets = [
  ["governance", "governance/README.md"],
  ["architecture", "architecture/README.md"],
  ["product", "product/product-goals.md"],
  ["reference", "reference/glossary.md"],
  ["dependencies", "dependencies/README.md"],
  ["qualification", "qualification/README.md"],
  ["engineering", "engineering/README.md"],
  ["roadmap", "roadmap/development-roadmap.md"],
  ["plans", "plans/README.md"],
];

async function writeFixtureFile(root, relativePath, text) {
  const path = join(root, relativePath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, text);
}

async function fixtureTree(setup) {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-documentation-"));
  try {
    await writeFixtureFile(root, "AGENTS.md", "# Repository Agent Contract\n");
    await writeFixtureFile(root, "package.json", "{}\n");
    await writeFixtureFile(root, "packages/example/README.md", "# Example\n");
    await writeFixtureFile(root, "tools/example.mjs", "export {};\n");
    await writeFixtureFile(root, "docs/README.md", "# Documentation\n");
    await writeFixtureFile(
      root,
      "docs/INDEX.md",
      `# Index\n${areaTargets.map(([, target]) => `[area](${target})`).join("\n")}\n`,
    );
    await writeFixtureFile(root, "docs/AGENTS.md", "# Documentation Agent Contract\n");
    await writeFixtureFile(root, "docs/governance/constitution.md", "# Constitution\n");
    await writeFixtureFile(
      root,
      "docs/governance/pre-production-evolution.md",
      "# Evolution\n",
    );
    await writeFixtureFile(
      root,
      "docs/governance/compatibility-obligations.json",
      JSON.stringify({
        schemaVersion: 1,
        compatibilityEpoch: "PRE_PRODUCTION",
        obligations: [],
      }),
    );
    await writeFixtureFile(
      root,
      "docs/architecture/README.md",
      "# Architecture\n[System](system.md)\n[Contract](contracts/contract.md)\n",
    );
    await writeFixtureFile(root, "docs/architecture/system.md", "# System\n");
    await writeFixtureFile(
      root,
      "docs/architecture/contracts/contract.md",
      "# Contract\n",
    );
    await writeFixtureFile(
      root,
      "docs/dependencies/dependency-routing.json",
      JSON.stringify({ version: 1 }),
    );
    await writeFixtureFile(
      root,
      "docs/qualification/dependency-status.json",
      JSON.stringify({ schemaVersion: 1 }),
    );
    await writeFixtureFile(root, "docs/qualification/results/README.md", "# Results\n");
    for (const [, target] of areaTargets) {
      if (target === "architecture/README.md") continue;
      await writeFixtureFile(root, `docs/${target}`, `# ${target}\n`);
    }
    await setup(root);
    return validateDocumentation({ root });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function hasCode(result, code) {
  return result.errors.some((error) => error.code === code);
}

describe("documentation topology verification", () => {
  it("accepts a complete current documentation graph", async () => {
    const result = await fixtureTree(async () => {});
    expect(result.errors).toEqual([]);
    expect(result.markdownCount).toBeGreaterThan(0);
    expect(result.jsonCount).toBe(3);
  });

  it("rejects a broken current Markdown link", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(root, "docs/README.md", "[missing](missing.md)\n");
    });
    expect(hasCode(result, "broken-current-link")).toBe(true);
  });

  it("accepts current links to repository artifacts outside docs", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/README.md",
        [
          "[package README](../packages/example/README.md)",
          "[root instructions](../AGENTS.md)",
          "[manifest](../package.json)",
          "[tool](../tools/example.mjs)",
        ].join("\n"),
      );
    });
    expect(result.errors).toEqual([]);
  });

  it("rejects a missing repository artifact link", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/README.md",
        "[missing repository artifact](../tools/missing.mjs)\n",
      );
    });
    expect(hasCode(result, "broken-current-link")).toBe(true);
  });

  it("rejects a current link that escapes the repository", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/README.md",
        "[outside repository](../../outside.md)\n",
      );
    });
    expect(hasCode(result, "link-outside-repository")).toBe(true);
  });

  it("rejects a stale reference to a moved current home", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/governance/pre-production-evolution.md",
        "The compatibility register is references/compatibility-obligations.json.\n",
      );
    });
    expect(hasCode(result, "stale-current-home")).toBe(true);
  });

  it("rejects a current link to the removed Corpus home", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/architecture/system.md",
        "[old](../../Architecture_Corpus/00.md)\n",
      );
    });
    expect(hasCode(result, "removed-corpus-path")).toBe(true);
  });

  it("allows historical Corpus text in completed plans", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/plans/completed/historical.md",
        "Historical path: Architecture_Corpus/00.md\n",
      );
    });
    expect(result.errors).toEqual([]);
  });

  it("validates broken links in active plans", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/plans/active/current.md",
        "[missing](missing.md)\n",
      );
    });
    expect(hasCode(result, "broken-current-link")).toBe(true);
  });

  it("validates removed current homes in active plans", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/plans/active/current.md",
        "Architecture_Corpus/00.md\n",
      );
    });
    expect(hasCode(result, "removed-corpus-path")).toBe(true);
  });

  it("validates the plans index as a current navigation document", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/plans/README.md",
        "[missing active plan](active/missing.md)\n",
      );
    });
    expect(hasCode(result, "broken-current-link")).toBe(true);
  });

  it("allows historical links in completed plans", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/plans/completed/historical.md",
        "[historical home](../../Architecture_Corpus/00.md)\n",
      );
    });
    expect(result.errors).toEqual([]);
  });

  it("rejects an architecture contract missing from its README", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(
        root,
        "docs/architecture/contracts/unindexed.md",
        "# Unindexed\n",
      );
    });
    expect(hasCode(result, "unindexed-architecture-document")).toBe(true);
  });

  it("rejects a nested documentation AGENTS file", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(root, "docs/architecture/AGENTS.md", "# forbidden\n");
    });
    expect(hasCode(result, "nested-docs-agents")).toBe(true);
  });

  it("rejects a translation sidecar during development", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFixtureFile(root, "docs/README.zh.md", "# translation\n");
    });
    expect(hasCode(result, "translation-disabled")).toBe(true);
  });
});
