import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

function persistenceProblem(
  problemCode: string,
  category: Problem["category"],
  retryClass: Problem["retryClass"],
  title: string,
  detail: string,
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

export function persistenceServiceFencedProblem(): ProblemError {
  return persistenceProblem(
    "persistence.service.fenced",
    "conflict",
    "after-change",
    "Persistence service is fenced",
    "The Host ownership authority is no longer active; new persistence admission is denied",
  );
}

export function persistenceServiceClosedProblem(): ProblemError {
  return persistenceProblem(
    "persistence.service.closed",
    "conflict",
    "manual",
    "Persistence service is closed",
    "The persistence service cannot admit work after closing or terminal shutdown",
  );
}

export function persistenceTransactionContextInvalidProblem(): ProblemError {
  return persistenceProblem(
    "persistence.transaction.context_invalid",
    "integrity",
    "manual",
    "Persistence transaction context is invalid",
    "The transaction context was not issued by the current persistence service",
  );
}

export function persistenceExecutionContextRequiredProblem(): ProblemError {
  return persistenceProblem(
    "persistence.execution_context.required",
    "conflict",
    "after-change",
    "Persistence mutation requires an execution context",
    "A canonical mutation must be admitted from a current Activity execution identity",
  );
}

export function persistenceExecutionContextStaleOriginProblem(): ProblemError {
  return persistenceProblem(
    "persistence.execution_context.stale_origin",
    "conflict",
    "after-change",
    "Persistence execution origin is stale",
    "The current execution origin does not match the active Host persistence authority",
  );
}

export function persistenceTransactionFailedProblem(): ProblemError {
  return persistenceProblem(
    "persistence.transaction.failed",
    "unavailable",
    "backoff",
    "Persistence transaction failed",
    "The persistence transaction did not complete successfully",
  );
}

export function persistenceTransactionCommitUncertainProblem(): ProblemError {
  return persistenceProblem(
    "persistence.transaction.commit_uncertain",
    "integrity",
    "manual",
    "Persistence transaction commit is uncertain",
    "The operation callback completed but transaction completion was not acknowledged; authoritative reconciliation is required",
  );
}

export function persistenceServiceCloseFailedProblem(): ProblemError {
  return persistenceProblem(
    "persistence.service.close_failed",
    "unavailable",
    "manual",
    "Persistence service close failed",
    "The persistence service could not prove that its database resources were closed",
  );
}
