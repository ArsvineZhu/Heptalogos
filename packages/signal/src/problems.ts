import {
  ProblemError,
  type Problem,
  type RetryClass,
} from "@heptalogos/foundation-contracts";

const specs: Readonly<
  Record<string, { category: string; retryClass: RetryClass; title: string }>
> = {
  "signal.hint.invalid": {
    category: "validation",
    retryClass: "never",
    title: "Signal hint is invalid",
  },
  "signal.hint.too_large": {
    category: "validation",
    retryClass: "never",
    title: "Signal hint is too large",
  },
  "signal.listener.connection_failed": {
    category: "unavailable",
    retryClass: "after-change",
    title: "Signal listener connection failed",
  },
  "signal.listener.closed": {
    category: "conflict",
    retryClass: "after-change",
    title: "Signal listener is closed",
  },
  "signal.listener.invalid_notification": {
    category: "validation",
    retryClass: "never",
    title: "Signal notification is invalid",
  },
  "signal.listener.invalid_options": {
    category: "validation",
    retryClass: "never",
    title: "Signal listener options are invalid",
  },
  "signal.publish.failed": {
    category: "unavailable",
    retryClass: "after-change",
    title: "Signal publication failed",
  },
  "signal.topic.invalid": {
    category: "validation",
    retryClass: "never",
    title: "Signal topic is invalid",
  },
};

export function signalProblem(
  problemCode: string,
  detail: string,
  cause?: unknown,
): ProblemError {
  const spec = specs[problemCode] ?? {
    category: "unavailable",
    retryClass: "after-change" as const,
    title: "Signal operation failed",
  };
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
