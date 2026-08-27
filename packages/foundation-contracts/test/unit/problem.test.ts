import { describe, expect, it } from "vitest";
import { createProblem, createProblemError, ProblemError } from "../../src/problem.js";

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

  it("constructs the canonical envelope without mutating caller input", () => {
    const init = {
      problemCode: "foundation.example",
      category: "validation",
      retryClass: "never",
      title: "Example problem",
      detail: "detail",
    } as const;

    expect(createProblem(init)).toEqual({ schemaVersion: 1, ...init });
    expect(createProblemError(init)).toBeInstanceOf(ProblemError);
    expect(init).toEqual({
      problemCode: "foundation.example",
      category: "validation",
      retryClass: "never",
      title: "Example problem",
      detail: "detail",
    });
  });
});
