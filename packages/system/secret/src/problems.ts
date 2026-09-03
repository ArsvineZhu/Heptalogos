/**
 * Maps Secret owner failures into the shared Problem contract without exposing
 * backend details or material.
 * @module problems
 */

import {
  createProblemError,
  type Problem,
  type ProblemError,
} from "@heptalogos/foundation-contracts";

/** Creates one redacted Secret Problem. */
export function secretProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "validation",
  retryClass: Problem["retryClass"] = "manual",
): ProblemError {
  return createProblemError({ problemCode, title, detail, category, retryClass });
}
