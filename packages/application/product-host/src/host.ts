/**
 * Composes the existing Bootstrap and Host authorities into the Product Host
 * headless Product Host process.
 * @module host
 */

import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  createMicroSystemId,
  createProviderId,
  createServiceId,
  createProblemError,
  type BootId,
  type InstallationId,
  type InstanceId,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import {
  createExecutionContextRuntime,
  createExecutionLineageService,
  createPersistenceExecutionContextProvider,
} from "@heptalogos/execution-lineage";
import type { ExecutionContext } from "@heptalogos/execution-lineage";
import { createEvidenceService } from "@heptalogos/evidence";
import {
  prepareBootstrapPrelude,
  type BootstrapManagedHostContext,
} from "@heptalogos/bootstrap-runtime";
import { createPersistenceService } from "@heptalogos/persistence";
import {
  createContractVersion,
  createRuntimeLifecycleLineage,
  MicroSystemSupervisor,
  type MicroSystemDefinition,
  type RuntimeKernelReadOnlySnapshot,
} from "@heptalogos/runtime-kernel";
import { createRuntimeSubstrate } from "@heptalogos/runtime-substrate";
import { createSystemTimeService } from "@heptalogos/time-service";
import {
  MANAGEMENT_CONTRACT_VERSION,
  createManagementService,
  type ManagementService,
  type RuntimeIntrospectionSnapshot,
} from "@heptalogos/management";
import { createAIRuntimeService, type AIRuntimeService } from "@heptalogos/ai-runtime";
import {
  createConfigurationService,
  type ConfigurationService,
} from "@heptalogos/configuration";
import {
  createNetworkAccessService,
  type NetworkAccessService,
} from "@heptalogos/network-access";
import { createSecretService, type SecretService } from "@heptalogos/secret";
import type { FastifyInstance } from "fastify";
import {
  BOOTSTRAP_RUNTIME_GENERATION_ID,
  PRODUCT_GENERATION_ID,
} from "./generated/build-identities.js";
import { createProductionBootstrapKeyProvider } from "./credentials.js";
import {
  startFirstClaimMaintenance,
  type FirstClaimMaintenance,
} from "./claim-maintenance.js";
import {
  readFirstClaimMaterial,
  removeCurrentEndpointDescriptor,
  removeFirstClaimMaterial,
  writeFirstClaimMaterial,
  writeManagementEndpointDescriptor,
  type ManagementEndpointDescriptorV1,
} from "./files.js";
import { createManagementHttpApp } from "./http.js";
import { parseProductHostInputs, type ProductHostInputs } from "./inputs.js";

/** Bounds the existing Foundation composition for one Product Host process. */
const PRIVATE_POSTGRES_LIFECYCLE = Object.freeze({
  startupTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  readinessPollIntervalMs: 100,
});

/** Bounds the existing Host lease and canonical schema connection mechanics. */
const HOST_TIMING = Object.freeze({
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  fenceLockTimeoutMs: 10_000,
  keepAliveInitialDelayMs: 1_000,
});

/** Bounds the existing canonical migration and normal persistence services. */
const CANONICAL_OPTIONS = Object.freeze({
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  lockTimeoutMs: 10_000,
  idleInTransactionSessionTimeoutMs: 30_000,
  onBackgroundError(error: unknown) {
    void error;
  },
});

const MANAGEMENT_SYSTEM_ID = createMicroSystemId("system.management");
const MANAGEMENT_SERVICE_ID = createServiceId("service.management");
const MANAGEMENT_PROVIDER_ID = createProviderId("provider.management");
const CONFIGURATION_SYSTEM_ID = createMicroSystemId("system.configuration");
const CONFIGURATION_SERVICE_ID = createServiceId("service.configuration");
const CONFIGURATION_PROVIDER_ID = createProviderId("provider.configuration");
const SECRET_SYSTEM_ID = createMicroSystemId("system.secret");
const SECRET_SERVICE_ID = createServiceId("service.secret");
const SECRET_PROVIDER_ID = createProviderId("provider.secret");
const NETWORK_SYSTEM_ID = createMicroSystemId("system.network-access");
const NETWORK_SERVICE_ID = createServiceId("service.network-access");
const NETWORK_PROVIDER_ID = createProviderId("provider.network-access");
const AI_RUNTIME_SYSTEM_ID = createMicroSystemId("system.ai-runtime");
const AI_RUNTIME_SERVICE_ID = createServiceId("service.ai-runtime");
const AI_RUNTIME_PROVIDER_ID = createProviderId("provider.ai-runtime");

/** Safe public handle for one running headless Product Host. */
export interface ProductHostHandle {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly productGeneration: ProductGenerationId;
  readonly origin: string;
  readonly signal: AbortSignal;
  /** Performs terminal shutdown exactly once. */
  close(): Promise<void>;
}

function startupProblem(detail: string): Error {
  return createProblemError({
    problemCode: "product-host.startup_failed",
    category: "unavailable",
    retryClass: "manual",
    title: "Product Host startup failed",
    detail,
  });
}

function notReadyProblem(): Error {
  return createProblemError({
    problemCode: "management.not_ready",
    category: "unavailable",
    retryClass: "after-change",
    title: "Product Host is not ready",
    detail:
      "The current Product Host did not prove all required Management readiness conditions",
  });
}

function emptyRuntimeSnapshot(): RuntimeIntrospectionSnapshot {
  return {
    operatingMode: "NORMAL",
    desiredRevision: 0,
    systems: [],
    selectedServiceBindings: [],
    selectedCapabilityBindings: [],
  };
}

function toManagementRuntimeSnapshot(
  snapshot: RuntimeKernelReadOnlySnapshot,
): RuntimeIntrospectionSnapshot {
  return Object.freeze({
    operatingMode: snapshot.operatingMode,
    desiredRevision: snapshot.desiredRevision,
    systems: Object.freeze(
      snapshot.systems.map((system) =>
        Object.freeze({
          microSystemId: system.microSystemId,
          role: system.role,
          actualState: system.actualState,
          generation: Object.freeze({
            productGenerationId: system.generation.productGenerationId,
            ...(system.generation.packageGenerationId === undefined
              ? {}
              : { packageGenerationId: system.generation.packageGenerationId }),
          }),
          serviceRequirements: Object.freeze(
            system.serviceRequirements.map((requirement) =>
              Object.freeze({
                serviceId: requirement.serviceId,
                contractVersion: requirement.contractVersion,
              }),
            ),
          ),
          serviceProvisions: Object.freeze(
            system.serviceProvisions.map((provision) =>
              Object.freeze({
                serviceId: provision.serviceId,
                providerId: provision.providerId,
                contractVersion: provision.contractVersion,
              }),
            ),
          ),
          capabilityRequirements: Object.freeze(
            system.capabilityRequirements.map((requirement) =>
              Object.freeze({
                capabilityId: requirement.capabilityId,
                contractVersion: requirement.contractVersion,
                required: requirement.required,
              }),
            ),
          ),
          capabilityProvisions: Object.freeze(
            system.capabilityProvisions.map((provision) =>
              Object.freeze({
                capabilityId: provision.capabilityId,
                providerId: provision.providerId,
                contractVersion: provision.contractVersion,
                priority: provision.priority,
              }),
            ),
          ),
        }),
      ),
    ),
    selectedServiceBindings: Object.freeze(
      snapshot.selectedServiceBindings.map((binding) =>
        Object.freeze({ id: binding.id, providerId: binding.providerId }),
      ),
    ),
    selectedCapabilityBindings: Object.freeze(
      snapshot.selectedCapabilityBindings.map((binding) =>
        Object.freeze({ id: binding.id, providerId: binding.providerId }),
      ),
    ),
  });
}

async function runRetainedManagementMutation<T>(
  runtime: ReturnType<typeof createExecutionContextRuntime>,
  persistence: ReturnType<typeof createPersistenceService>,
  lineage: ReturnType<typeof createExecutionLineageService>,
  evidence: ReturnType<typeof createEvidenceService>,
  time: ReturnType<typeof createSystemTimeService>,
  kind: string,
  operation: () => Promise<T>,
): Promise<T> {
  return runtime.runActivity(
    {
      kind,
      importance: "significant",
      retentionClass: "retained",
      sensitivity: "operational",
    },
    async (context: ExecutionContext) => {
      await persistence.mutate((transaction) =>
        lineage.retainCurrent(transaction, context),
      );
      let result: T;
      try {
        result = await operation();
      } catch (error) {
        try {
          await persistence.mutate((transaction) =>
            lineage.completeCurrent(transaction, context, {
              endedAt: time.now(),
              outcome: "FAILED",
            }),
          );
        } catch (completionError) {
          throw new AggregateError(
            [error, completionError],
            "Management mutation and Activity failure completion both failed",
          );
        }
        throw error;
      }

      await persistence.mutate((transaction) =>
        evidence.recordRequired(transaction, {
          evidenceKind: "management.mutation",
          evidenceContractVersion: "management.v1",
          subjectRef: kind,
          retentionClass: "retained",
          sensitivity: "operational",
        }),
      );
      await persistence.mutate((transaction) =>
        lineage.completeCurrent(transaction, context, {
          endedAt: time.now(),
          outcome: "SUCCEEDED",
        }),
      );
      return result;
    },
  );
}

async function runManagementReadActivity<T>(
  runtime: ReturnType<typeof createExecutionContextRuntime>,
  kind: string,
  operation: () => Promise<T>,
): Promise<T> {
  return runtime.runActivity(
    {
      kind,
      importance: "routine",
      retentionClass: "ephemeral",
      sensitivity: "operational",
    },
    async () => operation(),
  );
}

function serviceRequirement(
  serviceId: ReturnType<typeof createServiceId>,
  version: string,
) {
  return {
    serviceId,
    contract: { kind: "exact" as const, version: createContractVersion(version) },
  };
}

function productServiceDefinition<T extends object>(input: {
  readonly productGeneration: ProductGenerationId;
  readonly microSystemId: ReturnType<typeof createMicroSystemId>;
  readonly serviceId: ReturnType<typeof createServiceId>;
  readonly providerId: ReturnType<typeof createProviderId>;
  readonly contractVersion: string;
  readonly implementation: T;
  readonly serviceRequirements: readonly ReturnType<typeof serviceRequirement>[];
}): MicroSystemDefinition {
  const provision = {
    serviceId: input.serviceId,
    providerId: input.providerId,
    contractVersion: createContractVersion(input.contractVersion),
  };
  const projectedImplementation: Record<string, unknown> = {};
  for (const [name, member] of Object.entries(input.implementation)) {
    if (typeof member === "function") projectedImplementation[name] = member;
  }
  const runtimeImplementation = Object.freeze(projectedImplementation);
  return {
    microSystemId: input.microSystemId,
    role: "system-service",
    generation: { productGenerationId: input.productGeneration },
    operatingModes: ["NORMAL", "SAFE", "MAINTENANCE", "EMERGENCY_READ_ONLY"],
    serviceRequirements: input.serviceRequirements,
    capabilityRequirements: [],
    serviceProvisions: [provision],
    capabilityProvisions: [],
    activate: async (context) => {
      context.publishService(provision, runtimeImplementation);
    },
  };
}

function managementDefinition(
  productGeneration: ProductGenerationId,
  management: ManagementService,
): MicroSystemDefinition {
  const provision = {
    serviceId: MANAGEMENT_SERVICE_ID,
    providerId: MANAGEMENT_PROVIDER_ID,
    contractVersion: createContractVersion(MANAGEMENT_CONTRACT_VERSION),
  };
  return {
    microSystemId: MANAGEMENT_SYSTEM_ID,
    role: "system-service",
    generation: { productGenerationId: productGeneration },
    operatingModes: ["NORMAL", "SAFE", "MAINTENANCE", "EMERGENCY_READ_ONLY"],
    serviceRequirements: [
      serviceRequirement(CONFIGURATION_SERVICE_ID, "configuration.v1"),
      serviceRequirement(SECRET_SERVICE_ID, "secret.v1"),
      serviceRequirement(NETWORK_SERVICE_ID, "network-access.v1"),
      serviceRequirement(AI_RUNTIME_SERVICE_ID, "ai-runtime.v1"),
    ],
    capabilityRequirements: [],
    serviceProvisions: [provision],
    capabilityProvisions: [],
    activate: async (context) => {
      context.publishService(provision, management);
    },
  };
}

function assertDiscovery(discovery: unknown, installationId: string): void {
  if (
    typeof discovery !== "object" ||
    discovery === null ||
    !("installationId" in discovery) ||
    discovery.installationId !== installationId ||
    !("apiBasePath" in discovery) ||
    discovery.apiBasePath !== "/management/v1" ||
    !("compatibility" in discovery) ||
    typeof discovery.compatibility !== "object" ||
    discovery.compatibility === null ||
    !("coreContractVersion" in discovery.compatibility) ||
    discovery.compatibility.coreContractVersion !== MANAGEMENT_CONTRACT_VERSION
  ) {
    throw startupProblem(
      "The live Management discovery document did not match the current Host",
    );
  }
}

/** Validated options for one real headless Product Host. */
export type ProductHostStartOptions = ProductHostInputs;

/** Starts one real headless Product Host from validated bootstrap inputs. */
export async function startProductHost(
  input: ProductHostStartOptions,
): Promise<ProductHostHandle> {
  const options = input;
  const productGeneration = PRODUCT_GENERATION_ID;
  const prepared = await prepareBootstrapPrelude(options.anchorRoot);
  let owned: Awaited<ReturnType<typeof prepared.acquireOwnership>> | undefined;
  let ready:
    | Awaited<ReturnType<NonNullable<typeof owned>["preparePrivatePostgres"]>>
    | undefined;
  let host: BootstrapManagedHostContext | undefined;
  let persistence: ReturnType<typeof createPersistenceService> | undefined;
  let supervisor: MicroSystemSupervisor | undefined;
  let app: FastifyInstance | undefined;
  let endpoint: ManagementEndpointDescriptorV1 | undefined;
  let claimMaintenance: FirstClaimMaintenance | undefined;
  let closePromise: Promise<void> | undefined;
  let httpState: "STARTING" | "LISTENING" | "CLOSING" | "CLOSED" = "STARTING";
  let endpointPublished = false;
  let requestClose: () => Promise<void> = async () => undefined;

  try {
    owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const state = await owned.ensureBootstrapStateInitialized({
      activeBootstrapRuntimeGeneration: BOOTSTRAP_RUNTIME_GENERATION_ID,
      activeProductGeneration: productGeneration,
    });
    const existingInstallation = state.state.privatePostgres !== undefined;
    const keyProvider = await createProductionBootstrapKeyProvider({
      installationId: owned.installationId,
      instanceId: owned.instanceId,
      existingInstallation,
    });
    ready = await owned.preparePrivatePostgres({
      toolchainBinDirectory: options.postgresBinDirectory,
      ...(existingInstallation ? {} : { initialPort: options.initialPostgresPort }),
      lifecycle: PRIVATE_POSTGRES_LIFECYCLE,
      keyProvider,
    });
    host = await owned.handoffPrivatePostgresToHost(ready, {
      initializeCanonicalHost: createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
      keyProvider,
      timing: HOST_TIMING,
    });

    const time = createSystemTimeService();
    const runtime = createExecutionContextRuntime(
      {
        installationId: host.installationId,
        instanceId: host.instanceId,
        bootId: host.bootId,
        continuityEpochId: host.continuityEpochId,
        hostOwnershipToken: host.token,
        runtime: { productGenerationId: productGeneration },
      },
      time,
    );
    persistence = createPersistenceService(
      host.persistence,
      {
        maxConnections: 4,
        idleTimeoutMs: 5_000,
        connectionTimeoutMs: 10_000,
        statementTimeoutMs: 10_000,
        lockTimeoutMs: 10_000,
        idleInTransactionSessionTimeoutMs: 30_000,
        onBackgroundError(error) {
          void error;
        },
      },
      createPersistenceExecutionContextProvider(runtime),
    );
    const lineage = createExecutionLineageService();
    const evidence = createEvidenceService(time);
    const runMutationActivity = <T>(kind: string, operation: () => Promise<T>) =>
      runRetainedManagementMutation(
        runtime,
        persistence!,
        lineage,
        evidence,
        time,
        kind,
        operation,
      );
    const runReadActivity = <T>(kind: string, operation: () => Promise<T>) =>
      runManagementReadActivity(runtime, kind, operation);
    const configuration: ConfigurationService = createConfigurationService({
      persistence,
      time,
      execution: runtime,
      evidence,
    });
    const secret: SecretService = createSecretService({
      persistence,
      time,
      execution: runtime,
      evidence,
    });
    const networkAccess: NetworkAccessService = createNetworkAccessService({
      configuration,
      execution: runtime,
      installationId: host.installationId,
    });
    const aiRuntime: AIRuntimeService = createAIRuntimeService({
      persistence,
      time,
      execution: runtime,
      evidence,
      configuration,
      secret,
      networkAccess,
    });
    const management = createManagementService({
      installationId: host.installationId,
      instanceId: host.instanceId,
      bootId: host.bootId,
      continuityEpochId: host.continuityEpochId,
      productGeneration,
      persistence,
      time,
      productOwners: {
        configuration,
        secret,
        networkAccess,
        aiRuntime,
      },
      execution: runtime,
      runReadActivity,
      hostState: () => host?.state ?? "CLOSED",
      managementHttpState: () => httpState,
      endpointDescriptorPublished: () => endpointPublished,
      runtimeKernelActive: () => supervisor?.isActive() ?? false,
      managementServiceRunning: () =>
        supervisor?.getActualState(MANAGEMENT_SYSTEM_ID) === "RUNNING",
      runtimeSnapshot: () =>
        supervisor === undefined
          ? emptyRuntimeSnapshot()
          : toManagementRuntimeSnapshot(supervisor.getReadOnlySnapshot()),
      runMutationActivity,
    });
    const runtimeLineage = createRuntimeLifecycleLineage({
      execution: runtime,
      persistence,
      lineage,
      time,
    });
    supervisor = new MicroSystemSupervisor({
      substrate: createRuntimeSubstrate({ settleTimeoutMs: 5_000 }),
      settleTimeoutMs: 5_000,
      definitions: [
        productServiceDefinition({
          productGeneration,
          microSystemId: CONFIGURATION_SYSTEM_ID,
          serviceId: CONFIGURATION_SERVICE_ID,
          providerId: CONFIGURATION_PROVIDER_ID,
          contractVersion: "configuration.v1",
          implementation: configuration,
          serviceRequirements: [],
        }),
        productServiceDefinition({
          productGeneration,
          microSystemId: SECRET_SYSTEM_ID,
          serviceId: SECRET_SERVICE_ID,
          providerId: SECRET_PROVIDER_ID,
          contractVersion: "secret.v1",
          implementation: secret,
          serviceRequirements: [],
        }),
        productServiceDefinition({
          productGeneration,
          microSystemId: NETWORK_SYSTEM_ID,
          serviceId: NETWORK_SERVICE_ID,
          providerId: NETWORK_PROVIDER_ID,
          contractVersion: "network-access.v1",
          implementation: networkAccess,
          serviceRequirements: [
            serviceRequirement(CONFIGURATION_SERVICE_ID, "configuration.v1"),
          ],
        }),
        productServiceDefinition({
          productGeneration,
          microSystemId: AI_RUNTIME_SYSTEM_ID,
          serviceId: AI_RUNTIME_SERVICE_ID,
          providerId: AI_RUNTIME_PROVIDER_ID,
          contractVersion: "ai-runtime.v1",
          implementation: aiRuntime,
          serviceRequirements: [
            serviceRequirement(CONFIGURATION_SERVICE_ID, "configuration.v1"),
            serviceRequirement(SECRET_SERVICE_ID, "secret.v1"),
            serviceRequirement(NETWORK_SERVICE_ID, "network-access.v1"),
          ],
        }),
        managementDefinition(productGeneration, management),
      ],
      lifecycleLineage: runtimeLineage,
      rootRuntimeOrigin: { productGenerationId: productGeneration },
      ownerLifecycle: {
        signal: host.signal,
        onTerminalFailure(error) {
          void error;
          void requestClose().catch(() => undefined);
        },
      },
    });
    await supervisor.reconcile({
      revision: 1,
      operatingMode: "NORMAL",
      desired: new Map([
        [CONFIGURATION_SYSTEM_ID, "RUNNING"],
        [SECRET_SYSTEM_ID, "RUNNING"],
        [NETWORK_SYSTEM_ID, "RUNNING"],
        [AI_RUNTIME_SYSTEM_ID, "RUNNING"],
        [MANAGEMENT_SYSTEM_ID, "RUNNING"],
      ]),
      serviceBindings: new Map([
        [CONFIGURATION_SERVICE_ID, CONFIGURATION_PROVIDER_ID],
        [SECRET_SERVICE_ID, SECRET_PROVIDER_ID],
        [NETWORK_SERVICE_ID, NETWORK_PROVIDER_ID],
        [AI_RUNTIME_SERVICE_ID, AI_RUNTIME_PROVIDER_ID],
        [MANAGEMENT_SERVICE_ID, MANAGEMENT_PROVIDER_ID],
      ]),
      capabilityBindings: new Map(),
    });

    const runDirectory = owned!.paths.resolve("RUN").canonicalPath;

    app = await createManagementHttpApp(management, {
      onAdministratorClaimed: () =>
        claimMaintenance?.administratorClaimed() ??
        removeFirstClaimMaterial(runDirectory),
    });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (address === null || typeof address === "string") {
      throw startupProblem(
        "The Management HTTP listener did not expose a loopback port",
      );
    }
    const origin = "http://127.0.0.1:" + address.port;
    httpState = "LISTENING";
    endpoint = Object.freeze({
      schemaVersion: 1,
      installationId: host.installationId,
      bootId: host.bootId,
      origin,
    });
    await writeManagementEndpointDescriptor(runDirectory, endpoint);
    endpointPublished = true;
    claimMaintenance = await startFirstClaimMaintenance({
      readLocalClaim: () => readFirstClaimMaterial(runDirectory),
      ensureClaim: (localClaim) => management.ensureFirstAdministratorClaim(localClaim),
      publishClaim: (claim) => writeFirstClaimMaterial(runDirectory, claim),
      removeClaim: () => removeFirstClaimMaterial(runDirectory),
    });

    const discoveryResponse = await fetch(
      origin + "/.well-known/heptalogos-management",
    );
    if (!discoveryResponse.ok) {
      throw startupProblem("The live Management discovery endpoint was not reachable");
    }
    assertDiscovery(await discoveryResponse.json(), host.installationId);
    if ((await management.getReadiness()).data.state !== "READY") {
      throw notReadyProblem();
    }

    const currentHost = host;
    const currentPersistence = persistence;
    const currentSupervisor = supervisor;
    const currentApp = app;
    requestClose = async () => {
      if (closePromise !== undefined) return closePromise;
      closePromise = (async () => {
        claimMaintenance?.close();
        httpState = "CLOSING";
        await currentApp.close().catch(() => undefined);
        endpointPublished = false;
        await removeCurrentEndpointDescriptor(runDirectory, currentHost.bootId);
        await currentSupervisor.close().catch(() => undefined);
        await currentPersistence.close().catch(() => undefined);
        if (currentHost.state === "ACTIVE") {
          const maintenance = await currentHost.preparePrivatePostgresMaintenance({
            kind: "STOP_PRIVATE_POSTGRES",
          });
          await maintenance.execute({
            async retire() {
              return;
            },
          });
        }
        httpState = "CLOSED";
      })();
      return closePromise;
    };
    currentHost.signal.addEventListener(
      "abort",
      () => {
        void requestClose().catch(() => undefined);
      },
      { once: true },
    );
    return Object.freeze({
      installationId: currentHost.installationId,
      instanceId: currentHost.instanceId,
      bootId: currentHost.bootId,
      productGeneration,
      origin,
      signal: currentHost.signal,
      close: requestClose,
    });
  } catch (error) {
    claimMaintenance?.close();
    if (app !== undefined) await app.close().catch(() => undefined);
    if (supervisor !== undefined) await supervisor.close().catch(() => undefined);
    if (persistence !== undefined) await persistence.close().catch(() => undefined);
    if (host !== undefined && host.state === "ACTIVE") {
      await host
        .preparePrivatePostgresMaintenance({ kind: "STOP_PRIVATE_POSTGRES" })
        .then((maintenance) =>
          maintenance.execute({
            async retire() {
              return;
            },
          }),
        )
        .catch(() => undefined);
    } else if (ready !== undefined) {
      await ready.stop().catch(() => undefined);
    }
    await owned?.close().catch(() => undefined);
    throw error;
  }
}

/** Parses argv and keeps the built daemon's process entrypoint intentionally small. */
export async function startProductHostFromArgv(
  argv: readonly string[],
): Promise<ProductHostHandle> {
  return startProductHost(parseProductHostInputs(argv));
}
