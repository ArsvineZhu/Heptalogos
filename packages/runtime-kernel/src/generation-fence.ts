import { runtimeKernelProblem } from "./problems.js";

export type GenerationFenceState = "ACTIVE" | "RETIRING" | "RETIRED";

function validateOperationId(operationId: string): void {
  if (
    operationId.length === 0 ||
    new TextEncoder().encode(operationId).byteLength > 256
  ) {
    throw runtimeKernelProblem(
      "runtime.generation.invalid_operation_id",
      "Generation-fenced operationId must be non-empty and at most 256 UTF-8 bytes",
    );
  }
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export class GenerationFence {
  private currentState: GenerationFenceState = "ACTIVE";
  private inFlight = 0;
  private resolveIdle: (() => void) | undefined;
  private retirementPromise: Promise<void> | undefined;

  get state(): GenerationFenceState {
    return this.currentState;
  }

  get activeInvocationCount(): number {
    return this.inFlight;
  }

  assertActive(): void {
    if (this.currentState !== "ACTIVE") {
      throw runtimeKernelProblem(
        "runtime.generation.retired",
        "Runtime generation no longer admits new invocations",
      );
    }
  }

  invoke<TResult>(
    operationId: string,
    call: () => TResult | Promise<TResult>,
  ): TResult | Promise<TResult> {
    validateOperationId(operationId);
    this.assertActive();
    this.inFlight += 1;
    let result: TResult | Promise<TResult>;
    try {
      result = call();
    } catch (error) {
      this.finishInvocation();
      throw error;
    }
    if (isPromiseLike(result)) {
      return Promise.resolve(result).then(
        (value) => {
          this.finishInvocation();
          return value;
        },
        (error) => {
          this.finishInvocation();
          throw error;
        },
      );
    }
    this.finishInvocation();
    return result;
  }

  private finishInvocation(): void {
    this.inFlight -= 1;
    if (this.inFlight === 0) this.resolveIdle?.();
  }

  retire(settleTimeoutMs: number): Promise<void> {
    if (this.retirementPromise !== undefined) return this.retirementPromise;
    if (!Number.isSafeInteger(settleTimeoutMs) || settleTimeoutMs < 0) {
      return Promise.reject(
        runtimeKernelProblem(
          "runtime.generation.invalid_settle_timeout",
          "Generation settleTimeoutMs must be a non-negative safe integer",
        ),
      );
    }
    this.currentState = "RETIRING";
    this.retirementPromise = (async () => {
      try {
        if (this.inFlight > 0) {
          await new Promise<void>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            this.resolveIdle = () => {
              if (timer !== undefined) clearTimeout(timer);
              resolve();
            };
            timer = setTimeout(() => {
              reject(
                runtimeKernelProblem(
                  "runtime.generation.settlement_timeout",
                  `Generation did not settle within ${settleTimeoutMs}ms`,
                ),
              );
            }, settleTimeoutMs);
            void Promise.resolve().then(() => {
              if (this.inFlight === 0) {
                clearTimeout(timer);
                resolve();
              }
            });
          });
        }
      } finally {
        this.currentState = "RETIRED";
        this.resolveIdle = undefined;
      }
    })();
    return this.retirementPromise;
  }
}

export function createGenerationFence(): GenerationFence {
  return new GenerationFence();
}
