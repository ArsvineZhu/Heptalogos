import {
  createProblemError,
  type Problem,
  type ProblemError,
} from "@heptalogos/foundation-contracts";

function evidenceProblem(
  problemCode: string,
  category: Problem["category"],
  title: string,
  detail: string,
): ProblemError {
  return createProblemError({
    problemCode,
    category,
    retryClass: "never",
    title,
    detail,
  });
}

export function invalidEvidenceKindProblem(): ProblemError {
  return evidenceProblem(
    "evidence.invalid_kind",
    "integrity",
    "Evidence kind is invalid",
    "Evidence kind must be non-empty and at most 128 UTF-8 bytes",
  );
}

export function invalidEvidenceContractVersionProblem(): ProblemError {
  return evidenceProblem(
    "evidence.invalid_contract_version",
    "integrity",
    "Evidence contract version is invalid",
    "Evidence contract version must be non-empty and at most 128 UTF-8 bytes",
  );
}

export function invalidEvidenceReferenceProblem(): ProblemError {
  return evidenceProblem(
    "evidence.invalid_reference",
    "integrity",
    "Evidence reference is invalid",
    "Evidence references must be non-empty and at most 1024 UTF-8 bytes when present",
  );
}

export function evidenceRetentionNotDurableProblem(): ProblemError {
  return evidenceProblem(
    "evidence.retention_not_durable",
    "integrity",
    "Required Evidence retention is not durable",
    "Required Evidence cannot use ephemeral retention",
  );
}

export function evidenceActivityRequiredProblem(): ProblemError {
  return evidenceProblem(
    "evidence.persistence.activity_required",
    "integrity",
    "Required Evidence has no retained causal Activity",
    "The canonical Evidence foreign key requires the transaction Activity to be retained first",
  );
}

export function invalidEvidenceSensitivityProblem(): ProblemError {
  return evidenceProblem(
    "evidence.invalid_sensitivity",
    "integrity",
    "Evidence sensitivity is invalid",
    "Evidence sensitivity is not a supported Foundation sensitivity value",
  );
}
