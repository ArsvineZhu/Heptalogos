export class RuntimeKernelProblem extends Error {
  readonly problemCode: string;
  readonly cause: unknown;

  constructor(problemCode: string, message: string, cause?: unknown) {
    super(message);
    this.name = "RuntimeKernelProblem";
    this.problemCode = problemCode;
    this.cause = cause;
  }
}
