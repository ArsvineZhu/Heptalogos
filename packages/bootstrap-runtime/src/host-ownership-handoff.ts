import {
  createHostOwnershipToken,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import {
  acquireBootstrapHostReservation,
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  ensureHostOwnershipSchema,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  inspectCanonicalHostDatabase,
  provisionHostOwnershipDatabase,
  publishHostOwnershipToken,
  type BootstrapAdminPasswordProvider,
  type BootstrapMutationAuthority,
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
  type PrivatePostgresSessionToken,
  type PrivatePostgresSessionTracker,
  type ReadyPrivatePostgres,
} from "./private-postgres-bootstrap.js";
import type { OwnedBootstrapStateStore } from "./bootstrap-state-access.js";
import type { BootstrapPathProfile } from "./roots.js";

export interface HostOwnershipHandoffOptions {
  readonly keyProvider: BootstrapKeyProvider;
  readonly timing: HostOwnershipTimingOptions;
  readonly clientFactory?: unknown;
}

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

const STAGE_DATABASE_VALIDATED = "bootstrap.host.database_validated";
const STAGE_RESERVATION_ACQUIRED = "bootstrap.host.reservation_acquired";
const STAGE_LEASE_ACQUIRED = "bootstrap.host.lease_acquired";
const STAGE_FENCE_VALIDATED = "bootstrap.host.fence_validated";
const STAGE_TOKEN_PUBLISHED = "bootstrap.host.token_published";
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

async function recordStage(
  context: OwnedBootstrapPreludeHandoffContext,
  stage: string,
  outcome: "STARTED" | "SUCCEEDED" | "FAILED",
  problemCode?: string,
): Promise<void> {
  await context.journal.checkpoint({
    schemaVersion: 2,
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
): HostOwnershipContext {
  return Object.freeze({
    installationId: context.installationId,
    instanceId: context.instanceId,
    bootId: context.bootId,
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

export async function handoffPrivatePostgresToHostForOwnedPrelude(
  context: OwnedBootstrapPreludeHandoffContext,
  ready: ReadyPrivatePostgres,
  options: HostOwnershipHandoffOptions,
): Promise<HostOwnershipContext> {
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
        host: "127.0.0.1",
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
    return createContext(context, leaseConnection, token);
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
