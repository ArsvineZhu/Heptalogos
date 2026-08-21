import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBootId,
  createInstallationId,
  createInstanceId,
  isUuidV7,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import type { BootstrapKeyRequestContext } from "./bootstrap-key-provider.js";
import { createPrivatePostgresSessionTracker } from "./private-postgres-bootstrap.js";
import {
  handoffPrivatePostgresToHostForOwnedPrelude,
  type OwnedBootstrapPreludeHandoffContext,
  type HostOwnershipHandoffOptions,
} from "./host-ownership-handoff.js";
import type { ReadyPrivatePostgres } from "./private-postgres-bootstrap.js";

const hostOwnershipMocks = vi.hoisted(() => ({
  provision: vi.fn(),
  reserve: vi.fn(),
  schema: vi.fn(),
  acquireLease: vi.fn(),
  publish: vi.fn(),
}));

vi.mock("@heptalogos/host-ownership", async () => {
  const actual = await vi.importActual<typeof import("@heptalogos/host-ownership")>(
    "@heptalogos/host-ownership",
  );
  return {
    ...actual,
    provisionHostOwnershipDatabase: hostOwnershipMocks.provision,
    acquireBootstrapHostReservation: hostOwnershipMocks.reserve,
    ensureHostOwnershipSchema: hostOwnershipMocks.schema,
    acquireHostLeaseConnection: hostOwnershipMocks.acquireLease,
    publishHostOwnershipToken: hostOwnershipMocks.publish,
  };
});

function makeContext(
  startupDisposition: "STARTED_BY_THIS_BOOTSTRAP" | "ALREADY_RUNNING",
): {
  readonly context: OwnedBootstrapPreludeHandoffContext;
  readonly ready: ReadyPrivatePostgres & {
    readonly stopSpy: ReturnType<typeof vi.fn>;
    readonly restartSpy: ReturnType<typeof vi.fn>;
  };
  readonly ownership: { state: string; release: ReturnType<typeof vi.fn> };
  readonly session: ReturnType<typeof createPrivatePostgresSessionTracker>;
  readonly stages: string[];
} {
  const installationId = createInstallationId();
  const instanceId = createInstanceId();
  const bootId = createBootId();
  const session = createPrivatePostgresSessionTracker();
  const sessionToken = session.beginPreparation();
  session.markReady(sessionToken);
  const ownership = {
    state: "HELD",
    release: vi.fn(async () => {
      ownership.state = "RELEASED";
    }),
  };
  const stages: string[] = [];
  const stopSpy = vi.fn(async (): Promise<void> => undefined);
  const restartSpy = vi.fn(async (): Promise<void> => undefined);
  const ready = {
    installationId,
    instanceId,
    bootId,
    port: 55436,
    clusterSystemIdentifier: "123456789",
    toolchainVersion: "18.6" as const,
    startupDisposition,
    stop: stopSpy as ReadyPrivatePostgres["stop"],
    restart: restartSpy as ReadyPrivatePostgres["restart"],
    stopSpy,
    restartSpy,
  } satisfies ReadyPrivatePostgres & {
    readonly stopSpy: ReturnType<typeof vi.fn>;
    readonly restartSpy: ReturnType<typeof vi.fn>;
  };
  const context = {
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId: "0197cfe0-0000-7000-8000-000000000010" as never,
    paths: {
      resolve: () => ({ canonicalPath: "C:\\heptalogos-instance" }),
    } as never,
    ownership: {
      get state() {
        return ownership.state;
      },
      signal: new AbortController().signal,
      assertHeld: () => undefined,
      release: ownership.release,
    } as never,
    assertOwnership: () => undefined,
    state: {} as never,
    journal: {
      checkpoint: vi.fn(async (entry: { readonly stage: string }) => {
        stages.push(entry.stage);
      }),
    } as never,
    privatePostgresSession: session,
    assertReady: (candidate: ReadyPrivatePostgres) => {
      if (candidate !== ready) {
        throw new ProblemError({
          schemaVersion: 1,
          problemCode: "bootstrap.private_postgres.invalid_handle",
          category: "integrity",
          retryClass: "manual",
          title: "invalid test handle",
        });
      }
      return sessionToken;
    },
  } satisfies OwnedBootstrapPreludeHandoffContext;
  return { context, ready, ownership, session, stages };
}

function makeOptions(): HostOwnershipHandoffOptions {
  return {
    keyProvider: {
      async withPrivatePostgresBootstrapPassword<T>(
        _context: BootstrapKeyRequestContext,
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("B".repeat(32)));
      },
      async withPrivatePostgresHostLeasePassword<T>(
        _context: BootstrapKeyRequestContext,
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("H".repeat(32)));
      },
    },
    timing: {
      connectionTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
      fenceLockTimeoutMs: 1_000,
      keepAliveInitialDelayMs: 1_000,
    },
  };
}

function installSuccessMocks(): {
  readonly releaseReservation: ReturnType<typeof vi.fn>;
  readonly closeLease: ReturnType<typeof vi.fn>;
} {
  const releaseReservation = vi.fn(async () => undefined);
  const closeLease = vi.fn(async () => undefined);
  hostOwnershipMocks.provision.mockResolvedValue({
    ownerRoleCreated: true,
    hostLeaseRoleCreated: true,
    databaseCreated: true,
  });
  hostOwnershipMocks.reserve.mockResolvedValue({ release: releaseReservation });
  hostOwnershipMocks.schema.mockResolvedValue({
    schemaCreated: true,
    tableCreated: true,
    fenceRowInitialized: true,
  });
  hostOwnershipMocks.acquireLease.mockResolvedValue({
    state: "ACTIVE",
    signal: new AbortController().signal,
    assertActive: vi.fn(),
    fence: vi.fn(),
    query: vi.fn(),
    close: closeLease,
  });
  hostOwnershipMocks.publish.mockResolvedValue(undefined);
  return { releaseReservation, closeLease };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("bootstrap to Host ownership handoff", () => {
  it("publishes a fresh token before releasing bootstrap ownership", async () => {
    const fixture = makeContext("STARTED_BY_THIS_BOOTSTRAP");
    const { releaseReservation } = installSuccessMocks();
    const context = await handoffPrivatePostgresToHostForOwnedPrelude(
      fixture.context,
      fixture.ready,
      makeOptions(),
    );

    expect(isUuidV7(context.token)).toBe(true);
    expect(fixture.session.state).toBe("HANDED_OFF");
    expect(fixture.ownership.state).toBe("RELEASED");
    expect(fixture.ready.stopSpy).not.toHaveBeenCalled();
    expect(releaseReservation).toHaveBeenCalledOnce();
    expect(hostOwnershipMocks.publish).toHaveBeenCalledOnce();
    expect(fixture.stages).toEqual([
      "bootstrap.host.database_validated",
      "bootstrap.host.reservation_acquired",
      "bootstrap.host.fence_validated",
      "bootstrap.host.lease_acquired",
      "bootstrap.host.token_published",
      "bootstrap.host.forward_handoff_completed",
    ]);
  });

  it("yields an already-running PostgreSQL process when another Host owns the reservation", async () => {
    const fixture = makeContext("ALREADY_RUNNING");
    hostOwnershipMocks.provision.mockResolvedValue({
      ownerRoleCreated: false,
      hostLeaseRoleCreated: false,
      databaseCreated: false,
    });
    hostOwnershipMocks.reserve.mockResolvedValue(undefined);

    await expect(
      handoffPrivatePostgresToHostForOwnedPrelude(
        fixture.context,
        fixture.ready,
        makeOptions(),
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.host.existing_owner_detected" },
    });
    expect(fixture.session.state).toBe("YIELDED_TO_EXISTING_HOST");
    expect(fixture.ownership.state).toBe("RELEASED");
    expect(hostOwnershipMocks.schema).not.toHaveBeenCalled();
    expect(hostOwnershipMocks.acquireLease).not.toHaveBeenCalled();
    expect(hostOwnershipMocks.publish).not.toHaveBeenCalled();
    expect(fixture.ready.stopSpy).not.toHaveBeenCalled();
  });

  it("rejects a stale or foreign Ready handle before touching Host ownership", async () => {
    const fixture = makeContext("STARTED_BY_THIS_BOOTSTRAP");
    installSuccessMocks();
    const foreign = { ...fixture.ready };

    await expect(
      handoffPrivatePostgresToHostForOwnedPrelude(
        fixture.context,
        foreign,
        makeOptions(),
      ),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.private_postgres.invalid_handle" },
    });
    expect(hostOwnershipMocks.provision).not.toHaveBeenCalled();
  });
});
