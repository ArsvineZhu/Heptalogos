import { describe, expect, it } from "vitest";
import { ProblemError } from "./problem.js";

describe("ProblemError", () => {
  it("preserves stable machine fields independently from Error.message", () => {
    const problem = {
      schemaVersion: 1,
      problemCode: "bootstrap.state.invalid",
      category: "integrity",
      retryClass: "manual",
      title: "Bootstrap state is invalid",
    } as const;

    const error = new ProblemError(problem);
    expect(error.problem).toEqual(problem);
    expect(error.name).toBe("ProblemError");
  });
});
