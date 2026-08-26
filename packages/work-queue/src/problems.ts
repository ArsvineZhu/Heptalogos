import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

interface WorkQueueProblemSpec {
  readonly category: string;
  readonly retryClass: "never" | "immediate" | "backoff" | "after-change" | "manual";
  readonly title: string;
}

const problemSpecs: Readonly<Record<string, WorkQueueProblemSpec>> = {
  "work_queue.invalid_attempt_identity": {
    category: "validation",
    retryClass: "never",
    title: "WorkQueue dispatch-attempt identity is invalid",
  },
  "work_queue.invalid_options": {
    category: "validation",
    retryClass: "never",
    title: "WorkQueue runtime options are invalid",
  },
  "work_queue.invalid_transition": {
    category: "conflict",
    retryClass: "manual",
    title: "WorkItem state transition is invalid",
  },
};

function problemSpec(problemCode: string): WorkQueueProblemSpec {
  return (
    problemSpecs[problemCode] ?? {
      category: "validation",
      retryClass: "never",
      title: "WorkQueue request is invalid",
    }
  );
}

export function workQueueProblem(
  problemCode: string,
  detail: string,
  cause?: unknown,
): ProblemError {
  const spec = problemSpec(problemCode);
  const problem: Problem = {
    schemaVersion: 1,
    problemCode,
    category: spec.category,
    retryClass: spec.retryClass,
    title: spec.title,
    detail,
  };
  return new ProblemError(problem, cause === undefined ? undefined : { cause });
}
