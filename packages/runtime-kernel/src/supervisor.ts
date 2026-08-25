import {
  createMicroSystemInstanceId,
  type ProviderId,
} from "@heptalogos/foundation-contracts";
import type { RuntimeExecutionOrigin } from "@heptalogos/execution-lineage/runtime-kernel";
import type {
  RuntimeSubstrate,
  SubstrateActivationHandle,
} from "@heptalogos/runtime-substrate";
import { CapabilityRegistry } from "./capability-registry.js";
import { GenerationFence } from "./generation-fence.js";
import type {
  CapabilityProvisionDescriptor,
  CapabilityRequirement,
  DesiredRuntimeSnapshot,
  MicroSystemActivationContext,
  MicroSystemActualState,
  MicroSystemDefinition,
  MicroSystemId,
  ServiceProvisionDescriptor,
  ServiceRequirement,
} from "./contracts.js";
import { RuntimeKernelProblem } from "./problems.js";
import type { ReconcileAction, ReconcilePlan } from "./reconciler.js";
import { RuntimeReconciler } from "./reconciler.js";
import { RuntimeGraph } from "./runtime-graph.js";
import { ServiceRegistry } from "./service-registry.js";
import type { RuntimeLifecycleLineage } from "./lifecycle-lineage.js";

interface RunningSystem {
  readonly definition: MicroSystemDefinition;
  readonly instanceId: ReturnType<typeof createMicroSystemInstanceId>;
  readonly fence: GenerationFence;
  readonly handle: SubstrateActivationHandle;
  readonly serviceProviderIds: readonly ProviderId[];
  readonly capabilityProviderIds: readonly ProviderId[];
}

export interface MicroSystemSupervisorOptions {
  readonly substrate: RuntimeSubstrate;
  readonly settleTimeoutMs: number;
  readonly serviceRegistry?: ServiceRegistry;
  readonly capabilityRegistry?: CapabilityRegistry;
  readonly definitions?: readonly MicroSystemDefinition[];
  readonly lifecycleLineage?: RuntimeLifecycleLineage;
  readonly rootRuntimeOrigin?: RuntimeExecutionOrigin;
}

export class MicroSystemSupervisor {
  readonly services: ServiceRegistry;
  readonly capabilities: CapabilityRegistry;
  private readonly definitions = new Map<MicroSystemId, MicroSystemDefinition>();
  private readonly actual = new Map<MicroSystemId, MicroSystemActualState>();
  private readonly running = new Map<MicroSystemId, RunningSystem>();
  private readonly reconciler = new RuntimeReconciler();
  private readonly serviceBindings = new Map<
    import("@heptalogos/foundation-contracts").ServiceId,
    ProviderId
  >();
  private readonly capabilityBindings = new Map<
    import("@heptalogos/foundation-contracts").CapabilityId,
    ProviderId
  >();
  private operatingMode: import("./contracts.js").OperatingMode = "NORMAL";
  private reconcileChain: Promise<void> = Promise.resolve();

  constructor(private readonly options: MicroSystemSupervisorOptions) {
    this.services = options.serviceRegistry ?? new ServiceRegistry();
    this.capabilities = options.capabilityRegistry ?? new CapabilityRegistry();
    for (const definition of options.definitions ?? []) this.register(definition);
  }

  register(definition: MicroSystemDefinition): void {
    if (this.definitions.has(definition.microSystemId)) {
      throw new RuntimeKernelProblem(
        "runtime.supervisor.duplicate_definition",
        `MicroSystem '${definition.microSystemId}' is already registered`,
      );
    }
    this.definitions.set(definition.microSystemId, definition);
    this.actual.set(definition.microSystemId, "STOPPED");
  }

  getActualState(microSystemId: MicroSystemId): MicroSystemActualState {
    return this.actual.get(microSystemId) ?? "STOPPED";
  }

  getActualSnapshot(): ReadonlyMap<MicroSystemId, MicroSystemActualState> {
    return new Map(this.actual);
  }

  getDefinition(microSystemId: MicroSystemId): MicroSystemDefinition {
    const definition = this.definitions.get(microSystemId);
    if (definition === undefined) {
      throw new RuntimeKernelProblem(
        "runtime.supervisor.unknown_system",
        `Unknown MicroSystem '${microSystemId}'`,
      );
    }
    return definition;
  }

  async reconcile(desired: DesiredRuntimeSnapshot): Promise<ReconcilePlan> {
    let result!: ReconcilePlan;
    const run = this.reconcileChain.then(async () => {
      const execute = async (): Promise<void> => {
        this.operatingMode = desired.operatingMode;
        result = this.reconciler.plan({
          definitions: [...this.definitions.values()],
          desired,
          actual: this.actual,
          services: this.services,
          capabilities: this.capabilities,
          currentServiceBindings: this.serviceBindings,
          currentCapabilityBindings: this.capabilityBindings,
        });
        await this.executePlan(result);
        for (const [serviceId, providerId] of desired.serviceBindings) {
          this.serviceBindings.set(serviceId, providerId);
        }
        for (const [capabilityId, providerId] of desired.capabilityBindings) {
          this.capabilityBindings.set(capabilityId, providerId);
        }
      };

      if (
        this.options.lifecycleLineage !== undefined &&
        this.options.rootRuntimeOrigin !== undefined
      ) {
        await this.options.lifecycleLineage.runRetained(
          this.options.rootRuntimeOrigin,
          {
            kind: "runtime.reconcile",
            importance: "significant",
            retentionClass: "retained",
            sensitivity: "operational",
          },
          async () => execute(),
        );
      } else {
        await execute();
      }
    });
    this.reconcileChain = run.then(
      () => undefined,
      () => undefined,
    );
    await run;
    return result;
  }

  async executePlan(plan: ReconcilePlan): Promise<void> {
    for (const action of plan.actions) {
      try {
        await this.executeAction(action);
      } catch {
        if ("microSystemId" in action) {
          this.actual.set(action.microSystemId, "FAILED");
        }
      }
    }
    for (const [microSystemId, reason] of plan.blocked) {
      if (
        reason !== "runtime.operating_mode.ineligible" &&
        this.getActualState(microSystemId) !== "RUNNING"
      ) {
        this.actual.set(microSystemId, "BLOCKED");
      }
      void reason;
    }
  }

  async close(): Promise<void> {
    let ids: readonly MicroSystemId[];
    try {
      ids = new RuntimeGraph(
        [...this.running.values()].map((running) => running.definition),
        this.serviceBindings,
      )
        .plan()
        .shutdownOrder.map((definition) => definition.microSystemId);
    } catch {
      ids = [...this.running.keys()].sort().reverse();
    }
    for (const microSystemId of ids) {
      await this.stop(microSystemId).catch(() => undefined);
    }
    await this.options.substrate.close().catch(() => undefined);
  }

  private async executeAction(action: ReconcileAction): Promise<void> {
    switch (action.kind) {
      case "START":
        {
          const definition = this.getDefinition(action.microSystemId);
          const instanceId = createMicroSystemInstanceId();
          const start = () => this.start(action.microSystemId, instanceId);
          if (this.options.lifecycleLineage !== undefined) {
            await this.options.lifecycleLineage.runRetained(
              this.runtimeOrigin(definition, instanceId),
              {
                kind: "runtime.lifecycle.activate",
                importance: "significant",
                retentionClass: "retained",
                sensitivity: "operational",
                semantic: { featureId: definition.microSystemId },
              },
              async () => start(),
            );
          } else {
            await start();
          }
        }
        return;
      case "QUIESCE":
        if (this.running.has(action.microSystemId)) {
          this.actual.set(action.microSystemId, "QUIESCING");
        }
        return;
      case "STOP":
        {
          const running = this.running.get(action.microSystemId);
          const stop = () => this.stop(action.microSystemId);
          if (running !== undefined && this.options.lifecycleLineage !== undefined) {
            await this.options.lifecycleLineage.runRetained(
              this.runtimeOrigin(running.definition, running.instanceId),
              {
                kind: "runtime.lifecycle.deactivate",
                importance: "significant",
                retentionClass: "retained",
                sensitivity: "operational",
                semantic: { featureId: running.definition.microSystemId },
              },
              async () => stop(),
            );
          } else {
            await stop();
          }
        }
        return;
      case "REBIND_SERVICE":
        this.serviceBindings.set(action.serviceId, action.providerId);
        return;
      case "REBIND_CAPABILITY":
        this.capabilityBindings.set(action.capabilityId, action.providerId);
        return;
    }
  }

  private async start(
    microSystemId: MicroSystemId,
    instanceId = createMicroSystemInstanceId(),
  ): Promise<void> {
    if (this.running.has(microSystemId)) {
      this.actual.set(microSystemId, "RUNNING");
      return;
    }
    const definition = this.getDefinition(microSystemId);
    this.actual.set(microSystemId, "STARTING");
    const fence = new GenerationFence();
    const serviceProviderIds: ProviderId[] = [];
    const capabilityProviderIds: ProviderId[] = [];
    let backgroundFailure = false;
    let handle: SubstrateActivationHandle | undefined;

    try {
      handle = await this.options.substrate.activate({
        label: `microsystem:${definition.microSystemId}:${instanceId}`,
        activate: async (scope) => {
          const context = this.createActivationContext(
            definition,
            instanceId,
            fence,
            scope,
            serviceProviderIds,
            capabilityProviderIds,
          );
          await definition.activate(context);
          for (const provision of definition.serviceProvisions) {
            if (!serviceProviderIds.includes(provision.providerId)) {
              throw new RuntimeKernelProblem(
                "runtime.activation.missing_service_publication",
                `MicroSystem '${definition.microSystemId}' did not publish declared Service '${provision.serviceId}'`,
              );
            }
          }
          for (const provision of definition.capabilityProvisions) {
            if (!capabilityProviderIds.includes(provision.providerId)) {
              throw new RuntimeKernelProblem(
                "runtime.activation.missing_capability_publication",
                `MicroSystem '${definition.microSystemId}' did not publish declared Capability '${provision.capabilityId}'`,
              );
            }
          }
        },
        onFailure: (failure) => {
          if (failure.phase === "BACKGROUND") {
            backgroundFailure = true;
            this.actual.set(microSystemId, "FAILED");
            void this.handleBackgroundFailure(microSystemId);
          }
        },
      });
      const running: RunningSystem = {
        definition,
        instanceId,
        fence,
        handle,
        serviceProviderIds,
        capabilityProviderIds,
      };
      this.running.set(microSystemId, running);
      if (backgroundFailure) {
        await this.stop(microSystemId, "FAILED");
        return;
      }
      this.actual.set(microSystemId, "RUNNING");
    } catch (error) {
      await this.withdrawProviders(serviceProviderIds, capabilityProviderIds);
      if (handle !== undefined) {
        await handle.dispose().catch(() => undefined);
      }
      this.actual.set(microSystemId, "FAILED");
      if (this.options.lifecycleLineage !== undefined) {
        await this.options.lifecycleLineage
          .runRetained(
            this.runtimeOrigin(definition, instanceId),
            {
              kind: "runtime.lifecycle.failure",
              importance: "critical",
              retentionClass: "retained",
              sensitivity: "operational",
              semantic: { featureId: definition.microSystemId },
            },
            async () => undefined,
          )
          .catch(() => undefined);
      }
      throw error;
    }
  }

  private async stop(
    microSystemId: MicroSystemId,
    terminalState: "STOPPED" | "FAILED" = "STOPPED",
  ): Promise<void> {
    const running = this.running.get(microSystemId);
    if (running === undefined) {
      this.actual.set(microSystemId, terminalState);
      return;
    }
    this.actual.set(microSystemId, "QUIESCING");
    this.running.delete(microSystemId);
    let firstError: unknown;
    try {
      await this.withdrawProviders(
        running.serviceProviderIds,
        running.capabilityProviderIds,
      );
    } catch (error) {
      firstError ??= error;
    }
    try {
      await running.handle.dispose();
    } catch (error) {
      firstError ??= error;
    }
    try {
      await running.fence.retire(this.options.settleTimeoutMs);
    } catch (error) {
      firstError ??= error;
    }
    this.actual.set(microSystemId, terminalState);
    if (firstError !== undefined) throw firstError;
  }

  private async handleBackgroundFailure(microSystemId: MicroSystemId): Promise<void> {
    await this.stop(microSystemId, "FAILED").catch(() => undefined);
  }

  private async withdrawProviders(
    serviceProviderIds: readonly ProviderId[],
    capabilityProviderIds: readonly ProviderId[],
  ): Promise<void> {
    let firstError: unknown;
    for (const providerId of serviceProviderIds) {
      try {
        await this.services.retireProvider(providerId, this.options.settleTimeoutMs);
      } catch (error) {
        firstError ??= error;
      }
    }
    for (const providerId of capabilityProviderIds) {
      try {
        await this.capabilities.retireProvider(
          providerId,
          this.options.settleTimeoutMs,
        );
      } catch (error) {
        firstError ??= error;
      }
    }
    if (firstError !== undefined) throw firstError;
  }

  private runtimeOrigin(
    definition: MicroSystemDefinition,
    instanceId: ReturnType<typeof createMicroSystemInstanceId>,
  ): RuntimeExecutionOrigin {
    return {
      productGenerationId: definition.generation.productGenerationId,
      ...(definition.generation.packageGenerationId
        ? { packageGenerationId: definition.generation.packageGenerationId }
        : {}),
      microSystemId: definition.microSystemId,
      microSystemInstanceId: instanceId,
    };
  }

  private createActivationContext(
    definition: MicroSystemDefinition,
    instanceId: ReturnType<typeof createMicroSystemInstanceId>,
    fence: GenerationFence,
    scope: import("@heptalogos/runtime-substrate").ActivationResourceScope,
    serviceProviderIds: ProviderId[],
    capabilityProviderIds: ProviderId[],
  ): MicroSystemActivationContext {
    const runtimeActivity = this.options.lifecycleLineage?.runner(
      this.runtimeOrigin(definition, instanceId),
    );
    const declaredService = (descriptor: ServiceProvisionDescriptor): boolean =>
      definition.serviceProvisions.some(
        (candidate) =>
          candidate.serviceId === descriptor.serviceId &&
          candidate.providerId === descriptor.providerId &&
          candidate.contractVersion === descriptor.contractVersion,
      );
    const declaredCapability = (descriptor: CapabilityProvisionDescriptor): boolean =>
      definition.capabilityProvisions.some(
        (candidate) =>
          candidate.capabilityId === descriptor.capabilityId &&
          candidate.providerId === descriptor.providerId &&
          candidate.contractVersion === descriptor.contractVersion,
      );
    return {
      microSystemId: definition.microSystemId,
      microSystemInstanceId: instanceId,
      generation: definition.generation,
      operatingMode: this.operatingMode,
      scope,
      signal: scope.signal,
      runtimeActivity,
      requireService: (requirement, explicitProviderId) => {
        if (
          !definition.serviceRequirements.some(
            (candidate) =>
              candidate.serviceId === requirement.serviceId &&
              candidate.contract.version === requirement.contract.version,
          )
        ) {
          throw new RuntimeKernelProblem(
            "runtime.activation.undeclared_service_access",
            `MicroSystem '${definition.microSystemId}' requested an undeclared Service`,
          );
        }
        return this.services.resolve(requirement, explicitProviderId);
      },
      resolveCapability: (requirement, explicitProviderId) => {
        if (
          !definition.capabilityRequirements.some(
            (candidate) =>
              candidate.capabilityId === requirement.capabilityId &&
              candidate.contract.version === requirement.contract.version,
          )
        ) {
          throw new RuntimeKernelProblem(
            "runtime.activation.undeclared_capability_access",
            `MicroSystem '${definition.microSystemId}' requested an undeclared Capability`,
          );
        }
        return this.capabilities.resolve(requirement, explicitProviderId);
      },
      publishService: (descriptor, implementation) => {
        if (!declaredService(descriptor)) {
          throw new RuntimeKernelProblem(
            "runtime.activation.undeclared_service_publication",
            `MicroSystem '${definition.microSystemId}' published an undeclared Service`,
          );
        }
        if (serviceProviderIds.includes(descriptor.providerId)) {
          throw new RuntimeKernelProblem(
            "runtime.activation.duplicate_service_publication",
            `MicroSystem '${definition.microSystemId}' published a Service twice`,
          );
        }
        this.services.register(descriptor, implementation, fence, runtimeActivity);
        serviceProviderIds.push(descriptor.providerId);
      },
      publishCapability: (descriptor, implementation, priority = 0) => {
        if (!declaredCapability(descriptor)) {
          throw new RuntimeKernelProblem(
            "runtime.activation.undeclared_capability_publication",
            `MicroSystem '${definition.microSystemId}' published an undeclared Capability`,
          );
        }
        if (capabilityProviderIds.includes(descriptor.providerId)) {
          throw new RuntimeKernelProblem(
            "runtime.activation.duplicate_capability_publication",
            `MicroSystem '${definition.microSystemId}' published a Capability twice`,
          );
        }
        this.capabilities.register(
          descriptor,
          implementation,
          priority,
          fence,
          runtimeActivity,
        );
        capabilityProviderIds.push(descriptor.providerId);
      },
    };
  }
}
