/**
 * Maps NetworkAccess admission and transport failures into redacted Problems.
 * @module problems
 */

import {
  createProblemError,
  type Problem,
  type ProblemError,
} from "@heptalogos/foundation-contracts";

/** Creates one NetworkAccess Problem without provider or credential details. */
export function networkProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "unavailable",
  retryClass: Problem["retryClass"] = "manual",
): ProblemError {
  return createProblemError({ problemCode, title, detail, category, retryClass });
}
