import { performance } from "node:perf_hooks";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";
import type {
  PrivatePostgresExpectedIdentity,
  PrivatePostgresLifecycleOptions,
  PrivatePostgresPlacement,
  PrivatePostgresToolchain,
} from "./contracts.js";
import { validateExistingCluster } from "./controller.js";
import { runPostgresTool } from "./process-adapter.js";

export interface PrivatePostgresLifecycleOperationsOptions {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly expectedIdentity: PrivatePostgresExpectedIdentity;
  readonly logFilePath: string;
  readonly lifecycle: PrivatePostgresLifecycleOptions;
  readonly assertControlAuthority: () => void;
}

export type ExistingPrivatePostgresProcessStatus = "RUNNING" | "STOPPED";

const STATUS_PROBE_TIMEOUT_MS = 5_000;

function operationProblem(
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

function timeoutSeconds(timeoutMs: number): string {
  return String(Math.max(1, Math.ceil(timeoutMs / 1000)));
}

async function readProcessStatus(
  options: PrivatePostgresLifecycleOperationsOptions,
  timeoutMs = options.lifecycle.startupTimeoutMs,
): Promise<ExistingPrivatePostgresProcessStatus> {
  const result = await runPostgresTool(
    options.toolchain.pgCtl,
    ["status", "--pgdata", options.placement.canonicalDataDirectory],
    { timeoutMs: Math.min(STATUS_PROBE_TIMEOUT_MS, timeoutMs) },
  );
  if (result.exitCode === 0) return "RUNNING";
  if (result.exitCode === 3) return "STOPPED";
  throw operationProblem(
    "private-postgres.lifecycle.status_uncertain",
    "Private PostgreSQL process status is uncertain",
    "pg_ctl could not prove whether the validated private PostgreSQL process is running",
  );
}

async function waitForReadiness(
  options: PrivatePostgresLifecycleOperationsOptions,
): Promise<void> {
  const deadline = performance.now() + options.lifecycle.startupTimeoutMs;
  while (performance.now() < deadline) {
    const remainingMs = Math.max(1, deadline - performance.now());
    const status = await runPostgresTool(
      options.toolchain.pgCtl,
      ["status", "--pgdata", options.placement.canonicalDataDirectory],
      { timeoutMs: Math.min(STATUS_PROBE_TIMEOUT_MS, Math.ceil(remainingMs)) },
    );
    if (status.exitCode !== 0) {
      throw operationProblem(
        "private-postgres.lifecycle.process_exited",
        "Private PostgreSQL process exited before readiness",
        "pg_ctl reported that the validated private PostgreSQL process is no longer running",
        "unavailable",
      );
    }
    const readiness = await runPostgresTool(
      options.toolchain.pgIsReady,
      ["--host", "127.0.0.1", "--port", String(options.expectedIdentity.persistedPort)],
      { timeoutMs: Math.min(STATUS_PROBE_TIMEOUT_MS, Math.ceil(remainingMs)) },
    );
    if (readiness.exitCode === 0) return;
    const waitMs = Math.min(
      options.lifecycle.readinessPollIntervalMs,
      Math.max(1, Math.ceil(deadline - performance.now())),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  }
  throw operationProblem(
    "private-postgres.lifecycle.readiness_timeout",
    "Private PostgreSQL readiness timed out",
    "The validated private PostgreSQL cluster did not accept loopback connections within the startup budget",
    "unavailable",
  );
}

async function runChecked(
  executable: string,
  args: readonly string[],
  timeoutMs: number,
  problemCode: string,
  title: string,
  detail: string,
  stdio: "pipe" | "ignore" = "pipe",
): Promise<void> {
  const result = await runPostgresTool(executable, args, { timeoutMs, stdio });
  if (result.exitCode !== 0) {
    throw operationProblem(problemCode, title, detail, "unavailable");
  }
}

export async function observeValidatedCluster(
  options: PrivatePostgresLifecycleOperationsOptions,
): Promise<ExistingPrivatePostgresProcessStatus> {
  options.assertControlAuthority();
  await validateExistingCluster({
    toolchain: options.toolchain,
    placement: options.placement,
    expectedIdentity: options.expectedIdentity,
    timeoutMs: options.lifecycle.startupTimeoutMs,
  });
  const status = await readProcessStatus(options);
  if (status === "STOPPED") return status;
  await waitForReadiness(options);
  await validateExistingCluster({
    toolchain: options.toolchain,
    placement: options.placement,
    expectedIdentity: options.expectedIdentity,
    timeoutMs: options.lifecycle.startupTimeoutMs,
  });
  return "RUNNING";
}

export async function stopValidatedCluster(
  options: PrivatePostgresLifecycleOperationsOptions,
): Promise<void> {
  options.assertControlAuthority();
  const before = await readProcessStatus(options, options.lifecycle.shutdownTimeoutMs);
  if (before === "STOPPED") return;

  options.assertControlAuthority();
  try {
    await runChecked(
      options.toolchain.pgCtl,
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
  } catch {
    // The status proof below is authoritative even when pg_ctl reports a failure.
  }

  let after: ExistingPrivatePostgresProcessStatus;
  try {
    after = await readProcessStatus(options, options.lifecycle.shutdownTimeoutMs);
  } catch {
    throw operationProblem(
      "private-postgres.lifecycle.stop_uncertain",
      "Private PostgreSQL stop is uncertain",
      "The private PostgreSQL process could not be proven stopped through the bounded maintenance path",
    );
  }
  if (after !== "STOPPED") {
    throw operationProblem(
      "private-postgres.lifecycle.stop_uncertain",
      "Private PostgreSQL stop is uncertain",
      "The private PostgreSQL process remained running after the bounded stop command",
    );
  }
  options.assertControlAuthority();
}

export async function startValidatedCluster(
  options: PrivatePostgresLifecycleOperationsOptions,
): Promise<void> {
  options.assertControlAuthority();
  await runChecked(
    options.toolchain.pgCtl,
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
  await waitForReadiness(options);
  await validateExistingCluster({
    toolchain: options.toolchain,
    placement: options.placement,
    expectedIdentity: options.expectedIdentity,
    timeoutMs: options.lifecycle.startupTimeoutMs,
  });
  options.assertControlAuthority();
}
