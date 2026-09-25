/**
 * Public current NetworkAccess policy and controlled gateway transport.
 * @packageDocumentation
 */

export {
  GATEWAY_TRANSPORT_DEFINITION_ID,
  gatewayTransportConfigSchema,
  gatewayTransportConfigurationDefinition,
  networkAccessDiagnosticsSchema,
  networkAccessPolicySchema,
  type GatewayTransportConfigV1,
  type GatewayNetworkProtocol,
  type GatewayNetworkTarget,
  type NetworkAccessDiagnostics,
  type NetworkAccessPolicy,
  type NetworkAccessService,
  type NetworkAccessServiceOptions,
  type NetworkResponseKnowledge,
} from "./contracts.js";
export { createNetworkAccessService } from "./service.js";
