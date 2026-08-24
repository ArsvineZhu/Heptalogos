import {
  type BootstrapActivityId,
  type BootstrapJournal,
  createMaintenanceOperationId,
  type BootstrapStateBodyV1,
  type BootstrapStateEnvelopeV1,
  type MaintenanceJournalBodyV1,
  type MaintenanceOperationId,
  type MaintenanceOperationType,
  type MaintenanceStage,
} from "@heptalogos/bootstrap-state";
import {
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  inspectHostOwnershipCanonicalSnapshot,
  publishHostOwnershipToken,
  revokeHostOwnershipTokenForBootstrap,
  type HostOwnershipCanonicalSnapshot,
  type HostOwnershipContext,
} from "@heptalogos/host-ownership";
import { openPrivatePostgresMaintenanceController } from "@heptalogos/private-postgres";
import {
  createBootId,
  parseBootId,
  parseHostOwnershipToken,
  ProblemError,
  type BootId,
  type HostOwnershipToken,
  type InstallationId,
  type InstanceId,
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
import {
  createHostMaintenanceTracker,
  type HostMaintenanceEvent,
} from "./host-maintenance-machine.js";
import { admitCanonicalHost } from "./canonical-host-admission.js";
import type {
  BootstrapManagedHostContext,
  HostMaintenanceQuiescence,
  HostQuiescenceLease,
  ManagedHostOperations,
  PreparedPrivatePostgresMaintenance,
  PrivatePostgresMaintenanceRequest,
  PrivatePostgresMaintenanceResult,
} from "./managed-host.js";
import type { HostOwnershipHandoffOptions } from "./host-ownership-handoff.js";
import type { PrivatePostgresMaintenanceDescriptor } from "./private-postgres-bootstrap.js";
import type { BootstrapPathProfile } from "./roots.js";

type CurrentPrivatePostgresStateEnvelope = BootstrapStateEnvelopeV1 & {
  readonly state: BootstrapStateBodyV1 & {
    readonly privatePostgres: NonNullable<BootstrapStateBodyV1["privatePostgres"]>;
  };
};

const DEFAULT_BOOTSTRAP_HEARTBEAT_MS = 1_000;

export interface HostMaintenanceBootstrapContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
}

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
  complete(): void;
}

export interface HostMaintenanceOperationProvenance {
  readonly host: HostOwnershipContext;
  readonly bootstrap: HostMaintenanceBootstrapContext;
  readonly handoff: HostOwnershipHandoffOptions;
  readonly privatePostgres: PrivatePostgresMaintenanceDescriptor;
  readonly beginOldHostRetirement?: () => Promise<void>;
  readonly createHostToken?: () => HostOwnershipToken;
  readonly createHostContext?: (
    connection: Awaited<ReturnType<typeof acquireHostLeaseConnection>>,
    token: HostOwnershipToken,
    bootId?: BootId,
  ) => HostOwnershipContext;
  readonly createManagedHost?: (
    raw: HostOwnershipContext,
  ) => BootstrapManagedHostContext;
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

function safeAbortResumeFailureProblem(error: unknown): ProblemError {
  return maintenanceProblem(
    "bootstrap.maintenance.abort_resume_failed",
    "The old Host could not be safely resumed",
    `The pre-point-of-no-return abort could not complete its quiescence resume proof${problemCodeOf(error) === undefined ? "" : ` (${problemCodeOf(error)})`}`,
    "integrity",
  );
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
): CurrentPrivatePostgresStateEnvelope {
  if (loaded.status === "EMPTY") {
    throw maintenanceProblem(
      "bootstrap.maintenance.bootstrap_state_required",
      "BootstrapState is required for maintenance",
      "Host maintenance requires authoritative BootstrapState",
    );
  }
  if (loaded.status === "CORRUPT") throw new ProblemError(loaded.problem);
  if (loaded.status === "RECOVERED_PREVIOUS") {
    throw maintenanceProblem(
      "bootstrap.state.current_authority_required",
      "Current BootstrapState authority is required",
      "A recovered previous BootstrapState revision is inspection evidence only and cannot authorize host maintenance",
    );
  }
  if (loaded.value.state.privatePostgres === undefined) {
    throw maintenanceProblem(
      "bootstrap.maintenance.private_postgres_state_required",
      "Private PostgreSQL state is required for maintenance",
      "Maintenance requires BootstrapState with canonical private PostgreSQL identity",
    );
  }
  return loaded.value as CurrentPrivatePostgresStateEnvelope;
}

function assertPrivatePostgresIdentity(
  state: BootstrapStateBodyV1,
  descriptor: PrivatePostgresMaintenanceDescriptor,
): void {
  const persisted = state.privatePostgres;
  if (
    persisted === undefined ||
    persisted.schemaVersion !== 1 ||
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
      "The authoritative BootstrapState cluster identity, port, or initialization profile does not match the retained maintenance descriptor",
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
  context: HostMaintenanceBootstrapContext,
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
    withRuntimePassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return handoff.keyProvider.withPrivatePostgresRuntimePassword(
        {
          installationId: context.installationId,
          instanceId: context.instanceId,
          bootId: context.bootId,
          purpose: "private-postgres-runtime-role",
        },
        use,
      );
    },
    withMigrationPassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return handoff.keyProvider.withPrivatePostgresMigrationPassword(
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

function eventForCommittedStage(
  stage: MaintenanceStage,
): HostMaintenanceEvent | undefined {
  switch (stage) {
    case "HOST_QUIESCED":
      return { type: "QUIESCENCE_PROVEN" };
    case "HOST_TOKEN_REVOKED":
      return { type: "TOKEN_REVOKED" };
    case "HOST_LEASE_CLOSED":
      return { type: "WINDOW_ENTERED" };
    case "POSTGRES_STOPPED":
      return { type: "POSTGRES_STOPPED" };
    case "POSTGRES_READY":
      return { type: "POSTGRES_READY" };
    case "HOST_LEASE_ACQUIRED":
      return { type: "HOST_LEASE_ACQUIRED" };
    case "HOST_TOKEN_PUBLISHED":
      return { type: "HOST_REACQUIRED" };
    case "ABORTED":
      return { type: "ABORTED" };
    case "RECOVERY_REQUIRED":
      return { type: "RECOVERY_REQUIRED" };
    default:
      return undefined;
  }
}

function initialJournalBody(
  operationId: MaintenanceOperationId,
  request: PrivatePostgresMaintenanceRequest,
  context: HostMaintenanceBootstrapContext,
  host: HostOwnershipContext,
  state: BootstrapStateEnvelopeV1,
  ownershipRevision: string,
): MaintenanceJournalBodyV1 {
  const privatePostgres = state.state.privatePostgres;
  if (privatePostgres === undefined || privatePostgres.schemaVersion !== 1) {
    throw maintenanceProblem(
      "bootstrap.maintenance.private_postgres_state_required",
      "Private PostgreSQL state is not current",
      "A canonical private PostgreSQL state revision is required",
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
      postgresClusterSystemIdentifier: privatePostgres.clusterSystemIdentifier,
      persistedPort: privatePostgres.persistedPort,
    },
    target: { privatePostgres: targetPostgresOf(request) },
    verifiedPrerequisites: {
      bootstrapStateDigest: state.digest,
      privatePostgresInitializationProfileRevision:
        privatePostgres.initializationProfileRevision,
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
      await (provenance.beginOldHostRetirement?.() ?? provenance.host.close());
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

export function createStopPrivatePostgresEnteredWindowExecutor(
  provenance: HostMaintenanceOperationProvenance,
): (window: EnteredMaintenanceWindow) => Promise<PrivatePostgresMaintenanceResult> {
  return async (window) => {
    const controller = await openPrivatePostgresMaintenanceController({
      ...provenance.privatePostgres,
      assertControlAuthority: () => window.lease.assertHeld(),
    });
    if (controller.state !== "READY") {
      throw maintenanceProblem(
        "bootstrap.maintenance.postgres_not_ready",
        "Private PostgreSQL is not ready for stop",
        "Reverse-handoff entry did not observe the existing private PostgreSQL cluster as READY",
      );
    }
    await controller.stop();
    await window.advance("POSTGRES_STOPPED");
    await window.advance("BOOTSTRAP_RELEASE_ARMED", {
      terminalOutcome: "SUCCEEDED",
    });
    await window.lease.release();
    await Promise.resolve()
      .then(() =>
        provenance.bootstrap.journal.checkpoint({
          schemaVersion: 1,
          bootId: provenance.bootstrap.bootId,
          bootstrapActivityId: provenance.bootstrap.bootstrapActivityId,
          installationId: provenance.bootstrap.installationId,
          instanceId: provenance.bootstrap.instanceId,
          stage: "bootstrap.maintenance.completed",
          at: new Date().toISOString(),
          outcome: "SUCCEEDED",
        }),
      )
      .catch(() => undefined);
    window.complete();
    return { kind: "STOPPED" };
  };
}

export function createRestartPrivatePostgresEnteredWindowExecutor(
  provenance: HostMaintenanceOperationProvenance,
): (window: EnteredMaintenanceWindow) => Promise<PrivatePostgresMaintenanceResult> {
  return async (window) => {
    if (
      provenance.createHostContext === undefined ||
      provenance.createManagedHost === undefined ||
      provenance.createHostToken === undefined
    ) {
      throw maintenanceProblem(
        "bootstrap.maintenance.restart_executor_not_ready",
        "Private PostgreSQL restart executor is incomplete",
        "A restart window requires authentic raw Host and managed Host factories for fresh ownership reacquisition",
        "unavailable",
      );
    }

    const controller = await openPrivatePostgresMaintenanceController({
      ...provenance.privatePostgres,
      assertControlAuthority: () => window.lease.assertHeld(),
    });
    if (controller.state !== "READY") {
      throw maintenanceProblem(
        "bootstrap.maintenance.postgres_not_ready",
        "Private PostgreSQL is not ready for restart",
        "Reverse-handoff entry did not observe the existing private PostgreSQL cluster as READY",
      );
    }

    let rawHost: HostOwnershipContext | undefined;
    let leaseConnection:
      Awaited<ReturnType<typeof acquireHostLeaseConnection>> | undefined;
    let returned = false;
    try {
      await controller.stop();
      await window.advance("POSTGRES_STOPPED");

      await controller.start();
      await window.advance("POSTGRES_READY");

      window.lease.assertHeld();
      leaseConnection = await acquireHostLeaseConnection({
        target: {
          host: "127.0.0.1",
          port: provenance.privatePostgres.expectedIdentity.persistedPort,
          database: HOST_OWNERSHIP_CANONICAL_DATABASE,
        },
        advisoryKey: deriveHostAdvisoryKey(provenance.bootstrap.instanceId),
        timing: provenance.handoff.timing,
        passwordProvider: passwordProvider(provenance.bootstrap, provenance.handoff),
        mutationAuthority: { assertCurrent: () => window.lease.assertHeld() },
        clientFactory: provenance.handoff.clientFactory,
      });
      window.lease.assertHeld();
      await window.advance("HOST_LEASE_ACQUIRED");

      const token = provenance.createHostToken();
      const freshBootId = createBootId();
      const publication = await publishHostOwnershipToken({
        connection: leaseConnection,
        instanceId: provenance.bootstrap.instanceId,
        bootId: freshBootId,
        token,
        fenceLockTimeoutMs: provenance.handoff.timing.fenceLockTimeoutMs,
        statementTimeoutMs: provenance.handoff.timing.statementTimeoutMs,
        mutationAuthority: { assertCurrent: () => window.lease.assertHeld() },
      });
      leaseConnection.assertActive();
      rawHost = provenance.createHostContext(leaseConnection, token, freshBootId);
      rawHost.assertActive();
      await window.advance("HOST_TOKEN_PUBLISHED", {
        target: {
          ...window.journal.target,
          hostOwnershipToken: token,
          hostBootId: freshBootId,
          hostOwnershipRevision: publication.publishedRevision,
        },
      });
      const activeLeaseConnection = leaseConnection;
      if (activeLeaseConnection === undefined) {
        throw maintenanceProblem(
          "bootstrap.maintenance.host_lease_required",
          "A fresh Host lease is required for canonical admission",
          "Maintenance restart cannot expose a managed Host without the newly acquired Host lease",
        );
      }
      await admitCanonicalHost({
        installationId: provenance.bootstrap.installationId,
        instanceId: provenance.bootstrap.instanceId,
        bootId: freshBootId,
        token,
        port: provenance.privatePostgres.expectedIdentity.persistedPort,
        bootstrapOwnership: window.lease,
        hostLeaseConnection: activeLeaseConnection,
        keyProvider: provenance.handoff.keyProvider,
        loadCurrentContinuityEpochId: async () => {
          const currentState = stateBody(await window.access.state.load());
          assertPrivatePostgresIdentity(currentState.state, provenance.privatePostgres);
          return currentState.state.continuityEpochId;
        },
        initializeCanonicalHost: provenance.handoff.initializeCanonicalHost,
      });
      await window.advance("BOOTSTRAP_RELEASE_ARMED", {
        terminalOutcome: "SUCCEEDED",
      });

      await window.lease.release();
      await Promise.resolve()
        .then(() =>
          provenance.bootstrap.journal.checkpoint({
            schemaVersion: 1,
            bootId: provenance.bootstrap.bootId,
            bootstrapActivityId: provenance.bootstrap.bootstrapActivityId,
            installationId: provenance.bootstrap.installationId,
            instanceId: provenance.bootstrap.instanceId,
            stage: "bootstrap.maintenance.completed",
            at: new Date().toISOString(),
            outcome: "SUCCEEDED",
          }),
        )
        .catch(() => undefined);
      window.complete();
      const managedHost = provenance.createManagedHost(rawHost);
      returned = true;
      leaseConnection = undefined;
      return { kind: "RESTARTED", host: managedHost };
    } catch (error) {
      if (!returned) {
        await rawHost?.close().catch(() => undefined);
        await leaseConnection?.close().catch(() => undefined);
      }
      throw error;
    }
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
    bootId: provenance.bootstrap.bootId,
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
  let quiescenceLease: HostQuiescenceLease | undefined;
  let ponr = false;
  let revocationAttempted = false;
  const tracker = createHostMaintenanceTracker();
  let oldHostRetirementPromise: Promise<void> | undefined;
  type OldHostRetirementResult =
    { readonly ok: true } | { readonly ok: false; readonly error: unknown };
  let oldHostRetirementObservation: Promise<OldHostRetirementResult> | undefined;

  const beginOldHostRetirement = (): Promise<void> => {
    if (oldHostRetirementPromise !== undefined) {
      return oldHostRetirementPromise;
    }
    try {
      oldHostRetirementPromise =
        provenance.beginOldHostRetirement?.() ?? provenance.host.close();
    } catch (error) {
      oldHostRetirementPromise = Promise.reject(error);
    }
    return oldHostRetirementPromise;
  };

  const observeOldHostRetirement = (): Promise<OldHostRetirementResult> => {
    if (oldHostRetirementObservation !== undefined) {
      return oldHostRetirementObservation;
    }
    oldHostRetirementObservation = beginOldHostRetirement().then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    return oldHostRetirementObservation;
  };

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
    const event = eventForCommittedStage(stage);
    if (event !== undefined) tracker.assertCan(event);
    await access.journal.advance(next);
    body = next;
    if (event !== undefined) tracker.send(event);
  };

  const markRecoveryRequired = async (error: unknown): Promise<void> => {
    const oldHostRetirement = observeOldHostRetirement();
    if (lease.state === "HELD") {
      await advance("RECOVERY_REQUIRED", {
        terminalOutcome: isRevocationUncertain(error) ? "UNCERTAIN" : "FAILED",
        problemCode: problemCodeOf(error),
      }).catch(() => undefined);
    }
    if (
      tracker.state !== "RECOVERY_REQUIRED" &&
      tracker.can({ type: "RECOVERY_REQUIRED" })
    ) {
      tracker.send({ type: "RECOVERY_REQUIRED" });
    }
    await oldHostRetirement;
  };

  const safeAbort = async (error: unknown): Promise<void> => {
    try {
      if (quiescenceLease !== undefined) {
        lease.assertHeld();
        provenance.host.assertActive();
        const snapshot = await inspectHostOwnershipCanonicalSnapshot({
          port: body.source.persistedPort,
          passwordProvider: passwordProvider(provenance.bootstrap, provenance.handoff),
          clientFactory: provenance.handoff.clientFactory,
        });
        const currentRevision = assertCurrentFence(snapshot, provenance.host);
        if (currentRevision !== body.source.hostOwnershipRevision) {
          throw maintenanceProblem(
            "bootstrap.maintenance.source_fence_changed",
            "The old Host fence changed before safe abort",
            "The pre-point-of-no-return abort could not prove the original Host token and ownership revision were still current",
            "conflict",
          );
        }
        await quiescenceLease.resumeAfterAbort();
      }
      await advance("ABORTED", { terminalOutcome: "ABORTED" });
      await lease.release();
    } catch (abortError) {
      await markRecoveryRequired(abortError);
      throw safeAbortResumeFailureProblem(abortError);
    }
    void error;
  };

  const execute = async (
    quiescence: HostMaintenanceQuiescence,
  ): Promise<PrivatePostgresMaintenanceResult> => {
    if (tracker.state !== "PREPARED") {
      throw maintenanceProblem(
        "bootstrap.maintenance.invalid_state",
        "Prepared maintenance capability is not executable",
        `The maintenance capability is ${tracker.state}`,
        "conflict",
      );
    }
    try {
      lease.assertHeld();
      provenance.host.assertActive();
      quiescenceLease = await quiescence.quiesce();
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
      const oldHostClose = observeOldHostRetirement();
      await advance("HOST_TOKEN_REVOKED");

      const oldHostCloseResult = await oldHostClose;
      if (!oldHostCloseResult.ok) {
        throw oldHostCloseResult.error;
      }
      if (provenance.host.state !== "CLOSED") {
        throw maintenanceProblem(
          "bootstrap.maintenance.host_close_unverified",
          "Host lease close could not be verified",
          "The old Host lease did not reach CLOSED after token revocation",
        );
      }
      await advance("HOST_LEASE_CLOSED");
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
        get journal() {
          return body;
        },
        advance,
        complete() {
          if (!tracker.can({ type: "COMPLETED" })) {
            throw maintenanceProblem(
              "bootstrap.maintenance.invalid_completion",
              "Maintenance completion transition is invalid",
              `The maintenance capability is ${tracker.state}`,
              "conflict",
            );
          }
          tracker.send({ type: "COMPLETED" });
        },
      });
    } catch (error) {
      if (!ponr && (!revocationAttempted || isKnownNotCommitted(error))) {
        await safeAbort(error);
      } else {
        await markRecoveryRequired(error);
      }
      throw error;
    }
  };

  const abortBeforeEntry = async (): Promise<void> => {
    if (tracker.state !== "PREPARED") {
      throw maintenanceProblem(
        "bootstrap.maintenance.abort_after_entry",
        "Maintenance capability cannot abort after entry",
        "abortBeforeEntry is legal only while the old Host token is still current",
        "conflict",
      );
    }
    await advance("ABORTED", { terminalOutcome: "ABORTED" });
    await lease.release();
  };

  return {
    operationId: body.operationId,
    get state() {
      return tracker.state;
    },
    signal: lease.signal,
    execute,
    abortBeforeEntry,
  };
}
