/**
 * Public P1 Management contracts and semantic service; HTTP, OpenAPI, client,
 * and CLI projections remain outside this package.
 * @packageDocumentation
 */

export {
  FIRST_CLAIM_LIFETIME_MS,
  MANAGEMENT_API_BASE_PATH,
  MANAGEMENT_CONTRACT_VERSION,
  MANAGEMENT_DISCOVERY_PATH,
  SESSION_LIFETIME_MS,
  claimRequestSchema,
  claimResponseSchema,
  capabilityGraphSchema,
  hostReadModelSchema,
  loginRequestSchema,
  loginResponseSchema,
  managementDiscoverySchema,
  managementProblemSchema,
  readinessSchema,
  runtimeGraphSchema,
  systemStatusSchema,
} from "./contracts.js";
export type {
  AdministratorBootstrapState,
  AdministratorId,
  AdministratorVerifier,
  CapabilityGraphReadModel,
  ClaimRequest,
  ClaimResponse,
  CompatibilityDescriptor,
  ContractRange,
  FirstAdministratorClaim,
  FirstAdministratorClaimId,
  FirstClaimMaterial,
  HostReadModel,
  LoginRequest,
  LoginResponse,
  ManagementDiscovery,
  ManagementHttpState,
  ManagementHostState,
  ManagementProblemDetails,
  Readiness,
  RuntimeBindingSnapshot,
  RuntimeCapabilityGraphEntry,
  RuntimeCapabilityProvisionSnapshot,
  RuntimeCapabilityRequirementSnapshot,
  RuntimeGraphEdge,
  RuntimeGraphReadModel,
  RuntimeIntrospectionSnapshot,
  RuntimeProvisionSnapshot,
  RuntimeRequirementSnapshot,
  RuntimeSystemSnapshot,
  ServerSession,
  ServerSessionId,
  SystemStatus,
} from "./contracts.js";
export { createManagementService } from "./service.js";
export type {
  ManagementProjectionSource,
  ManagementService,
  ManagementServiceOptions,
} from "./service.js";
export { createManagementRepository, type ManagementRepository } from "./repository.js";
export {
  managementHttpStatus,
  managementProblem,
  toManagementProblemDetails,
  contractUnsupportedProblem,
  invalidInputProblem,
} from "./problems.js";
export {
  ARGON2_PARAMETERS,
  PASSWORD_NORMALIZATION_ID,
  digestManagementSecret,
  hashAdministratorPassword,
  normalizeAdministratorPassword,
  randomBase64Url,
  verifyAdministratorPassword,
} from "./password.js";
