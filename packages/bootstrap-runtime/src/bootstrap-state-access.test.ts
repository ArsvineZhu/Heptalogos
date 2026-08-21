import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  asContentDigest,
  createBootId,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import type { BootstrapStateBodyV1 } from "@heptalogos/bootstrap-state";
import {
  type BootstrapOwnershipLease,
  type BootstrapOwnershipState,
} from "./bootstrap-ownership.js";
import { openBootstrapStateAccess } from "./bootstrap-state-access.js";
import type { BootstrapPathProfile, ResolvedLifecycleRoot } from "./roots.js";
import type { BootstrapJournalCheckpointV2 } from "@heptalogos/bootstrap-state";

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

function makeJournalEntry(
  installationId: ReturnType<typeof createInstallationId>,
  instanceId: ReturnType<typeof createInstanceId>,
): BootstrapJournalCheckpointV2 {
  return {
    schemaVersion: 2,
    bootId: createBootId(),
    bootstrapActivityId: createUuidV7Id("ActivityId"),
    installationId,
    instanceId,
    stage: "bootstrap.preliminary",
    at: "2026-08-21T09:00:00.000Z",
    outcome: "STARTED",
  };
}

function makeLease(initialState: BootstrapOwnershipState): {
  readonly lease: BootstrapOwnershipLease;
  setState(state: BootstrapOwnershipState): void;
} {
  let state = initialState;
  const controller = new AbortController();
  const lease: BootstrapOwnershipLease = {
    get state() {
      return state;
    },
    signal: controller.signal,
    assertHeld() {
      if (state === "HELD") return;
      throw new ProblemError({
        schemaVersion: 1,
        problemCode:
          state === "COMPROMISED"
            ? "bootstrap.ownership.compromised"
            : "bootstrap.ownership.not_held",
        category: "conflict",
        retryClass: "after-change",
        title: "Bootstrap ownership is not held",
        detail: "The fake bootstrap ownership lease is not held",
      });
    },
    async release() {
      state = "RELEASED";
      controller.abort();
    },
  };
  return { lease, setState: (nextState) => (state = nextState) };
}

async function makeProfile(): Promise<{
  readonly profile: BootstrapPathProfile;
  readonly instanceRoot: string;
}> {
  const instanceRoot = await mkdtemp(
    join(tmpdir(), "heptalogos-bootstrap-state-access-"),
  );
  directories.push(instanceRoot);
  const resolved: ResolvedLifecycleRoot = {
    id: "INSTANCE",
    configuredPath: instanceRoot,
    canonicalPath: instanceRoot,
  };
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  return {
    instanceRoot,
    profile: {
      installationId,
      instanceId,
      resolve(root) {
        if (root !== "INSTANCE") throw new Error(`unexpected root ${root}`);
        return resolved;
      },
      list() {
        return [resolved];
      },
    },
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("owned bootstrap state access", () => {
  it("allows read and journal evidence before ownership but guards state commit", async () => {
    const { profile, instanceRoot } = await makeProfile();
    const fake = makeLease("RELEASED");
    const access = openBootstrapStateAccess(profile, fake.lease);

    await expect(access.state.load()).resolves.toEqual({ status: "EMPTY" });
    const early = makeJournalEntry(profile.installationId, profile.instanceId);
    await access.journal.checkpoint(early);
    await expect(access.journal.read(early.bootId)).resolves.toEqual([early]);

    await expect(access.state.commit(makeState(1))).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
    expect(
      await stat(join(instanceRoot, "bootstrap-state")).catch(() => undefined),
    ).toBe(undefined);
  });

  it("commits while HELD and rejects RELEASED or COMPROMISED before disk mutation", async () => {
    const { profile, instanceRoot } = await makeProfile();
    const fake = makeLease("HELD");
    const access = openBootstrapStateAccess(profile, fake.lease);

    await expect(access.state.commit(makeState(1))).resolves.toMatchObject({
      state: { revision: 1 },
    });
    const statePath = join(instanceRoot, "bootstrap-state", "bootstrap-state.json");
    const beforeRelease = {
      text: await readFile(statePath, "utf8"),
      mtimeMs: (await stat(statePath)).mtimeMs,
    };

    fake.setState("RELEASED");
    await expect(access.state.commit(makeState(2))).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
    expect({
      text: await readFile(statePath, "utf8"),
      mtimeMs: (await stat(statePath)).mtimeMs,
    }).toEqual(beforeRelease);

    fake.setState("COMPROMISED");
    await expect(access.state.commit(makeState(2))).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.compromised" },
    });
    expect({
      text: await readFile(statePath, "utf8"),
      mtimeMs: (await stat(statePath)).mtimeMs,
    }).toEqual(beforeRelease);
  });
});
