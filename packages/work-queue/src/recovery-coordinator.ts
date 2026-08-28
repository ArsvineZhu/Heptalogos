/**
 * Reconciles canonical RUNNING WorkItems with an engine-private projection.
 * The coordinator reports contradictions and never derives product outcomes
 * from DBOS status.
 * @module recovery-coordinator
 */

import { createDispatchAttemptId } from "./attempt-identity.js";
import type {
  DurableAttemptInspectionPort,
  DurableAttemptProjection,
} from "./contracts.js";
import type { WorkQueueRepository } from "./repository.js";
import { workQueueProblem } from "./problems.js";

/** Counts one bounded diagnostic scan of canonical RUNNING work. */
export interface WorkQueueRecoveryScanResult {
  readonly scanned: number;
  readonly healthy: number;
  readonly reported: number;
}

/** Owns bounded RUNNING-versus-engine projection diagnostics. */
export interface WorkQueueRecoveryCoordinator {
  /** Inspect one bounded page without mutating canonical WorkItem state. */
  scan(): Promise<WorkQueueRecoveryScanResult>;
}

function report(
  sink: (error: unknown) => void,
  problemCode: string,
  detail: string,
): void {
  try {
    sink(workQueueProblem(problemCode, detail));
  } catch {
    // Diagnostics must not turn anti-entropy into an unbounded failure path.
  }
}

function projectionProblem(projection: DurableAttemptProjection): {
  readonly problemCode: string;
  readonly detail: string;
} | undefined {
  switch (projection.kind) {
    case "ACTIVE":
      return undefined;
    case "VERSION_MISMATCH":
      return {
        problemCode: "work.recovery.engine_version_mismatch",
        detail: "Engine projection uses a different durable-code application version",
      };
    case "ABSENT":
      return {
        problemCode: "work.recovery.engine_projection_absent",
        detail: "Canonical RUNNING WorkItem has no engine projection",
      };
    case "ENGINE_SUCCESS":
      return {
        problemCode: "work.recovery.engine_success_conflict",
        detail: "Engine success cannot terminalize a canonical RUNNING WorkItem",
      };
    case "ENGINE_ERROR":
      return {
        problemCode: "work.recovery.engine_error",
        detail: "Engine reported an error while canonical work remains RUNNING",
      };
    case "ENGINE_CANCELLED":
      return {
        problemCode: "work.recovery.engine_cancelled",
        detail: "Engine cancellation cannot determine canonical WorkItem state",
      };
    case "RECOVERY_EXHAUSTED":
      return {
        problemCode: "work.recovery.recovery_exhausted",
        detail: "Engine recovery budget was exhausted while canonical work remains RUNNING",
      };
  }
}

/** Creates a bounded coordinator for canonical RUNNING recovery diagnostics. */
export function createWorkQueueRecoveryCoordinator(options: {
  readonly repository: WorkQueueRepository;
  readonly durableInspection: DurableAttemptInspectionPort;
  readonly onBackgroundError: (error: unknown) => void;
  readonly batchSize: number;
}): WorkQueueRecoveryCoordinator {
  if (!Number.isSafeInteger(options.batchSize) || options.batchSize <= 0) {
    throw workQueueProblem(
      "work_queue.invalid_options",
      "Recovery coordinator batchSize must be a positive safe integer",
    );
  }
  if (typeof options.onBackgroundError !== "function") {
    throw workQueueProblem(
      "work.request.invalid",
      "Recovery coordinator requires a background error sink",
    );
  }

  return {
    async scan() {
      const through = await options.repository.snapshotRunningCeiling();
      if (through === undefined) return { scanned: 0, healthy: 0, reported: 0 };
      const items = await options.repository.listRunning({
        through,
        limit: options.batchSize,
      });
      let healthy = 0;
      let reported = 0;
      for (const item of items) {
        const expectedAttemptId = createDispatchAttemptId(
          item.workItemId,
          item.dispatchRevision,
        );
        if (item.activeAttemptId !== expectedAttemptId) {
          report(
            options.onBackgroundError,
            "work.recovery.active_attempt_mismatch",
            "Canonical RUNNING WorkItem active attempt does not match its deterministic revision identity",
          );
          reported += 1;
          continue;
        }
        let projection: DurableAttemptProjection;
        try {
          projection = await options.durableInspection.inspect({
            workItemId: item.workItemId,
            dispatchRevision: item.dispatchRevision,
            dispatchAttemptId: expectedAttemptId,
            queueProfileId: item.queueProfileId,
          });
        } catch {
          report(
            options.onBackgroundError,
            "work.recovery.inspection_failed",
            "Durable engine projection inspection failed; canonical RUNNING state remains authoritative",
          );
          reported += 1;
          continue;
        }
        const issue = projectionProblem(projection);
        if (issue === undefined) {
          healthy += 1;
        } else {
          report(options.onBackgroundError, issue.problemCode, issue.detail);
          reported += 1;
        }
      }
      return { scanned: items.length, healthy, reported };
    },
  };
}
