/**
 * Maps package-resolution and DBOS-process failures to Foundation Problems so
 * provider-specific exceptions never cross the durable-execution boundary.
 * @module problems
 */

import {
  createProblemError,
  type Problem,
  type ProblemError,
  type RetryClass,
} from "@heptalogos/foundation-contracts";

const specs: Readonly<
  Record<
    string,
    {
      readonly category: string;
      readonly retryClass: RetryClass;
      readonly title: string;
    }
  >
> = {
  "durable.execution.package.not_installed": {
    category: "unavailable",
    retryClass: "after-change",
    title: "DBOS package is not installed",
  },
  "durable.execution.package.invalid_metadata": {
    category: "integrity",
    retryClass: "manual",
    title: "DBOS package metadata is invalid",
  },
  "durable.execution.package.invalid_version": {
    category: "validation",
    retryClass: "manual",
    title: "DBOS package version is not qualified",
  },
  "durable.execution.package.invalid_cli": {
    category: "integrity",
    retryClass: "manual",
    title: "DBOS CLI entry is invalid",
  },
  "durable.execution.process.invalid_options": {
    category: "validation",
    retryClass: "never",
    title: "DBOS process options are invalid",
  },
  "durable.execution.process.invalid_executable": {
    category: "validation",
    retryClass: "manual",
    title: "DBOS CLI entry path is invalid",
  },
  "durable.execution.process.timed_out": {
    category: "unavailable",
    retryClass: "backoff",
    title: "DBOS CLI invocation timed out",
  },
  "durable.execution.process.output_limit": {
    category: "integrity",
    retryClass: "manual",
    title: "DBOS CLI output exceeded its bound",
  },
  "durable.execution.process.launch_failed": {
    category: "unavailable",
    retryClass: "backoff",
    title: "DBOS CLI could not be launched",
  },
};

/** Creates a stable durable-execution Problem with an optional operational cause. */
export function durableExecutionProblem(
  problemCode: string,
  detail: string,
  cause?: unknown,
): ProblemError {
  const spec = specs[problemCode] ?? {
    category: "unavailable",
    retryClass: "after-change" as const,
    title: "Durable-execution operation failed",
  };
  const problem: Problem = {
    schemaVersion: 1,
    problemCode,
    category: spec.category,
    retryClass: spec.retryClass,
    title: spec.title,
    detail,
  };
  return createProblemError(problem, cause === undefined ? undefined : { cause });
}
