import {
  BootstrapJournal,
  maintenanceOperationRef,
  resolveMaintenanceTargetHostBootId,
  type BootstrapActivityId,
  type BootstrapStateEnvelopeV2,
  type BootstrapStateLoadResult,
  type MaintenanceJournalBodyV1,
  type MaintenanceJournalRecoveryHead,
  type MaintenanceStage,
  type MaintenanceOperationId,
} from "@heptalogos/bootstrap-state";
import {
  createBootId,
  createUuidV7Id,
  parseBootId,
  parseHostOwnershipToken,
  ProblemError,
  type BootId,
  type HostOwnershipToken,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  acquireHostLeaseConnection,
  deriveHostAdvisoryKey,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  inspectHostAdvisoryLease,
  inspectHostOwnershipCanonicalSnapshot,
  publishHostOwnershipToken,
  revokeHostOwnershipTokenForBootstrap,
  type HostOwnershipCanonicalSnapshot,
  type HostOwnershipContext,
  type HostOwnershipTimingOptions,
} from "@heptalogos/host-ownership";
import { openPrivatePostgresMaintenanceController } from "@heptalogos/private-postgres";
import type { BootstrapKeyProvider } from "./bootstrap-key-provider.js";
import {
  acquireBootstrapRecoveryLease,
  inspectBootstrapRecovery,
} from "./bootstrap-recovery.js";
import type { BootstrapOwnershipLease } from "./bootstrap-ownership.js";
import {
  createPrivatePostgresSessionTracker,
  type PrivatePostgresMaintenanceDescriptor,
} from "./private-postgres-bootstrap.js";
import {
  openMaintenanceStateAccess,
  type OwnedMaintenanceStateAccess,
} from "./maintenance-state-access.js";
import {
  createManagedHostContext,
  markManagedHostTerminal,
  type BootstrapManagedHostContext,
  type PrivatePostgresMaintenanceResult,
} from "./managed-host.js";
import {
  createHostMaintenanceOperations,
  createRestartPrivatePostgresEnteredWindowExecutor,
  createStopPrivatePostgresEnteredWindowExecutor,
  type HostMaintenanceOperationProvenance,
} from "./host-maintenance.js";
import type {
  HostOwnershipHandoffOptions,
  OwnedBootstrapPreludeHandoffContext,
} from "./host-ownership-handoff.js";
import { createFreshHostOwnershipToken } from "./host-ownership-handoff.js";
import { loadBootstrapLocator } from "./locator.js";
import { resolveBootstrapPathProfile, type BootstrapPathProfile } from "./roots.js";

const DEFAULT_BOOTSTRAP_HEARTBEAT_MS = 1_000;
const STAGE_ORDER: readonly MaintenanceStage[] = [
  "BOOTSTRAP_OWNERSHIP_ACQUIRED",
  "HOST_QUIESCED",
  "HOST_TOKEN_REVOKED",
  "HOST_LEASE_CLOSED",
  "POSTGRES_STOPPED",
  "POSTGRES_READY",
  "HOST_LEASE_ACQUIRED",
  "HOST_TOKEN_PUBLICATION_ARMED",
  "HOST_TOKEN_PUBLISHED",
  "BOOTSTRAP_RELEASE_ARMED",
];

type HostLeaseConnection = Awaited<ReturnType<typeof acquireHostLeaseConnection>>;

interface HostOwnershipRecoveryIds {
  readonly installationId: HostMaintenanceRecoveryOptions["privatePostgres"]["expectedIdentity"]["installationId"];
  readonly instanceId: HostMaintenanceRecoveryOptions["privatePostgres"]["expectedIdentity"]["instanceId"];
}

export interface HostMaintenanceRecoveryOptions {
  readonly anchorRoot: string;
  readonly principal: import("./local-installation-owner.js").LocalInstallationOwnerRecoveryPrincipal;
  readonly expectedOperationId?: MaintenanceOperationId;
  readonly keyProvider: BootstrapKeyProvider;
  readonly timing: HostOwnershipTimingOptions;
  readonly clientFactory?: unknown;
  readonly privatePostgres: PrivatePostgresMaintenanceDescriptor;
  readonly bootstrapHeartbeatMs?: number;
  readonly createHostToken?: () => HostOwnershipToken;
}

function recoveryProblem(
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
  const value = error.problem;
  if (typeof value !== "object" || value === null || !("problemCode" in value)) {
    return undefined;
  }
  return typeof value.problemCode === "string" ? value.problemCode : undefined;
}

function stageIndex(stage: MaintenanceStage): number {
  const index = STAGE_ORDER.indexOf(stage);
  if (index >= 0) return index;
  throw recoveryProblem(
    "bootstrap.recovery.invalid_progress_stage",
    "Maintenance recovery progress stage is not executable",
    `The MaintenanceJournal progress stage ${stage} cannot be resumed by fixed M5B recovery`,
  );
}

function hasReached(progress: MaintenanceStage, target: MaintenanceStage): boolean {
  return stageIndex(progress) >= stageIndex(target);
}

function canonicalFenceRevision(value: string | number): string {
  if (typeof value === "string" && /^(0|[1-9][0-9]*)$/u.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  throw recoveryProblem(
    "bootstrap.recovery.invalid_fence_revision",
    "HostOwnershipFence revision is invalid",
    "Recovery cannot adjudicate a publication candidate without an unsigned decimal fence revision",
  );
}

function requireBootstrapState(
  loaded: BootstrapStateLoadResult,
  profile: BootstrapPathProfile,
  descriptor: PrivatePostgresMaintenanceDescriptor,
): BootstrapStateEnvelopeV2 {
  if (loaded.status === "EMPTY") {
    throw recoveryProblem(
      "bootstrap.recovery.bootstrap_state_required",
      "BootstrapState is required for maintenance recovery",
      "M5B cannot recover a MaintenanceJournal without authoritative BootstrapState",
    );
  }
  if (loaded.status === "CORRUPT") throw new ProblemError(loaded.problem);
  const value = loaded.value;
  if (value.state.schemaVersion !== 2) {
    throw recoveryProblem(
      "bootstrap.recovery.private_postgres_state_required",
      "BootstrapState V2 is required for maintenance recovery",
      "M5B requires the persisted private PostgreSQL identity and placement",
    );
  }
  const state = value.state;
  const persisted = state.privatePostgres;
  if (
    persisted.schemaVersion !== 2 ||
    state.privatePostgres.installationId !== profile.installationId ||
    state.privatePostgres.instanceId !== profile.instanceId ||
    persisted.installationId !== descriptor.expectedIdentity.installationId ||
    persisted.instanceId !== descriptor.expectedIdentity.instanceId ||
    persisted.postgresMajor !== descriptor.expectedIdentity.postgresMajor ||
    persisted.bootstrapRoleName !== descriptor.expectedIdentity.bootstrapRoleName ||
    persisted.persistedPort !== descriptor.expectedIdentity.persistedPort ||
    persisted.clusterSystemIdentifier !==
      descriptor.expectedIdentity.clusterSystemIdentifier ||
    persisted.initializationProfileRevision !==
      descriptor.expectedIdentity.initializationProfileRevision ||
    persisted.dataPlacement.rootId !== descriptor.expectedIdentity.placement.rootId ||
    persisted.dataPlacement.relativePath !==
      descriptor.expectedIdentity.placement.relativePath ||
    persisted.dataPlacement.dataLayoutVersion !==
      descriptor.expectedIdentity.placement.dataLayoutVersion
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.private_postgres_identity_mismatch",
      "Private PostgreSQL identity does not match recovery authority",
      "BootstrapState and the retained private PostgreSQL descriptor do not identify the same authoritative cluster",
    );
  }
  return value as BootstrapStateEnvelopeV2;
}

function requireJournalScope(
  body: MaintenanceJournalBodyV1,
  operationId: MaintenanceOperationId,
  descriptor: PrivatePostgresMaintenanceDescriptor,
  installationId: BootstrapStateEnvelopeV2["state"]["privatePostgres"]["installationId"],
  instanceId: BootstrapStateEnvelopeV2["state"]["privatePostgres"]["instanceId"],
): void {
  if (
    body.operationId !== operationId ||
    body.installationId !== installationId ||
    body.instanceId !== instanceId ||
    body.source.postgresClusterSystemIdentifier !==
      descriptor.expectedIdentity.clusterSystemIdentifier ||
    body.source.persistedPort !== descriptor.expectedIdentity.persistedPort ||
    body.verifiedPrerequisites.privatePostgresInitializationProfileRevision !==
      descriptor.expectedIdentity.initializationProfileRevision
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.journal_scope_mismatch",
      "MaintenanceJournal does not match recovery authority",
      "The operation, installation, instance, cluster identity, port, or prerequisite digest is not the retained M5A scope",
    );
  }
  if (
    body.target.hostOwnershipToken !== undefined &&
    body.target.hostOwnershipToken === body.source.hostOwnershipToken
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.token_reuse",
      "MaintenanceJournal contains a reused Host token",
      "A historical target Host token must never be equal to the source Host token",
    );
  }
  const hasTargetToken = body.target.hostOwnershipToken !== undefined;
  const resolvedTargetBootId = resolveMaintenanceTargetHostBootId(body);
  const hasTargetRevision = body.target.hostOwnershipRevision !== undefined;
  const hasTargetOwnership =
    hasTargetToken || resolvedTargetBootId !== undefined || hasTargetRevision;
  if (hasTargetOwnership && (!hasTargetToken || resolvedTargetBootId === undefined)) {
    throw recoveryProblem(
      "bootstrap.recovery.target_fence_incomplete",
      "MaintenanceJournal target Host ownership is incomplete",
      "A target Host token and its publication BootId must be recorded together",
    );
  }
  if (body.operationType === "PRIVATE_POSTGRES_STOP" && hasTargetOwnership) {
    throw recoveryProblem(
      "bootstrap.recovery.stop_target_host_present",
      "Stop recovery contains a target Host owner",
      "A private PostgreSQL stop operation must never resume or preserve a target Host token",
    );
  }
  const expectedPrivatePostgres =
    body.operationType === "PRIVATE_POSTGRES_RESTART"
      ? "RUNNING_SAME_IDENTITY"
      : "STOPPED";
  if (body.target.privatePostgres !== expectedPrivatePostgres) {
    throw recoveryProblem(
      "bootstrap.recovery.target_postgres_mismatch",
      "MaintenanceJournal target does not match its operation",
      "The fixed recovery executor refuses to infer a different PostgreSQL target from an operation type",
    );
  }
}

function passwordProvider(
  options: HostMaintenanceRecoveryOptions,
  installationId: typeof options.privatePostgres.expectedIdentity.installationId,
  instanceId: typeof options.privatePostgres.expectedIdentity.instanceId,
  bootId: BootId,
) {
  return {
    withBootstrapPassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return options.keyProvider.withPrivatePostgresBootstrapPassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-bootstrap-superuser",
        },
        use,
      );
    },
    withHostLeasePassword<T>(use: (password: Uint8Array) => Promise<T>) {
      return options.keyProvider.withPrivatePostgresHostLeasePassword(
        {
          installationId,
          instanceId,
          bootId,
          purpose: "private-postgres-host-lease-role",
        },
        use,
      );
    },
  };
}

function hostState(connection: HostLeaseConnection): HostOwnershipContext["state"] {
  return connection.state === "ACQUIRING" ? "FENCED" : connection.state;
}

function createHostContext(
  installationId: HostOwnershipRecoveryIds["installationId"],
  instanceId: HostOwnershipRecoveryIds["instanceId"],
  bootId: BootId,
  connection: HostLeaseConnection,
  token: HostOwnershipToken,
): HostOwnershipContext {
  return Object.freeze({
    installationId,
    instanceId,
    bootId,
    token,
    get state() {
      return hostState(connection);
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

function createBootstrapContext(
  profile: BootstrapPathProfile,
  access: OwnedMaintenanceStateAccess,
  lease: BootstrapOwnershipLease,
  installationId: HostOwnershipRecoveryIds["installationId"],
  instanceId: HostOwnershipRecoveryIds["instanceId"],
  bootId: BootId,
  activityId: BootstrapActivityId,
): OwnedBootstrapPreludeHandoffContext {
  return {
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId: activityId,
    paths: profile,
    ownership: lease,
    assertOwnership() {
      lease.assertHeld();
    },
    state: access.state,
    journal: new BootstrapJournal(profile.resolve("INSTANCE").canonicalPath),
    privatePostgresSession: createPrivatePostgresSessionTracker(),
    assertReady() {
      throw recoveryProblem(
        "bootstrap.recovery.ready_handle_unavailable",
        "Recovered bootstrap has no process-local ReadyPrivatePostgres handle",
        "The fixed recovery executor does not manufacture a stale M5A ReadyPrivatePostgres capability",
      );
    },
  };
}

function createRecoveredManagedHost(
  raw: HostOwnershipContext,
  bootstrap: OwnedBootstrapPreludeHandoffContext,
  handoff: HostOwnershipHandoffOptions,
  privatePostgres: PrivatePostgresMaintenanceDescriptor,
): BootstrapManagedHostContext {
  const createManagedHost = (
    host: HostOwnershipContext,
  ): BootstrapManagedHostContext => {
    let managed!: BootstrapManagedHostContext;
    let oldHostRetirementPromise: Promise<void> | undefined;
    const beginOldHostRetirement = (): Promise<void> => {
      if (oldHostRetirementPromise !== undefined) return oldHostRetirementPromise;
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
      bootstrap,
      handoff,
      privatePostgres,
      beginOldHostRetirement,
      createHostToken: createFreshHostOwnershipToken,
      createHostContext: (connection, token) =>
        createHostContext(
          bootstrap.installationId,
          bootstrap.instanceId,
          bootstrap.bootId,
          connection,
          token,
        ),
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
    );
    return managed;
  };
  return createManagedHost(raw);
}

function assertHistoricalFence(
  snapshot: HostOwnershipCanonicalSnapshot,
  body: MaintenanceJournalBodyV1,
  historicalBootId: BootId,
): HostOwnershipToken | undefined {
  if (snapshot.fence.length !== 1) {
    throw recoveryProblem(
      "bootstrap.recovery.invalid_fence",
      "HostOwnershipFence snapshot is invalid",
      "Recovery did not observe exactly one canonical HostOwnershipFence row",
    );
  }
  const row = snapshot.fence[0];
  if (row.instance_id !== body.instanceId) {
    throw recoveryProblem(
      "bootstrap.recovery.fence_instance_mismatch",
      "HostOwnershipFence belongs to another instance",
      "Recovery refuses to mutate a fence row outside the MaintenanceJournal instance scope",
    );
  }
  if (row.host_ownership_token === null) {
    if (row.boot_id !== null) {
      throw recoveryProblem(
        "bootstrap.recovery.fence_inconsistent",
        "HostOwnershipFence is internally inconsistent",
        "A null Host token must have a null fence BootId",
      );
    }
    return undefined;
  }
  const token = parseHostOwnershipToken(row.host_ownership_token);
  if (token === undefined || token !== row.host_ownership_token) {
    throw recoveryProblem(
      "bootstrap.recovery.fence_token_invalid",
      "HostOwnershipFence token is invalid",
      "Recovery refuses to adjudicate an unparseable HostOwnershipToken",
    );
  }
  const historicalTarget = body.target.hostOwnershipToken;
  const resolvedTargetBootId = resolveMaintenanceTargetHostBootId(body);
  if (token !== body.source.hostOwnershipToken && token !== historicalTarget) {
    throw recoveryProblem(
      "bootstrap.recovery.unexpected_fence_token",
      "HostOwnershipFence contains unexpected ownership",
      "Recovery will not revoke or replace a token outside the exact historical source/target set",
      "conflict",
    );
  }
  const expectedBootId =
    token === body.source.hostOwnershipToken ? historicalBootId : resolvedTargetBootId;
  if (expectedBootId === undefined) {
    throw recoveryProblem(
      "bootstrap.recovery.target_fence_incomplete",
      "MaintenanceJournal target Host ownership is incomplete",
      "A target Host token requires an explicit or exact legacy publication BootId",
    );
  }
  if (
    row.boot_id === null ||
    parseBootId(row.boot_id) !== expectedBootId ||
    row.boot_id !== expectedBootId
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.fence_boot_mismatch",
      "Historical HostOwnershipFence BootId is unexpected",
      "A historical source or target token is only recoverable under its recorded publication BootId",
    );
  }
  return token;
}

async function acquireNoLiveHostLease(
  options: HostMaintenanceRecoveryOptions,
  provider: ReturnType<typeof passwordProvider>,
  lease: BootstrapOwnershipLease,
): Promise<HostLeaseConnection> {
  const advisoryKey = deriveHostAdvisoryKey(
    options.privatePostgres.expectedIdentity.instanceId,
  );
  const initialAdvisory = await inspectHostAdvisoryLease({
    port: options.privatePostgres.expectedIdentity.persistedPort,
    advisoryKey,
    passwordProvider: provider,
    clientFactory: options.clientFactory,
  });
  if (initialAdvisory.live) {
    throw recoveryProblem(
      "bootstrap.recovery.live_host_owner",
      "A live Host advisory owner blocks recovery",
      "Recovery will not stop PostgreSQL or mutate the HostOwnershipFence while another Host lease is active",
      "conflict",
    );
  }
  try {
    return await acquireHostLeaseConnection({
      target: {
        host: "127.0.0.1",
        port: options.privatePostgres.expectedIdentity.persistedPort,
        database: HOST_OWNERSHIP_CANONICAL_DATABASE,
      },
      advisoryKey,
      timing: options.timing,
      passwordProvider: provider,
      mutationAuthority: { assertCurrent: () => lease.assertHeld() },
      clientFactory: options.clientFactory,
    });
  } catch (error) {
    if (
      problemCodeOf(error) === "host-ownership.lease.busy" ||
      problemCodeOf(error) === "host-ownership.lease.connection_failed"
    ) {
      const afterFailure = await inspectHostAdvisoryLease({
        port: options.privatePostgres.expectedIdentity.persistedPort,
        advisoryKey,
        passwordProvider: provider,
        clientFactory: options.clientFactory,
      });
      if (!afterFailure.live) throw error;
      throw recoveryProblem(
        "bootstrap.recovery.live_host_owner",
        "A live Host advisory owner blocks recovery",
        "Recovery will not stop PostgreSQL or mutate the HostOwnershipFence while another Host lease is active",
        "conflict",
      );
    }
    throw error;
  }
}

async function normalizeHistoricalFence(
  options: HostMaintenanceRecoveryOptions,
  provider: ReturnType<typeof passwordProvider>,
  lease: BootstrapOwnershipLease,
  body: MaintenanceJournalBodyV1,
  historicalBootId: BootId,
  existing: HostLeaseConnection | undefined,
  markMutation: () => void,
): Promise<HostLeaseConnection> {
  lease.assertHeld();
  const first = await inspectHostOwnershipCanonicalSnapshot({
    port: options.privatePostgres.expectedIdentity.persistedPort,
    passwordProvider: provider,
    clientFactory: options.clientFactory,
  });
  lease.assertHeld();
  assertHistoricalFence(first, body, historicalBootId);

  let connection = existing;
  if (connection === undefined || connection.state !== "ACTIVE") {
    await connection?.close().catch(() => undefined);
    connection = await acquireNoLiveHostLease(options, provider, lease);
  }

  const second = await inspectHostOwnershipCanonicalSnapshot({
    port: options.privatePostgres.expectedIdentity.persistedPort,
    passwordProvider: provider,
    clientFactory: options.clientFactory,
  });
  lease.assertHeld();
  const token = assertHistoricalFence(second, body, historicalBootId);
  if (token !== undefined) {
    markMutation();
    const fenceBootId =
      token === body.target.hostOwnershipToken
        ? resolveMaintenanceTargetHostBootId(body)
        : historicalBootId;
    if (fenceBootId === undefined) {
      throw recoveryProblem(
        "bootstrap.recovery.target_fence_incomplete",
        "MaintenanceJournal target Host ownership is incomplete",
        "A target Host token requires an explicit or exact legacy publication BootId",
      );
    }
    await revokeHostOwnershipTokenForBootstrap({
      port: options.privatePostgres.expectedIdentity.persistedPort,
      instanceId: body.instanceId,
      bootId: fenceBootId,
      token,
      lockTimeoutMs: options.timing.fenceLockTimeoutMs,
      statementTimeoutMs: options.timing.statementTimeoutMs,
      passwordProvider: provider,
      mutationAuthority: { assertCurrent: () => lease.assertHeld() },
      clientFactory: options.clientFactory,
    });
  }
  return connection;
}

function nextBody(
  body: MaintenanceJournalBodyV1,
  stage: MaintenanceStage,
  changes: Partial<MaintenanceJournalBodyV1>,
): MaintenanceJournalBodyV1 {
  const nextCandidate: MaintenanceJournalBodyV1 = {
    ...body,
    ...changes,
    revision: body.revision + 1,
    lastCompletedStage: stage,
    updatedAt: new Date().toISOString(),
  };
  const resolvedTargetBootId = resolveMaintenanceTargetHostBootId(nextCandidate);
  const next: MaintenanceJournalBodyV1 =
    resolvedTargetBootId !== undefined && nextCandidate.target.hostBootId === undefined
      ? {
          ...nextCandidate,
          target: {
            ...nextCandidate.target,
            hostBootId: resolvedTargetBootId,
          },
        }
      : nextCandidate;
  if (stage === "RECOVERY_REQUIRED" || stage === "ABORTED") return next;
  const {
    terminalOutcome: _terminalOutcome,
    problemCode: _problemCode,
    ...cleared
  } = next;
  return cleared;
}

function isUncertainProblem(error: unknown): boolean {
  const code = problemCodeOf(error);
  return (
    code?.includes("uncertain") === true ||
    code === "host-ownership.revocation.committed_unverified" ||
    code === "host-ownership.publication.committed_unverified"
  );
}

export async function recoverInterruptedHostMaintenance(
  options: HostMaintenanceRecoveryOptions,
): Promise<PrivatePostgresMaintenanceResult> {
  const initialInspection = await inspectBootstrapRecovery(options.anchorRoot);
  if (
    initialInspection.operationId === undefined ||
    initialInspection.maintenance === undefined
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.operation_required",
      "An incomplete MaintenanceJournal operation is required",
      "The fixed M5B executor cannot recover an installation without a committed operation pointer",
    );
  }
  if (
    options.expectedOperationId !== undefined &&
    initialInspection.operationId !== options.expectedOperationId
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.operation_mismatch",
      "Requested recovery operation does not match BootstrapState",
      "Recovery refuses to select a different MaintenanceJournal operation implicitly",
      "conflict",
    );
  }

  const locator = await loadBootstrapLocator(options.anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator);
  const recoveryBootId = createBootId();
  const recoveryActivityId = createUuidV7Id("ActivityId");
  const lease = await acquireBootstrapRecoveryLease(
    options.anchorRoot,
    options.principal,
    {
      heartbeatMs: options.bootstrapHeartbeatMs ?? DEFAULT_BOOTSTRAP_HEARTBEAT_MS,
      bootId: recoveryBootId,
    },
  );
  let hostLeaseConnection: HostLeaseConnection | undefined;
  let managedHost: BootstrapManagedHostContext | undefined;
  let rawHost: HostOwnershipContext | undefined;
  let mutationStarted = false;

  try {
    const access = openMaintenanceStateAccess(profile, lease);
    const loaded = await access.state.load();
    const state = requireBootstrapState(loaded, profile, options.privatePostgres);
    if (
      state.state.lastCommittedOperationRef !==
      maintenanceOperationRef(initialInspection.operationId)
    ) {
      throw recoveryProblem(
        "bootstrap.recovery.operation_pointer_changed",
        "BootstrapState operation pointer changed during recovery selection",
        "Recovery refuses to execute a MaintenanceJournal that is not the current committed operation pointer",
        "conflict",
      );
    }
    const head: MaintenanceJournalRecoveryHead = await access.journal.loadRecoveryHead(
      initialInspection.operationId,
    );
    let body = head.current.state;
    let progress = head.effectiveProgressStage;
    if (progress === "ABORTED") {
      throw recoveryProblem(
        "bootstrap.recovery.aborted_operation",
        "Aborted maintenance is not resumed",
        "M5B never resumes a dead old Host from an ABORTED MaintenanceJournal",
        "conflict",
      );
    }
    requireJournalScope(
      body,
      initialInspection.operationId,
      options.privatePostgres,
      locator.installationId,
      locator.instanceId,
    );
    const historicalBootId = body.bootId;
    const provider = passwordProvider(
      options,
      locator.installationId,
      locator.instanceId,
      recoveryBootId,
    );
    const handoff: HostOwnershipHandoffOptions = {
      keyProvider: options.keyProvider,
      timing: options.timing,
      clientFactory: options.clientFactory,
      bootstrapHeartbeatMs: options.bootstrapHeartbeatMs,
    };
    const bootstrap = createBootstrapContext(
      profile,
      access,
      lease,
      locator.installationId,
      locator.instanceId,
      recoveryBootId,
      recoveryActivityId,
    );
    const controller = await openPrivatePostgresMaintenanceController({
      ...options.privatePostgres,
      assertControlAuthority: () => lease.assertHeld(),
    });
    const markMutation = () => {
      mutationStarted = true;
    };
    const advance = async (
      stage: MaintenanceStage,
      changes: Partial<MaintenanceJournalBodyV1> = {},
    ): Promise<void> => {
      const next = nextBody(body, stage, changes);
      await access.journal.advance(next);
      body = next;
      progress = stage;
    };

    if (controller.state === "READY" && !hasReached(progress, "HOST_LEASE_CLOSED")) {
      hostLeaseConnection = await normalizeHistoricalFence(
        options,
        provider,
        lease,
        body,
        historicalBootId,
        hostLeaseConnection,
        markMutation,
      );
      if (!hasReached(progress, "HOST_TOKEN_REVOKED")) {
        await advance("HOST_TOKEN_REVOKED");
      }
      if (!hasReached(progress, "HOST_LEASE_CLOSED")) {
        await advance("HOST_LEASE_CLOSED");
      }
    }

    if (body.operationType === "PRIVATE_POSTGRES_STOP") {
      if (controller.state === "READY") {
        if (hostLeaseConnection === undefined) {
          hostLeaseConnection = await normalizeHistoricalFence(
            options,
            provider,
            lease,
            body,
            historicalBootId,
            hostLeaseConnection,
            markMutation,
          );
        }
        markMutation();
        await controller.stop();
        await hostLeaseConnection.close().catch(() => undefined);
        hostLeaseConnection = undefined;
      }
      if (!hasReached(progress, "POSTGRES_STOPPED")) {
        await advance("POSTGRES_STOPPED");
      }
      if (!hasReached(progress, "BOOTSTRAP_RELEASE_ARMED")) {
        await advance("BOOTSTRAP_RELEASE_ARMED", {
          target: { privatePostgres: "STOPPED" },
        });
      }
      await lease.release();
      await bootstrap.journal
        .checkpoint({
          schemaVersion: 2,
          bootId: recoveryBootId,
          bootstrapActivityId: recoveryActivityId,
          installationId: locator.installationId,
          instanceId: locator.instanceId,
          stage: "bootstrap.maintenance.completed",
          at: new Date().toISOString(),
          outcome: "SUCCEEDED",
        })
        .catch(() => undefined);
      return { kind: "STOPPED" };
    }

    if (!hasReached(progress, "POSTGRES_STOPPED")) {
      if (controller.state === "READY") {
        if (hostLeaseConnection === undefined) {
          hostLeaseConnection = await normalizeHistoricalFence(
            options,
            provider,
            lease,
            body,
            historicalBootId,
            hostLeaseConnection,
            markMutation,
          );
        }
        markMutation();
        await controller.stop();
        await hostLeaseConnection.close().catch(() => undefined);
        hostLeaseConnection = undefined;
      }
      await advance("POSTGRES_STOPPED");
    }

    if (controller.state === "STOPPED") {
      markMutation();
      await controller.start();
    }
    if (!hasReached(progress, "POSTGRES_READY")) {
      await advance("POSTGRES_READY");
    }
    if (controller.state !== "READY") {
      throw recoveryProblem(
        "bootstrap.recovery.postgres_not_ready",
        "Private PostgreSQL is not ready for Host reacquisition",
        "Recovery could not prove the same cluster READY before fresh Host publication",
      );
    }

    hostLeaseConnection = await normalizeHistoricalFence(
      options,
      provider,
      lease,
      body,
      historicalBootId,
      hostLeaseConnection,
      markMutation,
    );
    if (!hasReached(progress, "HOST_LEASE_ACQUIRED")) {
      await advance("HOST_LEASE_ACQUIRED");
    }
    let freshToken: HostOwnershipToken;
    let publicationBootId: BootId;
    const targetIsHistorical =
      body.target.hostOwnershipToken !== undefined &&
      resolveMaintenanceTargetHostBootId(body) === historicalBootId;
    if (hasReached(progress, "HOST_TOKEN_PUBLICATION_ARMED") && !targetIsHistorical) {
      const candidateToken = body.target.hostOwnershipToken;
      const candidateBootId = body.target.hostBootId;
      if (candidateToken === undefined || candidateBootId === undefined) {
        throw recoveryProblem(
          "bootstrap.recovery.publication_candidate_missing",
          "Host publication candidate is missing",
          "A recovery stage at or beyond HOST_TOKEN_PUBLICATION_ARMED must retain the exact candidate token and BootId",
        );
      }
      freshToken = candidateToken;
      publicationBootId = candidateBootId;
      if (parseHostOwnershipToken(freshToken) !== freshToken) {
        throw recoveryProblem(
          "bootstrap.recovery.fresh_token_invalid",
          "Persisted Host token candidate is invalid",
          "Recovery refuses to publish an unparseable persisted Host token candidate",
        );
      }
    } else {
      const createToken = options.createHostToken ?? createFreshHostOwnershipToken;
      freshToken = createToken();
      publicationBootId = recoveryBootId;
      if (
        parseHostOwnershipToken(freshToken) !== freshToken ||
        freshToken === body.source.hostOwnershipToken ||
        freshToken === body.target.hostOwnershipToken
      ) {
        throw recoveryProblem(
          "bootstrap.recovery.fresh_token_invalid",
          "Fresh Host token is not fresh",
          "Recovery refuses to publish a source, historical target, or invalid Host token",
        );
      }
      const { hostOwnershipRevision: _historicalRevision, ...targetWithoutRevision } =
        body.target;
      await advance("HOST_TOKEN_PUBLICATION_ARMED", {
        target: {
          ...targetWithoutRevision,
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: freshToken,
          hostBootId: publicationBootId,
        },
      });
    }
    markMutation();
    hostLeaseConnection.assertActive();
    const publicationSnapshot = await inspectHostOwnershipCanonicalSnapshot({
      port: options.privatePostgres.expectedIdentity.persistedPort,
      passwordProvider: provider,
      clientFactory: options.clientFactory,
    });
    const currentFenceToken = assertHistoricalFence(
      publicationSnapshot,
      body,
      historicalBootId,
    );
    let publishedRevision: string;
    if (currentFenceToken === freshToken) {
      const row = publicationSnapshot.fence[0];
      if (row === undefined) {
        throw recoveryProblem(
          "bootstrap.recovery.invalid_fence",
          "HostOwnershipFence snapshot is invalid",
          "Recovery could not read the exact committed publication candidate row",
        );
      }
      publishedRevision = canonicalFenceRevision(row.ownership_revision);
      if (
        body.target.hostOwnershipRevision !== undefined &&
        body.target.hostOwnershipRevision !== publishedRevision
      ) {
        throw recoveryProblem(
          "bootstrap.recovery.publication_revision_mismatch",
          "Committed Host publication revision does not match the journal",
          "The exact candidate token is present but its canonical revision disagrees with durable recovery metadata",
        );
      }
    } else {
      const publication = await publishHostOwnershipToken({
        connection: hostLeaseConnection,
        instanceId: locator.instanceId,
        bootId: publicationBootId,
        token: freshToken,
        fenceLockTimeoutMs: options.timing.fenceLockTimeoutMs,
        statementTimeoutMs: options.timing.statementTimeoutMs,
        mutationAuthority: { assertCurrent: () => lease.assertHeld() },
      });
      publishedRevision = publication.publishedRevision;
    }
    rawHost = createHostContext(
      locator.installationId,
      locator.instanceId,
      publicationBootId,
      hostLeaseConnection,
      freshToken,
    );
    const target = {
      ...body.target,
      privatePostgres: "RUNNING_SAME_IDENTITY" as const,
      hostOwnershipToken: freshToken,
      hostBootId: publicationBootId,
      hostOwnershipRevision: publishedRevision,
    };
    if (!hasReached(progress, "HOST_TOKEN_PUBLISHED")) {
      await advance("HOST_TOKEN_PUBLISHED", { target });
    }
    if (!hasReached(progress, "BOOTSTRAP_RELEASE_ARMED")) {
      await advance("BOOTSTRAP_RELEASE_ARMED", { target });
    }
    managedHost = createRecoveredManagedHost(
      rawHost,
      bootstrap,
      handoff,
      options.privatePostgres,
    );
    try {
      await lease.release();
    } catch (error) {
      markManagedHostTerminal(managedHost);
      await rawHost.close().catch(() => undefined);
      throw error;
    }
    hostLeaseConnection = undefined;
    await bootstrap.journal
      .checkpoint({
        schemaVersion: 2,
        bootId: recoveryBootId,
        bootstrapActivityId: recoveryActivityId,
        installationId: locator.installationId,
        instanceId: locator.instanceId,
        stage: "bootstrap.maintenance.completed",
        at: new Date().toISOString(),
        outcome: "SUCCEEDED",
      })
      .catch(() => undefined);
    return { kind: "RESTARTED", host: managedHost };
  } catch (error) {
    await hostLeaseConnection?.close().catch(() => undefined);
    if (managedHost !== undefined) {
      markManagedHostTerminal(managedHost);
    } else {
      await rawHost?.close().catch(() => undefined);
    }
    if (mutationStarted && lease.state === "HELD") {
      try {
        const access = openMaintenanceStateAccess(profile, lease);
        const current = await access.state.load();
        if (current.status !== "CORRUPT") {
          const head = await access.journal.loadRecoveryHead(
            initialInspection.operationId,
          );
          const next = nextBody(head.current.state, "RECOVERY_REQUIRED", {
            terminalOutcome: isUncertainProblem(error) ? "UNCERTAIN" : "FAILED",
            problemCode: problemCodeOf(error),
          });
          await access.journal.advance(next).catch(() => undefined);
        }
      } catch {
        // The first failure remains authoritative; do not guess through a corrupt journal.
      }
    } else if (lease.state === "HELD") {
      await lease.release().catch(() => undefined);
    }
    throw error;
  }
}
