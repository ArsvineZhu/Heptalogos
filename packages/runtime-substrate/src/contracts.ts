export type RuntimeDisposer = () => void | Promise<void>;

export interface ActivationResourceScope {
  readonly signal: AbortSignal;
  defer(label: string, disposer: RuntimeDisposer): void;
  track(label: string, task: Promise<unknown>): void;
}

export interface RuntimeSubstrateFailure {
  readonly phase: "BACKGROUND" | "DISPOSAL" | "SETTLEMENT_TIMEOUT";
  readonly label: string;
  readonly cause: unknown;
}

export interface SubstrateActivationRequest {
  readonly label: string;
  activate(scope: ActivationResourceScope): Promise<void>;
  onFailure(failure: RuntimeSubstrateFailure): void;
}

export interface SubstrateActivationHandle {
  readonly state: "ACTIVE" | "FAILED" | "DISPOSING" | "DISPOSED";
  dispose(): Promise<void>;
}

export interface RuntimeSubstrate {
  activate(request: SubstrateActivationRequest): Promise<SubstrateActivationHandle>;
  close(): Promise<void>;
}

export interface RuntimeSubstrateOptions {
  readonly settleTimeoutMs: number;
}
