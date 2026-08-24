import type {
  PersistenceExecutionContextProvider,
  PersistenceExecutionMetadata,
} from "@heptalogos/persistence";
import type { ExecutionContextRuntime } from "./contracts.js";

export function createPersistenceExecutionContextProvider(
  runtime: ExecutionContextRuntime,
): PersistenceExecutionContextProvider {
  return {
    current(): PersistenceExecutionMetadata | undefined {
      const context = runtime.current();
      if (context === undefined) return undefined;
      return Object.freeze({
        activityId: context.activityId,
        installationId: context.origin.installationId,
        instanceId: context.origin.instanceId,
        bootId: context.origin.bootId,
        continuityEpochId: context.origin.continuityEpochId,
        hostOwnershipToken: context.origin.hostOwnershipToken,
      });
    },
  };
}
