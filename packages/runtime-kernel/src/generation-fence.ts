import { RuntimeKernelProblem } from "./problems.js";

export type GenerationFenceState = "ACTIVE" | "RETIRING" | "RETIRED";

function validateOperationId(operationId: string): void {
  if (
    operationId.length === 0 ||
    new TextEncoder().encode(operationId).byteLength > 256
  ) {
    throw new RuntimeKernelProblem(
      "runtime.generation.invalid_operation_id",
      "Generation-fenced operationId must be non-empty and at most 256 UTF-8 bytes",
    );
  }
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
      throw new RuntimeKernelProblem(
        "runtime.generation.retired",
        "Runtime generation no longer admits new invocations",
      );
    }
  }

  async invoke<TResult>(
    operationId: string,
    call: () => TResult | Promise<TResult>,
  ): Promise<TResult> {
    validateOperationId(operationId);
    this.assertActive();
    this.inFlight += 1;
    try {
      return await call();
    } finally {
      this.inFlight -= 1;
      if (this.inFlight === 0) this.resolveIdle?.();
    }
  }

  retire(settleTimeoutMs: number): Promise<void> {
    if (this.retirementPromise !== undefined) return this.retirementPromise;
    if (!Number.isSafeInteger(settleTimeoutMs) || settleTimeoutMs < 0) {
      return Promise.reject(
        new RuntimeKernelProblem(
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
                new RuntimeKernelProblem(
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
