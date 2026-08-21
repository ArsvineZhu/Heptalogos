import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createUuidV7Id,
  digestCanonicalJson,
} from "@heptalogos/foundation-contracts";
import { BootstrapJournal } from "./journal.js";
import type { BootstrapJournalCheckpointV1, BootId } from "./journal.js";

const directories: string[] = [];

async function makeDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "heptalogos-bootstrap-journal-"));
  directories.push(directory);
  return directory;
}

function makeEntry(
  bootId: BootId,
  stage: string,
  outcome: BootstrapJournalCheckpointV1["outcome"] = "STARTED",
): BootstrapJournalCheckpointV1 {
  return {
    schemaVersion: 1,
    bootId,
    bootstrapActivityId: createUuidV7Id("ActivityId"),
    attemptedBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    attemptedProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
    stage,
    at: "2026-08-21T00:00:00.000Z",
    outcome,
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("BootstrapJournal", () => {
  it("writes Boot A and Boot B to different files", async () => {
    const directory = await makeDirectory();
    const journal = new BootstrapJournal(directory);
    const bootA = createUuidV7Id("BootId");
    const bootB = createUuidV7Id("BootId");

    await journal.checkpoint(makeEntry(bootA, "anchor"));
    await journal.checkpoint(makeEntry(bootB, "anchor"));

    await expect(journal.read(bootA)).resolves.toHaveLength(1);
    await expect(journal.read(bootB)).resolves.toHaveLength(1);
  });

  it("preserves checkpoint order for one BootId", async () => {
    const journal = new BootstrapJournal(await makeDirectory());
    const bootId = createUuidV7Id("BootId");

    await journal.checkpoint(makeEntry(bootId, "anchor"));
    await journal.checkpoint(makeEntry(bootId, "runtime", "SUCCEEDED"));

    await expect(journal.read(bootId)).resolves.toMatchObject([
      { stage: "anchor" },
      { stage: "runtime", outcome: "SUCCEEDED" },
    ]);
  });

  it("never returns Boot B checkpoints while reading Boot A", async () => {
    const journal = new BootstrapJournal(await makeDirectory());
    const bootA = createUuidV7Id("BootId");
    const bootB = createUuidV7Id("BootId");

    await journal.checkpoint(makeEntry(bootB, "boot-b"));

    const entries = await journal.read(bootA);
    expect(entries).toEqual([]);
    expect(entries.some((entry) => entry.bootId === bootB)).toBe(false);
  });

  it("rejects a selected journal file whose entries have another bootId", async () => {
    const directory = await makeDirectory();
    const journal = new BootstrapJournal(directory);
    const bootA = createUuidV7Id("BootId");
    const bootB = createUuidV7Id("BootId");
    const file = join(directory, "bootstrap-journal", `${bootA}.json`);

    await journal.checkpoint(makeEntry(bootB, "boot-b"));
    const bootBText = await readFile(
      join(directory, "bootstrap-journal", `${bootB}.json`),
      "utf8",
    );
    await writeFile(file, bootBText);

    await expect(journal.read(bootA)).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.journal.boot_id_mismatch" },
    });
  });

  it("rejects a runtime BootId that is not UUIDv7 before deriving a filename", async () => {
    const journal = new BootstrapJournal(await makeDirectory());

    await expect(journal.read("banana" as BootId)).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.journal.invalid_boot_id" },
    });
  });

  it("rejects persisted generation references that are not content digests", async () => {
    const directory = await makeDirectory();
    const journal = new BootstrapJournal(directory);
    const bootId = createUuidV7Id("BootId");
    const file = join(directory, "bootstrap-journal", `${bootId}.json`);

    await journal.checkpoint(makeEntry(bootId, "anchor"));
    const text = await readFile(file, "utf8");
    const entries = JSON.parse(text) as Array<Record<string, unknown>>;
    entries[0].attemptedProductGeneration = "banana";
    await writeFile(file, JSON.stringify(entries));

    await expect(journal.read(bootId)).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.journal.invalid_entry" },
    });
  });

  it("keeps parser and schema details stable and bounded", async () => {
    const directory = await makeDirectory();
    const journal = new BootstrapJournal(directory);
    const bootId = createUuidV7Id("BootId");
    const file = join(directory, "bootstrap-journal", `${bootId}.json`);

    await journal.checkpoint(makeEntry(bootId, "anchor"));
    await writeFile(file, '[{"bootId":"');
    await expect(journal.read(bootId)).rejects.toMatchObject({
      problem: {
        problemCode: "bootstrap.journal.invalid_json",
        detail: "Bootstrap journal JSON could not be parsed",
      },
    });
  });

  it("does not import or expose BootstrapState authority", async () => {
    const source = await readFile(new URL("./journal.ts", import.meta.url), "utf8");

    expect(source).not.toContain('from "./store.js"');
    expect(source).not.toMatch(/\.commit\s*\(/u);
    expect(source).not.toMatch(/\bactivate\s*\(/u);
  });
});
