/**
 * Defines the canonical Problem envelope and construction seam used to report
 * typed failures without leaking provider-specific exception shapes.
 * @module problem
 */

import type { CanonicalJsonValue } from "./canonical-json.js";

/** Classifies how a Problem may be retried after the reported failure. */
export type RetryClass = "never" | "immediate" | "backoff" | "after-change" | "manual";

/** Describes a validation failure attached to one named field. */
export interface FieldError {
  readonly field: string;
  readonly problemCode: string;
  readonly detail?: string;
}

/** Carries the canonical, serializable failure semantics across package seams. */
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

/** Input shape for creating a Problem; the schema version is fixed by its owner. */
export type ProblemInit = Omit<Problem, "schemaVersion">;

/** Creates a schema-versioned Problem envelope from caller-supplied semantics. */
export function createProblem(init: ProblemInit): Problem {
  return { ...init, schemaVersion: 1 };
}

/** Creates an Error carrying the same canonical Problem envelope. */
export function createProblemError(
  init: ProblemInit,
  options?: ErrorOptions,
): ProblemError {
  return new ProblemError(createProblem(init), options);
}

/** Raises a canonical Problem while preserving normal Error behavior. */
export class ProblemError extends Error {
  readonly problem: Problem;

  /** Creates an error whose message follows the Problem detail/title policy. */
  constructor(problem: Problem, options?: ErrorOptions) {
    super(problem.detail ?? problem.title, options);
    this.name = "ProblemError";
    this.problem = problem;
  }
}
