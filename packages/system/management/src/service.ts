/**
 * Implements the Management semantic service over canonical persistence
 * and injected Host/Runtime read projections. HTTP and CLI remain projections.
 * @module service
 */

import {
  createUuidV7Id,
  formatInstant,
  parseUuidV7Id,
  type BootId,
  type ContinuityEpochId,
  type InstallationId,
  type InstanceId,
  type ProductGenerationId,
  type Instant,
} from "@heptalogos/foundation-contracts";
import type { PersistenceService } from "@heptalogos/persistence";
import type { TimeService } from "@heptalogos/time-service";
import {
  FIRST_CLAIM_LIFETIME_MS,
  MANAGEMENT_API_BASE_PATH,
  MANAGEMENT_CONTRACT_VERSION,
  type AdministratorBootstrapState,
  type CapabilityGraphReadModel,
  type CapabilityGraphReadModelData,
  type CompatibilityDescriptor,
  type ContractRange,
  type FirstClaimMaterial,
  type FirstAdministratorClaimId,
  type HostReadModel,
  type ManagementDiscovery,
  type ManagementHttpState,
  type ManagementHostState,
  type Readiness,
  type ReadinessData,
  type ReadModelEnvelope,
  type RuntimeGraphEdge,
  type RuntimeGraphReadModel,
  type RuntimeIntrospectionSnapshot,
  type ServerSession,
  type SystemStatus,
  type ClaimResponse,
  type LoginResponse,
} from "./contracts.js";
import { createManagementRepository, type ManagementRepository } from "./repository.js";
import {
  digestManagementSecret,
  hashAdministratorPassword,
  normalizeAdministratorPassword,
  PASSWORD_NORMALIZATION_ID,
  randomBase64Url,
  verifyAdministratorPassword,
  ARGON2_PARAMETERS,
} from "./password.js";
import { managementProblem } from "./problems.js";

/** Supplies current Host and Runtime read-only projections to Management. */
export interface ManagementProjectionSource {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly productGeneration: ProductGenerationId;
  readonly hostState: () => ManagementHostState;
  readonly managementHttpState: () => ManagementHttpState;
  readonly endpointDescriptorPublished: () => boolean;
  readonly runtimeKernelActive: () => boolean;
  readonly managementServiceRunning: () => boolean;
  readonly runtimeSnapshot: () => RuntimeIntrospectionSnapshot;
}

/** Bounds the Management service's canonical mutation activity owner. */
export interface ManagementServiceOptions extends ManagementProjectionSource {
  readonly persistence: PersistenceService;
  readonly time: TimeService;
  readonly runMutationActivity: <T>(
    kind: string,
    operation: () => Promise<T>,
  ) => Promise<T>;
}

/** Exposes the semantic Management operations to transport adapters. */
export interface ManagementService {
  readonly contractVersion: typeof MANAGEMENT_CONTRACT_VERSION;
  /** Reads the compatibility descriptor. */
  getCompatibilityDescriptor(): CompatibilityDescriptor;
  /** Reads the public discovery descriptor. */
  getDiscovery(): ManagementDiscovery;
  /** Reads aggregate Product Host status. */
  getSystemStatus(): Promise<SystemStatus>;
  /** Reads the Host projection. */
  getHost(): HostReadModel;
  /** Reads the Runtime graph projection. */
  getRuntimeGraph(): RuntimeGraphReadModel;
  /** Reads the Capability graph projection. */
  getCapabilityGraph(): CapabilityGraphReadModel;
  /** Reads current Product Host readiness. */
  getReadiness(): Promise<Readiness>;
  /** Ensures and returns the local first-administrator claim material. */
  ensureFirstAdministratorClaim(
    localClaim?: FirstClaimMaterial,
  ): Promise<FirstClaimMaterial | undefined>;
  /** Consumes the first-administrator claim and creates its Administrator. */
  claimFirstAdministrator(
    claimId: string,
    claimSecret: string,
    password: string,
  ): Promise<ClaimResponse>;
  /** Authenticates a password and creates an opaque session. */
  login(password: string): Promise<LoginResponse>;
  /** Authenticates an opaque session token. */
  authenticate(sessionToken: string): Promise<ServerSession>;
  /** Revokes an opaque session token. */
  logout(sessionToken: string): Promise<void>;
}

function timeAfter(time: Instant, milliseconds: number): Instant {
  return formatInstant(new Date(Date.parse(time) + milliseconds));
}

function invalidClaimId(value: string): FirstAdministratorClaimId {
  const parsed = parseUuidV7Id("FirstAdministratorClaimId", value);
  if (parsed === undefined) {
    throw managementProblem(
      "management.first_claim_invalid",
      "First-administrator claim is invalid",
      "The claim identifier is invalid",
      "validation",
    );
  }
  return parsed;
}

function claimSecretIsCanonical(value: string): boolean {
  try {
    const bytes = Buffer.from(value, "base64url");
    return bytes.byteLength === 32 && bytes.toString("base64url") === value;
  } catch {
    return false;
  }
}

function mapClaimStatus(status: string): never {
  if (status === "HOST_FENCE_LOST") {
    throw managementProblem(
      "management.host_fence_lost",
      "Host ownership fence was lost",
      "The Management mutation was not admitted by the current Host",
      "conflict",
    );
  }
  if (status === "ADMINISTRATOR_EXISTS") {
    throw managementProblem(
      "management.administrator_exists",
      "Administrator already exists",
      "The first-administrator claim can no longer be consumed",
      "conflict",
    );
  }
  if (status === "CLAIM_EXPIRED") {
    throw managementProblem(
      "management.first_claim_expired",
      "First-administrator claim has expired",
      "The first-administrator claim must be refreshed by the current Host",
      "conflict",
    );
  }
  if (status === "CLAIM_CONSUMED") {
    throw managementProblem(
      "management.first_claim_consumed",
      "First-administrator claim has already been consumed",
      "The first-administrator claim is single-use",
      "conflict",
    );
  }
  if (status === "CLAIM_INVALID" || status === "CLAIM_NOT_FOUND") {
    throw managementProblem(
      "management.first_claim_invalid",
      "First-administrator claim is invalid",
      "The supplied first-administrator claim is not the current canonical claim",
      "validation",
    );
  }
  throw managementProblem(
    "management.repository_invalid",
    "Management repository returned an unsupported status",
    "The canonical Management mutation status was not recognized",
    "integrity",
  );
}

function mapSessionStatus(status: string): never {
  if (status === "HOST_FENCE_LOST") {
    throw managementProblem(
      "management.host_fence_lost",
      "Host ownership fence was lost",
      "The Management mutation was not admitted by the current Host",
      "conflict",
    );
  }
  if (status === "ADMINISTRATOR_NOT_FOUND") {
    throw managementProblem(
      "management.invalid_credentials",
      "Management credentials are invalid",
      "The Administrator session could not be created",
      "conflict",
    );
  }
  throw managementProblem(
    "management.repository_invalid",
    "Management repository returned an unsupported status",
    "The canonical Management mutation status was not recognized",
    "integrity",
  );
}

function runtimeEdges(
  snapshot: RuntimeIntrospectionSnapshot,
): readonly RuntimeGraphEdge[] {
  const edges: RuntimeGraphEdge[] = [];
  for (const consumer of snapshot.systems) {
    for (const requirement of consumer.serviceRequirements) {
      const binding = snapshot.selectedServiceBindings.find(
        (candidate) => candidate.id === requirement.serviceId,
      );
      if (binding === undefined) continue;
      const provider = snapshot.systems.find((candidate) =>
        candidate.serviceProvisions.some(
          (provision) =>
            provision.serviceId === requirement.serviceId &&
            provision.providerId === binding.providerId,
        ),
      );
      if (provider === undefined) continue;
      edges.push({
        providerMicroSystemId: provider.microSystemId,
        consumerMicroSystemId: consumer.microSystemId,
        serviceId: requirement.serviceId,
        providerId: binding.providerId,
        contractVersion: requirement.contractVersion,
      });
    }
  }
  return Object.freeze(edges);
}

function capabilityEntries(
  snapshot: RuntimeIntrospectionSnapshot,
): CapabilityGraphReadModelData["capabilities"] {
  const byId = new Map<
    string,
    Array<
      RuntimeIntrospectionSnapshot["systems"][number]["capabilityProvisions"][number]
    >
  >();
  for (const system of snapshot.systems) {
    for (const provision of system.capabilityProvisions) {
      const entries = byId.get(provision.capabilityId) ?? [];
      entries.push(provision);
      byId.set(provision.capabilityId, entries);
    }
  }
  return Object.freeze(
    [...byId.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([capabilityId, providers]) => ({
        capabilityId,
        providers: Object.freeze([...providers]),
      })),
  );
}

function administratorState(
  administrator: Awaited<ReturnType<ManagementRepository["readAdministrator"]>>,
  claim: Awaited<ReturnType<ManagementRepository["readCurrentClaim"]>>,
  now: Instant,
): AdministratorBootstrapState {
  if (administrator !== undefined) return "CLAIMED";
  if (claim !== undefined && claim.expiresAt > now) return "CLAIM_READY";
  return "UNCLAIMED";
}

function readModelEnvelope<T>(
  options: ManagementProjectionSource,
  resourceKind: string,
  resourceId: string,
  observedAt: Instant,
  data: T,
): ReadModelEnvelope<T> {
  return Object.freeze({
    schemaVersion: 1 as const,
    contractVersion: MANAGEMENT_CONTRACT_VERSION,
    resource: Object.freeze({
      schemaVersion: 1 as const,
      resourceKind,
      resourceId,
    }),
    observedAt,
    productGeneration: options.productGeneration,
    continuityEpochId: options.continuityEpochId,
    data,
  });
}

function createManagementServiceWithRepository(
  options: ManagementServiceOptions,
  repository: ManagementRepository,
): ManagementService {
  const contractRange: ContractRange = Object.freeze({
    kind: "exact",
    version: MANAGEMENT_CONTRACT_VERSION,
  });
  const compatibility: CompatibilityDescriptor = Object.freeze({
    schemaVersion: 1,
    instanceId: options.instanceId,
    continuityEpochId: options.continuityEpochId,
    productGeneration: options.productGeneration,
    coreContractVersion: MANAGEMENT_CONTRACT_VERSION,
    supportedClientContractRange: contractRange,
    problemSchemaVersion: 1,
  });

  const service: ManagementService = {
    contractVersion: MANAGEMENT_CONTRACT_VERSION,
    getCompatibilityDescriptor() {
      return compatibility;
    },
    getDiscovery() {
      return Object.freeze({
        schemaVersion: 1 as const,
        installationId: options.installationId,
        compatibility,
        apiBasePath: MANAGEMENT_API_BASE_PATH,
      });
    },
    async getSystemStatus() {
      const readiness = await service.getReadiness();
      const [administrator, claim] = await Promise.all([
        repository.readAdministrator(),
        repository.readCurrentClaim(),
      ]);
      const data = Object.freeze({
        schemaVersion: 1 as const,
        hostState: options.hostState(),
        managementState: options.managementHttpState(),
        administratorBootstrap: administratorState(
          administrator,
          claim,
          readiness.observedAt,
        ),
        readiness: readiness.data,
      });
      return readModelEnvelope(
        options,
        "system-status",
        options.installationId,
        readiness.observedAt,
        data,
      );
    },
    getHost() {
      const observedAt = options.time.now();
      const data = Object.freeze({
        schemaVersion: 1 as const,
        installationId: options.installationId,
        instanceId: options.instanceId,
        bootId: options.bootId,
        hostState: options.hostState(),
        managementHttpState: options.managementHttpState(),
      });
      return readModelEnvelope(options, "host", options.instanceId, observedAt, data);
    },
    getRuntimeGraph() {
      const snapshot = options.runtimeSnapshot();
      const observedAt = options.time.now();
      const data = Object.freeze({
        schemaVersion: 1 as const,
        operatingMode: snapshot.operatingMode,
        desiredRevision: snapshot.desiredRevision,
        systems: Object.freeze(
          snapshot.systems.map((system) => Object.freeze({ ...system })),
        ),
        edges: runtimeEdges(snapshot),
      });
      return readModelEnvelope(
        options,
        "runtime-graph",
        options.installationId,
        observedAt,
        data,
      );
    },
    getCapabilityGraph() {
      const snapshot = options.runtimeSnapshot();
      const observedAt = options.time.now();
      const data = Object.freeze({
        schemaVersion: 1 as const,
        capabilities: capabilityEntries(snapshot),
        selectedBindings: Object.freeze([...snapshot.selectedCapabilityBindings]),
      });
      return readModelEnvelope(
        options,
        "capability-graph",
        options.installationId,
        observedAt,
        data,
      );
    },
    async getReadiness() {
      const observedAt = options.time.now();
      const [administrator, claim] = await Promise.all([
        repository.readAdministrator(),
        repository.readCurrentClaim(),
      ]);
      const hostActive = options.hostState() === "ACTIVE";
      const persistenceUsable = options.persistence.state === "OPEN";
      const runtimeKernelActive = options.runtimeKernelActive();
      const managementServiceRunning = options.managementServiceRunning();
      const httpListening = options.managementHttpState() === "LISTENING";
      const endpointDescriptorPublished = options.endpointDescriptorPublished();
      const administratorBootstrapCoherent =
        administrator !== undefined ||
        (claim !== undefined && claim.expiresAt > observedAt);
      const state =
        hostActive &&
        persistenceUsable &&
        runtimeKernelActive &&
        managementServiceRunning &&
        httpListening &&
        endpointDescriptorPublished &&
        administratorBootstrapCoherent
          ? "READY"
          : "NOT_READY";
      const data: ReadinessData = Object.freeze({
        schemaVersion: 1 as const,
        hostActive,
        persistenceUsable,
        runtimeKernelActive,
        managementServiceRunning,
        httpListening,
        endpointDescriptorPublished,
        administratorBootstrapCoherent,
        state,
      });
      return readModelEnvelope(
        options,
        "management-readiness",
        options.installationId,
        observedAt,
        data,
      );
    },
    async ensureFirstAdministratorClaim(localClaim) {
      const administrator = await repository.readAdministrator();
      if (administrator !== undefined) return undefined;
      const current = await repository.readCurrentClaim();
      const now = options.time.now();
      if (
        current !== undefined &&
        localClaim !== undefined &&
        current.claimId === localClaim.claimId &&
        current.expiresAt === localClaim.expiresAt &&
        digestManagementSecret(localClaim.claimSecret) === current.secretDigest &&
        current.expiresAt > now
      ) {
        return localClaim;
      }
      const claimId = createUuidV7Id("FirstAdministratorClaimId");
      const claimSecret = randomBase64Url(32);
      const expiresAt = timeAfter(now, FIRST_CLAIM_LIFETIME_MS);
      const status = await options.runMutationActivity(
        "management.first-claim.created",
        () =>
          repository.createOrReplaceClaim({
            claimId,
            secretDigest: digestManagementSecret(claimSecret),
            createdAt: now,
            expiresAt,
          }),
      );
      if (status !== "CREATED") mapClaimStatus(status);
      return Object.freeze({ claimId, claimSecret, expiresAt });
    },
    async claimFirstAdministrator(claimIdText, claimSecret, password) {
      if (!claimSecretIsCanonical(claimSecret)) {
        throw managementProblem(
          "management.first_claim_invalid",
          "First-administrator claim is invalid",
          "The claim secret is not canonical",
          "validation",
        );
      }
      const claimId = invalidClaimId(claimIdText);
      const normalized = normalizeAdministratorPassword(password);
      const passwordHash = await hashAdministratorPassword(normalized);
      const administratorId = createUuidV7Id("AdministratorId");
      const now = options.time.now();
      try {
        const status = await options.runMutationActivity(
          "management.administrator.claimed",
          () =>
            repository.consumeClaimCreateAdministrator({
              claimId,
              secretDigest: digestManagementSecret(claimSecret),
              now,
              administratorId,
              authEpoch: 1,
              passwordSalt: passwordHash.salt,
              passwordNonce: passwordHash.nonce,
              passwordVerifier: passwordHash.verifier,
              passwordMemoryCost: ARGON2_PARAMETERS.memory,
              passwordTimeCost: ARGON2_PARAMETERS.passes,
              passwordParallelism: ARGON2_PARAMETERS.parallelism,
              passwordNormalizationId: PASSWORD_NORMALIZATION_ID,
            }),
        );
        if (status !== "CLAIMED") mapClaimStatus(status);
        return Object.freeze({ schemaVersion: 1 as const, administratorId });
      } finally {
        passwordHash.salt.fill(0);
        passwordHash.nonce.fill(0);
        passwordHash.verifier.fill(0);
      }
    },
    async login(password) {
      let normalized: string;
      try {
        normalized = normalizeAdministratorPassword(password);
      } catch {
        throw managementProblem(
          "management.invalid_credentials",
          "Management credentials are invalid",
          "The supplied Management credentials are invalid",
          "conflict",
        );
      }
      const administrator = await repository.readAdministrator();
      if (administrator === undefined) {
        throw managementProblem(
          "management.invalid_credentials",
          "Management credentials are invalid",
          "The supplied Management credentials are invalid",
          "conflict",
        );
      }
      if (!(await verifyAdministratorPassword(normalized, administrator))) {
        throw managementProblem(
          "management.invalid_credentials",
          "Management credentials are invalid",
          "The supplied Management credentials are invalid",
          "conflict",
        );
      }
      const sessionToken = randomBase64Url(32);
      const sessionId = createUuidV7Id("ServerSessionId");
      const issuedAt = options.time.now();
      const expiresAt = timeAfter(issuedAt, 7 * 24 * 60 * 60 * 1_000);
      const status = await options.runMutationActivity(
        "management.session.created",
        () =>
          repository.createSession({
            sessionId,
            tokenDigest: digestManagementSecret(sessionToken),
            administratorId: administrator.administratorId,
            authEpoch: administrator.authEpoch,
            issuedAt,
            expiresAt,
          }),
      );
      if (status !== "CREATED") mapSessionStatus(status);
      return Object.freeze({ schemaVersion: 1 as const, sessionToken, expiresAt });
    },
    async authenticate(sessionToken) {
      if (!claimSecretIsCanonical(sessionToken)) {
        throw managementProblem(
          "management.session_invalid",
          "Management session is invalid",
          "The supplied Management session is invalid",
          "conflict",
        );
      }
      const session = await repository.readSessionByTokenDigest(
        digestManagementSecret(sessionToken),
      );
      if (session === undefined) {
        throw managementProblem(
          "management.session_invalid",
          "Management session is invalid",
          "The supplied Management session is invalid",
          "conflict",
        );
      }
      const now = options.time.now();
      if (session.revokedAt !== undefined) {
        throw managementProblem(
          "management.session_revoked",
          "Management session is revoked",
          "The supplied Management session has been revoked",
          "conflict",
        );
      }
      if (session.expiresAt <= now) {
        throw managementProblem(
          "management.session_expired",
          "Management session is expired",
          "The supplied Management session has expired",
          "conflict",
        );
      }
      const administrator = await repository.readAdministrator();
      if (
        administrator === undefined ||
        administrator.administratorId !== session.administratorId ||
        administrator.authEpoch !== session.authEpoch
      ) {
        throw managementProblem(
          "management.session_invalid",
          "Management session is invalid",
          "The supplied Management session no longer matches the Administrator",
          "conflict",
        );
      }
      return session;
    },
    async logout(sessionToken) {
      const session = await service.authenticate(sessionToken);
      const status = await options.runMutationActivity(
        "management.session.revoked",
        () =>
          repository.revokeSession({
            sessionId: session.sessionId,
            tokenDigest: session.tokenDigest,
            revokedAt: options.time.now(),
          }),
      );
      if (status === "REVOKED") return;
      if (status === "HOST_FENCE_LOST") mapSessionStatus(status);
      throw managementProblem(
        "management.session_invalid",
        "Management session is invalid",
        "The Management session could not be revoked",
        "conflict",
      );
    },
  };
  return Object.freeze(service);
}

/** Creates the current Management semantic service. */
export function createManagementService(
  options: ManagementServiceOptions,
): ManagementService {
  return createManagementServiceWithRepository(
    options,
    createManagementRepository(options.persistence),
  );
}

/** Package-private construction seam for semantic service tests. */
export function createManagementServiceFromRepository(
  options: ManagementServiceOptions,
  repository: ManagementRepository,
): ManagementService {
  return createManagementServiceWithRepository(options, repository);
}
