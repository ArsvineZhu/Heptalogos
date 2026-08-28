/**
 * Public durable-execution package contracts; DBOS SDK, process, and vendor
 * implementation details remain behind the adapter boundary.
 * @packageDocumentation
 */

export {
  DBOS_PACKAGE_NAME,
  DBOS_PACKAGE_VERSION,
  type DurableExecutionPackageResolution,
} from "./contracts.js";
export { resolveDbosPackage } from "./dbos-package.js";
