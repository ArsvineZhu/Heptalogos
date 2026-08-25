import type {
  ActivityCompletion,
  ActivityRequest,
  ExecutionContext,
  ExecutionContextRuntime,
  ExecutionLineageService,
} from "@heptalogos/execution-lineage";
import {
  bindRuntimeExecutionOrigin,
  type RuntimeActivityRunner,
  type RuntimeExecutionOrigin,
} from "@heptalogos/execution-lineage/runtime-kernel";
import type { PersistenceService } from "@heptalogos/persistence";
import type { TimeService } from "@heptalogos/time-service";

export interface RuntimeLifecycleLineageOptions {
  readonly execution: ExecutionContextRuntime;
  readonly persistence: PersistenceService;
  readonly lineage: ExecutionLineageService;
  readonly time: TimeService;
}

export interface RuntimeLifecycleLineage {
  runner(origin: RuntimeExecutionOrigin): RuntimeActivityRunner;
  runRetained<T>(
    origin: RuntimeExecutionOrigin,
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
}

function completion(
  time: TimeService,
  outcome: ActivityCompletion["outcome"],
): ActivityCompletion {
  return { endedAt: time.now(), outcome };
}

export function createRuntimeLifecycleLineage(
  options: RuntimeLifecycleLineageOptions,
): RuntimeLifecycleLineage {
  const retain = async (context: ExecutionContext): Promise<void> => {
    await options.persistence.mutate((transaction) =>
      options.lineage.retainCurrent(transaction, context),
    );
  };

  const complete = async (
    context: ExecutionContext,
    outcome: ActivityCompletion["outcome"],
  ): Promise<void> => {
    await options.persistence.mutate((transaction) =>
      options.lineage.completeCurrent(
        transaction,
        context,
        completion(options.time, outcome),
      ),
    );
  };

  return {
    runner(origin) {
      return bindRuntimeExecutionOrigin(options.execution, origin);
    },

    async runRetained<T>(
      origin: RuntimeExecutionOrigin,
      request: ActivityRequest,
      operation: (context: ExecutionContext) => Promise<T>,
    ): Promise<T> {
      const runner = bindRuntimeExecutionOrigin(options.execution, origin);
      return runner.runActivity(request, async (context) => {
        await retain(context);
        let result: T;
        try {
          result = await operation(context);
        } catch (error) {
          try {
            await complete(context, "FAILED");
          } catch (completionError) {
            throw new AggregateError(
              [error, completionError],
              "Lifecycle operation and failure completion both failed",
            );
          }
          throw error;
        }

        await complete(context, "SUCCEEDED");
        return result;
      });
    },
  };
}
