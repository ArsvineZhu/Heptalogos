import type { CanonicalJsonValue } from "./canonical-json.js";

export type RetryClass = "never" | "immediate" | "backoff" | "after-change" | "manual";

export interface FieldError {
  readonly field: string;
  readonly problemCode: string;
  readonly detail?: string;
}

export interface Problem {
  readonly schemaVersion: 1;
  readonly problemCode: string;
  readonly category: string;
  readonly retryClass: RetryClass;
  readonly title: string;
  readonly detail?: string;
  readonly activityId?: string;
  readonly resourceRef?: string;
  readonly fieldErrors?: readonly FieldError[];
  readonly causeProblemRefs?: readonly string[];
  readonly metadata?: Readonly<Record<string, CanonicalJsonValue>>;
}

export type ProblemInit = Omit<Problem, "schemaVersion">;

export function createProblem(init: ProblemInit): Problem {
  return { ...init, schemaVersion: 1 };
}

export function createProblemError(
  init: ProblemInit,
  options?: ErrorOptions,
): ProblemError {
  return new ProblemError(createProblem(init), options);
}

export class ProblemError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem, options?: ErrorOptions) {
    super(problem.detail ?? problem.title, options);
    this.name = "ProblemError";
    this.problem = problem;
  }
}
