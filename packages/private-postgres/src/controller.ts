import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
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

export interface InitializePrivatePostgresClusterOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly credentialTempRoot: string;
  readonly bootstrapPasswordUtf8: Uint8Array;
  readonly port: number;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
}

export interface ValidateExistingPrivatePostgresClusterOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly timeoutMs: number;
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

async function writeRuntimeProfile(
  dataDirectory: string,
  port: number,
): Promise<void> {
  const configuration = [
    "listen_addresses = '127.0.0.1'",
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

function requireRuntimeProfileSetting(
  configuration: string,
  name: string,
): string {
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

async function readRuntimeProfile(
  dataDirectory: string,
): Promise<{ readonly listenAddress: string; readonly port: number; readonly passwordEncryption: string }> {
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
  return { listenAddress, port, passwordEncryption };
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
    async (passwordFilePath) =>
      runPostgresTool(
        options.toolchain.initdb,
        initializationArgs(
          options.placement.canonicalDataDirectory,
          passwordFilePath,
        ),
        { timeoutMs: options.lifecycle.startupTimeoutMs },
      ),
  );

  if (initResult.exitCode !== 0) {
    throw controllerProblem(
      "private-postgres.cluster.init_failed",
      "Private PostgreSQL cluster initialization failed",
      "initdb did not complete successfully; the partial target remains visible for bounded recovery",
      "unavailable",
    );
  }

  await writeRuntimeProfile(
    options.placement.canonicalDataDirectory,
    options.port,
  );
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
