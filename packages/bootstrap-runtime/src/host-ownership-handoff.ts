import {
  createHostOwnershipToken,
  ProblemError,
  type ContinuityEpochId,
  type HostOwnershipToken,
} from "@heptalogos/foundation-contracts";
import {
  acquireBootstrapHostReservation,
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  ensureHostOwnershipSchema,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_RUNTIME_ROLE,
  inspectCanonicalHostDatabase,
  provisionHostOwnershipDatabase,
  publishHostOwnershipToken,
  type BootstrapAdminPasswordProvider,
  type BootstrapMutationAuthority,
  type HostCanonicalMigrationAuthority,
  type HostOwnershipContext,
  type HostOwnershipState,
  type HostOwnershipTimingOptions,
} from "@heptalogos/host-ownership";
import type {
  BootstrapActivityId,
  BootstrapJournal,
} from "@heptalogos/bootstrap-state";
import type { BootstrapOwnershipLease } from "./bootstrap-ownership.js";
import type { BootstrapKeyProvider } from "./bootstrap-key-provider.js";
import {
  assertReadyPrivatePostgresSession,
  getPrivatePostgresMaintenanceDescriptor,
  type PrivatePostgresSessionToken,
  type PrivatePostgresSessionTracker,
  type ReadyPrivatePostgres,
} from "./private-postgres-bootstrap.js";
import type { OwnedBootstrapStateStore } from "./bootstrap-state-access.js";
import type { BootstrapPathProfile } from "./roots.js";
import {
  createManagedHostContext,
  markManagedHostTerminal,
  type BootstrapManagedHostContext,
} from "./managed-host.js";
import { admitCanonicalHost } from "./canonical-host-admission.js";
import {
  createHostMaintenanceOperations,
  createRestartPrivatePostgresEnteredWindowExecutor,
  createStopPrivatePostgresEnteredWindowExecutor,
  type HostMaintenanceOperationProvenance,
} from "./host-maintenance.js";

export interface HostOwnershipHandoffOptions {
  readonly keyProvider: BootstrapKeyProvider;
  readonly timing: HostOwnershipTimingOptions;
  readonly initializeCanonicalHost: CanonicalHostInitializer;
  readonly clientFactory?: unknown;
  readonly bootstrapHeartbeatMs?: number;
}

interface CanonicalHostInitializationContext {
  readonly authority: HostCanonicalMigrationAuthority;
  readonly expectedContinuityEpochId: ContinuityEpochId;
}

type CanonicalHostInitializer = (
  context: CanonicalHostInitializationContext,
) => Promise<void>;

export interface OwnedBootstrapPreludeHandoffContext {
  readonly installationId: ReadyPrivatePostgres["installationId"];
  readonly instanceId: ReadyPrivatePostgres["instanceId"];
  readonly bootId: ReadyPrivatePostgres["bootId"];
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly ownership: BootstrapOwnershipLease;
  readonly assertOwnership: () => void;
  readonly state: OwnedBootstrapStateStore;
  readonly journal: BootstrapJournal;
  readonly privatePostgresSession: PrivatePostgresSessionTracker;
  readonly assertReady: (ready: ReadyPrivatePostgres) => PrivatePostgresSessionToken;
}

// Host ownership handoff owns fresh Host token materialization. Recovery reuses this seam so it
// cannot create a parallel token-authority path.
export function createFreshHostOwnershipToken(): HostOwnershipToken {
  return createHostOwnershipToken();
}

const STAGE_DATABASE_VALIDATED = "bootstrap.host.database_validated";
const STAGE_RESERVATION_ACQUIRED = "bootstrap.host.reservation_acquired";
const STAGE_LEASE_ACQUIRED = "bootstrap.host.lease_acquired";
const STAGE_FENCE_VALIDATED = "bootstrap.host.fence_validated";
const STAGE_TOKEN_PUBLISHED = "bootstrap.host.token_published";
const STAGE_STATE_AUTHORITATIVE_RELOADED =
  "bootstrap.host.state_authoritative_reloaded";
const STAGE_CANONICAL_INITIALIZATION_STARTED =
  "bootstrap.host.canonical_initialization_started";
const STAGE_CANONICAL_INITIALIZATION_SUCCEEDED =
  "bootstrap.host.canonical_initialization_succeeded";
const STAGE_CANONICAL_INITIALIZATION_FAILED =
  "bootstrap.host.canonical_initialization_failed";
const STAGE_FORWARD_HANDOFF_COMPLETED = "bootstrap.host.forward_handoff_completed";
const STAGE_EXISTING_OWNER_DETECTED = "bootstrap.host.existing_owner_detected";
const STAGE_HANDOFF_FAILED = "bootstrap.host.handoff_failed";

function instant(): string {
  return new Date().toISOString();
}

function problemCodeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("problem" in error)) {
    return undefined;
  }
  const problem = error.problem;
  if (typeof problem !== "object" || problem === null || !("problemCode" in problem)) {
    return undefined;
  }
  return typeof problem.problemCode === "string" ? problem.problemCode : undefined;
}

function handoffProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: "conflict" | "integrity" | "unavailable" = "integrity",
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category,
    retryClass: "manual",
    title,
    detail,
  });
}

function existingOwnerProblem(): ProblemError {
  return handoffProblem(
    "bootstrap.host.existing_owner_detected",
    "Another Host already owns PostgreSQL",
    "The bootstrap attempt yielded without mutating ownership state or controlling the already-running PostgreSQL process",
    "conflict",
  );
}

function releaseUncertainProblem(): ProblemError {
  return handoffProblem(
    "bootstrap.host.handoff_release_uncertain",
    "Bootstrap to Host handoff release is uncertain",
    "Bootstrap ownership could not be proven released after Host token publication",
    "integrity",
  );
}

function ownershipLostDuringHandoffProblem(): ProblemError {
  return handoffProblem(
    "bootstrap.host.ownership_lost_during_handoff",
    "Host ownership was lost during handoff",
    "The Host lease was not active after bootstrap ownership release",
    "integrity",
  );
}

function currentBootstrapStateRequiredProblem(): ProblemError {
  return handoffProblem(
    "bootstrap.host.current_state_required",
    "Current BootstrapState is required for Host handoff",
    "Canonical Host initialization requires the current committed BootstrapState; empty, corrupt, or recovered state cannot authorize normal Host exposure",
    "integrity",
  );
}

async function recordStage(
  context: OwnedBootstrapPreludeHandoffContext,
  stage: string,
  outcome: "STARTED" | "SUCCEEDED" | "FAILED",
  problemCode?: string,
): Promise<void> {
  await context.journal.checkpoint({
    schemaVersion: 1,
    bootId: context.bootId,
    bootstrapActivityId: context.bootstrapActivityId,
    installationId: context.installationId,
    instanceId: context.instanceId,
    stage,
    at: instant(),
    outcome,
    ...(problemCode ? { problemCode } : {}),
  });
}

function passwordProvider(
  context: OwnedBootstrapPreludeHandoffContext,
  keyProvider: BootstrapKeyProvider,
): BootstrapAdminPasswordProvider {
  return {
    withBootstrapPassword(use) {
      return keyProvider.withPrivatePostgresBootstrapPassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-bootstrap-superuser",
        },
        use,
      );
    },
    withHostLeasePassword(use) {
      return keyProvider.withPrivatePostgresHostLeasePassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-host-lease-role",
        },
        use,
      );
    },
    withRuntimePassword(use) {
      return keyProvider.withPrivatePostgresRuntimePassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-runtime-role",
        },
        use,
      );
    },
    withMigrationPassword(use) {
      return keyProvider.withPrivatePostgresMigrationPassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-migration-role",
        },
        use,
      );
    },
  };
}

function stateOf(connection: {
  readonly state: "ACQUIRING" | "ACTIVE" | "FENCED" | "CLOSING" | "CLOSED";
}): HostOwnershipState {
  return connection.state === "ACQUIRING" ? "FENCED" : connection.state;
}

function createContext(
  context: OwnedBootstrapPreludeHandoffContext,
  connection: Awaited<ReturnType<typeof acquireHostLeaseConnection>>,
  token: ReturnType<typeof createHostOwnershipToken>,
  bootId: ReadyPrivatePostgres["bootId"] = context.bootId,
): HostOwnershipContext {
  return Object.freeze({
    installationId: context.installationId,
    instanceId: context.instanceId,
    bootId,
    token,
    get state() {
      return stateOf(connection);
    },
    signal: connection.signal,
    assertActive() {
      connection.assertActive();
    },
    close() {
      return connection.close();
    },
  });
}

interface HostHandoffResult {
  readonly host: HostOwnershipContext;
  readonly continuityEpochId: ContinuityEpochId;
}

async function handoffPrivatePostgresToHostForOwnedPreludeInternal(
  context: OwnedBootstrapPreludeHandoffContext,
  ready: ReadyPrivatePostgres,
  options: HostOwnershipHandoffOptions,
): Promise<HostHandoffResult> {
  const sessionToken = context.assertReady(ready);
  if (
    ready.installationId !== context.installationId ||
    ready.instanceId !== context.instanceId ||
    ready.bootId !== context.bootId
  ) {
    throw handoffProblem(
      "bootstrap.host.ready_identity_mismatch",
      "Ready private PostgreSQL identity does not match bootstrap ownership",
      "The ReadyPrivatePostgres handle does not belong to this owned bootstrap prelude",
      "integrity",
    );
  }

  const provider = passwordProvider(context, options.keyProvider);
  const mutationAuthority: BootstrapMutationAuthority = Object.freeze({
    assertCurrent: context.assertOwnership,
  });
  const advisoryKey = deriveHostAdvisoryKey(context.instanceId);
  let reservation: Awaited<ReturnType<typeof acquireBootstrapHostReservation>> =
    undefined;
  let reservationReleased = false;
  let leaseConnection:
    Awaited<ReturnType<typeof acquireHostLeaseConnection>> | undefined;
  let token: ReturnType<typeof createHostOwnershipToken> | undefined;
  let continuityEpochId: ContinuityEpochId | undefined;
  let canonicalInitializationStarted = false;
  let canonicalInitializationSucceeded = false;
  let terminalHandoff = false;

  try {
    context.assertOwnership();
    const databaseInspection = await inspectCanonicalHostDatabase({
      port: ready.port,
      passwordProvider: provider,
      mutationAuthority,
      clientFactory: options.clientFactory,
    });

    if (databaseInspection.exists) {
      reservation = await acquireBootstrapHostReservation({
        port: ready.port,
        advisoryKey,
        passwordProvider: provider,
        mutationAuthority,
        clientFactory: options.clientFactory,
      });
    } else {
      await provisionHostOwnershipDatabase({
        port: ready.port,
        passwordProvider: provider,
        mutationAuthority,
        clientFactory: options.clientFactory,
      });
      reservation = await acquireBootstrapHostReservation({
        port: ready.port,
        advisoryKey,
        passwordProvider: provider,
        mutationAuthority,
        clientFactory: options.clientFactory,
      });
    }
    if (reservation === undefined) {
      context.assertOwnership();
      await recordStage(context, STAGE_EXISTING_OWNER_DETECTED, "SUCCEEDED");
      context.assertOwnership();
      context.privatePostgresSession.markYieldedToExistingHost(sessionToken);
      terminalHandoff = true;
      context.assertOwnership();
      await context.ownership.release();
      throw existingOwnerProblem();
    }
    if (databaseInspection.exists) {
      await provisionHostOwnershipDatabase({
        port: ready.port,
        passwordProvider: provider,
        mutationAuthority,
        clientFactory: options.clientFactory,
      });
    }
    context.assertOwnership();
    await recordStage(context, STAGE_DATABASE_VALIDATED, "SUCCEEDED");
    context.assertOwnership();
    await recordStage(context, STAGE_RESERVATION_ACQUIRED, "SUCCEEDED");

    await ensureHostOwnershipSchema({
      port: ready.port,
      instanceId: context.instanceId,
      passwordProvider: provider,
      mutationAuthority,
      clientFactory: options.clientFactory,
    });
    context.assertOwnership();
    await recordStage(context, STAGE_FENCE_VALIDATED, "SUCCEEDED");

    context.assertOwnership();
    await reservation.release();
    context.assertOwnership();
    reservationReleased = true;
    reservation = undefined;

    leaseConnection = await acquireHostLeaseConnection({
      target: {
        host: "127.0.0.1" as const,
        port: ready.port,
        database: HOST_OWNERSHIP_CANONICAL_DATABASE,
      },
      advisoryKey,
      timing: options.timing,
      passwordProvider: provider,
      mutationAuthority,
      clientFactory: options.clientFactory,
    });
    context.assertOwnership();
    await recordStage(context, STAGE_LEASE_ACQUIRED, "SUCCEEDED");

    token = createHostOwnershipToken();
    await publishHostOwnershipToken({
      connection: leaseConnection,
      instanceId: context.instanceId,
      bootId: context.bootId,
      token,
      fenceLockTimeoutMs: options.timing.fenceLockTimeoutMs,
      statementTimeoutMs: options.timing.statementTimeoutMs,
      mutationAuthority,
    });
    context.assertOwnership();
    await recordStage(context, STAGE_TOKEN_PUBLISHED, "SUCCEEDED");

    const activeLeaseConnection = leaseConnection;
    const activeToken = token;
    if (activeLeaseConnection === undefined || activeToken === undefined) {
      throw handoffProblem(
        "bootstrap.host.migration_authority_unavailable",
        "Canonical migration authority is unavailable",
        "Host token and lease must both be present before canonical initialization",
        "integrity",
      );
    }
    const admission = await admitCanonicalHost({
      installationId: context.installationId,
      instanceId: context.instanceId,
      bootId: context.bootId,
      token: activeToken,
      port: ready.port,
      bootstrapOwnership: context.ownership,
      hostLeaseConnection: activeLeaseConnection,
      keyProvider: options.keyProvider,
      loadCurrentContinuityEpochId: async () => {
        const currentState = await context.state.load();
        if (currentState.status !== "CURRENT") {
          throw currentBootstrapStateRequiredProblem();
        }
        continuityEpochId = currentState.value.state.continuityEpochId;
        context.assertOwnership();
        await recordStage(context, STAGE_STATE_AUTHORITATIVE_RELOADED, "SUCCEEDED");
        return continuityEpochId;
      },
      initializeCanonicalHost: async (initialization) => {
        canonicalInitializationStarted = true;
        await recordStage(context, STAGE_CANONICAL_INITIALIZATION_STARTED, "STARTED");
        await options.initializeCanonicalHost(initialization);
      },
    });
    continuityEpochId = admission.continuityEpochId;
    canonicalInitializationSucceeded = true;
    await recordStage(context, STAGE_CANONICAL_INITIALIZATION_SUCCEEDED, "SUCCEEDED");

    context.assertOwnership();
    context.privatePostgresSession.markHandedOff(sessionToken);
    terminalHandoff = true;
    context.assertOwnership();
    try {
      await context.ownership.release();
    } catch {
      throw releaseUncertainProblem();
    }
    await recordStage(context, STAGE_FORWARD_HANDOFF_COMPLETED, "SUCCEEDED");
    try {
      leaseConnection.assertActive();
    } catch {
      throw ownershipLostDuringHandoffProblem();
    }
    return {
      host: createContext(context, activeLeaseConnection, activeToken),
      continuityEpochId,
    };
  } catch (error) {
    if (reservation !== undefined && !reservationReleased) {
      await reservation.release().catch(() => undefined);
    }
    if (leaseConnection !== undefined) {
      await leaseConnection.close().catch(() => undefined);
    }

    if (
      !terminalHandoff &&
      reservationReleased &&
      ready.startupDisposition === "STARTED_BY_THIS_BOOTSTRAP" &&
      context.privatePostgresSession.state === "READY"
    ) {
      try {
        context.assertOwnership();
        await ready.stop();
      } catch {
        // The original handoff failure remains authoritative; release stays fenced.
      }
    }

    if (!terminalHandoff) {
      if (canonicalInitializationStarted && !canonicalInitializationSucceeded) {
        await recordStage(
          context,
          STAGE_CANONICAL_INITIALIZATION_FAILED,
          "FAILED",
          problemCodeOf(error) ?? "bootstrap.host.canonical_initialization_failed",
        ).catch(() => undefined);
      }
      await recordStage(
        context,
        STAGE_HANDOFF_FAILED,
        "FAILED",
        problemCodeOf(error),
      ).catch(() => undefined);
    }
    throw error;
  }
}

export async function handoffPrivatePostgresToHostForOwnedPrelude(
  context: OwnedBootstrapPreludeHandoffContext,
  ready: ReadyPrivatePostgres,
  options: HostOwnershipHandoffOptions,
): Promise<HostOwnershipContext> {
  return (
    await handoffPrivatePostgresToHostForOwnedPreludeInternal(context, ready, options)
  ).host;
}

export async function handoffPrivatePostgresToManagedHostForOwnedPrelude(
  context: OwnedBootstrapPreludeHandoffContext,
  ready: ReadyPrivatePostgres,
  options: HostOwnershipHandoffOptions,
): Promise<BootstrapManagedHostContext> {
  const privatePostgres = getPrivatePostgresMaintenanceDescriptor(ready);
  const handoff = await handoffPrivatePostgresToHostForOwnedPreludeInternal(
    context,
    ready,
    options,
  );
  const raw = handoff.host;
  const createManagedHost = (
    host: HostOwnershipContext,
  ): BootstrapManagedHostContext => {
    let managed: BootstrapManagedHostContext;
    let oldHostRetirementPromise: Promise<void> | undefined;
    const beginOldHostRetirement = (): Promise<void> => {
      if (oldHostRetirementPromise !== undefined) {
        return oldHostRetirementPromise;
      }
      markManagedHostTerminal(managed);
      try {
        oldHostRetirementPromise = host.close();
      } catch (error) {
        oldHostRetirementPromise = Promise.reject(error);
      }
      return oldHostRetirementPromise;
    };
    const provenance: HostMaintenanceOperationProvenance = {
      host,
      bootstrap: context,
      handoff: options,
      privatePostgres,
      beginOldHostRetirement,
      createHostToken: createHostOwnershipToken,
      createHostContext: (connection, token, bootId = context.bootId) =>
        createContext(context, connection, token, bootId),
      createManagedHost,
    };
    managed = createManagedHostContext(
      host,
      createHostMaintenanceOperations({
        ...provenance,
        executeEnteredWindow: async (window) => {
          if (window.request.kind === "STOP_PRIVATE_POSTGRES") {
            return createStopPrivatePostgresEnteredWindowExecutor(provenance)(window);
          }
          return createRestartPrivatePostgresEnteredWindowExecutor(provenance)(window);
        },
      }),
      {
        continuityEpochId: handoff.continuityEpochId,
        target: {
          host: "127.0.0.1",
          port: ready.port,
          database: HOST_OWNERSHIP_CANONICAL_DATABASE,
          user: HOST_RUNTIME_ROLE,
        },
        withRuntimeDatabasePassword(use) {
          return options.keyProvider.withPrivatePostgresRuntimePassword(
            {
              installationId: context.installationId,
              instanceId: context.instanceId,
              bootId: host.bootId,
              purpose: "private-postgres-runtime-role",
            },
            use,
          );
        },
      },
    );
    return managed;
  };
  return createManagedHost(raw);
}
