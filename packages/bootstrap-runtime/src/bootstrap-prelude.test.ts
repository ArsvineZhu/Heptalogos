import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createInstallationId,
  createInstanceId,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type BootId,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import {
  BootstrapStateStore,
  type BootstrapStateBodyV1,
} from "@heptalogos/bootstrap-state";
import { prepareBootstrapPrelude } from "./bootstrap-prelude.js";
import type { BootstrapLocatorV1 } from "./locator.js";

const directories: string[] = [];
const LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";

async function makeDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
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

async function makeFixture(anchorRoot?: string): Promise<{
  readonly anchorRoot: string;
  readonly instanceRoot: string;
  readonly locator: BootstrapLocatorV1;
}> {
  const anchor = anchorRoot ?? (await makeDirectory("heptalogos-prelude-anchor-"));
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchor
        : await makeDirectory(`heptalogos-prelude-${id.toLowerCase()}-`);
  }
  const locator: BootstrapLocatorV1 = {
    schemaVersion: 1,
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    roots,
  };
  await writeFile(join(anchor, "heptalogos.bootstrap.json"), JSON.stringify(locator));
  await new BootstrapStateStore(join(roots.INSTANCE, "bootstrap-state")).commit(
    makeState(1),
  );
  return { anchorRoot: anchor, instanceRoot: roots.INSTANCE, locator };
}

async function stages(
  journal: Awaited<ReturnType<typeof prepareBootstrapPrelude>>["journal"],
  bootId: BootId,
): Promise<readonly string[]> {
  return (await journal.read(bootId)).map((entry) => entry.stage);
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("pre-PostgreSQL bootstrap prelude", () => {
  it("records ordered early stages and reloads authoritative state after ownership", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);

    expect(prepared.installationId).toBe(fixture.locator.installationId);
    expect(prepared.instanceId).toBe(fixture.locator.instanceId);
    expect(prepared.preliminaryState).toMatchObject({
      status: "CURRENT",
      value: { state: { revision: 1 } },
    });
    await expect(stages(prepared.journal, prepared.bootId)).resolves.toEqual([
      "bootstrap.prelude.started",
      "bootstrap.locator.resolved",
      "bootstrap.roots.resolved",
      "bootstrap.state.preliminary_read",
    ]);

    const owned = await prepared.acquireOwnership({ heartbeatMs: 1000 });
    expect(owned.authoritativeState).toMatchObject({
      status: "CURRENT",
      value: { state: { revision: 1 } },
    });
    await owned.state.commit(makeState(2));
    await owned.close();

    await expect(stages(prepared.journal, prepared.bootId)).resolves.toEqual([
      "bootstrap.prelude.started",
      "bootstrap.locator.resolved",
      "bootstrap.roots.resolved",
      "bootstrap.state.preliminary_read",
      "bootstrap.ownership.acquired",
      "bootstrap.state.authoritative_reload",
      "bootstrap.prelude.owned",
      "bootstrap.prelude.released",
    ]);
  });

  it("allows competing attempts to keep separate journals while only one mutates state", async () => {
    const fixture = await makeFixture();
    const first = await prepareBootstrapPrelude(fixture.anchorRoot);
    const second = await prepareBootstrapPrelude(fixture.anchorRoot);
    const before = await readFile(
      join(fixture.instanceRoot, "bootstrap-state", "bootstrap-state.json"),
      "utf8",
    );

    const results = await Promise.allSettled([
      first.acquireOwnership({ heartbeatMs: 1000 }),
      second.acquireOwnership({ heartbeatMs: 1000 }),
    ]);
    const ownedResult = results.find(
      (
        result,
      ): result is PromiseFulfilledResult<
        Awaited<ReturnType<typeof first.acquireOwnership>>
      > => result.status === "fulfilled",
    );
    const blockedResult = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    expect(ownedResult).toBeDefined();
    expect(blockedResult).toMatchObject({
      reason: { problem: { problemCode: "bootstrap.ownership.lock_present" } },
    });
    expect(
      await readFile(
        join(fixture.instanceRoot, "bootstrap-state", "bootstrap-state.json"),
        "utf8",
      ),
    ).toBe(before);
    const firstStages = await stages(first.journal, first.bootId);
    const secondStages = await stages(second.journal, second.bootId);
    expect(
      [firstStages, secondStages].filter((value) =>
        value.includes("bootstrap.ownership.blocked"),
      ),
    ).toHaveLength(1);

    await ownedResult?.value.close();
  });

  it("allows concurrent owners for different resolved instance roots", async () => {
    const anchor = await makeDirectory("heptalogos-prelude-shared-program-");
    const first = await makeFixture(anchor);
    const firstPrepared = await prepareBootstrapPrelude(first.anchorRoot);
    const second = await makeFixture(anchor);
    const secondPrepared = await prepareBootstrapPrelude(second.anchorRoot);
    const [firstOwned, secondOwned] = await Promise.all([
      firstPrepared.acquireOwnership({ heartbeatMs: 1000 }),
      secondPrepared.acquireOwnership({ heartbeatMs: 1000 }),
    ]);

    expect(first.instanceRoot).not.toBe(second.instanceRoot);
    expect(firstOwned.instanceId).not.toBe(secondOwned.instanceId);
    await Promise.all([firstOwned.close(), secondOwned.close()]);
  });

  it("does not reclaim an abandoned lock at prelude level", async () => {
    const fixture = await makeFixture();
    const lockDirectory = join(fixture.instanceRoot, LOCK_DIRECTORY);
    await mkdir(lockDirectory);
    await utimes(lockDirectory, new Date(0), new Date(0));

    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    await expect(
      prepared.acquireOwnership({ heartbeatMs: 1000 }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.lock_present" },
    });
    await expect(lstat(lockDirectory)).resolves.toMatchObject({
      isDirectory: expect.any(Function),
    });
    await expect(stages(prepared.journal, prepared.bootId)).resolves.toContain(
      "bootstrap.ownership.blocked",
    );
  });
});
