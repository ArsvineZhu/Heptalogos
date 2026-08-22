import {
  createMaintenanceOperationId,
  type BootstrapStateBodyV2,
  type BootstrapStateEnvelopeV2,
  type MaintenanceJournalBodyV1,
  type MaintenanceOperationId,
  type MaintenanceOperationType,
  type MaintenanceStage,
} from "@heptalogos/bootstrap-state";
import {
  inspectHostOwnershipCanonicalSnapshot,
  revokeHostOwnershipTokenForBootstrap,
  type HostOwnershipCanonicalSnapshot,
  type HostOwnershipContext,
} from "@heptalogos/host-ownership";
import {
  parseBootId,
  parseHostOwnershipToken,
  ProblemError,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  acquireBootstrapOwnership,
  type BootstrapOwnershipLease,
} from "./bootstrap-ownership.js";
import {
  openMaintenanceStateAccess,
  type OwnedMaintenanceStateAccess,
} from "./maintenance-state-access.js";
import { createHostMaintenanceTracker } from "./host-maintenance-machine.js";
import type {
  HostMaintenanceQuiescence,
  HostQuiescenceLease,
  ManagedHostOperations,
  PreparedMaintenanceState,
  PreparedPrivatePostgresMaintenance,
  PrivatePostgresMaintenanceRequest,
  PrivatePostgresMaintenanceResult,
} from "./managed-host.js";
import type {
  HostOwnershipHandoffOptions,
  OwnedBootstrapPreludeHandoffContext,
} from "./host-ownership-handoff.js";
import type { PrivatePostgresMaintenanceDescriptor } from "./private-postgres-bootstrap.js";

const DEFAULT_BOOTSTRAP_HEARTBEAT_MS = 1_000;

export interface EnteredMaintenanceWindow {
  readonly operationId: MaintenanceOperationId;
  readonly request: PrivatePostgresMaintenanceRequest;
  readonly lease: BootstrapOwnershipLease;
  readonly access: OwnedMaintenanceStateAccess;
  readonly journal: MaintenanceJournalBodyV1;
  advance(
    stage: MaintenanceStage,
    changes?: Partial<MaintenanceJournalBodyV1>,
  ): Promise<void>;
}

export interface HostMaintenanceOperationProvenance {
  readonly host: HostOwnershipContext;
  readonly bootstrap: OwnedBootstrapPreludeHandoffContext;
  readonly handoff: HostOwnershipHandoffOptions;
  readonly privatePostgres: PrivatePostgresMaintenanceDescriptor;
  readonly executeEnteredWindow?: (
    window: EnteredMaintenanceWindow,
  ) => Promise<PrivatePostgresMaintenanceResult>;
  readonly onOldHostTerminal?: () => void;
}

function maintenanceProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "integrity",
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

function decimalRevision(value: string | number): string {
  if (typeof value === "string" && /^(0|[1-9][0-9]*)$/u.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  throw maintenanceProblem(
    "bootstrap.maintenance.invalid_fence",
    "HostOwnershipFence revision is invalid",
    "The current HostOwnershipFence revision is not an unsigned decimal value",
  );
}

function stateBody(
  loaded: Awaited<ReturnType<OwnedMaintenanceStateAccess["state"]["load"]>>,
): BootstrapStateEnvelopeV2 {
  if (loaded.status === "EMPTY") {
    throw maintenanceProblem(
      "bootstrap.maintenance.bootstrap_state_required",
      "BootstrapState is required for maintenance",
      "M5A cannot enter maintenance without authoritative BootstrapState",
    );
  }
  if (loaded.status === "CORRUPT") throw new ProblemError(loaded.problem);
  if (loaded.value.state.schemaVersion !== 2) {
    throw maintenanceProblem(
      "bootstrap.maintenance.private_postgres_state_required",
      "M4 private PostgreSQL state is required for maintenance",
      "M5A requires BootstrapState V2 private PostgreSQL identity",
    );
  }
  return loaded.value as BootstrapStateEnvelopeV2;
}

function assertPrivatePostgresIdentity(
  state: BootstrapStateBodyV2,
  descriptor: PrivatePostgresMaintenanceDescriptor,
): void {
  const persisted = state.privatePostgres;
  if (
    persisted.schemaVersion !== 2 ||
    persisted.installationId !== descriptor.expectedIdentity.installationId ||
    persisted.instanceId !== descriptor.expectedIdentity.instanceId ||
    persisted.persistedPort !== descriptor.expectedIdentity.persistedPort ||
    persisted.clusterSystemIdentifier !==
      descriptor.expectedIdentity.clusterSystemIdentifier ||
    persisted.initializationProfileRevision !==
      descriptor.expectedIdentity.initializationProfileRevision
  ) {
    throw maintenanceProblem(
      "bootstrap.maintenance.private_postgres_identity_mismatch",
      "Private PostgreSQL identity does not match maintenance provenance",
      "The authoritative BootstrapState cluster identity, port, or initialization profile does not match the retained M4 descriptor",
    );
  }
}

function assertCurrentFence(
  snapshot: HostOwnershipCanonicalSnapshot,
  host: HostOwnershipContext,
): string {
  if (snapshot.fence.length !== 1) {
    throw maintenanceProblem(
      "bootstrap.maintenance.invalid_fence",
      "HostOwnershipFence snapshot is invalid",
      "The maintenance entry snapshot did not contain exactly one HostOwnershipFence row",
    );
  }
  const row = snapshot.fence[0];
  if (
    row.instance_id !== host.instanceId ||
    row.host_ownership_token !== host.token ||
    row.boot_id !== host.bootId ||
    parseHostOwnershipToken(row.host_ownership_token) !== host.token ||
    parseBootId(row.boot_id) !== host.bootId
  ) {
    throw maintenanceProblem(
      "bootstrap.maintenance.fence_mismatch",
      "HostOwnershipFence does not match the current Host",
      "The maintenance entry snapshot did not prove the exact current Host token, BootId, and InstanceId",
      "conflict",
    );
  }
  return decimalRevision(row.ownership_revision);
}

function passwordProvider(
  context: OwnedBootstrapPreludeHandoffContext,
  handoff: HostOwnershipHandoffOptions,
) {
  return {
    withBootstrapPassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return handoff.keyProvider.withPrivatePostgresBootstrapPassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-bootstrap-superuser",
        },
        use,
      );
    },
    withHostLeasePassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return handoff.keyProvider.withPrivatePostgresHostLeasePassword(
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

function operationTypeOf(
  request: PrivatePostgresMaintenanceRequest,
): MaintenanceOperationType {
  return request.kind === "RESTART_PRIVATE_POSTGRES"
    ? "PRIVATE_POSTGRES_RESTART"
    : "PRIVATE_POSTGRES_STOP";
}

function targetPostgresOf(
  request: PrivatePostgresMaintenanceRequest,
): "RUNNING_SAME_IDENTITY" | "STOPPED" {
  return request.kind === "RESTART_PRIVATE_POSTGRES"
    ? "RUNNING_SAME_IDENTITY"
    : "STOPPED";
}

function initialJournalBody(
  operationId: MaintenanceOperationId,
  request: PrivatePostgresMaintenanceRequest,
  context: OwnedBootstrapPreludeHandoffContext,
  host: HostOwnershipContext,
  state: BootstrapStateEnvelopeV2,
  ownershipRevision: string,
): MaintenanceJournalBodyV1 {
  if (state.state.privatePostgres.schemaVersion !== 2) {
    throw maintenanceProblem(
      "bootstrap.maintenance.private_postgres_state_required",
      "Private PostgreSQL state is not current",
      "M5A requires the M4 private PostgreSQL state revision",
    );
  }
  return {
    schemaVersion: 1,
    revision: 1,
    operationId,
    activityId: context.bootstrapActivityId,
    installationId: context.installationId,
    instanceId: context.instanceId,
    bootId: context.bootId,
    operationType: operationTypeOf(request),
    source: {
      hostOwnershipToken: host.token,
      hostOwnershipRevision: ownershipRevision,
      postgresClusterSystemIdentifier:
        state.state.privatePostgres.clusterSystemIdentifier,
      persistedPort: state.state.privatePostgres.persistedPort,
    },
    target: { privatePostgres: targetPostgresOf(request) },
    verifiedPrerequisites: {
      bootstrapStateDigest: state.digest,
      privatePostgresInitializationProfileRevision:
        state.state.privatePostgres.initializationProfileRevision,
    },
    lastCompletedStage: "BOOTSTRAP_OWNERSHIP_ACQUIRED",
    updatedAt: new Date().toISOString(),
  };
}

function isKnownNotCommitted(error: unknown): boolean {
  return problemCodeOf(error) === "host-ownership.revocation.known_not_committed";
}

function isRevocationUncertain(error: unknown): boolean {
  return (
    problemCodeOf(error) === "host-ownership.revocation.commit_uncertain" ||
    problemCodeOf(error) === "host-ownership.revocation.committed_unverified"
  );
}

export function createHostMaintenanceOperations(
  provenance: HostMaintenanceOperationProvenance,
): ManagedHostOperations {
  return {
    preparePrivatePostgresMaintenance(request) {
      return prepareMaintenance(provenance, request);
    },
    async shutdownKeepingPrivatePostgres(quiescence) {
      await quiescence.quiesce();
      provenance.host.assertActive();
      await provenance.host.close();
      if (provenance.host.state !== "CLOSED") {
        throw maintenanceProblem(
          "bootstrap.maintenance.host_close_unverified",
          "Host lease close could not be verified",
          "The managed Host lease did not reach CLOSED after quiescence",
        );
      }
      provenance.onOldHostTerminal?.();
    },
  };
}

async function prepareMaintenance(
  provenance: HostMaintenanceOperationProvenance,
  request: PrivatePostgresMaintenanceRequest,
): Promise<PreparedPrivatePostgresMaintenance> {
  const instanceRoot = provenance.bootstrap.paths.resolve("INSTANCE");
  const lease = await acquireBootstrapOwnership(instanceRoot, {
    heartbeatMs:
      provenance.handoff.bootstrapHeartbeatMs ?? DEFAULT_BOOTSTRAP_HEARTBEAT_MS,
  });
  let returned = false;
  try {
    const access = openMaintenanceStateAccess(provenance.bootstrap.paths, lease);
    provenance.host.assertActive();
    lease.assertHeld();
    const state = stateBody(await access.state.load());
    assertPrivatePostgresIdentity(state.state, provenance.privatePostgres);
    const provider = passwordProvider(provenance.bootstrap, provenance.handoff);
    const snapshot = await inspectHostOwnershipCanonicalSnapshot({
      port: state.state.privatePostgres.persistedPort,
      passwordProvider: provider,
      clientFactory: provenance.handoff.clientFactory,
    });
    lease.assertHeld();
    provenance.host.assertActive();
    const ownershipRevision = assertCurrentFence(snapshot, provenance.host);
    const operationId = createMaintenanceOperationId();
    const initial = initialJournalBody(
      operationId,
      request,
      provenance.bootstrap,
      provenance.host,
      state,
      ownershipRevision,
    );
    await access.journal.create(initial);
    await access.commitOperationPointer(operationId);
    const prepared = createPreparedMaintenance(
      provenance,
      request,
      lease,
      access,
      initial,
    );
    returned = true;
    return prepared;
  } finally {
    if (!returned) await lease.release().catch(() => undefined);
  }
}

function createPreparedMaintenance(
  provenance: HostMaintenanceOperationProvenance,
  request: PrivatePostgresMaintenanceRequest,
  lease: BootstrapOwnershipLease,
  access: OwnedMaintenanceStateAccess,
  initial: MaintenanceJournalBodyV1,
): PreparedPrivatePostgresMaintenance {
  let body = initial;
  let lifecycleState: PreparedMaintenanceState = "PREPARED";
  let quiescenceLease: HostQuiescenceLease | undefined;
  let ponr = false;
  let revocationAttempted = false;
  const tracker = createHostMaintenanceTracker();

  const advance = async (
    stage: MaintenanceStage,
    changes: Partial<MaintenanceJournalBodyV1> = {},
  ): Promise<void> => {
    const next: MaintenanceJournalBodyV1 = {
      ...body,
      ...changes,
      revision: body.revision + 1,
      lastCompletedStage: stage,
      updatedAt: new Date().toISOString(),
    };
    await access.journal.advance(next);
    body = next;
  };

  const markRecoveryRequired = async (error: unknown): Promise<void> => {
    lifecycleState = "RECOVERY_REQUIRED";
    if (tracker.can({ type: "RECOVERY_REQUIRED" })) {
      tracker.send({ type: "RECOVERY_REQUIRED" });
    }
    if (lease.state === "HELD") {
      await advance("RECOVERY_REQUIRED", {
        terminalOutcome: isRevocationUncertain(error) ? "UNCERTAIN" : "FAILED",
        problemCode: problemCodeOf(error),
      }).catch(() => undefined);
    }
  };

  const safeAbort = async (error: unknown): Promise<void> => {
    try {
      if (quiescenceLease !== undefined) {
        await quiescenceLease.resumeAfterAbort();
      }
      if (tracker.can({ type: "ABORTED" })) tracker.send({ type: "ABORTED" });
      await advance("ABORTED", { terminalOutcome: "ABORTED" });
      lifecycleState = "ABORTED";
      await lease.release();
    } catch (abortError) {
      await markRecoveryRequired(abortError);
    }
    void error;
  };

  const execute = async (
    quiescence: HostMaintenanceQuiescence,
  ): Promise<PrivatePostgresMaintenanceResult> => {
    if (lifecycleState !== "PREPARED") {
      throw maintenanceProblem(
        "bootstrap.maintenance.invalid_state",
        "Prepared maintenance capability is not executable",
        `The maintenance capability is ${lifecycleState}`,
        "conflict",
      );
    }
    try {
      lease.assertHeld();
      provenance.host.assertActive();
      quiescenceLease = await quiescence.quiesce();
      tracker.send({ type: "QUIESCENCE_PROVEN" });
      lifecycleState = "QUIESCED";
      await advance("HOST_QUIESCED");

      lease.assertHeld();
      provenance.host.assertActive();
      const provider = passwordProvider(provenance.bootstrap, provenance.handoff);
      revocationAttempted = true;
      await revokeHostOwnershipTokenForBootstrap({
        port: body.source.persistedPort,
        instanceId: provenance.host.instanceId,
        bootId: provenance.host.bootId,
        token: provenance.host.token,
        lockTimeoutMs: provenance.handoff.timing.fenceLockTimeoutMs,
        statementTimeoutMs: provenance.handoff.timing.statementTimeoutMs,
        passwordProvider: provider,
        mutationAuthority: { assertCurrent: () => lease.assertHeld() },
        clientFactory: provenance.handoff.clientFactory,
      });
      ponr = true;
      tracker.send({ type: "TOKEN_REVOKED" });
      lifecycleState = "TOKEN_REVOKED";
      await advance("HOST_TOKEN_REVOKED");

      provenance.host.assertActive();
      await provenance.host.close();
      if (provenance.host.state !== "CLOSED") {
        throw maintenanceProblem(
          "bootstrap.maintenance.host_close_unverified",
          "Host lease close could not be verified",
          "The old Host lease did not reach CLOSED after token revocation",
        );
      }
      await advance("HOST_LEASE_CLOSED");
      tracker.send({ type: "WINDOW_ENTERED" });
      lifecycleState = "ENTERED";
      provenance.onOldHostTerminal?.();

      if (provenance.executeEnteredWindow === undefined) {
        throw maintenanceProblem(
          "bootstrap.maintenance.executor_not_ready",
          "Maintenance window executor is not ready",
          "The reverse-handoff entry is proven but no bounded PostgreSQL maintenance action is connected",
          "unavailable",
        );
      }
      return await provenance.executeEnteredWindow({
        operationId: body.operationId,
        request,
        lease,
        access,
        journal: body,
        advance,
      });
    } catch (error) {
      if (!ponr && (!revocationAttempted || isKnownNotCommitted(error))) {
        await safeAbort(error);
      } else if (ponr || isRevocationUncertain(error)) {
        await markRecoveryRequired(error);
      }
      throw error;
    }
  };

  const abortBeforeEntry = async (): Promise<void> => {
    if (lifecycleState !== "PREPARED") {
      throw maintenanceProblem(
        "bootstrap.maintenance.abort_after_entry",
        "Maintenance capability cannot abort after entry",
        "abortBeforeEntry is legal only while the old Host token is still current",
        "conflict",
      );
    }
    await advance("ABORTED", { terminalOutcome: "ABORTED" });
    lifecycleState = "ABORTED";
    await lease.release();
  };

  return {
    operationId: body.operationId,
    get state() {
      return lifecycleState;
    },
    signal: lease.signal,
    execute,
    abortBeforeEntry,
  };
}
