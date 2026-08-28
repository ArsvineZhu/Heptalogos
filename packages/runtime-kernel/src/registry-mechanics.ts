/**
 * Exposes package-private registry and generation primitives to the supervisor
 * without widening those mechanics into the Runtime Kernel public contract.
 * @module registry-mechanics
 */

export { ContractCompatibilityRegistry } from "./contract-compatibility.js";
export { GenerationFence } from "./generation-fence.js";
export { createFencedProxy } from "./fenced-proxy.js";
export { validateSupportedContractShape } from "./contract-shape.js";
export { runtimeKernelProblem } from "./problems.js";
