import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { asContentDigest, digestCanonicalJson } from "@heptalogos/foundation-contracts";
import {
  BootstrapStateStore,
  type BootstrapStateBodyV1,
} from "@heptalogos/bootstrap-state";
import { inspectMaintenanceObligation } from "./maintenance-obligation.js";

const directories: string[] = [];

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

describe("shared maintenance obligation inspection", () => {
  it("returns a current-authority problem for RECOVERED_PREVIOUS BootstrapState", async () => {
    const instanceRoot = await mkdtemp(
      join(tmpdir(), "heptalogos-maintenance-obligation-"),
    );
    directories.push(instanceRoot);
    const store = new BootstrapStateStore(join(instanceRoot, "bootstrap-state"));
    await store.commit(makeState(1));
    await store.commit(makeState(2));
    await writeFile(
      join(instanceRoot, "bootstrap-state", "bootstrap-state.json"),
      "corrupt",
    );

    const loaded = await store.load();
    expect(loaded.status).toBe("RECOVERED_PREVIOUS");

    await expect(
      inspectMaintenanceObligation(instanceRoot, loaded),
    ).resolves.toMatchObject({
      incomplete: false,
      problem: { problemCode: "bootstrap.state.current_authority_required" },
    });
  });
});
