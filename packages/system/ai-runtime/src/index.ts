/**
 * Public current AIRuntime contracts and the official OpenAI route.
 * @packageDocumentation
 */

export {
  aiRuntimeReadinessSchema,
  CURRENT_MODEL_CAPABILITIES,
  modelBindingSchema,
  modelBindingSetInputSchema,
  modelProfileSchema,
  modelProfileSetInputSchema,
  providerProfileSchema,
  providerProfileSetInputSchema,
  type AIRuntimeMessage,
  type AIRuntimeReadiness,
  type AIRuntimeService,
  type AIRuntimeServiceOptions,
  type GenerationResult,
  type InvocationBudget,
  type InvocationId,
  type InvocationSpec,
  type ModelBinding,
  type ModelBindingId,
  type ModelCapability,
  type ModelProfile,
  type ModelProfileId,
  type OpenAIProviderSettings,
  type ProviderProfile,
  type ProviderProfileId,
  type SetModelBindingInput,
  type SetModelProfileInput,
  type SetProviderProfileInput,
  type UsageMetadata,
} from "./contracts.js";
export { createAIRuntimeService } from "./service.js";
