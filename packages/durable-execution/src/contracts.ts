/**
 * Defines the normalized durable-execution adapter contracts without exposing
 * DBOS SDK, Execa, or PostgreSQL implementation objects.
 * @module contracts
 */

/** Exact DBOS package identity adopted by the durable-execution boundary. */
export const DBOS_PACKAGE_NAME = "@dbos-inc/dbos-sdk" as const;
/** Exact DBOS package version approved by the current implementation plan. */
export const DBOS_PACKAGE_VERSION = "4.27.6" as const;

/** Identifies the installed DBOS package and its package-contained CLI. */
export interface DurableExecutionPackageResolution {
  readonly packageName: typeof DBOS_PACKAGE_NAME;
  readonly packageVersion: typeof DBOS_PACKAGE_VERSION;
  readonly packageRoot: string;
  readonly cliPath: string;
}

/** Bounds one shell-free invocation of the installed DBOS CLI. */
export interface DurableExecutionProcessOptions {
  readonly cliPath: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly cwd?: string;
  /** Explicit child-environment values; inherited PostgreSQL keys are removed first. */
  readonly env?: Readonly<Record<string, string>>;
}

/** Normalized bounded output from one DBOS CLI invocation. */
export interface DurableExecutionProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}
