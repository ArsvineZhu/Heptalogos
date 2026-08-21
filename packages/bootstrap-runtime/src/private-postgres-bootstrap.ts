import { join } from "node:path";
import {
  BootstrapJournal,
  type BootstrapActivityId,
  type BootstrapStateBodyV1,
  type BootstrapStateBodyV2,
  type BootstrapStateLoadResult,
  type BootstrapStageOutcome,
  type PrivatePostgresBootstrapStateV2,
} from "@heptalogos/bootstrap-state";
import {
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
  stop(): Promise<void>;
  restart(): Promise<void>;
}

export type PrivatePostgresSessionState =
  "QUIESCENT" | "TRANSITIONING" | "READY" | "UNCERTAIN";

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
  return new ProblemError({
    schemaVersion: 1,
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
    assertReleaseAllowed() {
      if (state === "QUIESCENT") return;
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

function stateBody(
  loaded: BootstrapStateLoadResult,
): BootstrapStateBodyV1 | BootstrapStateBodyV2 {
  if (loaded.status === "CORRUPT") {
    throw new ProblemError(loaded.problem);
  }
  if (loaded.status === "EMPTY") {
    throw bootstrapProblem(
      "bootstrap.private_postgres.state_required",
      "BootstrapState is required before private PostgreSQL preparation",
      "M3 cannot invent active generation identity when BootstrapState is empty",
      "unavailable",
    );
  }
  return loaded.value.state;
}

function hasPrivatePostgres(
  state: BootstrapStateBodyV1 | BootstrapStateBodyV2,
): state is BootstrapStateBodyV2 {
  return state.schemaVersion === 2;
}

function assertPrivatePostgresPlacement(
  privatePostgres: BootstrapStateBodyV2["privatePostgres"],
  placement: PrivatePostgresPlacement,
  installationId: InstallationId,
  instanceId: InstanceId,
  toolchain: PrivatePostgresToolchain,
): asserts privatePostgres is PrivatePostgresBootstrapStateV2 {
  if (
    privatePostgres.schemaVersion !== 2 ||
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
  state: BootstrapStateBodyV2,
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

function nextStateV2(
  current: BootstrapStateBodyV1,
  expected: PrivatePostgresExpectedIdentity,
  toolchain: PrivatePostgresToolchain,
): BootstrapStateBodyV2 {
  return {
    ...current,
    schemaVersion: 2,
    revision: current.revision + 1,
    privatePostgres: {
      schemaVersion: 2,
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
          "The persisted private PostgreSQL port is authoritative; M3 does not relocate an existing cluster",
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
          "DATA/private-postgres is non-empty without authoritative BootstrapState private PostgreSQL identity; M3 will not adopt or overwrite it",
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
      await context.state.commit(nextStateV2(currentBody, expectedIdentity, toolchain));
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
    return Object.freeze({
      installationId: context.installationId,
      instanceId: context.instanceId,
      bootId: context.bootId,
      port: mechanics.port,
      clusterSystemIdentifier: mechanics.identity.clusterSystemIdentifier,
      toolchainVersion: toolchain.version,
      ...lifecycle,
    });
  } catch (error) {
    let cleanupSucceeded = true;
    if (mechanics) {
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
    }
    await recordFailure(context, error);
    throw error;
  }
}
