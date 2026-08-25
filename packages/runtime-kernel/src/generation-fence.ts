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

  beginRetirement(): void {
    if (this.currentState === "ACTIVE") this.currentState = "RETIRING";
  }

  retire(settleTimeoutMs: number): Promise<void> {
    if (this.currentState === "RETIRED") return Promise.resolve();
    if (this.retirementPromise !== undefined) return this.retirementPromise;
    if (!Number.isSafeInteger(settleTimeoutMs) || settleTimeoutMs < 0) {
      return Promise.reject(
        runtimeKernelProblem(
          "runtime.generation.invalid_settle_timeout",
          "Generation settleTimeoutMs must be a non-negative safe integer",
        ),
      );
    }
    this.beginRetirement();
    this.retirementPromise = new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const complete = () => {
        if (this.currentState !== "RETIRING" || this.inFlight !== 0) return;
        if (timer !== undefined) clearTimeout(timer);
        this.currentState = "RETIRED";
        this.resolveIdle = undefined;
        resolve();
      };
      this.resolveIdle = complete;
      if (this.inFlight === 0) {
        complete();
        return;
      }
      timer = setTimeout(() => {
        // A timeout only reports that retirement is not yet proven. The
        // in-flight drain watcher remains installed so a late settlement can
        // still transition the fence to RETIRED.
        reject(
          runtimeKernelProblem(
            "runtime.generation.settlement_timeout",
            `Generation did not settle within ${settleTimeoutMs}ms`,
          ),
        );
      }, settleTimeoutMs);
    });
    return this.retirementPromise;
  }
}

export function createGenerationFence(): GenerationFence {
  return new GenerationFence();
}
