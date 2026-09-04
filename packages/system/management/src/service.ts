/**
 * Implements the Management semantic service over canonical persistence
 * and injected Host/Runtime read projections. HTTP and CLI remain projections.
 * @module service
 */

import {
  createUuidV7Id,
  digestCanonicalJson,
  formatInstant,
  parseUuidV7Id,
  snapshotCanonicalJson,
  type BootId,
  type CanonicalJsonValue,
  type ContinuityEpochId,
  type InstallationId,
  type InstanceId,
  type ProductGenerationId,
  type Instant,
} from "@heptalogos/foundation-contracts";
import type { ExecutionContextRuntime } from "@heptalogos/execution-lineage";
import type { AIRuntimeService } from "@heptalogos/ai-runtime";
import type { ConfigurationService } from "@heptalogos/configuration";
import type { NetworkAccessService } from "@heptalogos/network-access";
import type { SecretService } from "@heptalogos/secret";
import type { PersistenceService } from "@heptalogos/persistence";
import type { TimeService } from "@heptalogos/time-service";
import { compileSchema } from "@heptalogos/schema-runtime";
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
  currentSystemActionCatalog,
  SYSTEM_ACTION_CATALOG_REVISION,
  systemActionRequestSchema,
  type ProductStateReadModel,
  type ManagementDigest,
  type SystemActionDefinition,
  type SystemActionExecuteRequest,
  type SystemActionExecuteResult,
  type SystemActionRequest,
  type SystemActionId,
  type SystemChangePlan,
  type TargetPrecondition,
  type ProductSystemActionId,
  type ProductSemanticId,
  type ConfigurationRevisionCreateActionInput,
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
import { invalidInputProblem, managementProblem } from "./problems.js";

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

/** Supplies the current Product prerequisite semantic owners to Management. */
export interface ManagementProductOwners {
  readonly configuration: ConfigurationService;
  readonly secret: SecretService;
  readonly networkAccess: NetworkAccessService;
  readonly aiRuntime: AIRuntimeService;
  readonly subject: SubjectManagementPort;
}

/** Narrow Subject owner seam used by Management without importing Product code. */
export interface SubjectManagementPort {
  /** Reads the current Subject status projection. */
  getStatus(): Promise<import("./contracts.js").SubjectStatusProjection>;
  /** Starts the current Subject under an authority revision fence. */
  start(input: {
    readonly subjectId: string;
    readonly expectedAuthorityRevision: number;
  }): Promise<import("./contracts.js").SubjectStatusProjection>;
  /** Stops the current Subject under an authority revision fence. */
  stop(input: {
    readonly subjectId: string;
    readonly expectedAuthorityRevision: number;
  }): Promise<import("./contracts.js").SubjectStatusProjection>;
}

/** Bounds the Management service's canonical mutation activity owner. */
export interface ManagementServiceOptions extends ManagementProjectionSource {
  readonly persistence: PersistenceService;
  readonly time: TimeService;
  /** Current owner composition; absent only for legacy auth-only unit fixtures. */
  readonly productOwners?: ManagementProductOwners;
  /** Current execution owner used to attribute ephemeral plans. */
  readonly execution?: ExecutionContextRuntime;
  /** Runs a side-effect-free plan under an ephemeral Activity context. */
  readonly runReadActivity?: <T>(
    kind: string,
    operation: () => Promise<T>,
  ) => Promise<T>;
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
  /** Reads the current redacted Product prerequisite state. */
  getProductState(): Promise<ProductStateReadModel>;
  /** Reads the finite current SystemAction catalog. */
  getSystemActionCatalog(): readonly SystemActionDefinition[];
  /** Creates a side-effect-free exact current-state change plan. */
  planAction(request: SystemActionRequest): Promise<SystemChangePlan>;
  /** Reauthenticates, confirms, and executes one exact action plan. */
  executeAction(
    sessionToken: string,
    request: SystemActionExecuteRequest,
  ): Promise<SystemActionExecuteResult<CanonicalJsonValue>>;
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

const systemActionRequestValidator = compileSchema<SystemActionRequest>(
  systemActionRequestSchema,
);

function canonicalObject(value: object): {
  readonly value: CanonicalJsonValue;
  readonly canonical: string;
} {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw invalidInputProblem("The Management action could not be canonicalized");
  }
  const parsed: unknown = JSON.parse(serialized);
  const snapshot = snapshotCanonicalJson(parsed as CanonicalJsonValue);
  return Object.freeze({ value: snapshot.value, canonical: snapshot.canonical });
}

function canonicalValue(value: CanonicalJsonValue): string {
  return snapshotCanonicalJson(value).canonical;
}

function managementDigest(domain: string, value: object): ManagementDigest {
  return digestCanonicalJson(domain, canonicalObject(value).value)
    .hex as ManagementDigest;
}

function requiredUuid(brand: string, value: string, field: string): string {
  if (parseUuidV7Id(brand, value) === undefined) {
    throw invalidInputProblem(field + " must be a UUIDv7 identifier");
  }
  return value;
}

function actionDefinition(actionId: ProductSystemActionId): SystemActionDefinition {
  const definition = currentSystemActionCatalog.find(
    (candidate) => candidate.actionId === actionId,
  );
  if (definition === undefined) {
    throw invalidInputProblem("The requested SystemAction is not current");
  }
  return definition;
}

function canonicalAction(action: SystemActionRequest): CanonicalJsonValue {
  return canonicalObject(action).value;
}

function normalizedInputDigest(action: SystemActionRequest): ManagementDigest {
  return digestCanonicalJson(
    "management.system-action.input.v1",
    canonicalAction(action),
  ).hex as ManagementDigest;
}

function exactModelCapabilities(
  capabilities: readonly string[],
): capabilities is readonly [
  "text-generation",
  "structured-output",
  "usage-metadata",
  "abort-timeout",
] {
  return (
    capabilities.length === 4 &&
    capabilities.every(
      (capability, index) =>
        capability ===
        ["text-generation", "structured-output", "usage-metadata", "abort-timeout"][
          index
        ],
    )
  );
}

async function normalizeAction(
  request: SystemActionRequest,
  owners: ManagementProductOwners,
): Promise<SystemActionRequest> {
  const validation = systemActionRequestValidator.validate(request);
  if (!validation.ok) {
    throw invalidInputProblem(
      validation.issues
        .map((issue) => issue.instancePath + " " + issue.message)
        .join("; "),
    );
  }
  const action = validation.value;
  switch (action.actionId) {
    case "configuration.revision.create": {
      const value = owners.configuration.validateValue(
        action.input.definitionId,
        action.input.value,
      );
      return Object.freeze({
        actionId: action.actionId,
        input: Object.freeze({ ...action.input, value }),
      });
    }
    case "configuration.activate":
      requiredUuid("ConfigurationRevisionId", action.input.revisionId, "revisionId");
      if (action.input.expectedActiveRevisionId !== undefined) {
        requiredUuid(
          "ConfigurationRevisionId",
          action.input.expectedActiveRevisionId,
          "expectedActiveRevisionId",
        );
      }
      return action;
    case "secret.set":
      if (
        action.input.purpose !== "ai.gateway.bearer-token" ||
        action.input.scopeRef?.resourceKind !== "gateway-profile"
      ) {
        throw invalidInputProblem(
          "The current Secret route only accepts an ai.gateway.bearer-token scoped to a gateway-profile",
        );
      }
      return action;
    case "secret.replace":
      requiredUuid("SecretId", action.input.secretRef, "secretRef");
      return action;
    case "secret.revoke":
      requiredUuid("SecretId", action.input.secretRef, "secretRef");
      return action;
    case "gateway-profile.set":
      if (action.input.gatewayProfileId !== undefined) {
        requiredUuid(
          "GatewayProfileId",
          action.input.gatewayProfileId,
          "gatewayProfileId",
        );
      }
      if (action.input.apiTokenSecretRef !== undefined) {
        if (action.input.gatewayProfileId === undefined) {
          throw invalidInputProblem(
            "A gateway token SecretRef requires an explicit gatewayProfileId",
          );
        }
        requiredUuid(
          "SecretId",
          action.input.apiTokenSecretRef.secretId,
          "apiTokenSecretRef.secretId",
        );
      }
      return action;
    case "model-profile.set":
      if (action.input.modelProfileId !== undefined) {
        requiredUuid("ModelProfileId", action.input.modelProfileId, "modelProfileId");
      }
      requiredUuid(
        "GatewayProfileId",
        action.input.gatewayProfileId,
        "gatewayProfileId",
      );
      if (!exactModelCapabilities(action.input.consumedCapabilities)) {
        throw invalidInputProblem(
          "consumedCapabilities must be the exact current four-capability set in order",
        );
      }
      return action;
    case "model-binding.set":
      requiredUuid("ModelProfileId", action.input.modelProfileId, "modelProfileId");
      return action;
    case "subject.start":
    case "subject.stop":
      requiredUuid("SubjectId", action.input.subjectId, "subjectId");
      if (
        !Number.isSafeInteger(action.input.expectedAuthorityRevision) ||
        action.input.expectedAuthorityRevision < 1
      ) {
        throw invalidInputProblem(
          "expectedAuthorityRevision must be a positive safe integer",
        );
      }
      return action;
  }
}

function precondition(
  resourceKind: string,
  resourceId: string,
  current: object | undefined,
  digestDomain = "management.target.v1",
): TargetPrecondition {
  return Object.freeze({
    schemaVersion: 1 as const,
    resource: Object.freeze({
      schemaVersion: 1 as const,
      resourceKind,
      resourceId,
    }),
    ...(current === undefined
      ? {}
      : { expectedDigest: managementDigest(digestDomain, current) }),
  });
}

function configurationResourceId(
  ref: ConfigurationRevisionCreateActionInput["scopeRef"],
): string {
  return ref.resourceKind + ":" + ref.resourceId;
}

async function actionPreconditions(
  action: SystemActionRequest,
  owners: ManagementProductOwners,
): Promise<readonly TargetPrecondition[]> {
  switch (action.actionId) {
    case "configuration.revision.create": {
      const activation = await owners.configuration.getActivation(
        action.input.scopeRef,
      );
      return Object.freeze([
        precondition(
          "configuration-scope",
          configurationResourceId(action.input.scopeRef),
          activation,
        ),
      ]);
    }
    case "configuration.activate": {
      const revision = await owners.configuration.getRevision(action.input.revisionId);
      if (revision === undefined) {
        throw managementProblem(
          "management.configuration_revision_not_found",
          "Configuration revision was not found",
          "The requested ConfigurationRevision is not current",
          "conflict",
        );
      }
      const activation = await owners.configuration.getActivation(revision.scopeRef);
      return Object.freeze([
        precondition("configuration-revision", revision.revisionId, revision),
        precondition(
          "configuration-scope",
          configurationResourceId(revision.scopeRef),
          activation,
        ),
      ]);
    }
    case "secret.set":
      return Object.freeze([]);
    case "secret.replace":
    case "secret.revoke": {
      const metadata = await owners.secret.getMetadata(action.input.secretRef);
      if (metadata === undefined) {
        throw managementProblem(
          "management.secret_not_found",
          "Secret was not found",
          "The requested SecretRef is not current",
          "conflict",
        );
      }
      return Object.freeze([precondition("secret", metadata.secretId, metadata)]);
    }
    case "gateway-profile.set": {
      if (action.input.gatewayProfileId === undefined) return Object.freeze([]);
      const profile = await owners.aiRuntime.getGatewayProfile(
        action.input.gatewayProfileId,
      );
      return Object.freeze([
        precondition(
          "gateway-profile",
          action.input.gatewayProfileId,
          profile,
          "ai.gateway-profile.v1",
        ),
      ]);
    }
    case "model-profile.set": {
      if (action.input.modelProfileId === undefined) return Object.freeze([]);
      const profile = await owners.aiRuntime.getModelProfile(
        action.input.modelProfileId,
      );
      return Object.freeze([
        precondition(
          "model-profile",
          action.input.modelProfileId,
          profile,
          "ai.model-profile.v1",
        ),
      ]);
    }
    case "model-binding.set": {
      const binding = await owners.aiRuntime.getModelBinding(action.input.role);
      return Object.freeze([
        precondition(
          "model-binding",
          action.input.role,
          binding,
          "ai.model-binding.v1",
        ),
      ]);
    }
    case "subject.start":
    case "subject.stop": {
      const status = await owners.subject.getStatus();
      if (status.subjectId !== action.input.subjectId) {
        throw managementProblem(
          "management.subject_not_found",
          "Subject was not found",
          "The requested SubjectId is not current for this Installation",
          "conflict",
        );
      }
      return Object.freeze([
        precondition("subject", status.subjectId, status, "subject.status.v1"),
      ]);
    }
  }
}

function actionOwners(action: SystemActionRequest): readonly ProductSemanticId[] {
  switch (action.actionId) {
    case "configuration.revision.create":
    case "configuration.activate":
      return Object.freeze([
        "system.configuration" as ProductSemanticId,
        "system.network-access" as ProductSemanticId,
      ]);
    case "secret.set":
    case "secret.replace":
    case "secret.revoke":
      return Object.freeze(["system.secret" as ProductSemanticId]);
    case "gateway-profile.set":
    case "model-profile.set":
    case "model-binding.set":
      return Object.freeze(["system.ai-runtime" as ProductSemanticId]);
    case "subject.start":
    case "subject.stop":
      return Object.freeze([
        "product.subject" as ProductSemanticId,
        "product.messaging" as ProductSemanticId,
      ]);
  }
}

function actionImpact(action: SystemActionRequest): {
  readonly readiness: CanonicalJsonValue;
  readonly restart: CanonicalJsonValue;
} {
  const readiness = Object.freeze({
    gatewayPrerequisiteReadiness: "re-evaluate",
    subjectDispatch: "re-evaluate",
  });
  const restart = Object.freeze({
    restartRequired: false,
    reconciliation: "immediate",
  });
  void action;
  return { readiness, restart };
}

function planDigest(plan: SystemChangePlan): ManagementDigest {
  return digestCanonicalJson(
    "management.system-change-plan.v1",
    canonicalObject({
      schemaVersion: plan.schemaVersion,
      planId: plan.planId,
      actionId: plan.actionId,
      actionVersion: plan.actionVersion,
      normalizedInputDigest: plan.normalizedInputDigest,
      targetPreconditions: plan.targetPreconditions,
      affectedSemanticOwners: plan.affectedSemanticOwners,
      configurationReadinessSubjectImpact: plan.configurationReadinessSubjectImpact,
      restartReconcileImpact: plan.restartReconcileImpact,
      riskClass: plan.riskClass,
      createdAt: plan.createdAt,
      lineageContextRef: plan.lineageContextRef,
    }).value,
  ).hex as ManagementDigest;
}

function samePreconditions(
  left: readonly TargetPrecondition[],
  right: readonly TargetPrecondition[],
): boolean {
  return (
    canonicalObject({ value: left }).canonical ===
    canonicalObject({ value: right }).canonical
  );
}

function productOwners(options: ManagementServiceOptions): ManagementProductOwners {
  if (options.productOwners === undefined) {
    throw managementProblem(
      "management.product_not_composed",
      "Product prerequisite services are unavailable",
      "The current Product Host has not composed the Product prerequisite owners",
      "unavailable",
      "after-change",
    );
  }
  return options.productOwners;
}

function secretRefFromAction(value: {
  readonly schemaVersion: 1;
  readonly secretId: string;
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    secretId: parseUuidV7Id("SecretId", value.secretId)!,
  });
}

function resultField(value: CanonicalJsonValue, field: string): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return undefined;
  const candidate = (value as { readonly [key: string]: CanonicalJsonValue })[field];
  return typeof candidate === "string" ? candidate : undefined;
}

async function dispatchAction(
  action: SystemActionRequest,
  owners: ManagementProductOwners,
  expectedDigest: string | null | undefined,
): Promise<CanonicalJsonValue> {
  switch (action.actionId) {
    case "configuration.revision.create":
      return canonicalObject(
        await owners.configuration.createRevision({
          definitionId: action.input.definitionId,
          scopeRef: action.input.scopeRef,
          value: action.input.value,
        }),
      ).value;
    case "configuration.activate":
      return canonicalObject(
        await owners.configuration.activate({
          revisionId: action.input.revisionId,
          ...(action.input.expectedActiveRevisionId === undefined
            ? {}
            : { expectedActiveRevisionId: action.input.expectedActiveRevisionId }),
        }),
      ).value;
    case "secret.set": {
      const bytes = new TextEncoder().encode(action.input.material);
      try {
        const ref = await owners.secret.createOrSet({
          purpose: action.input.purpose,
          ...(action.input.scopeRef === undefined
            ? {}
            : { scopeRef: action.input.scopeRef }),
          material: bytes,
        });
        return canonicalObject(ref).value;
      } finally {
        bytes.fill(0);
      }
    }
    case "secret.replace": {
      const bytes = new TextEncoder().encode(action.input.material);
      try {
        const existing = await owners.secret.getMetadata(action.input.secretRef);
        if (existing === undefined) {
          throw managementProblem(
            "management.secret_not_found",
            "Secret was not found",
            "The requested SecretRef is not current",
            "conflict",
          );
        }
        const ref = await owners.secret.replace(action.input.secretRef, {
          purpose: existing.purpose,
          ...(existing.scopeRef === undefined ? {} : { scopeRef: existing.scopeRef }),
          material: bytes,
        });
        return canonicalObject(ref).value;
      } finally {
        bytes.fill(0);
      }
    }
    case "secret.revoke":
      await owners.secret.revoke(action.input.secretRef);
      return null;
    case "gateway-profile.set":
      return canonicalObject(
        await owners.aiRuntime.setGatewayProfile(
          {
            ...(action.input.gatewayProfileId === undefined
              ? {}
              : { gatewayProfileId: action.input.gatewayProfileId }),
            baseUrl: action.input.baseUrl,
            ...(action.input.apiTokenSecretRef === undefined
              ? {}
              : {
                  apiTokenSecretRef: secretRefFromAction(
                    action.input.apiTokenSecretRef,
                  ),
                }),
            enabled: action.input.enabled,
          },
          expectedDigest,
        ),
      ).value;
    case "model-profile.set":
      return canonicalObject(
        await owners.aiRuntime.setModelProfile(
          {
            ...(action.input.modelProfileId === undefined
              ? {}
              : { modelProfileId: action.input.modelProfileId }),
            gatewayProfileId: action.input.gatewayProfileId,
            modelIdentifier: action.input.modelIdentifier,
            protocol: action.input.protocol,
            consumedCapabilities: action.input.consumedCapabilities,
          },
          expectedDigest,
        ),
      ).value;
    case "model-binding.set":
      return canonicalObject(
        await owners.aiRuntime.setModelBinding(
          {
            role: action.input.role,
            modelProfileId: action.input.modelProfileId,
          },
          expectedDigest,
        ),
      ).value;
    case "subject.start":
      return canonicalObject(
        await owners.subject.start({
          subjectId: action.input.subjectId,
          expectedAuthorityRevision: action.input.expectedAuthorityRevision,
        }),
      ).value;
    case "subject.stop":
      return canonicalObject(
        await owners.subject.stop({
          subjectId: action.input.subjectId,
          expectedAuthorityRevision: action.input.expectedAuthorityRevision,
        }),
      ).value;
  }
}

async function verifyPostcondition(
  action: SystemActionRequest,
  result: CanonicalJsonValue,
  owners: ManagementProductOwners,
): Promise<boolean> {
  switch (action.actionId) {
    case "configuration.revision.create":
      return (
        resultField(result, "revisionId") !== undefined &&
        (await owners.configuration.getRevision(resultField(result, "revisionId")!)) !==
          undefined
      );
    case "configuration.activate": {
      const revision = await owners.configuration.getRevision(action.input.revisionId);
      if (revision === undefined) return false;
      const activation = await owners.configuration.getActivation(revision.scopeRef);
      return activation?.activeRevisionId === action.input.revisionId;
    }
    case "secret.set":
      return (
        resultField(result, "secretId") !== undefined &&
        (await owners.secret.getMetadata(resultField(result, "secretId")!))?.state ===
          "ACTIVE"
      );
    case "secret.replace":
      return (
        (await owners.secret.getMetadata(action.input.secretRef))?.state === "ACTIVE"
      );
    case "secret.revoke":
      return (
        (await owners.secret.getMetadata(action.input.secretRef))?.state === "REVOKED"
      );
    case "gateway-profile.set": {
      const gatewayProfileId = resultField(result, "gatewayProfileId");
      const current =
        gatewayProfileId === undefined
          ? undefined
          : await owners.aiRuntime.getGatewayProfile(gatewayProfileId);
      return (
        current !== undefined &&
        canonicalObject(current).canonical === canonicalValue(result)
      );
    }
    case "model-profile.set": {
      const modelProfileId = resultField(result, "modelProfileId");
      const current =
        modelProfileId === undefined
          ? undefined
          : await owners.aiRuntime.getModelProfile(modelProfileId);
      return (
        current !== undefined &&
        canonicalObject(current).canonical === canonicalValue(result)
      );
    }
    case "model-binding.set": {
      const current = await owners.aiRuntime.getModelBinding(action.input.role);
      return (
        current !== undefined &&
        canonicalObject(current).canonical === canonicalValue(result)
      );
    }
    case "subject.start":
    case "subject.stop": {
      const current = await owners.subject.getStatus();
      return (
        current.subjectId === action.input.subjectId &&
        current.desiredState ===
          (action.actionId === "subject.start" ? "RUNNING" : "STOPPED") &&
        canonicalObject(current).canonical === canonicalValue(result)
      );
    }
  }
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
    systemActionCatalogRevision: SYSTEM_ACTION_CATALOG_REVISION,
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
    async getProductState() {
      const read = async (): Promise<ProductStateReadModel> => {
        const owners = productOwners(options);
        const [
          revisions,
          activations,
          secrets,
          gatewayProfiles,
          modelProfiles,
          modelBindings,
          networkAccess,
          aiReadiness,
          subject,
        ] = await Promise.all([
          owners.configuration.listRevisions(),
          owners.configuration.listActivations(),
          owners.secret.listMetadata(),
          owners.aiRuntime.listGatewayProfiles(),
          owners.aiRuntime.listModelProfiles(),
          owners.aiRuntime.listModelBindings(),
          owners.networkAccess.getDiagnostics(),
          owners.aiRuntime.getReadiness(),
          owners.subject.getStatus(),
        ]);
        const observedAt = options.time.now();
        const data = Object.freeze({
          schemaVersion: 1 as const,
          configuration: Object.freeze({
            definitions: Object.freeze([...owners.configuration.definitions]),
            revisions: Object.freeze([...revisions]),
            activations: Object.freeze([...activations]),
          }),
          secrets: Object.freeze([...secrets]),
          gatewayProfiles: Object.freeze([...gatewayProfiles]),
          modelProfiles: Object.freeze([...modelProfiles]),
          modelBindings: Object.freeze([...modelBindings]),
          networkAccess,
          aiReadiness,
          subject,
        });
        return readModelEnvelope(
          options,
          "product-prerequisites",
          options.installationId,
          observedAt,
          data,
        );
      };
      if (options.runReadActivity !== undefined) {
        return options.runReadActivity("management.product-state.read", read);
      }
      return read();
    },
    getSystemActionCatalog() {
      return currentSystemActionCatalog;
    },
    async planAction(request) {
      const plan = async (): Promise<SystemChangePlan> => {
        const owners = productOwners(options);
        const action = await normalizeAction(request, owners);
        const definition = actionDefinition(action.actionId);
        const preconditions = await actionPreconditions(action, owners);
        const execution = options.execution;
        if (execution === undefined) {
          throw managementProblem(
            "management.plan_activity_required",
            "SystemAction planning requires an Activity",
            "The current Management Host did not provide a planning Activity context",
            "conflict",
          );
        }
        let lineageContextRef: SystemChangePlan["lineageContextRef"];
        try {
          lineageContextRef = execution.createLineageContextRef();
        } catch {
          throw managementProblem(
            "management.plan_activity_required",
            "SystemAction planning requires an Activity",
            "The current Management Host did not provide a planning Activity context",
            "conflict",
          );
        }
        const impact = actionImpact(action);
        const draft: SystemChangePlan = Object.freeze({
          schemaVersion: 1,
          planId: createUuidV7Id("SystemChangePlanId"),
          actionId: action.actionId as SystemActionId,
          actionVersion: definition.actionVersion,
          normalizedInputDigest: normalizedInputDigest(action),
          targetPreconditions: preconditions,
          affectedSemanticOwners: actionOwners(action),
          configurationReadinessSubjectImpact: impact.readiness,
          restartReconcileImpact: impact.restart,
          riskClass: definition.riskClass,
          planDigest: "0".repeat(64) as ManagementDigest,
          createdAt: options.time.now(),
          lineageContextRef,
        });
        return Object.freeze({ ...draft, planDigest: planDigest(draft) });
      };
      if (options.runReadActivity !== undefined) {
        return options.runReadActivity("management.system-action.plan", plan);
      }
      return plan();
    },
    async executeAction(sessionToken, request) {
      await service.authenticate(sessionToken);
      return options.runMutationActivity(
        "management.system-action.execute",
        async () => {
          const owners = productOwners(options);
          const action = await normalizeAction(request.action, owners);
          const definition = actionDefinition(action.actionId);
          if (
            request.plan.actionId !== action.actionId ||
            request.plan.actionVersion !== definition.actionVersion
          ) {
            throw managementProblem(
              "management.plan_conflict",
              "SystemAction plan does not match the request",
              "The confirmed plan action and action input must match exactly",
              "conflict",
              "after-change",
            );
          }
          if (planDigest(request.plan) !== request.plan.planDigest) {
            throw managementProblem(
              "management.plan_invalid",
              "SystemAction plan is invalid",
              "The confirmed plan digest does not match its canonical contents",
              "conflict",
            );
          }
          if (normalizedInputDigest(action) !== request.plan.normalizedInputDigest) {
            throw managementProblem(
              "management.plan_conflict",
              "SystemAction input is stale",
              "The confirmed plan was created for different normalized input",
              "conflict",
              "after-change",
            );
          }
          const currentPreconditions = await actionPreconditions(action, owners);
          if (
            !samePreconditions(request.plan.targetPreconditions, currentPreconditions)
          ) {
            throw managementProblem(
              "management.plan_conflict",
              "SystemAction target is stale",
              "A target resource changed after the action was planned",
              "conflict",
              "after-change",
            );
          }
          const targetPrecondition = request.plan.targetPreconditions.find(
            (candidate) => {
              if (action.actionId === "gateway-profile.set") {
                return candidate.resource.resourceKind === "gateway-profile";
              }
              if (action.actionId === "model-profile.set") {
                return candidate.resource.resourceKind === "model-profile";
              }
              if (action.actionId === "model-binding.set") {
                return candidate.resource.resourceKind === "model-binding";
              }
              return false;
            },
          );
          const expectedDigest =
            targetPrecondition === undefined
              ? undefined
              : targetPrecondition.expectedDigest === undefined
                ? null
                : targetPrecondition.expectedDigest;
          const result = await dispatchAction(action, owners, expectedDigest);
          const postconditionsVerified = await verifyPostcondition(
            action,
            result,
            owners,
          );
          return Object.freeze({
            schemaVersion: 1 as const,
            actionId: action.actionId as SystemActionId,
            planDigest: request.plan.planDigest,
            result,
            postconditionsVerified,
            evidenceRefs: Object.freeze([]),
          });
        },
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
