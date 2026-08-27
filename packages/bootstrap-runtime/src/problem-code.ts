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
