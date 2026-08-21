import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";
import type { PrivatePostgresToolchain } from "./contracts.js";
import { runPostgresTool } from "./process-adapter.js";

export interface EffectivePrivatePostgresProfile {
  readonly listenAddress: string;
  readonly unixSocketDirectories: string;
  readonly port: number;
  readonly passwordEncryption: string;
  readonly dataDirectory: string;
  readonly hbaFile: string;
}

function profileProblem(
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
    throw profileProblem(
      "private-postgres.cluster.invalid_port",
      "Private PostgreSQL port is invalid",
      "The private PostgreSQL port must be an integer from 1 through 65535",
      "validation",
    );
  }
}

export function createCanonicalRuntimeProfile(port: number): string {
  assertPort(port);
  return [
    "listen_addresses = '127.0.0.1'",
    "unix_socket_directories = ''",
    `port = ${port}`,
    "password_encryption = 'scram-sha-256'",
    "",
  ].join("\n");
}

export function createCanonicalHbaProfile(): string {
  return [
    "# Heptalogos private PostgreSQL HBA profile v1",
    "host all all 127.0.0.1/32 scram-sha-256",
    "",
  ].join("\n");
}

export async function writeCanonicalPrivatePostgresRuntimeProfile(
  dataDirectory: string,
  port: number,
): Promise<void> {
  try {
    await writeFile(
      join(dataDirectory, "postgresql.auto.conf"),
      createCanonicalRuntimeProfile(port),
      { mode: 0o600 },
    );
    await writeFile(join(dataDirectory, "pg_hba.conf"), createCanonicalHbaProfile(), {
      mode: 0o600,
    });
  } catch {
    throw profileProblem(
      "private-postgres.cluster.profile_write_failed",
      "Private PostgreSQL runtime profile could not be written",
      "The owned PostgreSQL runtime and HBA profiles could not be materialized in the initialized cluster",
      "unavailable",
    );
  }
}

async function queryEffectiveSetting(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
  setting: string,
  timeoutMs: number,
): Promise<string> {
  const result = await runPostgresTool(
    toolchain.postgres,
    ["-D", dataDirectory, "-C", setting],
    { timeoutMs },
  );
  if (result.exitCode !== 0) {
    throw profileProblem(
      "private-postgres.cluster.effective_setting_failed",
      "PostgreSQL effective setting inspection failed",
      `PostgreSQL could not report the effective ${setting} setting`,
      "unavailable",
    );
  }
  const value = result.stdout.trim();
  if (value.length === 0 && setting !== "unix_socket_directories") {
    throw profileProblem(
      "private-postgres.cluster.effective_setting_invalid",
      "PostgreSQL effective setting is empty",
      `PostgreSQL reported an empty effective ${setting} setting`,
    );
  }
  return value;
}

export async function inspectEffectivePrivatePostgresProfile(
  toolchain: PrivatePostgresToolchain,
  dataDirectory: string,
  timeoutMs: number,
): Promise<EffectivePrivatePostgresProfile> {
  const listenAddress = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "listen_addresses",
    timeoutMs,
  );
  const unixSocketDirectories = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "unix_socket_directories",
    timeoutMs,
  );
  const portText = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "port",
    timeoutMs,
  );
  const port = Number(portText);
  assertPort(port);
  const passwordEncryption = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "password_encryption",
    timeoutMs,
  );
  const dataDirectorySetting = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "data_directory",
    timeoutMs,
  );
  const hbaFile = await queryEffectiveSetting(
    toolchain,
    dataDirectory,
    "hba_file",
    timeoutMs,
  );

  return Object.freeze({
    listenAddress,
    unixSocketDirectories,
    port,
    passwordEncryption,
    dataDirectory: dataDirectorySetting,
    hbaFile,
  });
}

export async function readCanonicalHbaProfile(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch {
    throw profileProblem(
      "private-postgres.cluster.hba_profile_missing",
      "Private PostgreSQL HBA profile is missing",
      "The authoritative private PostgreSQL HBA profile could not be read",
    );
  }
}
