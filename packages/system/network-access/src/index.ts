/**
 * Public current NetworkAccess policy and controlled gateway transport.
 * @packageDocumentation
 */

export {
  networkAccessDiagnosticsSchema,
  networkAccessPolicySchema,
  type GatewayNetworkProtocol,
  type GatewayNetworkTarget,
  type NetworkAccessDiagnostics,
  type NetworkAccessPolicy,
  type NetworkAccessService,
  type NetworkAccessServiceOptions,
  type NetworkResponseKnowledge,
} from "./contracts.js";
export { createNetworkAccessService } from "./service.js";
