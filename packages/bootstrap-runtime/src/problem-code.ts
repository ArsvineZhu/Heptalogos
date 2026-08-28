/**
 * Provides Bootstrap-specific Problem-code classification while retaining the
 * shared Foundation Problem envelope as the error Authority.
 * @module problem-code
 */

/** Extracts a Foundation Problem code from an unknown caught value. */
export function problemCodeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("problem" in error)) {
    return undefined;
  }
  const problem = error.problem;
  if (typeof problem !== "object" || problem === null || !("problemCode" in problem)) {
    return undefined;
  }
  return typeof problem.problemCode === "string" ? problem.problemCode : undefined;
}
