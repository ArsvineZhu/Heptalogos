/**
 * Public Product Host composition and bounded startup helpers.
 * @packageDocumentation
 */

export {
  startProductHost,
  startProductHostFromArgv,
  type ProductHost,
  type ProductHostStartOptions,
} from "./host.js";
export { createManagementHttpApp, type ManagementHttpOptions } from "./http.js";
export {
  deriveProductGenerationDescriptor,
  deriveProductGenerationId,
  type ProductGenerationDescriptor,
} from "./generation.js";
export { parseProductHostInputs, type ProductHostInputs } from "./inputs.js";
