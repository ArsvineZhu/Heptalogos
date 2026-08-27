import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

function lineageProblem(
  problemCode: string,
  title: string,
  detail: string,
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "never",
    title,
    detail,
  });
}

export function invalidContextRefProblem(detail: string): ProblemError {
  return lineageProblem(
    "lineage.context_ref.invalid",
    "Lineage context reference is invalid",
    detail,
  );
}

export function discontinuousContextRefProblem(): ProblemError {
  return lineageProblem(
    "lineage.context_ref.discontinuity",
    "Lineage context reference is discontinuous",
    "The source InstanceId or ContinuityEpochId does not match the current Host timeline",
  );
}

export function requiredContextRefProblem(): ProblemError {
  return lineageProblem(
    "lineage.context_ref.required",
    "Lineage context requires an active Activity",
    "A durable causal reference can only be created inside an active Activity",
  );
}

export function invalidActivityProblem(detail: string): ProblemError {
  return lineageProblem(
    "lineage.activity.invalid",
    "Activity request is invalid",
    detail,
  );
}

export function invalidOriginProblem(): ProblemError {
  return lineageProblem(
    "lineage.origin.invalid",
    "Host execution origin is invalid",
    "ExecutionContextRuntime requires valid typed Host origin identities",
  );
}

export function currentActivityMismatchProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.current_activity_mismatch",
    "Current Activity does not match the mutation transaction",
    "Retained Activity identity must be the Activity admitted by the current mutation transaction",
  );
}

export function originMismatchProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.origin_mismatch",
    "Activity origin does not match the mutation transaction",
    "Retained Activity Host origin must match the current persistence authority snapshot",
  );
}

export function retentionNotDurableProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.retention_not_durable",
    "Activity retention is not durable",
    "Ephemeral Activities cannot be retained in canonical PostgreSQL",
  );
}

export function activityAlreadyRetainedProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.activity_already_retained",
    "Activity is already retained",
    "retainCurrent is not an Activity upsert or completion mutation",
  );
}

export function activityNotRetainedProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.activity_not_retained",
    "Activity is not retained",
    "Only a currently retained Activity can be completed",
  );
}

export function completionConflictProblem(): ProblemError {
  return lineageProblem(
    "lineage.persistence.completion_conflict",
    "Activity completion conflicts with retained history",
    "A retained Activity already has a different completion",
  );
}

export function invalidCompletionProblem(detail: string): ProblemError {
  return lineageProblem(
    "lineage.persistence.completion_invalid",
    "Activity completion is invalid",
    detail,
  );
}

export function bootstrapReferenceDiscontinuityProblem(): ProblemError {
  return lineageProblem(
    "lineage.bootstrap_reference.discontinuity",
    "Bootstrap Activity reference is discontinuous",
    "Bootstrap InstanceId and ContinuityEpochId must match the current mutation timeline",
  );
}

export function bootstrapReferenceConflictProblem(): ProblemError {
  return lineageProblem(
    "lineage.bootstrap_reference.conflict",
    "Bootstrap Activity reference conflicts with retained history",
    "The same Bootstrap ActivityId was previously retained with different summary fields",
  );
}

export function invalidBootstrapHandoffProblem(detail: string): ProblemError {
  return lineageProblem(
    "lineage.bootstrap_handoff.invalid",
    "Bootstrap handoff journal cannot be projected",
    detail,
  );
}
