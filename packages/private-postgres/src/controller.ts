import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import {
  asContentDigest,
  digestCanonicalJson,
  ProblemError,
  type CanonicalJsonValue,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  PRIVATE_POSTGRES_DATA_LAYOUT_VERSION,
  PRIVATE_POSTGRES_RELATIVE_DATA_PATH,
  type PrivatePostgresExpectedIdentity,
  type PrivatePostgresInitializationProfile,
  type PrivatePostgresInitializationProfileRevision,
  type PrivatePostgresInitializationResult,
  type PrivatePostgresLifecycleOptions,
  type PrivatePostgresControlGuard,
  type PrivatePostgresPlacement,
  type PrivatePostgresToolchain,
} from "./contracts.js";
import { withRestrictedPasswordFile } from "./credential-file.js";
import {
  classifyClusterDirectory,
  type ClusterDirectoryState,
} from "./cluster-layout.js";
import { inspectPrivatePostgresCluster } from "./cluster-inspection.js";
import { runPostgresTool } from "./process-adapter.js";

// IMPLEMENTATION_CONSTANT: cap one pg_ctl status probe; lifecycle budgets remain caller-configured.
const PRIVATE_POSTGRES_STATUS_PROBE_TIMEOUT_MS = 5_000;

export interface InitializePrivatePostgresClusterOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly credentialTempRoot: string;
  readonly bootstrapPasswordUtf8: Uint8Array;
  readonly port: number;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly assertControlAuthority: PrivatePostgresControlGuard;
}

export interface ValidateExistingPrivatePostgresClusterOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly timeoutMs: number;
}

export interface StartPrivatePostgresClusterOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly logFilePath: string;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly assertControlAuthority: PrivatePostgresControlGuard;
}

function controllerProblem(
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

function assertPort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw controllerProblem(
      "private-postgres.cluster.invalid_port",
      "Private PostgreSQL port is invalid",
      "The private PostgreSQL port must be an integer from 1 through 65535",
      "validation",
    );
  }
}

function assertLifecycleOptions(options: PrivatePostgresLifecycleOptions): void {
  if (
    !Number.isInteger(options.startupTimeoutMs) ||
    options.startupTimeoutMs <= 0 ||
    !Number.isInteger(options.shutdownTimeoutMs) ||
    options.shutdownTimeoutMs <= 0 ||
    !Number.isInteger(options.readinessPollIntervalMs) ||
    options.readinessPollIntervalMs <= 0
  ) {
    throw controllerProblem(
      "private-postgres.lifecycle.invalid_options",
      "Private PostgreSQL lifecycle options are invalid",
      "Private PostgreSQL lifecycle budgets must be positive integer milliseconds",
      "validation",
    );
  }
}

export function createPrivatePostgresInitializationProfile(
  port: number,
): PrivatePostgresInitializationProfile {
  assertPort(port);
  return Object.freeze({
    encoding: "UTF8",
    dataChecksums: true,
    hostAuthentication: "scram-sha-256",
    localAuthentication: "scram-sha-256",
    listenAddress: "127.0.0.1",
    unixSocketDirectories: "",
    persistedPort: port,
  });
}

export function createPrivatePostgresInitializationProfileRevision(
  port: number,
): PrivatePostgresInitializationProfileRevision {
  const profile = createPrivatePostgresInitializationProfile(port);
  return asContentDigest(
    "PrivatePostgresInitializationProfileRevision",
    digestCanonicalJson(
      "heptalogos.private-postgres.initialization-profile/v1",
      profile as unknown as CanonicalJsonValue,
    ),
  );
}

function initializationArgs(
  dataDirectory: string,
  passwordFilePath: string,
): readonly string[] {
  return [
    "--pgdata",
    dataDirectory,
    "--encoding=UTF8",
    "--data-checksums",
    "--auth-host=scram-sha-256",
    "--auth-local=scram-sha-256",
    `--pwfile=${passwordFilePath}`,
  ];
}

async function assertFirstInitializationTarget(
  placement: PrivatePostgresPlacement,
): Promise<void> {
  const state: ClusterDirectoryState = await classifyClusterDirectory(
    placement.canonicalDataDirectory,
  );
  if (state.kind === "NON_EMPTY") {
    throw controllerProblem(
      "private-postgres.cluster.non_empty_target",
      "Private PostgreSQL target is not eligible for first initialization",
      "A non-empty private PostgreSQL target requires authoritative BootstrapState and cannot be adopted or overwritten",
      "conflict",
    );
  }
}

async function writeRuntimeProfile(dataDirectory: string, port: number): Promise<void> {
  const configuration = [
    "listen_addresses = '127.0.0.1'",
    "unix_socket_directories = ''",
    `port = ${port}`,
    "password_encryption = 'scram-sha-256'",
    "",
  ].join("\n");
  try {
    await writeFile(join(dataDirectory, "postgresql.auto.conf"), configuration, {
      mode: 0o600,
    });
  } catch {
    throw controllerProblem(
      "private-postgres.cluster.profile_write_failed",
      "Private PostgreSQL runtime profile could not be written",
      "The owned PostgreSQL runtime profile could not be materialized in the initialized cluster",
      "unavailable",
    );
  }
}

function requireRuntimeProfileSetting(configuration: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = new RegExp(`^\\s*${escapedName}\\s*=\\s*(.*?)\\s*$`, "mu").exec(
    configuration,
  );
  if (!match || match[1].length === 0) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL runtime profile is not authoritative",
      "The existing cluster runtime profile does not expose the required deterministic settings",
    );
  }
  return match[1].replace(/^'(.*)'$/u, "$1");
}

async function readRuntimeProfile(dataDirectory: string): Promise<{
  readonly listenAddress: string;
  readonly unixSocketDirectories: string;
  readonly port: number;
  readonly passwordEncryption: string;
}> {
  let configuration: string;
  try {
    configuration = await readFile(join(dataDirectory, "postgresql.auto.conf"), "utf8");
  } catch {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL runtime profile is missing",
      "The existing cluster does not contain the Heptalogos-owned runtime profile",
    );
  }
  const listenAddress = requireRuntimeProfileSetting(configuration, "listen_addresses");
  const unixSocketDirectories = requireRuntimeProfileSetting(
    configuration,
    "unix_socket_directories",
  );
  const portText = requireRuntimeProfileSetting(configuration, "port");
  const passwordEncryption = requireRuntimeProfileSetting(
    configuration,
    "password_encryption",
  );
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL runtime port is invalid",
      "The existing cluster runtime profile contains an invalid port",
    );
  }
  return { listenAddress, unixSocketDirectories, port, passwordEncryption };
}

export async function initializePrivatePostgresCluster(
  options: InitializePrivatePostgresClusterOptions,
): Promise<PrivatePostgresInitializationResult> {
  assertPort(options.port);
  await assertFirstInitializationTarget(options.placement);

  const initializationProfileRevision =
    createPrivatePostgresInitializationProfileRevision(options.port);
  const initResult = await withRestrictedPasswordFile(
    options.credentialTempRoot,
    options.bootstrapPasswordUtf8,
    async (passwordFilePath) => {
      options.assertControlAuthority();
      return runPostgresTool(
        options.toolchain.initdb,
        initializationArgs(options.placement.canonicalDataDirectory, passwordFilePath),
        { timeoutMs: options.lifecycle.startupTimeoutMs },
      );
    },
  );

  if (initResult.exitCode !== 0) {
    throw controllerProblem(
      "private-postgres.cluster.init_failed",
      "Private PostgreSQL cluster initialization failed",
      "initdb did not complete successfully; the partial target remains visible for bounded recovery",
      "unavailable",
    );
  }

  options.assertControlAuthority();
  await writeRuntimeProfile(options.placement.canonicalDataDirectory, options.port);
  const inspection = await inspectPrivatePostgresCluster(
    options.toolchain,
    options.placement.canonicalDataDirectory,
    { timeoutMs: options.lifecycle.startupTimeoutMs },
  );
  if (inspection.dataPageChecksumVersion !== 1) {
    throw controllerProblem(
      "private-postgres.cluster.checksums_disabled",
      "Private PostgreSQL data checksums are not enabled",
      "The initialized private PostgreSQL cluster did not report data page checksum version 1",
      "integrity",
    );
  }

  return Object.freeze({
    toolchain: options.toolchain,
    placement: options.placement,
    identity: {
      clusterSystemIdentifier: inspection.clusterSystemIdentifier,
      postgresMajor: inspection.postgresMajor,
    },
    port: options.port,
    initializationProfileRevision,
    dataPageChecksumVersion: inspection.dataPageChecksumVersion,
    databaseClusterState: inspection.databaseClusterState,
    catalogVersionNumber: inspection.catalogVersionNumber,
  });
}

export async function validateExistingCluster(
  options: ValidateExistingPrivatePostgresClusterOptions,
): Promise<PrivatePostgresInitializationResult> {
  const expectedPlacement = options.expectedIdentity.placement;
  if (
    expectedPlacement.rootId !== "DATA" ||
    expectedPlacement.relativePath !== PRIVATE_POSTGRES_RELATIVE_DATA_PATH ||
    expectedPlacement.dataLayoutVersion !== PRIVATE_POSTGRES_DATA_LAYOUT_VERSION
  ) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL placement does not match BootstrapState",
      "The existing cluster placement is not the authoritative DATA/private-postgres layout",
    );
  }

  const inspection = await inspectPrivatePostgresCluster(
    options.toolchain,
    options.placement.canonicalDataDirectory,
    { timeoutMs: options.timeoutMs },
  );
  if (
    inspection.postgresMajor !== options.expectedIdentity.postgresMajor ||
    inspection.clusterSystemIdentifier !==
      options.expectedIdentity.clusterSystemIdentifier ||
    inspection.dataPageChecksumVersion !== 1
  ) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL cluster identity does not match BootstrapState",
      "The existing cluster major, system identifier, or checksum profile does not match the authoritative identity",
    );
  }

  const runtimeProfile = await readRuntimeProfile(
    options.placement.canonicalDataDirectory,
  );
  if (
    runtimeProfile.listenAddress !== "127.0.0.1" ||
    runtimeProfile.unixSocketDirectories !== "" ||
    runtimeProfile.passwordEncryption !== "scram-sha-256" ||
    runtimeProfile.port !== options.expectedIdentity.persistedPort
  ) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL runtime profile does not match BootstrapState",
      "The existing cluster loopback, port, or password-encryption profile does not match the authoritative identity",
    );
  }

  const actualProfileRevision = createPrivatePostgresInitializationProfileRevision(
    runtimeProfile.port,
  );
  if (
    actualProfileRevision !== options.expectedIdentity.initializationProfileRevision
  ) {
    throw controllerProblem(
      "private-postgres.cluster.identity_mismatch",
      "Private PostgreSQL initialization profile does not match BootstrapState",
      "The existing cluster initialization profile revision does not match the authoritative identity",
    );
  }

  return Object.freeze({
    toolchain: options.toolchain,
    placement: options.placement,
    identity: {
      clusterSystemIdentifier: inspection.clusterSystemIdentifier,
      postgresMajor: inspection.postgresMajor,
    },
    port: runtimeProfile.port,
    initializationProfileRevision: actualProfileRevision,
    dataPageChecksumVersion: inspection.dataPageChecksumVersion,
    databaseClusterState: inspection.databaseClusterState,
    catalogVersionNumber: inspection.catalogVersionNumber,
  });
}

function timeoutSeconds(timeoutMs: number): string {
  return String(Math.max(1, Math.ceil(timeoutMs / 1000)));
}

async function runPgCtlChecked(
  toolchain: PrivatePostgresToolchain,
  args: readonly string[],
  timeoutMs: number,
  problemCode: string,
  title: string,
  detail: string,
  stdio: "pipe" | "ignore" = "pipe",
): Promise<void> {
  const result = await runPostgresTool(toolchain.pgCtl, args, { timeoutMs, stdio });
  if (result.exitCode !== 0) {
    throw controllerProblem(problemCode, title, detail, "unavailable");
  }
}

async function waitForPrivatePostgresReadiness(
  options: StartPrivatePostgresClusterOptions,
  port: number,
): Promise<void> {
  const deadline = performance.now() + options.lifecycle.startupTimeoutMs;

  while (performance.now() < deadline) {
    const remainingMs = Math.max(1, deadline - performance.now());
    const status = await runPostgresTool(
      options.toolchain.pgCtl,
      ["status", "--pgdata", options.placement.canonicalDataDirectory],
      {
        timeoutMs: Math.min(
          PRIVATE_POSTGRES_STATUS_PROBE_TIMEOUT_MS,
          Math.ceil(remainingMs),
        ),
      },
    );
    if (status.exitCode !== 0) {
      throw controllerProblem(
        "private-postgres.lifecycle.process_exited",
        "Private PostgreSQL process exited before readiness",
        "pg_ctl reported that the validated private PostgreSQL process is no longer running",
        "unavailable",
      );
    }

    const readiness = await runPostgresTool(
      options.toolchain.pgIsReady,
      ["--host", "127.0.0.1", "--port", String(port)],
      {
        timeoutMs: Math.min(
          PRIVATE_POSTGRES_STATUS_PROBE_TIMEOUT_MS,
          Math.ceil(remainingMs),
        ),
      },
    );
    if (readiness.exitCode === 0) return;

    const waitMs = Math.min(
      options.lifecycle.readinessPollIntervalMs,
      Math.max(1, Math.ceil(deadline - performance.now())),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  }

  throw controllerProblem(
    "private-postgres.lifecycle.readiness_timeout",
    "Private PostgreSQL readiness timed out",
    "The validated private PostgreSQL cluster did not accept loopback connections within the startup budget",
    "unavailable",
  );
}

async function assertPrivatePostgresProcessRunning(
  options: StartPrivatePostgresClusterOptions,
): Promise<void> {
  const status = await runPostgresTool(
    options.toolchain.pgCtl,
    ["status", "--pgdata", options.placement.canonicalDataDirectory],
    {
      timeoutMs: Math.min(
        PRIVATE_POSTGRES_STATUS_PROBE_TIMEOUT_MS,
        options.lifecycle.startupTimeoutMs,
      ),
    },
  );
  if (status.exitCode !== 0) {
    throw controllerProblem(
      "private-postgres.lifecycle.restart_failed",
      "Private PostgreSQL restart refused after process exit",
      "The validated private PostgreSQL process is no longer running; restart will not silently recover an unexpected exit",
      "unavailable",
    );
  }
}

async function startProcess(
  options: StartPrivatePostgresClusterOptions,
): Promise<void> {
  options.assertControlAuthority();
  await runPgCtlChecked(
    options.toolchain,
    [
      "start",
      "--pgdata",
      options.placement.canonicalDataDirectory,
      "--log",
      options.logFilePath,
      "--wait",
      "--timeout",
      timeoutSeconds(options.lifecycle.startupTimeoutMs),
    ],
    options.lifecycle.startupTimeoutMs,
    "private-postgres.lifecycle.start_failed",
    "Private PostgreSQL start failed",
    "pg_ctl could not start the validated private PostgreSQL cluster",
    "ignore",
  );
}

async function restartProcess(
  options: StartPrivatePostgresClusterOptions,
): Promise<void> {
  options.assertControlAuthority();
  await runPgCtlChecked(
    options.toolchain,
    [
      "restart",
      "--pgdata",
      options.placement.canonicalDataDirectory,
      "--mode=fast",
      "--wait",
      "--timeout",
      timeoutSeconds(options.lifecycle.startupTimeoutMs),
    ],
    options.lifecycle.startupTimeoutMs,
    "private-postgres.lifecycle.restart_failed",
    "Private PostgreSQL restart failed",
    "pg_ctl could not restart the validated private PostgreSQL cluster",
    "ignore",
  );
}

async function stopProcess(options: StartPrivatePostgresClusterOptions): Promise<void> {
  options.assertControlAuthority();
  await runPgCtlChecked(
    options.toolchain,
    [
      "stop",
      "--pgdata",
      options.placement.canonicalDataDirectory,
      "--mode=fast",
      "--wait",
      "--timeout",
      timeoutSeconds(options.lifecycle.shutdownTimeoutMs),
    ],
    options.lifecycle.shutdownTimeoutMs,
    "private-postgres.lifecycle.stop_failed",
    "Private PostgreSQL stop failed",
    "pg_ctl could not stop the private PostgreSQL cluster within the shutdown budget",
  );
}

export async function startPrivatePostgresCluster(
  options: StartPrivatePostgresClusterOptions,
): Promise<import("./contracts.js").ReadyPrivatePostgresMechanics> {
  options.assertControlAuthority();
  assertPort(options.expectedIdentity.persistedPort);
  assertLifecycleOptions(options.lifecycle);
  if (!/^\//u.test(options.logFilePath) && process.platform !== "win32") {
    throw controllerProblem(
      "private-postgres.lifecycle.invalid_log_path",
      "Private PostgreSQL log path is not absolute",
      "The PostgreSQL lifecycle log target must be an absolute path under the logical LOG root",
      "validation",
    );
  }
  if (process.platform === "win32" && !/^[A-Za-z]:[\\/]/u.test(options.logFilePath)) {
    throw controllerProblem(
      "private-postgres.lifecycle.invalid_log_path",
      "Private PostgreSQL log path is not absolute",
      "The PostgreSQL lifecycle log target must be an absolute path under the logical LOG root",
      "validation",
    );
  }

  let processStarted = false;
  try {
    await validateExistingCluster({
      toolchain: options.toolchain,
      placement: options.placement,
      expectedIdentity: options.expectedIdentity,
      timeoutMs: options.lifecycle.startupTimeoutMs,
    });
    await startProcess(options);
    processStarted = true;
    await waitForPrivatePostgresReadiness(
      options,
      options.expectedIdentity.persistedPort,
    );
    const started = await validateExistingCluster({
      toolchain: options.toolchain,
      placement: options.placement,
      expectedIdentity: options.expectedIdentity,
      timeoutMs: options.lifecycle.startupTimeoutMs,
    });
    let state: "READY" | "STOPPED" = "READY";

    return {
      toolchain: started.toolchain,
      placement: started.placement,
      identity: started.identity,
      port: started.port,
      async stop(): Promise<void> {
        if (state === "STOPPED") return;
        await stopProcess(options);
        state = "STOPPED";
      },
      async restart(): Promise<void> {
        if (state === "STOPPED") {
          await startProcess(options);
        } else {
          await assertPrivatePostgresProcessRunning(options);
          await restartProcess(options);
        }
        try {
          await waitForPrivatePostgresReadiness(
            options,
            options.expectedIdentity.persistedPort,
          );
          const restarted = await validateExistingCluster({
            toolchain: options.toolchain,
            placement: options.placement,
            expectedIdentity: options.expectedIdentity,
            timeoutMs: options.lifecycle.startupTimeoutMs,
          });
          if (
            restarted.identity.clusterSystemIdentifier !==
              started.identity.clusterSystemIdentifier ||
            restarted.port !== started.port
          ) {
            throw controllerProblem(
              "private-postgres.lifecycle.identity_changed",
              "Private PostgreSQL identity changed during restart",
              "The restarted private PostgreSQL process did not preserve the validated cluster identity and port",
              "integrity",
            );
          }
          state = "READY";
        } catch (error) {
          if (error instanceof ProblemError) throw error;
          throw controllerProblem(
            "private-postgres.lifecycle.restart_failed",
            "Private PostgreSQL restart readiness failed",
            "The restarted private PostgreSQL cluster did not return to its validated ready state",
            "unavailable",
          );
        }
      },
    };
  } catch (error) {
    if (!processStarted) throw error;
    try {
      options.assertControlAuthority();
      await stopProcess(options);
    } catch {
      throw controllerProblem(
        "private-postgres.lifecycle.start_cleanup_uncertain",
        "Private PostgreSQL start cleanup is uncertain",
        "PostgreSQL started but a later readiness or identity check failed and the process could not be proven stopped",
        "integrity",
      );
    }
    throw error;
  }
}
