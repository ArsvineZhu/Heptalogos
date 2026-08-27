import {
  asContentDigest,
  digestCanonicalJson,
  parseContentDigest,
  type WorkItemId,
} from "@heptalogos/foundation-contracts";
import type { DispatchAttemptId } from "./contracts.js";
import { workQueueProblem } from "./problems.js";

const ATTEMPT_DOMAIN = "heptalogos/work-dispatch-attempt/v1";

function assertDispatchRevision(dispatchRevision: number): void {
  if (
    !Number.isSafeInteger(dispatchRevision) ||
    dispatchRevision < 1 ||
    dispatchRevision > Number.MAX_SAFE_INTEGER
  ) {
    throw workQueueProblem(
      "work_queue.invalid_attempt_identity",
      "dispatchRevision must be a positive safe integer",
    );
  }
}

export function createDispatchAttemptId(
  workItemId: WorkItemId,
  dispatchRevision: number,
): DispatchAttemptId {
  assertDispatchRevision(dispatchRevision);
  return asContentDigest(
    "DispatchAttemptId",
    digestCanonicalJson(ATTEMPT_DOMAIN, {
      workItemId,
      dispatchRevision,
    }),
  );
}

export function parseDispatchAttemptId(value: unknown): DispatchAttemptId | undefined {
  return parseContentDigest("DispatchAttemptId", value);
}

export function dispatchAttemptIdToWorkflowId(
  dispatchAttemptId: DispatchAttemptId,
): string {
  return `heptalogos.work.${dispatchAttemptId}`;
}
