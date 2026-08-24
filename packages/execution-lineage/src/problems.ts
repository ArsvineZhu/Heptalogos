import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

export function lineageProblem(
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
