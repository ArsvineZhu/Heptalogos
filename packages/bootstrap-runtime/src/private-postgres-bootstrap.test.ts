import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  asContentDigest,
  createInstallationId,
  createInstanceId,
  digestCanonicalJson,
  LIFECYCLE_ROOT_IDS,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import {
  BootstrapStateStore,
  type BootstrapStateBodyV1,
  type BootstrapStateBodyV2,
} from "@heptalogos/bootstrap-state";
import type {
  BootstrapKeyProvider,
  BootstrapKeyRequestContext,
} from "./bootstrap-key-provider.js";
import {
  prepareBootstrapPrelude,
  type OwnedBootstrapPrelude,
} from "./bootstrap-prelude.js";
import {
  createOwnershipScopedPrivatePostgresLifecycle,
  createPrivatePostgresSessionTracker,
} from "./private-postgres-bootstrap.js";
import * as bootstrapRuntime from "./index.js";

const directories: string[] = [];
const LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";
const { AMBIGUOUS_START_TEST_BIN } = vi.hoisted(() => ({
  AMBIGUOUS_START_TEST_BIN: "ambiguous-start-test-bin",
}));

vi.mock("@heptalogos/private-postgres", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/private-postgres")>(
    "@heptalogos/private-postgres",
  );
  return {
    ...actual,
    resolvePrivatePostgresToolchain: async (binDirectory: string) => {
      if (binDirectory === AMBIGUOUS_START_TEST_BIN) {
        return {
          version: "18.6",
          major: 18,
          binDirectory,
          postgres: `${binDirectory}/postgres.exe`,
          initdb: `${binDirectory}/initdb.exe`,
          pgCtl: `${binDirectory}/pg_ctl.exe`,
          pgControldata: `${binDirectory}/pg_controldata.exe`,
          pgIsReady: `${binDirectory}/pg_isready.exe`,
        } as const;
      }
      return actual.resolvePrivatePostgresToolchain(binDirectory);
    },
    validateExistingCluster: async (
      options: Parameters<typeof actual.validateExistingCluster>[0],
    ) => {
      if (options.toolchain.binDirectory === AMBIGUOUS_START_TEST_BIN) {
        return {
          toolchain: options.toolchain,
          placement: options.placement,
          identity: {
            clusterSystemIdentifier: options.expectedIdentity.clusterSystemIdentifier,
            postgresMajor: 18,
          },
          port: options.expectedIdentity.persistedPort,
          initializationProfileRevision:
            options.expectedIdentity.initializationProfileRevision,
          dataPageChecksumVersion: 1,
          databaseClusterState: "shut down",
          catalogVersionNumber: "202507181",
        };
      }
      return actual.validateExistingCluster(options);
    },
    startPrivatePostgresCluster: async (
      options: Parameters<typeof actual.startPrivatePostgresCluster>[0],
    ) => {
      if (options.toolchain.binDirectory === AMBIGUOUS_START_TEST_BIN) {
        throw {
          problem: {
            schemaVersion: 1,
            problemCode: "private-postgres.lifecycle.start_cleanup_uncertain",
            category: "integrity",
            retryClass: "manual",
            title: "Private PostgreSQL start cleanup is uncertain",
            detail: "The mocked issued start remains uncertain",
          },
        };
      }
      return actual.startPrivatePostgresCluster(options);
    },
  };
});

interface TestPreparePrivatePostgresOptions {
  readonly toolchainBinDirectory: string;
  readonly initialPort?: number;
  readonly lifecycle: {
    readonly startupTimeoutMs: number;
    readonly shutdownTimeoutMs: number;
    readonly readinessPollIntervalMs: number;
  };
  readonly keyProvider: BootstrapKeyProvider;
}

type OwnedPreludeWithPrivatePostgres = OwnedBootstrapPrelude & {
  preparePrivatePostgres(options: TestPreparePrivatePostgresOptions): Promise<unknown>;
};

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

async function makeFixture(): Promise<{
  readonly anchorRoot: string;
  readonly instanceRoot: string;
  readonly dataRoot: string;
}> {
  const anchorRoot = await mkdtemp(join(tmpdir(), "heptalogos-pg-bootstrap-anchor-"));
  directories.push(anchorRoot);
  const roots = {} as Record<LifecycleRootId, string>;
  for (const id of LIFECYCLE_ROOT_IDS) {
    roots[id] =
      id === "PROGRAM"
        ? anchorRoot
        : await mkdtemp(join(tmpdir(), `heptalogos-pg-bootstrap-${id.toLowerCase()}-`));
    if (id !== "PROGRAM") directories.push(roots[id]);
  }
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  await writeFile(
    join(anchorRoot, "heptalogos.bootstrap.json"),
    JSON.stringify({ schemaVersion: 1, installationId, instanceId, roots }),
  );
  await new BootstrapStateStore(join(roots.INSTANCE, "bootstrap-state")).commit(
    makeState(1),
  );
  return { anchorRoot, instanceRoot: roots.INSTANCE, dataRoot: roots.DATA };
}

function makeOptions(
  toolchainBinDirectory: string,
  calls: { count: number },
): TestPreparePrivatePostgresOptions {
  const keyProvider: BootstrapKeyProvider = {
    async withPrivatePostgresBootstrapPassword<T>(
      _context: BootstrapKeyRequestContext,
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      calls.count += 1;
      return use(new TextEncoder().encode("M3_TEST_SENTINEL_DO_NOT_LEAK_4f88b1c6"));
    },
  };
  return {
    toolchainBinDirectory,
    initialPort: 55436,
    lifecycle: {
      startupTimeoutMs: 1_000,
      shutdownTimeoutMs: 1_000,
      readinessPollIntervalMs: 10,
    },
    keyProvider,
  };
}

function callable(owned: OwnedBootstrapPrelude): OwnedPreludeWithPrivatePostgres {
  return owned as OwnedPreludeWithPrivatePostgres;
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("private PostgreSQL bootstrap ownership boundary", () => {
  it("tracks the deterministic private PostgreSQL session state machine", () => {
    const session = createPrivatePostgresSessionTracker();

    expect(session.state).toBe("QUIESCENT");
    session.beginPreparation();
    expect(session.state).toBe("TRANSITIONING");
    session.markReady();
    expect(session.state).toBe("READY");
    session.beginStop();
    expect(session.state).toBe("TRANSITIONING");
    session.markQuiescent();
    expect(session.state).toBe("QUIESCENT");
    session.beginRestart();
    session.markReady();
    expect(session.state).toBe("READY");
    session.beginStop();
    session.markUncertain();
    expect(session.state).toBe("UNCERTAIN");
  });

  it("rejects release while the private PostgreSQL session is active or uncertain", () => {
    const transitioning = createPrivatePostgresSessionTracker();
    transitioning.beginPreparation();
    try {
      transitioning.assertReleaseAllowed();
      throw new Error("expected release to be blocked");
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "bootstrap.private_postgres.release_blocked" },
      });
    }

    const uncertain = createPrivatePostgresSessionTracker();
    uncertain.beginPreparation();
    uncertain.markUncertain();
    try {
      uncertain.assertReleaseAllowed();
      throw new Error("expected release to be blocked");
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "bootstrap.private_postgres.release_blocked" },
      });
    }
  });

  it("does not let compromised ownership reach retained lifecycle mechanics", async () => {
    const session = createPrivatePostgresSessionTracker();
    session.beginPreparation();
    session.markReady();
    let owned = true;
    const stop = vi.fn(async () => undefined);
    const restart = vi.fn(async () => undefined);
    const lifecycle = createOwnershipScopedPrivatePostgresLifecycle(
      {
        privatePostgresSession: session,
        assertOwnership: () => {
          if (!owned) throw new Error("bootstrap ownership lost");
        },
      },
      { stop, restart } as never,
    );

    owned = false;
    await expect(lifecycle.stop()).rejects.toThrow("bootstrap ownership lost");
    await expect(lifecycle.restart()).rejects.toThrow("bootstrap ownership lost");
    expect(stop).not.toHaveBeenCalled();
    expect(restart).not.toHaveBeenCalled();
    expect(session.state).toBe("READY");
  });

  it("marks lifecycle uncertainty when ownership is lost after mechanics stop", async () => {
    const session = createPrivatePostgresSessionTracker();
    session.beginPreparation();
    session.markReady();
    let assertions = 0;
    const stop = vi.fn(async () => undefined);
    const restart = vi.fn(async () => undefined);
    const lifecycle = createOwnershipScopedPrivatePostgresLifecycle(
      {
        privatePostgresSession: session,
        assertOwnership: () => {
          assertions += 1;
          if (assertions === 2) throw new Error("bootstrap ownership lost");
        },
      },
      { stop, restart } as never,
    );

    await expect(lifecycle.stop()).rejects.toThrow("bootstrap ownership lost");
    expect(stop).toHaveBeenCalledOnce();
    expect(session.state).toBe("UNCERTAIN");
    await expect(lifecycle.restart()).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.private_postgres.invalid_transition" },
    });
    expect(restart).not.toHaveBeenCalled();
  });

  it("does not add preparation to PreparedBootstrapPrelude or export a forgeable function", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);

    expect("preparePrivatePostgres" in prepared).toBe(false);
    expect("preparePrivatePostgres" in bootstrapRuntime).toBe(false);
  });

  it("rejects a structurally fake owned object without exposing an orchestration bypass", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const fake = {
      installationId: prepared.installationId,
      instanceId: prepared.instanceId,
      bootId: prepared.bootId,
      bootstrapActivityId: prepared.bootstrapActivityId,
      paths: prepared.paths,
      ownershipState: "HELD",
      ownershipSignal: new AbortController().signal,
      state: prepared,
      authoritativeState: prepared.preliminaryState,
      close: async () => undefined,
    } as unknown as OwnedBootstrapPrelude;

    expect("preparePrivatePostgres" in fake).toBe(false);
  });

  it("rejects after release before resolving tools or requesting a password", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const calls = { count: 0 };

    await owned.close();

    await expect(
      callable(owned).preparePrivatePostgres(
        makeOptions("relative-bin-directory", calls),
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
    expect(calls.count).toBe(0);
  });

  it("rejects a mutation as soon as close begins releasing ownership", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const calls = { count: 0 };
    const closePromise = owned.close();

    await expect(
      callable(owned).preparePrivatePostgres(
        makeOptions("relative-bin-directory", calls),
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.not_held" },
    });
    expect(calls.count).toBe(0);
    await closePromise;
  });

  it("rejects a compromised ownership lease before cluster mutation", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const calls = { count: 0 };

    await rm(join(fixture.instanceRoot, LOCK_DIRECTORY), {
      recursive: true,
      force: true,
    });
    await new Promise<void>((resolve) => {
      if (owned.ownershipSignal.aborted) {
        resolve();
      } else {
        owned.ownershipSignal.addEventListener("abort", () => resolve(), {
          once: true,
        });
      }
    });

    await expect(
      callable(owned).preparePrivatePostgres(
        makeOptions("relative-bin-directory", calls),
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.compromised" },
    });
    expect(calls.count).toBe(0);
    await owned.close();
  });

  it("allows a same-instance genuine owner to reach the private PostgreSQL boundary", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const emptyBin = await mkdtemp(join(tmpdir(), "heptalogos-pg-empty-bin-"));
    directories.push(emptyBin);
    const calls = { count: 0 };

    await expect(
      callable(owned).preparePrivatePostgres(makeOptions(emptyBin, calls)),
    ).rejects.toMatchObject({
      problem: { problemCode: "private-postgres.toolchain.tool_missing" },
    });
    expect(calls.count).toBe(0);
    await owned.close();
  });

  it("keeps bootstrap ownership held when ambiguous start cleanup is uncertain", async () => {
    const fixture = await makeFixture();
    const prepared = await prepareBootstrapPrelude(fixture.anchorRoot);
    const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const dataDirectory = join(fixture.dataRoot, "private-postgres");
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(join(dataDirectory, "PG_VERSION"), "18\n");

    const initializationProfileRevision = asContentDigest(
      "PrivatePostgresInitializationProfileRevision",
      digestCanonicalJson("test.private-postgres.profile/v1", {
        port: 55455,
      }),
    );
    const current = makeState(1);
    const stateV2: BootstrapStateBodyV2 = {
      ...current,
      schemaVersion: 2,
      revision: 2,
      privatePostgres: {
        schemaVersion: 1,
        postgresMajor: 18,
        initializedByPostgresVersion: "18.6",
        installationId: owned.installationId,
        instanceId: owned.instanceId,
        dataPlacement: {
          rootId: "DATA",
          relativePath: "private-postgres",
          dataLayoutVersion: 1,
        },
        persistedPort: 55455,
        clusterSystemIdentifier: "123456789",
        initializationProfileRevision,
      },
    };
    await owned.state.commit(stateV2);

    const calls = { count: 0 };
    try {
      await expect(
        callable(owned).preparePrivatePostgres({
          ...makeOptions(AMBIGUOUS_START_TEST_BIN, calls),
          initialPort: undefined,
        }),
      ).rejects.toMatchObject({
        problem: {
          problemCode: "private-postgres.lifecycle.start_cleanup_uncertain",
        },
      });
      expect(owned.ownershipState).toBe("HELD");
      await expect(owned.close()).rejects.toMatchObject({
        problem: { problemCode: "bootstrap.private_postgres.release_blocked" },
      });
      expect(owned.ownershipState).toBe("HELD");
    } finally {
      await rm(join(fixture.instanceRoot, LOCK_DIRECTORY), {
        recursive: true,
        force: true,
      });
      await new Promise<void>((resolve) => {
        if (owned.ownershipSignal.aborted) {
          resolve();
        } else {
          owned.ownershipSignal.addEventListener("abort", () => resolve(), {
            once: true,
          });
        }
      });
    }
  });
});
