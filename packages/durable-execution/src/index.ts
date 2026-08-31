/**
 * Public durable-execution package contracts; DBOS SDK, process, and vendor
 * implementation details remain behind the adapter boundary.
 * @packageDocumentation
 */

export {
  DBOS_PACKAGE_NAME,
  DBOS_PACKAGE_VERSION,
  type DurableExecutionPackageResolution,
  type DurableExecutionLifecycleState,
  type DurableExecutionPoolOptions,
  type DurableExecutionQuiescenceCoordinator,
  type DurableExecutionQuiescenceLease,
  type DurableExecutionRuntime,
  type DurableExecutionRuntimeOptions,
  type DurableExecutionSchemaProvisioner,
  type DurableExecutionSchemaProvisionerOptions,
} from "./contracts.js";
export { resolveDbosPackage } from "./dbos-package.js";
export { createDurableExecutionSchemaProvisioner } from "./dbos-schema-provisioner.js";
export { createDurableExecutionRuntime } from "./dbos-runtime.js";
export {
  createDurableDispatchPort,
  type DurableDispatchPortOptions,
} from "./dbos-dispatch-port.js";
