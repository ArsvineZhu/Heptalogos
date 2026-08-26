import {
  canonicalizeJson,
  POSTGRES_INTEGER_MAX,
  parseContentDigest,
  parseContributionId,
  parseInstant,
  parseMicroSystemId,
  createWorkItemId,
  type CanonicalJsonValue,
  type Instant,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContext,
  ExecutionContextRuntime,
  ExecutionLineageService,
} from "@heptalogos/execution-lineage";
import type {
  PersistenceMutationTransactionContext,
  PersistenceService,
} from "@heptalogos/persistence";
import type {
  RuntimeWorkHandlerLease,
  WorkHandlerProvisionDescriptor,
} from "@heptalogos/runtime-kernel";
import { createSignalTopic, type SignalPublisher } from "@heptalogos/signal";
import type { TimeService } from "@heptalogos/time-service";
import { applyWorkAdmissionDecision, type WorkAdmissionPort } from "./admission.js";
import type {
  ResourceAdmissionClassId,
  WorkConfigurationBinding,
  WorkHandlerTarget,
  WorkItem,
  WorkQueueRuntimeOptions,
  WorkQueueProfileId,
} from "./contracts.js";
import {
  createWorkQueueRepository,
  type WorkItemInsertResult,
  type WorkQueueRepository,
} from "./repository.js";
import { workQueueProblem } from "./problems.js";

export const WORK_AVAILABLE_TOPIC = createSignalTopic("work.available");

export interface WorkCreationRequest {
  readonly target: WorkHandlerTarget;
  readonly payload: unknown;
  readonly queueProfileId: WorkQueueProfileId;
  readonly resourceAdmissionClass: ResourceAdmissionClassId;
  readonly partitionKey?: string;
  readonly priority: number;
  readonly notBefore?: Instant;
  readonly dedupKey?: string;
  readonly configurationBinding?: WorkConfigurationBinding;
}

export interface WorkCreationResult {
  readonly status: "CREATED" | "EXISTING";
  readonly item: WorkItem;
}

export interface WorkHandlerResolver {
  resolve(target: WorkHandlerTarget): RuntimeWorkHandlerLease | undefined;
}

export interface WorkQueueServiceOptions {
  readonly persistence: PersistenceService;
  readonly repository?: WorkQueueRepository;
  readonly handlerRegistry: WorkHandlerResolver;
  readonly execution: ExecutionContextRuntime;
  readonly lineage: ExecutionLineageService;
  readonly time: TimeService;
  readonly signalPublisher: SignalPublisher;
  readonly admission: WorkAdmissionPort;
  readonly runtimeOptions: WorkQueueRuntimeOptions;
  readonly onBackgroundError: (error: unknown) => void;
  readonly scheduleReconciliation?: () => void | Promise<void>;
}

export interface WorkQueueService {
  create(request: WorkCreationRequest): Promise<WorkCreationResult>;
}

export function validateWorkQueueRuntimeOptions(
  options: WorkQueueRuntimeOptions,
): void {
  for (const [name, value] of [
    ["maxInlinePayloadBytes", options.maxInlinePayloadBytes],
    ["maxOutcomeBytes", options.maxOutcomeBytes],
    ["reconciliationBatchSize", options.reconciliationBatchSize],
    ["antiEntropyIntervalMs", options.antiEntropyIntervalMs],
  ] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw workQueueProblem(
        "work_queue.invalid_options",
        `${name} must be a positive safe integer`,
      );
    }
  }
}

function assertBoundedOptional(value: unknown, name: string): void {
  if (value === undefined) return;
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    new TextEncoder().encode(value).byteLength > 256
  ) {
    throw workQueueProblem(
      "work.request.invalid",
      `${name} must be non-empty and at most 256 UTF-8 bytes`,
    );
  }
}

function assertPriority(priority: number): void {
  if (!Number.isSafeInteger(priority) || priority < 1 || priority > 2_147_483_647) {
    throw workQueueProblem(
      "work.request.invalid",
      "priority must be between 1 and 2147483647",
    );
  }
}

function assertTarget(target: WorkHandlerTarget): void {
  if (
    parseContentDigest("ProductGenerationId", target.productGenerationId) ===
      undefined ||
    parseContentDigest("PackageGenerationId", target.packageGenerationId) ===
      undefined ||
    parseMicroSystemId(target.microSystemId) === undefined ||
    parseContributionId(target.contributionId) === undefined ||
    !Number.isSafeInteger(target.payloadVersion) ||
    target.payloadVersion < 1 ||
    target.payloadVersion > POSTGRES_INTEGER_MAX
  ) {
    throw workQueueProblem(
      "work.request.invalid",
      "WorkHandler target contains an invalid generation, contribution, or payload version",
    );
  }
}

function canonicalPayload(
  lease: RuntimeWorkHandlerLease,
  target: WorkHandlerTarget,
  value: unknown,
  maximumBytes: number,
): CanonicalJsonValue {
  const validated = lease.validatePayload(target.payloadVersion, value);
  let encoded: string;
  try {
    encoded = canonicalizeJson(validated as CanonicalJsonValue);
  } catch (cause) {
    throw workQueueProblem(
      "work.payload.invalid",
      "WorkHandler payload is not canonical JSON",
      cause,
    );
  }
  if (new TextEncoder().encode(encoded).byteLength > maximumBytes) {
    throw workQueueProblem(
      "work.payload.too_large",
      "WorkHandler payload exceeds maxInlinePayloadBytes",
    );
  }
  return validated as CanonicalJsonValue;
}

function requestedNotBefore(value: Instant | undefined): Instant | undefined {
  if (value === undefined) return undefined;
  const parsed = parseInstant(value);
  if (parsed === undefined) {
    throw workQueueProblem(
      "work.request.invalid",
      "notBefore must be a canonical Instant",
    );
  }
  return parsed;
}

function configurationBinding(
  descriptor: WorkHandlerProvisionDescriptor,
  requested: WorkConfigurationBinding | undefined,
): WorkConfigurationBinding {
  if (descriptor.configurationBindingPolicy !== "LATEST_COMPATIBLE_AT_ATTEMPT") {
    throw workQueueProblem(
      "work.configuration.binding_unavailable",
      "No ConfigurationRevision resolver is composed for CONFIG_PINNED WorkHandlers",
    );
  }
  if (requested !== undefined) {
    if (
      requested.policy === "CONFIG_PINNED" ||
      requested.configRevisionRef !== undefined
    ) {
      throw workQueueProblem(
        "work.configuration.binding_unavailable",
        "CONFIG_PINNED WorkItem creation requires a composed ConfigurationRevision resolver",
      );
    }
    if (requested.policy !== descriptor.configurationBindingPolicy) {
      throw workQueueProblem(
        "work.request.invalid",
        "Requested configuration binding does not match the exact WorkHandler descriptor",
      );
    }
  }
  return { policy: "LATEST_COMPATIBLE_AT_ATTEMPT" };
}

function admissionReason(
  decision: Parameters<typeof applyWorkAdmissionDecision>[1],
): string | undefined {
  return decision.decision === "DELAY" || decision.decision === "THROTTLE"
    ? decision.reasonCode
    : undefined;
}

function reportBackgroundError(sink: (error: unknown) => void, problem: unknown): void {
  try {
    sink(problem);
  } catch {
    // Background reporting must not escape canonical creation.
  }
}

function scheduleFailure(sink: (error: unknown) => void): void {
  reportBackgroundError(
    sink,
    workQueueProblem(
      "work.schedule.failed",
      "Reconciliation scheduling failed after the WorkItem was inserted",
    ),
  );
}

export function createWorkQueueService(
  options: WorkQueueServiceOptions,
): WorkQueueService {
  validateWorkQueueRuntimeOptions(options.runtimeOptions);
  if (
    options.admission === undefined ||
    typeof options.admission.beforeCreate !== "function"
  ) {
    throw workQueueProblem(
      "work.admission.required",
      "WorkQueueService requires an explicit WorkAdmissionPort",
    );
  }
  if (typeof options.onBackgroundError !== "function") {
    throw workQueueProblem(
      "work.request.invalid",
      "WorkQueueService requires a background error sink",
    );
  }
  const repository =
    options.repository ?? createWorkQueueRepository(options.persistence);

  return {
    async create(request): Promise<WorkCreationResult> {
      const source = options.execution.current();
      if (source === undefined) {
        throw workQueueProblem(
          "work.context.required",
          "Durable WorkItem creation requires a current ExecutionContext",
        );
      }
      assertTarget(request.target);
      assertPriority(request.priority);
      assertBoundedOptional(request.partitionKey, "partitionKey");
      assertBoundedOptional(request.dedupKey, "dedupKey");
      const notBefore = requestedNotBefore(request.notBefore);
      const lease = options.handlerRegistry.resolve(request.target);
      if (lease === undefined) {
        throw workQueueProblem(
          "work.handler.unavailable",
          "No exact generation-bound WorkHandler is available for the requested target",
        );
      }
      const descriptor = lease.descriptor;
      if (request.queueProfileId !== descriptor.queueProfileId) {
        throw workQueueProblem(
          "work.queue.profile_mismatch",
          "WorkItem queueProfileId does not match the exact WorkHandler descriptor",
        );
      }
      if (request.resourceAdmissionClass !== descriptor.resourceAdmissionClass) {
        throw workQueueProblem(
          "work.resource-admission.mismatch",
          "WorkItem resourceAdmissionClass does not match the exact WorkHandler descriptor",
        );
      }
      const payload = canonicalPayload(
        lease,
        request.target,
        request.payload,
        options.runtimeOptions.maxInlinePayloadBytes,
      );
      const binding = configurationBinding(descriptor, request.configurationBinding);
      const lineageContextRef = options.execution.createLineageContextRef();
      const admissionRequest = {
        execution: source,
        target: request.target,
        payload,
        queueProfileId: request.queueProfileId,
        resourceAdmissionClass: request.resourceAdmissionClass,
        ...(request.partitionKey === undefined
          ? {}
          : { partitionKey: request.partitionKey }),
        priority: request.priority,
        ...(notBefore === undefined ? {} : { notBefore }),
        ...(request.dedupKey === undefined ? {} : { dedupKey: request.dedupKey }),
        configurationBinding: binding,
        createdContinuityEpochId: source.origin.continuityEpochId,
        lineageContextRef,
        handlerMicroSystemId: request.target.microSystemId,
        handlerContributionId: request.target.contributionId,
      };
      const decision = await options.admission.beforeCreate(admissionRequest);
      const effectiveNotBefore = applyWorkAdmissionDecision(notBefore, decision);
      const stateReasonCode = admissionReason(decision);
      const result = await options.execution.runActivity(
        {
          kind: "work.create",
          importance: "significant",
          retentionClass: "operational",
          sensitivity: "operational",
        },
        async (activity) => {
          const createdAt = options.time.now();
          const workLineageContextRef = options.execution.createLineageContextRef();
          const item: WorkItem = {
            schemaVersion: 1,
            workItemId: createWorkItemId(),
            handler: request.target,
            payload,
            queueProfileId: request.queueProfileId,
            resourceAdmissionClass: request.resourceAdmissionClass,
            ...(request.partitionKey === undefined
              ? {}
              : { partitionKey: request.partitionKey }),
            priority: request.priority,
            ...(effectiveNotBefore === undefined
              ? {}
              : { notBefore: effectiveNotBefore }),
            ...(request.dedupKey === undefined ? {} : { dedupKey: request.dedupKey }),
            createdContinuityEpochId: source.origin.continuityEpochId,
            lineageContextRef: workLineageContextRef,
            configurationBinding: binding,
            restoreReplayClass: descriptor.restoreReplayClass,
            dispatchRevision: 1,
            state: "PENDING",
            ...(stateReasonCode === undefined ? {} : { stateReasonCode }),
            createdAt,
            updatedAt: createdAt,
          };
          return repository.insertWorkItem(item, {
            onWithinTransaction: async (
              inserted: WorkItemInsertResult,
              transaction: PersistenceMutationTransactionContext,
            ) => {
              await options.lineage.retainCurrent(transaction, activity);
              if (inserted.status === "INSERTED") {
                await options.signalPublisher.publish(
                  transaction,
                  WORK_AVAILABLE_TOPIC,
                );
              }
            },
          });
        },
      );
      const creationResult: WorkCreationResult = {
        status: result.status === "INSERTED" ? "CREATED" : "EXISTING",
        item: result.item,
      };
      if (
        result.status === "INSERTED" &&
        options.scheduleReconciliation !== undefined
      ) {
        try {
          await options.scheduleReconciliation();
        } catch {
          scheduleFailure(options.onBackgroundError);
        }
      }
      return creationResult;
    },
  };
}
