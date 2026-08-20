import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { asContentDigest, digestCanonicalJson } from "@heptalogos/foundation-contracts";
import { parseBootstrapState } from "./codec.js";
import { BootstrapStateStore } from "./store.js";
import type { BootstrapStateBodyV1 } from "./model.js";

const directories: string[] = [];

async function makeDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "heptalogos-bootstrap-state-"));
  directories.push(directory);
  return directory;
}

function makeState(revision: number): BootstrapStateBodyV1 {
  return {
    schemaVersion: 1,
    revision,
    activeBootstrapRuntimeGeneration: asContentDigest(
      "BootstrapRuntimeGenerationId",
      digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
    ),
    activeProductGeneration: asContentDigest(
      "ProductGenerationId",
      digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
    ),
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("BootstrapStateStore", () => {
  it("returns EMPTY for a directory with no state files", async () => {
    const store = new BootstrapStateStore(await makeDirectory());

    await expect(store.load()).resolves.toEqual({ status: "EMPTY" });
  });

  it("commits revision 1 and loads it as CURRENT", async () => {
    const store = new BootstrapStateStore(await makeDirectory());
    await store.commit(makeState(1));

    await expect(store.load()).resolves.toMatchObject({
      status: "CURRENT",
      value: { state: { revision: 1 } },
    });
  });

  it("preserves revision 1 as previous when revision 2 is committed", async () => {
    const directory = await makeDirectory();
    const store = new BootstrapStateStore(directory);
    await store.commit(makeState(1));
    await store.commit(makeState(2));

    const previous = parseBootstrapState(
      await readFile(join(directory, "bootstrap-state.previous.json"), "utf8"),
    );
    expect(previous).toMatchObject({ ok: true, value: { state: { revision: 1 } } });
  });

  it("rejects skipped and repeated candidate revisions", async () => {
    const store = new BootstrapStateStore(await makeDirectory());
    await store.commit(makeState(1));

    await expect(store.commit(makeState(3))).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.state.revision_conflict" },
    });
    await expect(store.commit(makeState(1))).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.state.revision_conflict" },
    });
  });

  it("recovers the previous valid revision when current bytes are corrupt", async () => {
    const directory = await makeDirectory();
    const store = new BootstrapStateStore(directory);
    await store.commit(makeState(1));
    await store.commit(makeState(2));
    await writeFile(join(directory, "bootstrap-state.json"), "corrupt");

    await expect(store.load()).resolves.toMatchObject({
      status: "RECOVERED_PREVIOUS",
      value: { state: { revision: 1 } },
      problem: { problemCode: "bootstrap.state.current_corrupt" },
    });
  });

  it("returns CORRUPT when both state files are invalid", async () => {
    const directory = await makeDirectory();
    const store = new BootstrapStateStore(directory);
    await writeFile(join(directory, "bootstrap-state.json"), "bad-current");
    await writeFile(join(directory, "bootstrap-state.previous.json"), "bad-previous");

    await expect(store.load()).resolves.toMatchObject({
      status: "CORRUPT",
      problem: { problemCode: "bootstrap.state.no_valid_revision" },
    });
  });

  it("commits the next revision after recovering a valid previous state", async () => {
    const directory = await makeDirectory();
    const store = new BootstrapStateStore(directory);
    await store.commit(makeState(1));
    await store.commit(makeState(2));
    await writeFile(join(directory, "bootstrap-state.json"), "corrupt");

    await store.commit(makeState(2));

    await expect(store.load()).resolves.toMatchObject({
      status: "CURRENT",
      value: { state: { revision: 2 } },
    });
  });
});
