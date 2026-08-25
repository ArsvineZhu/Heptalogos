import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanCurrentTree } from "../src/current-tree-hygiene.mjs";

async function fixtureTree(setup) {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-hygiene-"));
  try {
    await mkdir(join(root, "Architecture_Corpus/references"), { recursive: true });
    await mkdir(join(root, "docs/plans/completed"), { recursive: true });
    await writeFile(
      join(root, "Architecture_Corpus/references/compatibility-obligations.json"),
      JSON.stringify({
        schemaVersion: 1,
        compatibilityEpoch: "PRE_PRODUCTION",
        obligations: [],
      }),
    );
    await setup(root);
    return await scanCurrentTree({ root });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function hasCode(result, code) {
  return result.findings.some((finding) => finding.code === code);
}

describe("current-tree hygiene scanner", () => {
  it("rejects a phase-named filename", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/h2a3-fixture.test.ts"),
        "export {};\n",
      );
    });

    expect(hasCode(result, "development-provenance")).toBe(true);
  });

  it("rejects a phase token in a test constant or value", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/test.ts"),
        'const H2A3_TEST_PASSWORD = "h2a3-secret";\n',
      );
    });

    expect(hasCode(result, "development-provenance")).toBe(true);
  });

  it("rejects a phase token in a temporary path", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/test.ts"),
        'const path = "/tmp/heptalogos-h2a3-anchor-";\n',
      );
    });

    expect(hasCode(result, "development-provenance")).toBe(true);
  });

  it("rejects bare stage-family and numbered PR provenance", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/test.ts"),
        "const stage = 'H2A'; const review = 'PR #24';\n",
      );
    });

    expect(hasCode(result, "development-provenance")).toBe(true);
  });

  it("rejects scanned symbolic-link residue without following it", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(join(root, "packages/example/real.ts"), "export {};\n");
      await symlink("real.ts", join(root, "packages/example/link.ts"), "file");
    });

    expect(hasCode(result, "symbolic-link-residue")).toBe(true);
    expect(result.findings.some((finding) => finding.path.endsWith("real.ts"))).toBe(
      false,
    );
  });

  it("rejects high-signal legacy or obsolete wording in implementation tests", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/test.ts"),
        "it('rejects obsolete input', () => {});\n",
      );
    });

    expect(hasCode(result, "historical-compatibility")).toBe(true);
  });

  it("allows current contract compatibility and version negotiation wording", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/current.ts"),
        "export const text = 'contract compatibility contractV2 version negotiation';\n",
      );
    });

    expect(result.findings).toEqual([]);
  });

  it("allows generic governance prose about corrective cycles without an identity", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "AGENTS.md"),
        "Do not leave corrective-cycle names in executable identities.\n",
      );
    });

    expect(result.findings).toEqual([]);
  });

  it("ignores completed-plan and provenance paths", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "docs/plans/completed/h2b-history.md"),
        "legacy H2B evidence and obsolete development shape\n",
      );
      await writeFile(
        join(root, "Architecture_Corpus/h2b-history.md"),
        "legacy H2B architecture evidence\n",
      );
    });

    expect(result.findings).toEqual([]);
  });

  it("rejects GENESIS_EVIDENCE.json and scripts/phases", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(join(root, "GENESIS_EVIDENCE.json"), "{}\n");
      await mkdir(join(root, "scripts/phases"), { recursive: true });
      await writeFile(join(root, "scripts/phases/one-time.mjs"), "export {};\n");
    });

    expect(hasCode(result, "closed-phase-artifact")).toBe(true);
  });

  it("passes a history-neutral fixture", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example"), { recursive: true });
      await writeFile(
        join(root, "packages/example/host-maintenance.test.ts"),
        "export const resource = 'host-maintenance';\n",
      );
    });

    expect(result.findings).toEqual([]);
  });

  it("fails a missing or malformed compatibility register", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-hygiene-register-"));
    try {
      const missing = await scanCurrentTree({ root });
      expect(hasCode(missing, "compatibility-register")).toBe(true);

      await mkdir(join(root, "Architecture_Corpus/references"), { recursive: true });
      await writeFile(
        join(root, "Architecture_Corpus/references/compatibility-obligations.json"),
        "{ malformed\n",
      );
      const malformed = await scanCurrentTree({ root });
      expect(hasCode(malformed, "compatibility-register")).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects non-empty PRE_PRODUCTION obligations", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-hygiene-obligation-"));
    try {
      await mkdir(join(root, "Architecture_Corpus/references"), { recursive: true });
      await writeFile(
        join(root, "Architecture_Corpus/references/compatibility-obligations.json"),
        JSON.stringify({
          schemaVersion: 1,
          compatibilityEpoch: "PRE_PRODUCTION",
          obligations: [{ id: "external-consumer" }],
        }),
      );
      const result = await scanCurrentTree({ root });
      expect(hasCode(result, "compatibility-register")).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
