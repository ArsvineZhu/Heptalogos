/**
 * Public current NetworkAccess profile and controlled provider transport.
 * @packageDocumentation
 */

export {
  networkAccessDiagnosticsSchema,
  networkAccessProfileSchema,
  OPENAI_NETWORK_ACCESS_PROFILE_ID,
  type NetworkAccessDiagnostics,
  type NetworkAccessProfile,
  type NetworkAccessProfileId,
  type NetworkAccessService,
  type NetworkAccessServiceOptions,
  type NetworkResponseKnowledge,
} from "./contracts.js";
export { createNetworkAccessService } from "./service.js";
