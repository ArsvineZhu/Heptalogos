import type {
  ActivityRequest,
  ExecutionContext,
  ExecutionContextRuntime,
  RuntimeExecutionOrigin,
} from "./contracts.js";
import { bindRuntimeOriginInternal } from "./execution-context-runtime.js";

export interface RuntimeActivityRunner {
  current(): ExecutionContext | undefined;
  runActivity<T>(
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
}

export function bindRuntimeExecutionOrigin(
  runtime: ExecutionContextRuntime,
  origin: RuntimeExecutionOrigin,
): RuntimeActivityRunner {
  return bindRuntimeOriginInternal(runtime, origin);
}

export type { RuntimeExecutionOrigin } from "./contracts.js";
