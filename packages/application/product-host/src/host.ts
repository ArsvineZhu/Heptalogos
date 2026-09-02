/**
 * Composes the existing Bootstrap and Host authorities into the real P1
 * headless Product Host process.
 * @module host
 */

import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  asContentDigest,
  createMicroSystemId,
  createProviderId,
  createServiceId,
  createProblemError,
  digestCanonicalJson,
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
import type { BootstrapRuntimeGenerationId } from "@heptalogos/bootstrap-state";
import { createPersistenceService } from "@heptalogos/persistence";
import {
  createContractVersion,
  createRuntimeLifecycleLineage,
  MicroSystemSupervisor,
  type MicroSystemDefinition,
} from "@heptalogos/runtime-kernel";
import { createRuntimeSubstrate } from "@heptalogos/runtime-substrate";
import { createSystemTimeService } from "@heptalogos/time-service";
import {
  MANAGEMENT_CONTRACT_VERSION,
  createManagementService,
  type ManagementService,
  type RuntimeIntrospectionSnapshot,
} from "@heptalogos/management";
import type { OsCredentialStore } from "@heptalogos/os-credential";
import type { FastifyInstance } from "fastify";
import { deriveProductGenerationId } from "./generation.js";
import { createProductionBootstrapKeyProvider } from "./credentials.js";
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

/** The running headless Product Host and its canonical Management surfaces. */
export interface ProductHost {
  readonly host: BootstrapManagedHostContext;
  readonly productGeneration: ProductGenerationId;
  readonly management: ManagementService;
  readonly supervisor: MicroSystemSupervisor;
  readonly http: FastifyInstance;
  readonly endpoint: ManagementEndpointDescriptorV1;
  readonly origin: string;
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
      "The current P1 Host did not prove all required Management readiness conditions",
  });
}

function bootstrapGeneration(): BootstrapRuntimeGenerationId {
  return asContentDigest(
    "BootstrapRuntimeGenerationId",
    digestCanonicalJson("heptalogos.bootstrap-runtime/v1", {
      package: "@heptalogos/bootstrap-runtime",
      contract: "bootstrap-runtime.v1",
    }),
  );
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
    serviceRequirements: [],
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

/** Starts one real headless Product Host from validated bootstrap inputs. */
export interface ProductHostStartOptions extends ProductHostInputs {
  /** Overrides the source root used only by tests and local composition. */
  readonly repositoryRoot?: string;
  /** Injects a test/local credential adapter; production uses the OS store. */
  readonly credentialStore?: OsCredentialStore;
}

/** Starts one real headless Product Host from validated bootstrap inputs. */
export async function startProductHost(
  input: ProductHostStartOptions,
): Promise<ProductHost> {
  const options = input;
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const productGeneration = await deriveProductGenerationId(repositoryRoot);
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
  let closePromise: Promise<void> | undefined;
  let httpState: "STARTING" | "LISTENING" | "CLOSING" | "CLOSED" = "STARTING";
  let endpointPublished = false;
  let requestClose: () => Promise<void> = async () => undefined;

  try {
    owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
    const state = await owned.ensureBootstrapStateInitialized({
      activeBootstrapRuntimeGeneration: bootstrapGeneration(),
      activeProductGeneration: productGeneration,
    });
    const existingInstallation = state.state.privatePostgres !== undefined;
    const keyProvider = await createProductionBootstrapKeyProvider({
      installationId: owned.installationId,
      instanceId: owned.instanceId,
      existingInstallation,
      store: options.credentialStore,
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
    const management = createManagementService({
      installationId: host.installationId,
      instanceId: host.instanceId,
      bootId: host.bootId,
      continuityEpochId: host.continuityEpochId,
      productGeneration,
      persistence,
      time,
      hostState: () => host?.state ?? "CLOSED",
      managementHttpState: () => httpState,
      endpointDescriptorCurrent: () => endpointPublished,
      runtimeKernelActive: () =>
        supervisor?.getActualState(MANAGEMENT_SYSTEM_ID) === "RUNNING",
      runtimeSnapshot: () =>
        supervisor === undefined
          ? emptyRuntimeSnapshot()
          : (supervisor.getReadOnlySnapshot() as unknown as RuntimeIntrospectionSnapshot),
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
      definitions: [managementDefinition(productGeneration, management)],
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
      desired: new Map([[MANAGEMENT_SYSTEM_ID, "RUNNING"]]),
      serviceBindings: new Map(),
      capabilityBindings: new Map(),
    });

    const runDirectory = owned!.paths.resolve("RUN").canonicalPath;
    const localClaim = await readFirstClaimMaterial(runDirectory);
    const claimMaterial = await management.ensureFirstAdministratorClaim(localClaim);
    if (claimMaterial === undefined) {
      await removeFirstClaimMaterial(runDirectory);
    }

    app = await createManagementHttpApp(management, {
      onAdministratorClaimed: () => removeFirstClaimMaterial(runDirectory),
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
    if (claimMaterial !== undefined) {
      await writeFirstClaimMaterial(runDirectory, claimMaterial);
    }

    const discoveryResponse = await fetch(
      origin + "/.well-known/heptalogos-management",
    );
    if (!discoveryResponse.ok) {
      throw startupProblem("The live Management discovery endpoint was not reachable");
    }
    assertDiscovery(await discoveryResponse.json(), host.installationId);
    if ((await management.getReadiness()).state !== "READY") {
      throw notReadyProblem();
    }

    const currentHost = host;
    const currentPersistence = persistence;
    const currentSupervisor = supervisor;
    const currentApp = app;
    const currentEndpoint = endpoint;
    requestClose = async () => {
      if (closePromise !== undefined) return closePromise;
      closePromise = (async () => {
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
      host: currentHost,
      productGeneration,
      management,
      supervisor: currentSupervisor,
      http: currentApp,
      endpoint: currentEndpoint,
      origin,
      close: requestClose,
    });
  } catch (error) {
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
): Promise<ProductHost> {
  return startProductHost(parseProductHostInputs(argv));
}
