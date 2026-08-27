import { join } from "node:path";
import {
  BootstrapJournal,
  type BootstrapActivityId,
  type BootstrapStateBodyV1,
  type BootstrapStateLoadResult,
  type BootstrapStageOutcome,
  type PrivatePostgresBootstrapStateV1,
} from "@heptalogos/bootstrap-state";
import {
  createProblemError,
  formatInstant,
  ProblemError,
  type BootId,
  type InstallationId,
  type InstanceId,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  classifyClusterDirectory,
  initializePrivatePostgresCluster,
  resolvePrivatePostgresPlacement,
  resolvePrivatePostgresToolchain,
  startPrivatePostgresCluster,
  validateExistingCluster,
  type PrivatePostgresExpectedIdentity,
  type PrivatePostgresLifecycleOptions,
  type PrivatePostgresPlacement,
  type PrivatePostgresStartupDisposition,
  type PrivatePostgresToolchain,
  type ReadyPrivatePostgresMechanics,
  PRIVATE_POSTGRES_BOOTSTRAP_ROLE_NAME,
} from "@heptalogos/private-postgres";
import type { BootstrapKeyProvider } from "./bootstrap-key-provider.js";
import {
  assertBootstrapOwnershipFor,
  type BootstrapOwnershipLease,
} from "./bootstrap-ownership.js";
import type { OwnedBootstrapStateStore } from "./bootstrap-state-access.js";
import type { BootstrapPathProfile } from "./roots.js";
import { problemCodeOf } from "./problem-code.js";
import { recordBootstrapStage } from "./journal-stage.js";

export interface PreparePrivatePostgresOptions {
  readonly toolchainBinDirectory: string;
  readonly initialPort?: number;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly keyProvider: BootstrapKeyProvider;
}

export interface ReadyPrivatePostgres {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly port: number;
  readonly clusterSystemIdentifier: string;
  readonly toolchainVersion: "18.6";
  readonly startupDisposition: PrivatePostgresStartupDisposition;
  stop(): Promise<void>;
  restart(): Promise<void>;
}

export interface PrivatePostgresMaintenanceDescriptor {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly logFilePath: string;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
}

const readySessionTokens = new WeakMap<
  ReadyPrivatePostgres,
  PrivatePostgresSessionToken
>();
const readyMaintenanceDescriptors = new WeakMap<
  ReadyPrivatePostgres,
  PrivatePostgresMaintenanceDescriptor
>();

type PrivatePostgresSessionState =
  | "QUIESCENT"
  | "TRANSITIONING"
  | "READY"
  | "UNCERTAIN"
  | "HANDED_OFF"
  | "YIELDED_TO_EXISTING_HOST";

export interface PrivatePostgresSessionToken {
  readonly __privatePostgresSessionToken: unique symbol;
}

export interface PrivatePostgresSessionTracker {
  readonly state: PrivatePostgresSessionState;
  beginPreparation(): PrivatePostgresSessionToken;
  assertCurrent(token: PrivatePostgresSessionToken): void;
  beginStop(token: PrivatePostgresSessionToken): void;
  beginRestart(token: PrivatePostgresSessionToken): void;
  markReady(token: PrivatePostgresSessionToken): void;
  markQuiescent(token: PrivatePostgresSessionToken): void;
  markUncertain(token: PrivatePostgresSessionToken): void;
  markHandedOff(token: PrivatePostgresSessionToken): void;
  markYieldedToExistingHost(token: PrivatePostgresSessionToken): void;
  assertReleaseAllowed(): void;
}

interface OwnedPrivatePostgresContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly ownership: BootstrapOwnershipLease;
  readonly state: OwnedBootstrapStateStore;
  readonly journal: BootstrapJournal;
  readonly privatePostgresSession: PrivatePostgresSessionTracker;
}

type PrivatePostgresBootstrapTestPhase =
  | "after-initdb-before-state-commit"
  | "after-state-commit-before-start"
  | "after-start-before-ready-return";

interface InternalPreparePrivatePostgresOptions extends PreparePrivatePostgresOptions {
  // TEST_ONLY_INTERNAL_HOOK: qualification fault injection, intentionally absent from the public option type.
  readonly __testHook?: (
    phase: PrivatePostgresBootstrapTestPhase,
  ) => void | Promise<void>;
}

const PRIVATE_POSTGRES_LOG_FILENAME = "private-postgres.log";
const STAGE_TOOLCHAIN_VALIDATED = "bootstrap.postgres.toolchain_validated";
const STAGE_CLUSTER_INITIALIZATION_STARTED =
  "bootstrap.postgres.cluster_initialization_started";
const STAGE_CLUSTER_INITIALIZED = "bootstrap.postgres.cluster_initialized";
const STAGE_IDENTITY_COMMITTED = "bootstrap.postgres.identity_committed";
const STAGE_CLUSTER_VALIDATED = "bootstrap.postgres.cluster_validated";
const STAGE_START_STARTED = "bootstrap.postgres.start_started";
const STAGE_READY = "bootstrap.postgres.ready";
const STAGE_FAILED = "bootstrap.postgres.failed";

function isPrivatePostgresCleanupUncertain(error: unknown): boolean {
  return problemCodeOf(error) === "private-postgres.lifecycle.start_cleanup_uncertain";
}

function bootstrapProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "integrity",
  retryClass: Problem["retryClass"] = "manual",
): ProblemError {
  return createProblemError({
    problemCode,
    category,
    retryClass,
    title,
    detail,
  });
}

function assertSessionState(
  state: PrivatePostgresSessionState,
  allowed: readonly PrivatePostgresSessionState[],
  action: string,
): void {
  if (allowed.includes(state)) return;
  throw bootstrapProblem(
    "bootstrap.private_postgres.invalid_transition",
    "Private PostgreSQL lifecycle transition is invalid",
    `${action} is not allowed while the private PostgreSQL session is ${state}`,
    "conflict",
  );
}

function stalePrivatePostgresHandleProblem(): ProblemError {
  return bootstrapProblem(
    "bootstrap.private_postgres.stale_handle",
    "Private PostgreSQL lifecycle handle is stale",
    "The private PostgreSQL lifecycle handle belongs to an earlier preparation session and cannot control the current session",
    "conflict",
  );
}

function alreadyRunningControlDeniedProblem(): ProblemError {
  return bootstrapProblem(
    "bootstrap.private_postgres.already_running_control_denied",
    "Already-running private PostgreSQL control is denied",
    "This ReadyPrivatePostgres handle observed PostgreSQL already running; stop or restart requires the Host ownership handoff authority",
    "conflict",
  );
}

function invalidReadyHandleProblem(): ProblemError {
  return bootstrapProblem(
    "bootstrap.private_postgres.invalid_handle",
    "Private PostgreSQL Ready handle is invalid",
    "The ReadyPrivatePostgres value was not issued by the current bootstrap prelude",
    "integrity",
  );
}

export function assertReadyPrivatePostgresSession(
  ready: ReadyPrivatePostgres,
  session: PrivatePostgresSessionTracker,
): PrivatePostgresSessionToken {
  const token = readySessionTokens.get(ready);
  if (token === undefined) throw invalidReadyHandleProblem();
  session.assertCurrent(token);
  return token;
}

export function getPrivatePostgresMaintenanceDescriptor(
  ready: ReadyPrivatePostgres,
): PrivatePostgresMaintenanceDescriptor {
  const descriptor = readyMaintenanceDescriptors.get(ready);
  if (descriptor === undefined) throw invalidReadyHandleProblem();
  return descriptor;
}

export function createPrivatePostgresSessionTracker(): PrivatePostgresSessionTracker {
  let state: PrivatePostgresSessionState = "QUIESCENT";
  let currentToken: PrivatePostgresSessionToken | undefined;

  const assertCurrent = (token: PrivatePostgresSessionToken): void => {
    if (token === currentToken) return;
    throw stalePrivatePostgresHandleProblem();
  };

  return {
    get state() {
      return state;
    },
    beginPreparation() {
      assertSessionState(state, ["QUIESCENT"], "Preparation");
      currentToken = Object.freeze({}) as PrivatePostgresSessionToken;
      state = "TRANSITIONING";
      return currentToken;
    },
    assertCurrent,
    beginStop(token) {
      assertCurrent(token);
      assertSessionState(state, ["READY", "UNCERTAIN"], "Stop");
      state = "TRANSITIONING";
    },
    beginRestart(token) {
      assertCurrent(token);
      assertSessionState(state, ["QUIESCENT", "READY"], "Restart");
      state = "TRANSITIONING";
    },
    markReady(token) {
      assertCurrent(token);
      assertSessionState(state, ["TRANSITIONING"], "Ready");
      state = "READY";
    },
    markQuiescent(token) {
      assertCurrent(token);
      assertSessionState(state, ["TRANSITIONING"], "Quiescent");
      state = "QUIESCENT";
    },
    markUncertain(token) {
      assertCurrent(token);
      assertSessionState(state, ["TRANSITIONING", "READY"], "Uncertain");
      state = "UNCERTAIN";
    },
    markHandedOff(token) {
      assertCurrent(token);
      assertSessionState(state, ["READY"], "Forward handoff");
      state = "HANDED_OFF";
      currentToken = undefined;
    },
    markYieldedToExistingHost(token) {
      assertCurrent(token);
      assertSessionState(state, ["READY"], "Yield to existing Host");
      state = "YIELDED_TO_EXISTING_HOST";
      currentToken = undefined;
    },
    assertReleaseAllowed() {
      if (
        state === "QUIESCENT" ||
        state === "HANDED_OFF" ||
        state === "YIELDED_TO_EXISTING_HOST"
      ) {
        return;
      }
      throw bootstrapProblem(
        "bootstrap.private_postgres.release_blocked",
        "Bootstrap ownership release is blocked",
        `Bootstrap ownership cannot be released while the private PostgreSQL session is ${state}`,
        "conflict",
      );
    },
  };
}

interface OwnershipScopedPrivatePostgresLifecycleContext {
  readonly privatePostgresSession: PrivatePostgresSessionTracker;
  readonly assertOwnership: () => void;
}

export function createOwnershipScopedPrivatePostgresLifecycle(
  context: OwnershipScopedPrivatePostgresLifecycleContext,
  mechanics: ReadyPrivatePostgresMechanics,
  sessionToken: PrivatePostgresSessionToken,
): Pick<ReadyPrivatePostgres, "stop" | "restart"> {
  const stop = async (): Promise<void> => {
    context.privatePostgresSession.assertCurrent(sessionToken);
    if (mechanics.startupDisposition === "ALREADY_RUNNING") {
      throw alreadyRunningControlDeniedProblem();
    }
    context.assertOwnership();
    context.privatePostgresSession.beginStop(sessionToken);
    try {
      await mechanics.stop();
      context.assertOwnership();
      context.privatePostgresSession.markQuiescent(sessionToken);
    } catch (error) {
      if (context.privatePostgresSession.state === "TRANSITIONING") {
        context.privatePostgresSession.markUncertain(sessionToken);
      }
      throw error;
    }
  };
  const restart = async (): Promise<void> => {
    context.privatePostgresSession.assertCurrent(sessionToken);
    if (mechanics.startupDisposition === "ALREADY_RUNNING") {
      throw alreadyRunningControlDeniedProblem();
    }
    context.assertOwnership();
    context.privatePostgresSession.beginRestart(sessionToken);
    try {
      await mechanics.restart();
      context.assertOwnership();
      context.privatePostgresSession.markReady(sessionToken);
    } catch (error) {
      if (context.privatePostgresSession.state === "TRANSITIONING") {
        context.privatePostgresSession.markUncertain(sessionToken);
      }
      throw error;
    }
  };
  return { stop, restart };
}

async function recordStage(
  context: OwnedPrivatePostgresContext,
  stage: string,
  outcome: BootstrapStageOutcome,
  problemCode?: string,
): Promise<void> {
  await recordBootstrapStage(
    context,
    stage,
    formatInstant(new Date()),
    outcome,
    problemCode,
  );
}

async function recordFailure(
  context: OwnedPrivatePostgresContext,
  error: unknown,
): Promise<void> {
  await recordStage(context, STAGE_FAILED, "FAILED", problemCodeOf(error)).catch(
    () => undefined,
  );
}

async function invokeTestHook(
  options: PreparePrivatePostgresOptions,
  phase: PrivatePostgresBootstrapTestPhase,
): Promise<void> {
  const hook = (options as InternalPreparePrivatePostgresOptions).__testHook;
  await hook?.(phase);
}

function stateBody(loaded: BootstrapStateLoadResult): BootstrapStateBodyV1 {
  if (loaded.status === "CORRUPT") {
    throw new ProblemError(loaded.problem);
  }
  if (loaded.status === "EMPTY") {
    throw bootstrapProblem(
      "bootstrap.private_postgres.state_required",
      "BootstrapState is required before private PostgreSQL preparation",
      "The bootstrap runtime cannot invent active generation identity when BootstrapState is empty",
      "unavailable",
    );
  }
  if (loaded.status === "RECOVERED_PREVIOUS") {
    throw bootstrapProblem(
      "bootstrap.state.current_authority_required",
      "Current BootstrapState authority is required",
      "A recovered previous BootstrapState revision is inspection evidence only and cannot authorize private PostgreSQL preparation",
    );
  }
  return loaded.value.state;
}

function hasPrivatePostgres(
  state: BootstrapStateBodyV1,
): state is BootstrapStateBodyV1 & {
  readonly privatePostgres: PrivatePostgresBootstrapStateV1;
} {
  return state.privatePostgres !== undefined;
}

function assertPrivatePostgresPlacement(
  privatePostgres: BootstrapStateBodyV1["privatePostgres"],
  placement: PrivatePostgresPlacement,
  installationId: InstallationId,
  instanceId: InstanceId,
  toolchain: PrivatePostgresToolchain,
): asserts privatePostgres is PrivatePostgresBootstrapStateV1 {
  if (
    privatePostgres === undefined ||
    privatePostgres.schemaVersion !== 1 ||
    privatePostgres.bootstrapRoleName !== PRIVATE_POSTGRES_BOOTSTRAP_ROLE_NAME ||
    privatePostgres.installationId !== installationId ||
    privatePostgres.instanceId !== instanceId ||
    privatePostgres.dataPlacement.rootId !== placement.rootId ||
    privatePostgres.dataPlacement.relativePath !== placement.relativePath ||
    privatePostgres.dataPlacement.dataLayoutVersion !== placement.dataLayoutVersion ||
    privatePostgres.postgresMajor !== toolchain.major
  ) {
    throw bootstrapProblem(
      "bootstrap.private_postgres.identity_mismatch",
      "BootstrapState private PostgreSQL identity does not match the current installation",
      "The persisted private PostgreSQL installation, placement, or architecture major does not match the current bootstrap context",
    );
  }
}

function expectedIdentityFromState(
  state: BootstrapStateBodyV1,
  placement: PrivatePostgresPlacement,
  installationId: InstallationId,
  instanceId: InstanceId,
  toolchain: PrivatePostgresToolchain,
): PrivatePostgresExpectedIdentity {
  const privatePostgres = state.privatePostgres;
  assertPrivatePostgresPlacement(
    privatePostgres,
    placement,
    installationId,
    instanceId,
    toolchain,
  );
  return {
    installationId,
    instanceId,
    postgresMajor: privatePostgres.postgresMajor,
    placement: {
      rootId: privatePostgres.dataPlacement.rootId,
      relativePath: privatePostgres.dataPlacement.relativePath,
      dataLayoutVersion: privatePostgres.dataPlacement.dataLayoutVersion,
    },
    persistedPort: privatePostgres.persistedPort,
    clusterSystemIdentifier: privatePostgres.clusterSystemIdentifier,
    bootstrapRoleName: privatePostgres.bootstrapRoleName,
    initializationProfileRevision: privatePostgres.initializationProfileRevision,
  };
}

function expectedIdentityFromInitialization(
  context: OwnedPrivatePostgresContext,
  placement: PrivatePostgresPlacement,
  initialized: Awaited<ReturnType<typeof initializePrivatePostgresCluster>>,
): PrivatePostgresExpectedIdentity {
  return {
    installationId: context.installationId,
    instanceId: context.instanceId,
    postgresMajor: initialized.identity.postgresMajor,
    bootstrapRoleName: initialized.identity.bootstrapRoleName,
    placement: {
      rootId: placement.rootId,
      relativePath: placement.relativePath,
      dataLayoutVersion: placement.dataLayoutVersion,
    },
    persistedPort: initialized.port,
    clusterSystemIdentifier: initialized.identity.clusterSystemIdentifier,
    initializationProfileRevision: initialized.initializationProfileRevision,
  };
}

function nextStateV1(
  current: BootstrapStateBodyV1,
  expected: PrivatePostgresExpectedIdentity,
  toolchain: PrivatePostgresToolchain,
): BootstrapStateBodyV1 {
  return {
    ...current,
    schemaVersion: 1,
    revision: current.revision + 1,
    privatePostgres: {
      schemaVersion: 1,
      postgresMajor: expected.postgresMajor,
      initializedByPostgresVersion: toolchain.version,
      installationId: expected.installationId,
      instanceId: expected.instanceId,
      bootstrapRoleName: expected.bootstrapRoleName,
      dataPlacement: expected.placement,
      persistedPort: expected.persistedPort,
      clusterSystemIdentifier: expected.clusterSystemIdentifier,
      initializationProfileRevision: expected.initializationProfileRevision,
    },
  };
}

function assertOwnership(context: OwnedPrivatePostgresContext): void {
  assertBootstrapOwnershipFor(
    context.ownership,
    context.paths.resolve("INSTANCE").canonicalPath,
  );
}

export async function preparePrivatePostgresForOwnedPrelude(
  context: OwnedPrivatePostgresContext,
  options: PreparePrivatePostgresOptions,
): Promise<ReadyPrivatePostgres> {
  let mechanics: ReadyPrivatePostgresMechanics | undefined;
  const sessionToken = context.privatePostgresSession.beginPreparation();
  const assertControlAuthority = () => assertOwnership(context);
  try {
    assertOwnership(context);

    const toolchain = await resolvePrivatePostgresToolchain(
      options.toolchainBinDirectory,
    );
    await recordStage(context, STAGE_TOOLCHAIN_VALIDATED, "SUCCEEDED");

    const placement = resolvePrivatePostgresPlacement(
      context.paths.resolve("DATA").canonicalPath,
    );
    const logFilePath = join(
      context.paths.resolve("LOG").canonicalPath,
      PRIVATE_POSTGRES_LOG_FILENAME,
    );
    const currentState = await context.state.load();
    const directoryState = await classifyClusterDirectory(
      placement.canonicalDataDirectory,
    );
    const currentBody = stateBody(currentState);

    let expectedIdentity: PrivatePostgresExpectedIdentity;
    if (hasPrivatePostgres(currentBody)) {
      if (
        options.initialPort !== undefined &&
        options.initialPort !== currentBody.privatePostgres.persistedPort
      ) {
        throw bootstrapProblem(
          "bootstrap.private_postgres.port_conflict",
          "Private PostgreSQL port conflicts with BootstrapState",
          "The persisted private PostgreSQL port is authoritative; bootstrap does not relocate an existing cluster",
          "conflict",
        );
      }
      if (directoryState.kind === "ABSENT" || directoryState.kind === "EMPTY") {
        throw bootstrapProblem(
          "bootstrap.private_postgres.cluster_missing",
          "Authoritative private PostgreSQL cluster is missing",
          "BootstrapState contains private PostgreSQL identity but DATA/private-postgres is absent or empty",
          "unavailable",
        );
      }
      expectedIdentity = expectedIdentityFromState(
        currentBody,
        placement,
        context.installationId,
        context.instanceId,
        toolchain,
      );
    } else {
      if (directoryState.kind === "NON_EMPTY") {
        throw bootstrapProblem(
          "bootstrap.private_postgres.recovery_required",
          "Private PostgreSQL directory requires recovery",
          "DATA/private-postgres is non-empty without authoritative BootstrapState private PostgreSQL identity; bootstrap will not adopt or overwrite it",
          "conflict",
        );
      }
      if (options.initialPort === undefined) {
        throw bootstrapProblem(
          "bootstrap.private_postgres.initial_port_required",
          "Initial private PostgreSQL port is required",
          "A first private PostgreSQL initialization requires an explicit installation port",
          "validation",
        );
      }
      const initialPort = options.initialPort;

      await recordStage(context, STAGE_CLUSTER_INITIALIZATION_STARTED, "STARTED");
      const initialized =
        await options.keyProvider.withPrivatePostgresBootstrapPassword(
          {
            installationId: context.installationId,
            instanceId: context.instanceId,
            bootId: context.bootId,
            purpose: "private-postgres-bootstrap-superuser",
          },
          async (bootstrapPasswordUtf8) => {
            assertOwnership(context);
            return initializePrivatePostgresCluster({
              toolchain,
              placement,
              credentialTempRoot: context.paths.resolve("TEMP").canonicalPath,
              bootstrapPasswordUtf8,
              port: initialPort,
              lifecycle: options.lifecycle,
              assertControlAuthority,
            });
          },
        );
      await recordStage(context, STAGE_CLUSTER_INITIALIZED, "SUCCEEDED");
      await invokeTestHook(options, "after-initdb-before-state-commit");
      expectedIdentity = expectedIdentityFromInitialization(
        context,
        placement,
        initialized,
      );
      assertOwnership(context);
      await context.state.commit(nextStateV1(currentBody, expectedIdentity, toolchain));
      await recordStage(context, STAGE_IDENTITY_COMMITTED, "SUCCEEDED");
      await invokeTestHook(options, "after-state-commit-before-start");
    }

    assertOwnership(context);
    await validateExistingCluster({
      toolchain,
      placement,
      expectedIdentity,
      timeoutMs: options.lifecycle.startupTimeoutMs,
    });
    await recordStage(context, STAGE_CLUSTER_VALIDATED, "SUCCEEDED");

    assertOwnership(context);
    await recordStage(context, STAGE_START_STARTED, "STARTED");
    mechanics = await startPrivatePostgresCluster({
      toolchain,
      placement,
      expectedIdentity,
      logFilePath,
      lifecycle: options.lifecycle,
      assertControlAuthority,
    });
    context.privatePostgresSession.markReady(sessionToken);
    await invokeTestHook(options, "after-start-before-ready-return");
    await recordStage(context, STAGE_READY, "SUCCEEDED");

    assertOwnership(context);
    const readyMechanics = mechanics;
    const lifecycle = createOwnershipScopedPrivatePostgresLifecycle(
      {
        privatePostgresSession: context.privatePostgresSession,
        assertOwnership: () => assertOwnership(context),
      },
      readyMechanics,
      sessionToken,
    );
    const ready = Object.freeze({
      installationId: context.installationId,
      instanceId: context.instanceId,
      bootId: context.bootId,
      port: mechanics.port,
      clusterSystemIdentifier: mechanics.identity.clusterSystemIdentifier,
      toolchainVersion: toolchain.version,
      startupDisposition: mechanics.startupDisposition,
      ...lifecycle,
    });
    readySessionTokens.set(ready, sessionToken);
    readyMaintenanceDescriptors.set(
      ready,
      Object.freeze({
        toolchain,
        placement,
        expectedIdentity,
        logFilePath,
        lifecycle: options.lifecycle,
      }),
    );
    return ready;
  } catch (error) {
    let cleanupSucceeded = true;
    if (mechanics?.startupDisposition === "STARTED_BY_THIS_BOOTSTRAP") {
      if (context.privatePostgresSession.state === "READY") {
        context.privatePostgresSession.beginStop(sessionToken);
      }
      try {
        await mechanics.stop();
      } catch {
        cleanupSucceeded = false;
      }
    }
    if (context.privatePostgresSession.state === "TRANSITIONING") {
      if (cleanupSucceeded && !isPrivatePostgresCleanupUncertain(error)) {
        context.privatePostgresSession.markQuiescent(sessionToken);
      } else {
        context.privatePostgresSession.markUncertain(sessionToken);
      }
    } else if (mechanics) {
      if (context.privatePostgresSession.state === "READY") {
        context.privatePostgresSession.markUncertain(sessionToken);
      }
      cleanupSucceeded = false;
    }
    await recordFailure(context, error);
    throw error;
  }
}
