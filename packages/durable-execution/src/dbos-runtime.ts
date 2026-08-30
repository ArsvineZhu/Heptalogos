/**
 * Coordinates the Host-bound DBOS pool, process-global binding, and lifecycle
 * without exposing DBOS configuration or PostgreSQL implementation objects.
 * @module dbos-runtime
 */

import { createRequire } from "node:module";
import {
  parseDurableCodeVersion,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import type { HostDurableExecutionAuthority } from "@heptalogos/host-ownership";
import type { WorkAttemptExecutor } from "@heptalogos/work-queue";
import {
  type DurableExecutionAuthority,
  type DurableExecutionLifecycleState,
  type DurableExecutionPoolOptions,
  type DurableExecutionQuiescenceLease,
  type DurableExecutionRuntime,
  type DurableExecutionRuntimeOptions,
} from "./contracts.js";
import {
  bindWorkAttemptExecutor,
  getActiveWorkAttemptInvocationCount,
  waitForActiveWorkAttemptInvocations,
} from "./dbos-binding.js";
import type { BindingDriver } from "./dbos-binding.js";
import { createDbosSystemPool } from "./dbos-pool.js";
import { type DbosQueueClient, withDbosQueueClient } from "./dbos-client.js";
import { createDurableExecutionLifecycleMachine } from "./dbos-lifecycle-machine.js";
import { projectWorkQueueProfiles } from "./dbos-queue-profiles.js";
import { durableExecutionProblem } from "./problems.js";

interface DurableExecutionPoolHandle {
  end(): Promise<void>;
}

interface DbosRuntimeConfig {
  readonly name: "heptalogos";
  readonly applicationVersion: string;
  readonly executorID: string;
  readonly systemDatabaseSchemaName: "dbos";
  readonly systemDatabasePool: DurableExecutionPoolHandle;
  readonly systemDatabasePollingConcurrency: number;
  readonly runMigrations: false;
  readonly runAdminServer: false;
  readonly listenQueues: readonly string[];
  readonly maxConcurrentQueueDispatches: number;
}

interface DbosLifecycleDriver {
  withQueueClient<T>(
    authority: HostDurableExecutionAuthority,
    pool: DurableExecutionPoolHandle,
    options: {
      readonly poolSize: number;
      readonly pollingConcurrency: number;
      readonly connectionTimeoutMs: number;
    },
    use: (client: DbosQueueClient) => Promise<T>,
  ): Promise<T>;
  setConfig(config: DbosRuntimeConfig): void;
  launch(): Promise<void>;
  shutdown(options: { readonly workflowCompletionTimeoutMS: number }): Promise<void>;
}

type PoolFactory = (
  authority: HostDurableExecutionAuthority,
  options: DurableExecutionPoolOptions,
  onBackgroundError: DurableExecutionRuntimeOptions["onBackgroundError"],
) => DurableExecutionPoolHandle;

interface RuntimeDependencies {
  readonly createPool: PoolFactory;
  readonly dbos: DbosLifecycleDriver;
  readonly bindingDriver?: BindingDriver;
}

const defaultDbosDriver: DbosLifecycleDriver = {
  withQueueClient(authority, pool, options, use) {
    return withDbosQueueClient(authority, pool, options, use);
  },
  setConfig(config) {
    dbosSdk.setConfig(config);
  },
  launch() {
    return dbosSdk.launch();
  },
  shutdown(options) {
    return dbosSdk.shutdown(options);
  },
};

interface DbosSdkRuntimeSurface {
  setConfig(config: DbosRuntimeConfig): void;
  launch(): Promise<void>;
  shutdown(options: { readonly workflowCompletionTimeoutMS: number }): Promise<void>;
}

const dbosSdk = createRequire(import.meta.url)("@dbos-inc/dbos-sdk")
  .DBOS as DbosSdkRuntimeSurface;

const defaultDependencies: RuntimeDependencies = {
  createPool: createDbosSystemPool,
  dbos: defaultDbosDriver,
};

function reportBackgroundError(
  options: DurableExecutionRuntimeOptions,
  error: unknown,
): void {
  try {
    options.onBackgroundError(error);
  } catch {
    // Background diagnostics must not become an unhandled rejection.
  }
}

function assertPositiveSafeInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      `${field} must be a positive safe integer`,
    );
  }
}

function validateOptions(options: DurableExecutionRuntimeOptions): void {
  if (typeof options.onTerminalFailure !== "function") {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      "onTerminalFailure must be a function",
    );
  }
  if (typeof options.onBackgroundError !== "function") {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      "onBackgroundError must be a function",
    );
  }
  if (parseDurableCodeVersion(options.durableCodeVersion) === undefined) {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      "durableCodeVersion must be a branded digest string",
    );
  }
  for (const [field, value] of [
    ["systemPool.maxConnections", options.systemPool.maxConnections],
    ["systemPool.idleTimeoutMs", options.systemPool.idleTimeoutMs],
    ["systemPool.connectionTimeoutMs", options.systemPool.connectionTimeoutMs],
    ["systemPool.statementTimeoutMs", options.systemPool.statementTimeoutMs],
    [
      "systemPool.idleInTransactionSessionTimeoutMs",
      options.systemPool.idleInTransactionSessionTimeoutMs,
    ],
    ["systemDatabasePollingConcurrency", options.systemDatabasePollingConcurrency],
    ["maxConcurrentQueueDispatches", options.maxConcurrentQueueDispatches],
    ["workflowMaxRecoveryAttempts", options.workflowMaxRecoveryAttempts],
    ["shutdownDrainTimeoutMs", options.shutdownDrainTimeoutMs],
  ] as const) {
    assertPositiveSafeInteger(value, field);
  }
  if (options.systemDatabasePollingConcurrency > options.systemPool.maxConnections) {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      "systemDatabasePollingConcurrency cannot exceed pool maxConnections",
    );
  }
  if (options.profiles.list().length === 0) {
    throw durableExecutionProblem(
      "durable.execution.runtime.invalid_options",
      "DurableExecution requires a non-empty WorkQueue profile catalog",
    );
  }
}

function queueNames(options: DurableExecutionRuntimeOptions): string[] {
  return options.profiles
    .list()
    .map((profile) => `heptalogos.queue.${String(profile.profileId)}`);
}

function dbosConfig(
  authority: DurableExecutionAuthority,
  options: DurableExecutionRuntimeOptions,
  pool: DurableExecutionPoolHandle,
): DbosRuntimeConfig {
  return {
    name: "heptalogos",
    applicationVersion: options.durableCodeVersion,
    executorID: authority.instanceId,
    systemDatabaseSchemaName: "dbos",
    systemDatabasePool: pool,
    systemDatabasePollingConcurrency: options.systemDatabasePollingConcurrency,
    runMigrations: false,
    runAdminServer: false,
    listenQueues: queueNames(options),
    maxConcurrentQueueDispatches: options.maxConcurrentQueueDispatches,
  };
}

function invalidState(
  action: string,
  state: DurableExecutionLifecycleState,
): ProblemError {
  return durableExecutionProblem(
    "durable.execution.runtime.invalid_transition",
    `Cannot ${action} while DurableExecution is ${state}`,
  );
}

function assertAuthorityActive(authority: HostDurableExecutionAuthority): void {
  try {
    authority.assertActive();
  } catch (error) {
    if (error instanceof ProblemError) throw error;
    throw durableExecutionProblem(
      "durable.execution.runtime.authority_lost",
      "The Host durable-execution authority is no longer active",
      error,
    );
  }
}

function createRuntime(
  authority: HostDurableExecutionAuthority,
  options: DurableExecutionRuntimeOptions,
  executor: WorkAttemptExecutor,
  dependencies: RuntimeDependencies,
): DurableExecutionRuntime {
  const lifecycle = createDurableExecutionLifecycleMachine();
  let pool: DurableExecutionPoolHandle | undefined;
  let binding: ReturnType<typeof bindWorkAttemptExecutor> | undefined;
  let poolClosed = false;
  let dbosLaunchAttempted = false;
  let dbosLaunched = false;
  let startPromise: Promise<void> | undefined;
  let quiescePromise: Promise<void> | undefined;
  let closePromise: Promise<void> | undefined;
  let upstreamQuiescenceLease: DurableExecutionQuiescenceLease | undefined;
  let terminalFailureNotified = false;
  let authorityAbortListener: (() => void) | undefined;

  const releaseBinding = (): void => {
    binding?.release();
    binding = undefined;
  };

  const closePool = async (): Promise<void> => {
    if (pool === undefined || poolClosed) return;
    const current = pool;
    await current.end();
    poolClosed = true;
    pool = undefined;
  };

  const notifyTerminalFailure = async (error: unknown): Promise<void> => {
    if (terminalFailureNotified) return;
    terminalFailureNotified = true;
    try {
      await options.onTerminalFailure(error);
    } catch (callbackError) {
      reportBackgroundError(options, callbackError);
    }
  };

  const restoreUpstreamQuiescence = async (): Promise<void> => {
    const lease = upstreamQuiescenceLease;
    if (lease === undefined) return;
    await lease.resumeAfterAbort();
    upstreamQuiescenceLease = undefined;
  };

  const detachAuthorityAbortListener = (): void => {
    if (authorityAbortListener === undefined) return;
    authority.signal.removeEventListener("abort", authorityAbortListener);
    authorityAbortListener = undefined;
  };

  const preflightQueueProfiles = async (): Promise<void> => {
    if (pool === undefined) {
      throw durableExecutionProblem(
        "durable.execution.runtime.invalid_transition",
        "DBOS queue preflight requires an open caller-owned pool",
      );
    }
    await dependencies.dbos.withQueueClient(
      authority,
      pool,
      {
        poolSize: options.systemPool.maxConnections,
        pollingConcurrency: options.systemDatabasePollingConcurrency,
        connectionTimeoutMs: options.systemPool.connectionTimeoutMs,
      },
      (client) => projectWorkQueueProfiles(options.profiles, client),
    );
  };

  const configureAndLaunch = async (): Promise<void> => {
    if (pool === undefined) {
      throw durableExecutionProblem(
        "durable.execution.runtime.invalid_transition",
        "DBOS launch requires an open caller-owned pool",
      );
    }
    await preflightQueueProfiles();
    dependencies.dbos.setConfig(dbosConfig(authority, options, pool));
    dbosLaunchAttempted = true;
    await dependencies.dbos.launch();
    dbosLaunched = true;
  };

  const shutdownDbosAndPool = async (): Promise<void> => {
    if (dbosLaunchAttempted || dbosLaunched) {
      await dependencies.dbos.shutdown({
        workflowCompletionTimeoutMS: options.shutdownDrainTimeoutMs,
      });
      if (getActiveWorkAttemptInvocationCount() !== 0) {
        throw durableExecutionProblem(
          "durable.execution.runtime.drain_timeout",
          "DurableExecution shutdown exceeded its bounded drain budget",
        );
      }
      dbosLaunched = false;
      dbosLaunchAttempted = false;
    }
    if (getActiveWorkAttemptInvocationCount() !== 0) {
      throw durableExecutionProblem(
        "durable.execution.runtime.drain_timeout",
        "DurableExecution cannot release engine resources while an invocation remains active",
      );
    }
    let firstError: unknown;
    try {
      await closePool();
    } catch (error) {
      firstError ??= error;
    }
    if (getActiveWorkAttemptInvocationCount() === 0) releaseBinding();
    if (firstError !== undefined) throw firstError;
  };

  const cleanupAfterStartFailure = async (): Promise<void> => {
    try {
      await shutdownDbosAndPool();
    } catch (error) {
      await notifyTerminalFailure(error);
    }
  };

  const openResources = (): void => {
    assertAuthorityActive(authority);
    pool = dependencies.createPool(authority, options.systemPool, (error) =>
      reportBackgroundError(options, error),
    );
    poolClosed = false;
    binding = bindWorkAttemptExecutor(
      executor,
      options.workflowMaxRecoveryAttempts,
      dependencies.bindingDriver,
    );
  };

  const start = (): Promise<void> => {
    if (lifecycle.state === "OPEN") return Promise.resolve();
    if (lifecycle.state === "STARTING" && startPromise !== undefined) {
      return startPromise;
    }
    if (lifecycle.state !== "CREATED" && lifecycle.state !== "QUIESCED") {
      return Promise.reject(invalidState("start", lifecycle.state));
    }
    if (lifecycle.state === "QUIESCED") {
      return resume();
    }
    lifecycle.send("START");
    startPromise = (async () => {
      try {
        openResources();
        await configureAndLaunch();
        assertAuthorityActive(authority);
        lifecycle.send("START_SUCCEEDED");
      } catch (error) {
        if (lifecycle.state === "STARTING") lifecycle.send("FAIL");
        await cleanupAfterStartFailure();
        throw error;
      } finally {
        startPromise = undefined;
      }
    })();
    return startPromise;
  };

  const quiesce = (): Promise<void> => {
    if (lifecycle.state === "QUIESCED") return Promise.resolve();
    if (lifecycle.state === "QUIESCING" && quiescePromise !== undefined) {
      return quiescePromise;
    }
    if (lifecycle.state !== "OPEN") {
      return Promise.reject(invalidState("quiesce", lifecycle.state));
    }
    lifecycle.send("BEGIN_QUIESCE");
    quiescePromise = (async () => {
      let providerTeardownStarted = false;
      let upstreamRestorationAttempted = false;
      try {
        const quiescenceSignal =
          options.quiescence === undefined
            ? undefined
            : AbortSignal.timeout(options.shutdownDrainTimeoutMs);
        upstreamQuiescenceLease =
          options.quiescence === undefined
            ? undefined
            : await options.quiescence.prepare(quiescenceSignal!);
        const settled = await waitForActiveWorkAttemptInvocations(
          options.shutdownDrainTimeoutMs,
        );
        if (!settled) {
          upstreamRestorationAttempted = true;
          try {
            await restoreUpstreamQuiescence();
          } catch (error) {
            if (lifecycle.state === "QUIESCING") lifecycle.send("FAIL");
            await notifyTerminalFailure(error);
            throw error;
          }
          lifecycle.send("QUIESCE_ABORTED");
          throw durableExecutionProblem(
            "durable.execution.runtime.drain_timeout",
            "DurableExecution pre-entry drain exceeded its bounded budget",
          );
        }
        providerTeardownStarted = true;
        await shutdownDbosAndPool();
        lifecycle.send("QUIESCE_SUCCEEDED");
      } catch (error) {
        if (providerTeardownStarted) {
          if (lifecycle.state === "QUIESCING") lifecycle.send("FAIL");
          await notifyTerminalFailure(error);
        } else if (!upstreamRestorationAttempted) {
          upstreamRestorationAttempted = true;
          try {
            await restoreUpstreamQuiescence();
            if (lifecycle.state === "QUIESCING") lifecycle.send("QUIESCE_ABORTED");
          } catch (restoreError) {
            if (lifecycle.state === "QUIESCING") lifecycle.send("FAIL");
            await notifyTerminalFailure(restoreError);
            throw restoreError;
          }
        }
        throw error;
      } finally {
        quiescePromise = undefined;
      }
    })();
    return quiescePromise;
  };

  const resume = (): Promise<void> => {
    if (lifecycle.state === "OPEN") return Promise.resolve();
    if (lifecycle.state !== "QUIESCED") {
      return Promise.reject(invalidState("resume", lifecycle.state));
    }
    lifecycle.send("BEGIN_RESUME");
    startPromise = (async () => {
      try {
        openResources();
        await configureAndLaunch();
        assertAuthorityActive(authority);
        await restoreUpstreamQuiescence();
        lifecycle.send("RESUME_SUCCEEDED");
      } catch (error) {
        if (lifecycle.state === "RESUMING") lifecycle.send("FAIL");
        await cleanupAfterStartFailure();
        throw error;
      } finally {
        startPromise = undefined;
      }
    })();
    return startPromise;
  };

  const close = (): Promise<void> => {
    if (lifecycle.state === "CLOSED") return Promise.resolve();
    if (closePromise !== undefined) return closePromise;
    closePromise = (async () => {
      if (
        (lifecycle.state === "STARTING" || lifecycle.state === "RESUMING") &&
        startPromise !== undefined
      ) {
        await startPromise.catch(() => undefined);
      }
      if (lifecycle.state === "QUIESCING" && quiescePromise !== undefined) {
        await quiescePromise.catch(() => undefined);
      }
      if (
        lifecycle.state === "CREATED" ||
        lifecycle.state === "OPEN" ||
        lifecycle.state === "QUIESCED" ||
        lifecycle.state === "FAILED"
      ) {
        lifecycle.send("BEGIN_CLOSE");
      }
      if (lifecycle.state === "CLOSING") {
        let firstError: unknown;
        try {
          await shutdownDbosAndPool();
          lifecycle.send("CLOSED");
          detachAuthorityAbortListener();
          lifecycle.stop();
        } catch (error) {
          firstError = error;
          if (lifecycle.state === "CLOSING") lifecycle.send("FAIL");
        }
        if (firstError !== undefined) throw firstError;
      }
    })().finally(() => {
      closePromise = undefined;
    });
    return closePromise;
  };

  const runtime: DurableExecutionRuntime = Object.freeze({
    get state() {
      return lifecycle.state;
    },
    start,
    quiesce,
    resume,
    close,
  });

  const onAuthorityAbort = (): void => {
    void close().catch((error) => reportBackgroundError(options, error));
  };
  authorityAbortListener = onAuthorityAbort;
  authority.signal.addEventListener("abort", onAuthorityAbort, { once: true });
  return runtime;
}

/** Creates the Host-bound runtime with the real DBOS and caller-owned pool. */
export function createDurableExecutionRuntime(
  authority: HostDurableExecutionAuthority,
  options: DurableExecutionRuntimeOptions,
  executor: WorkAttemptExecutor,
): DurableExecutionRuntime {
  validateOptions(options);
  return createRuntime(authority, options, executor, defaultDependencies);
}

/** Tests only: injects DBOS/pool seams while retaining the real lifecycle rules. */
export function createDurableExecutionRuntimeForTests(
  authority: HostDurableExecutionAuthority,
  options: DurableExecutionRuntimeOptions,
  executor: WorkAttemptExecutor,
  dependencies: RuntimeDependencies,
): DurableExecutionRuntime {
  validateOptions(options);
  return createRuntime(authority, options, executor, dependencies);
}

/** Checks the admission fence used by the later DurableDispatchPort adapter. */
export function assertDurableExecutionDispatchOpen(
  state: DurableExecutionLifecycleState,
  authority: HostDurableExecutionAuthority,
): void {
  if (state !== "OPEN") {
    throw durableExecutionProblem(
      "durable.execution.dispatch.not_open",
      `DurableExecution dispatch requires OPEN state, received ${state}`,
    );
  }
  assertAuthorityActive(authority);
}
