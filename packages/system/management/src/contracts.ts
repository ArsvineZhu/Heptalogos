/**
 * Defines the P1 Management wire contracts, read models, and runtime
 * projection inputs. Transport adapters consume these schemas without owning
 * their semantics.
 * @module contracts
 */

import type {
  BootId,
  Branded,
  ContinuityEpochId,
  InstallationId,
  InstanceId,
  Instant,
  ProductGenerationId,
  UuidV7Id,
} from "@heptalogos/foundation-contracts";
import { Type } from "@heptalogos/schema-runtime/typebox";

/** Identifies the single current Administrator. */
export type AdministratorId = UuidV7Id<"AdministratorId">;
/** Identifies a first-administrator claim. */
export type FirstAdministratorClaimId = UuidV7Id<"FirstAdministratorClaimId">;
/** Identifies a server-side Management session. */
export type ServerSessionId = UuidV7Id<"ServerSessionId">;
/** Identifies an opaque SHA-256 digest stored by Management. */
export type ManagementDigest = Branded<string, "ManagementDigest">;

/** The version of the P1 Management wire contract. */
export const MANAGEMENT_CONTRACT_VERSION = "management.v1" as const;
/** The fixed API base path exposed by the P1 Host. */
export const MANAGEMENT_API_BASE_PATH = "/management/v1" as const;
/** The public well-known Management discovery path. */
export const MANAGEMENT_DISCOVERY_PATH = "/.well-known/heptalogos-management" as const;
/** The bounded first-claim lifetime in milliseconds. */
export const FIRST_CLAIM_LIFETIME_MS = 30 * 60 * 1_000;
/** The default server-side session lifetime in milliseconds. */
export const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;

/** Describes the exact client/server contract range accepted by Management. */
export interface ContractRange {
  readonly kind: "exact";
  readonly version: typeof MANAGEMENT_CONTRACT_VERSION;
}

/** Describes the current Management contract and installation generation. */
export interface CompatibilityDescriptor {
  readonly schemaVersion: 1;
  readonly instanceId: InstanceId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly productGeneration: ProductGenerationId;
  readonly coreContractVersion: typeof MANAGEMENT_CONTRACT_VERSION;
  readonly supportedClientContractRange: ContractRange;
  readonly problemSchemaVersion: 1;
}

/** Public discovery response for a live Management endpoint. */
export interface ManagementDiscovery {
  readonly schemaVersion: 1;
  readonly installationId: InstallationId;
  readonly compatibility: CompatibilityDescriptor;
  readonly apiBasePath: typeof MANAGEMENT_API_BASE_PATH;
}

/** Describes a public Management Problem response. */
export interface ManagementProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly problemCode: string;
  readonly schemaVersion: 1;
}

/** Request body for first-administrator claim consumption. */
export interface ClaimRequest {
  readonly claimId: string;
  readonly claimSecret: string;
  readonly password: string;
}

/** Successful first-administrator claim response. */
export interface ClaimResponse {
  readonly schemaVersion: 1;
  readonly administratorId: AdministratorId;
}

/** The short-lived plaintext claim material published only by the Host. */
export interface FirstClaimMaterial {
  readonly claimId: FirstAdministratorClaimId;
  readonly claimSecret: string;
  readonly expiresAt: Instant;
}

/** Request body for Administrator login. */
export interface LoginRequest {
  readonly password: string;
}

/** Successful login response; token plaintext is returned once to the client. */
export interface LoginResponse {
  readonly schemaVersion: 1;
  readonly sessionToken: string;
  readonly expiresAt: Instant;
}

/** Administrator bootstrap state projected by SystemStatus. */
export type AdministratorBootstrapState = "UNCLAIMED" | "CLAIM_READY" | "CLAIMED";

/** Current Host state accepted by P1 read models. */
export type ManagementHostState = "ACTIVE" | "FENCED" | "CLOSING" | "CLOSED";
/** Current Management HTTP lifecycle state. */
export type ManagementHttpState = "STARTING" | "LISTENING" | "CLOSING" | "CLOSED";

/** Read-only readiness projection for current P1 dependencies. */
export interface Readiness {
  readonly schemaVersion: 1;
  readonly hostActive: boolean;
  readonly persistenceUsable: boolean;
  readonly runtimeKernelActive: boolean;
  readonly managementServiceRunning: boolean;
  readonly httpListening: boolean;
  readonly endpointDescriptorCurrent: boolean;
  readonly administratorBootstrapCoherent: boolean;
  readonly state: "READY" | "NOT_READY";
  readonly observedAt: Instant;
}

/** Safe Host identity/state read model. */
export interface HostReadModel {
  readonly schemaVersion: 1;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly productGeneration: ProductGenerationId;
  readonly hostState: ManagementHostState;
  readonly managementHttpState: ManagementHttpState;
  readonly observedAt: Instant;
}

/** Minimal runtime introspection source supplied by Product Host. */
export interface RuntimeIntrospectionSnapshot {
  readonly operatingMode: string;
  readonly desiredRevision: number;
  readonly systems: readonly RuntimeSystemSnapshot[];
  readonly selectedServiceBindings: readonly RuntimeBindingSnapshot[];
  readonly selectedCapabilityBindings: readonly RuntimeBindingSnapshot[];
}

/** Safe read-only MicroSystem projection used by RuntimeGraph. */
export interface RuntimeSystemSnapshot {
  readonly microSystemId: string;
  readonly role: string;
  readonly actualState: string;
  readonly generation: {
    readonly productGenerationId: ProductGenerationId;
    readonly packageGenerationId?: string;
  };
  readonly serviceRequirements: readonly RuntimeRequirementSnapshot[];
  readonly serviceProvisions: readonly RuntimeProvisionSnapshot[];
  readonly capabilityRequirements: readonly RuntimeCapabilityRequirementSnapshot[];
  readonly capabilityProvisions: readonly RuntimeCapabilityProvisionSnapshot[];
}

/** Read-only Service/Capability binding projection. */
export interface RuntimeBindingSnapshot {
  readonly id: string;
  readonly providerId: string;
}

/** Read-only Service requirement projection. */
export interface RuntimeRequirementSnapshot {
  readonly serviceId: string;
  readonly contractVersion: string;
}

/** Read-only Service provision projection. */
export interface RuntimeProvisionSnapshot {
  readonly serviceId: string;
  readonly providerId: string;
  readonly contractVersion: string;
}

/** Read-only Capability requirement projection. */
export interface RuntimeCapabilityRequirementSnapshot {
  readonly capabilityId: string;
  readonly contractVersion: string;
  readonly required: boolean;
}

/** Read-only Capability provision projection. */
export interface RuntimeCapabilityProvisionSnapshot {
  readonly capabilityId: string;
  readonly providerId: string;
  readonly contractVersion: string;
  readonly priority: number;
}

/** Runtime graph read model derived from one RuntimeKernel snapshot. */
export interface RuntimeGraphReadModel {
  readonly schemaVersion: 1;
  readonly productGeneration: ProductGenerationId;
  readonly operatingMode: string;
  readonly desiredRevision: number;
  readonly systems: readonly RuntimeSystemSnapshot[];
  readonly edges: readonly RuntimeGraphEdge[];
  readonly observedAt: Instant;
}

/** One read-only hard Service edge in RuntimeGraph. */
export interface RuntimeGraphEdge {
  readonly providerMicroSystemId: string;
  readonly consumerMicroSystemId: string;
  readonly serviceId: string;
  readonly providerId: string;
  readonly contractVersion: string;
}

/** Capability graph read model derived from one RuntimeKernel snapshot. */
export interface CapabilityGraphReadModel {
  readonly schemaVersion: 1;
  readonly productGeneration: ProductGenerationId;
  readonly capabilities: readonly RuntimeCapabilityGraphEntry[];
  readonly selectedBindings: readonly RuntimeBindingSnapshot[];
  readonly observedAt: Instant;
}

/** One capability and its currently visible providers. */
export interface RuntimeCapabilityGraphEntry {
  readonly capabilityId: string;
  readonly providers: readonly RuntimeCapabilityProvisionSnapshot[];
}

/** Small aggregate system status read model. */
export interface SystemStatus {
  readonly schemaVersion: 1;
  readonly productGeneration: ProductGenerationId;
  readonly hostState: ManagementHostState;
  readonly managementState: ManagementHttpState;
  readonly administratorBootstrap: AdministratorBootstrapState;
  readonly readiness: Readiness;
  readonly observedAt: Instant;
}

/** Internal current Administrator verifier row. */
export interface AdministratorVerifier {
  readonly administratorId: AdministratorId;
  readonly authEpoch: number;
  readonly passwordAlgorithm: "argon2id";
  readonly passwordSalt: Uint8Array;
  readonly passwordNonce: Uint8Array;
  readonly passwordVerifier: Uint8Array;
  readonly passwordMemoryCost: number;
  readonly passwordTimeCost: number;
  readonly passwordParallelism: number;
  readonly passwordNormalizationId: "NFKC-v1";
}

/** Internal current claim row. */
export interface FirstAdministratorClaim {
  readonly claimId: FirstAdministratorClaimId;
  readonly secretDigest: ManagementDigest;
  readonly createdAt: Instant;
  readonly expiresAt: Instant;
  readonly consumedAt?: Instant;
}

/** Internal current session row. */
export interface ServerSession {
  readonly sessionId: ServerSessionId;
  readonly tokenDigest: ManagementDigest;
  readonly administratorId: AdministratorId;
  readonly authEpoch: number;
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
  readonly revokedAt?: Instant;
}

/** Canonical wire schema for a Problem Details response. */
export const managementProblemSchema = Type.Object({
  type: Type.String(),
  title: Type.String(),
  status: Type.Integer(),
  detail: Type.String(),
  instance: Type.Optional(Type.String()),
  problemCode: Type.String(),
  schemaVersion: Type.Literal(1),
});

/** Canonical wire schema for Management discovery. */
export const managementDiscoverySchema = Type.Object({
  schemaVersion: Type.Literal(1),
  installationId: Type.String(),
  compatibility: Type.Object({
    schemaVersion: Type.Literal(1),
    instanceId: Type.String(),
    continuityEpochId: Type.String(),
    productGeneration: Type.String(),
    coreContractVersion: Type.Literal(MANAGEMENT_CONTRACT_VERSION),
    supportedClientContractRange: Type.Object({
      kind: Type.Literal("exact"),
      version: Type.Literal(MANAGEMENT_CONTRACT_VERSION),
    }),
    problemSchemaVersion: Type.Literal(1),
  }),
  apiBasePath: Type.Literal(MANAGEMENT_API_BASE_PATH),
});

/** Canonical wire schema for the first-claim request. */
export const claimRequestSchema = Type.Object({
  claimId: Type.String({ minLength: 1 }),
  claimSecret: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
});

/** Canonical wire schema for the first-claim response. */
export const claimResponseSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  administratorId: Type.String(),
});

/** Canonical wire schema for login. */
export const loginRequestSchema = Type.Object({
  password: Type.String({ minLength: 1 }),
});

/** Canonical wire schema for a successful login. */
export const loginResponseSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  sessionToken: Type.String({ minLength: 1 }),
  expiresAt: Type.String(),
});

/** Canonical wire schema for Product Host readiness. */
export const readinessSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  hostActive: Type.Boolean(),
  persistenceUsable: Type.Boolean(),
  runtimeKernelActive: Type.Boolean(),
  managementServiceRunning: Type.Boolean(),
  httpListening: Type.Boolean(),
  endpointDescriptorCurrent: Type.Boolean(),
  administratorBootstrapCoherent: Type.Boolean(),
  state: Type.Union([Type.Literal("READY"), Type.Literal("NOT_READY")]),
  observedAt: Type.String(),
});

/** Canonical wire schema for SystemStatus. */
export const systemStatusSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  productGeneration: Type.String(),
  hostState: Type.String(),
  managementState: Type.String(),
  administratorBootstrap: Type.Union([
    Type.Literal("UNCLAIMED"),
    Type.Literal("CLAIM_READY"),
    Type.Literal("CLAIMED"),
  ]),
  readiness: readinessSchema,
  observedAt: Type.String(),
});

/** Canonical wire schema for the safe Host read model. */
export const hostReadModelSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  installationId: Type.String(),
  instanceId: Type.String(),
  bootId: Type.String(),
  continuityEpochId: Type.String(),
  productGeneration: Type.String(),
  hostState: Type.String(),
  managementHttpState: Type.String(),
  observedAt: Type.String(),
});

/** Canonical wire schema for RuntimeGraph. */
export const runtimeGraphSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  productGeneration: Type.String(),
  operatingMode: Type.String(),
  desiredRevision: Type.Integer(),
  systems: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  edges: Type.Array(Type.Record(Type.String(), Type.String())),
  observedAt: Type.String(),
});

/** Canonical wire schema for CapabilityGraph. */
export const capabilityGraphSchema = Type.Object({
  schemaVersion: Type.Literal(1),
  productGeneration: Type.String(),
  capabilities: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  selectedBindings: Type.Array(
    Type.Object({ id: Type.String(), providerId: Type.String() }),
  ),
  observedAt: Type.String(),
});
