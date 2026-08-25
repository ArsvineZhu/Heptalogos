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
  ServiceId,
  ServiceProvisionDescriptor,
  ServiceRequirement,
} from "./contracts.js";
import { runtimeKernelProblem } from "./problems.js";
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

interface UnsettledRetirement {
  readonly fence: GenerationFence;
  readonly serviceIds: readonly ServiceId[];
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

function captureDesiredRuntimeSnapshot(
  input: DesiredRuntimeSnapshot,
): DesiredRuntimeSnapshot {
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) {
    throw runtimeKernelProblem(
      "runtime.supervisor.invalid_revision",
      "DesiredRuntimeSnapshot revision must be a non-negative safe integer",
    );
  }
  return Object.freeze({
    revision: input.revision,
    operatingMode: input.operatingMode,
    desired: new Map(input.desired),
    serviceBindings: new Map(input.serviceBindings),
    capabilityBindings: new Map(input.capabilityBindings),
  });
}

export class MicroSystemSupervisor {
  readonly services: ServiceRegistry;
  readonly capabilities: CapabilityRegistry;
  private readonly definitions = new Map<MicroSystemId, MicroSystemDefinition>();
  private readonly actual = new Map<MicroSystemId, MicroSystemActualState>();
  private readonly running = new Map<MicroSystemId, RunningSystem>();
  private readonly unsettledRetirements = new Map<MicroSystemId, UnsettledRetirement>();
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
      throw runtimeKernelProblem(
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
      throw runtimeKernelProblem(
        "runtime.supervisor.unknown_system",
        `Unknown MicroSystem '${microSystemId}'`,
      );
    }
    return definition;
  }

  async reconcile(input: DesiredRuntimeSnapshot): Promise<ReconcilePlan> {
    const desired = captureDesiredRuntimeSnapshot(input);
    let result!: ReconcilePlan;
    const run = this.reconcileChain.then(async () => {
      const previousOperatingMode = this.operatingMode;
      result = this.reconciler.plan({
        definitions: [...this.definitions.values()],
        desired,
        actual: this.actual,
        services: this.services,
        capabilities: this.capabilities,
        currentServiceBindings: this.serviceBindings,
        currentCapabilityBindings: this.capabilityBindings,
      });
      this.operatingMode = desired.operatingMode;
      const changesState =
        previousOperatingMode !== desired.operatingMode ||
        result.actions.length > 0 ||
        result.blocked.size > 0;
      const execute = async (): Promise<void> => {
        try {
          await this.executePlan(result);
        } finally {
          for (const serviceId of this.serviceBindings.keys()) {
            if (!result.serviceBindings.has(serviceId)) {
              this.serviceBindings.delete(serviceId);
            }
          }
          for (const [serviceId, providerId] of result.serviceBindings) {
            this.serviceBindings.set(serviceId, providerId);
          }
          for (const capabilityId of this.capabilityBindings.keys()) {
            if (!result.capabilityBindings.has(capabilityId)) {
              this.capabilityBindings.delete(capabilityId);
            }
          }
          for (const [capabilityId, providerId] of result.capabilityBindings) {
            this.capabilityBindings.set(capabilityId, providerId);
          }
        }
      };

      if (
        changesState &&
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
    let firstError: unknown;
    const blockedServiceIds = this.collectUnsettledServiceIds();
    for (const action of plan.actions) {
      if (action.kind === "START") {
        const blockedReason =
          this.generationRetirementBlockReason(action) ??
          this.hardPrerequisiteBlockReason(action, plan, blockedServiceIds);
        if (blockedReason !== undefined) {
          this.actual.set(action.microSystemId, "BLOCKED");
          continue;
        }
      }
      try {
        await this.executeAction(action);
      } catch (error) {
        firstError ??= error;
        if (action.kind === "START") {
          await this.stop(action.microSystemId, "FAILED").catch(() => undefined);
          this.actual.set(action.microSystemId, "FAILED");
        } else if (action.kind === "STOP") {
          if (
            this.getActualState(action.microSystemId) !== "STOPPED" &&
            this.running.has(action.microSystemId)
          ) {
            this.actual.set(action.microSystemId, "FAILED");
          }
          const unsettled = this.unsettledRetirements.get(action.microSystemId);
          for (const serviceId of unsettled?.serviceIds ?? []) {
            blockedServiceIds.add(serviceId);
          }
        } else if ("microSystemId" in action) {
          this.actual.set(action.microSystemId, "FAILED");
        }
      }
    }
    for (const [microSystemId, reason] of plan.blocked) {
      if (this.getActualState(microSystemId) !== "RUNNING") {
        this.actual.set(microSystemId, "BLOCKED");
      }
      void reason;
    }
    if (firstError !== undefined) throw firstError;
  }

  private hardPrerequisiteBlockReason(
    action: Extract<ReconcileAction, { kind: "START" }>,
    plan: ReconcilePlan,
    blockedServiceIds: ReadonlySet<ServiceId> = new Set(),
  ): string | undefined {
    const definition = this.getDefinition(action.microSystemId);
    for (const requirement of definition.serviceRequirements) {
      if (blockedServiceIds.has(requirement.serviceId)) {
        return "runtime.service.blocked_dependency";
      }
      const providerId = plan.serviceBindings.get(requirement.serviceId);
      if (providerId === undefined) {
        return "runtime.service.missing";
      }

      const provider = [...this.definitions.values()].find((candidate) =>
        candidate.serviceProvisions.some(
          (provision) =>
            provision.serviceId === requirement.serviceId &&
            provision.providerId === providerId &&
            provision.contractVersion === requirement.contract.version,
        ),
      );
      if (
        provider === undefined ||
        this.getActualState(provider.microSystemId) !== "RUNNING"
      ) {
        return "runtime.service.blocked_dependency";
      }
    }
    return undefined;
  }

  private generationRetirementBlockReason(
    action: Extract<ReconcileAction, { kind: "START" }>,
  ): string | undefined {
    const retirement = this.unsettledRetirements.get(action.microSystemId);
    if (retirement === undefined) return undefined;
    if (retirement.fence.state === "RETIRED") {
      this.unsettledRetirements.delete(action.microSystemId);
      return undefined;
    }
    return "runtime.generation.settlement_timeout";
  }

  private collectUnsettledServiceIds(): Set<ServiceId> {
    const serviceIds = new Set<ServiceId>();
    for (const [microSystemId, retirement] of this.unsettledRetirements) {
      if (retirement.fence.state === "RETIRED") {
        this.unsettledRetirements.delete(microSystemId);
        continue;
      }
      for (const serviceId of retirement.serviceIds) serviceIds.add(serviceId);
    }
    return serviceIds;
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
      // The Map preserves activation order; reversing it is the last-resort
      // acquisition-order projection, not a lexical ordering claim.
      ids = [...this.running.keys()].reverse();
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
        if (action.providerId === undefined) {
          this.capabilityBindings.delete(action.capabilityId);
        } else {
          this.capabilityBindings.set(action.capabilityId, action.providerId);
        }
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
    const publishedServiceBindings = new Set<string>();
    const publishedCapabilityBindings = new Set<string>();
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
            publishedServiceBindings,
            publishedCapabilityBindings,
          );
          await definition.activate(context);
          for (const provision of definition.serviceProvisions) {
            if (
              !publishedServiceBindings.has(
                `${provision.serviceId}\u0000${provision.providerId}`,
              )
            ) {
              throw runtimeKernelProblem(
                "runtime.activation.missing_service_publication",
                `MicroSystem '${definition.microSystemId}' did not publish declared Service '${provision.serviceId}'`,
              );
            }
          }
          for (const provision of definition.capabilityProvisions) {
            if (
              !publishedCapabilityBindings.has(
                `${provision.capabilityId}\u0000${provision.providerId}`,
              )
            ) {
              throw runtimeKernelProblem(
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
      const unsettled = this.unsettledRetirements.get(microSystemId);
      if (unsettled !== undefined && unsettled.fence.state !== "RETIRED") {
        this.actual.set(microSystemId, "FAILED");
        return;
      }
      this.unsettledRetirements.delete(microSystemId);
      this.actual.set(microSystemId, terminalState);
      return;
    }
    this.actual.set(microSystemId, "QUIESCING");
    this.running.delete(microSystemId);
    const serviceIds = [
      ...new Set(
        running.definition.serviceProvisions
          .filter((provision) =>
            running.serviceProviderIds.includes(provision.providerId),
          )
          .map((provision) => provision.serviceId),
      ),
    ];
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
    if (running.fence.state !== "RETIRED") {
      this.unsettledRetirements.set(microSystemId, {
        fence: running.fence,
        serviceIds,
      });
    }
    this.actual.set(microSystemId, firstError === undefined ? terminalState : "FAILED");
    if (firstError !== undefined) throw firstError;
  }

  private async handleBackgroundFailure(microSystemId: MicroSystemId): Promise<void> {
    const failed = this.definitions.get(microSystemId);
    if (failed !== undefined) {
      const failedProviderIds = new Set(
        failed.serviceProvisions.map((provision) => provision.providerId),
      );
      const affectedServices = new Set(
        failed.serviceProvisions
          .filter(
            (provision) =>
              this.serviceBindings.get(provision.serviceId) === provision.providerId,
          )
          .map((provision) => provision.serviceId),
      );
      const dependentIds = [...this.running.entries()]
        .filter(([runningId, running]) => {
          if (runningId === microSystemId) return false;
          return running.definition.serviceRequirements.some(
            (requirement) =>
              affectedServices.has(requirement.serviceId) &&
              failedProviderIds.has(this.serviceBindings.get(requirement.serviceId)!),
          );
        })
        .map(([runningId]) => runningId);
      for (const dependentId of dependentIds) {
        await this.stop(dependentId, "FAILED").catch(() => undefined);
      }
    }
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
    publishedServiceBindings: Set<string>,
    publishedCapabilityBindings: Set<string>,
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
          candidate.contractVersion === descriptor.contractVersion &&
          candidate.priority === descriptor.priority,
      );
    return {
      microSystemId: definition.microSystemId,
      microSystemInstanceId: instanceId,
      generation: definition.generation,
      operatingMode: this.operatingMode,
      scope,
      signal: scope.signal,
      runtimeActivity,
      requireService: (requirement) => {
        if (
          !definition.serviceRequirements.some(
            (candidate) =>
              candidate.serviceId === requirement.serviceId &&
              candidate.contract.version === requirement.contract.version,
          )
        ) {
          throw runtimeKernelProblem(
            "runtime.activation.undeclared_service_access",
            `MicroSystem '${definition.microSystemId}' requested an undeclared Service`,
          );
        }
        return this.services.resolve(
          requirement,
          this.serviceBindings.get(requirement.serviceId),
        );
      },
      resolveCapability: (requirement) => {
        if (
          !definition.capabilityRequirements.some(
            (candidate) =>
              candidate.capabilityId === requirement.capabilityId &&
              candidate.contract.version === requirement.contract.version,
          )
        ) {
          throw runtimeKernelProblem(
            "runtime.activation.undeclared_capability_access",
            `MicroSystem '${definition.microSystemId}' requested an undeclared Capability`,
          );
        }
        return this.capabilities.resolve(
          requirement,
          this.capabilityBindings.get(requirement.capabilityId),
        );
      },
      publishService: (descriptor, implementation) => {
        if (!declaredService(descriptor)) {
          throw runtimeKernelProblem(
            "runtime.activation.undeclared_service_publication",
            `MicroSystem '${definition.microSystemId}' published an undeclared Service`,
          );
        }
        const bindingKey = `${descriptor.serviceId}\u0000${descriptor.providerId}`;
        if (publishedServiceBindings.has(bindingKey)) {
          throw runtimeKernelProblem(
            "runtime.activation.duplicate_service_publication",
            `MicroSystem '${definition.microSystemId}' published a Service twice`,
          );
        }
        this.services.register(descriptor, implementation, fence, runtimeActivity);
        publishedServiceBindings.add(bindingKey);
        serviceProviderIds.push(descriptor.providerId);
      },
      publishCapability: (descriptor, implementation) => {
        if (!declaredCapability(descriptor)) {
          throw runtimeKernelProblem(
            "runtime.activation.undeclared_capability_publication",
            `MicroSystem '${definition.microSystemId}' published an undeclared Capability`,
          );
        }
        const bindingKey = `${descriptor.capabilityId}\u0000${descriptor.providerId}`;
        if (publishedCapabilityBindings.has(bindingKey)) {
          throw runtimeKernelProblem(
            "runtime.activation.duplicate_capability_publication",
            `MicroSystem '${definition.microSystemId}' published a Capability twice`,
          );
        }
        this.capabilities.register(descriptor, implementation, fence, runtimeActivity);
        publishedCapabilityBindings.add(bindingKey);
        capabilityProviderIds.push(descriptor.providerId);
      },
    };
  }
}
