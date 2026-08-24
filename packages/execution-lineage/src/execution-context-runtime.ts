import { AsyncLocalStorage } from "node:async_hooks";
import {
  createActivityId,
  parseBootId,
  parseContinuityEpochId,
  parseHostOwnershipToken,
  parseInstallationId,
  parseInstanceId,
  type ActivityId,
} from "@heptalogos/foundation-contracts";
import type { TimeService } from "@heptalogos/time-service";
import type {
  ActivityImportance,
  ActivityLink,
  ActivityRequest,
  ExecutionContext,
  ExecutionContextRuntime,
  HostExecutionOrigin,
  LineageContextRefV1,
} from "./contracts.js";
import { decodeLineageContextRef } from "./lineage-context-ref.js";
import {
  discontinuousContextRefProblem,
  invalidActivityProblem,
  invalidOriginProblem,
  requiredContextRefProblem,
} from "./problems.js";
import {
  activeTelemetryContext,
  projectTelemetryCorrelation,
  withTelemetryContext,
  type LineageTelemetryContext,
} from "./observability-adapter.js";

interface ExecutionStore {
  readonly execution: ExecutionContext;
  readonly otelContext: LineageTelemetryContext;
}

const importanceValues = new Set<ActivityImportance>([
  "diagnostic",
  "routine",
  "significant",
  "critical",
]);
const retentionValues = new Set(["ephemeral", "operational", "retained", "audit"]);
const sensitivityValues = new Set([
  "public",
  "operational",
  "sensitive",
  "pii",
  "secret",
]);

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function assertBoundedString(value: string, name: string, maximumBytes: number): void {
  if (value.trim().length === 0 || utf8Length(value) > maximumBytes) {
    throw invalidActivityProblem(
      `${name} must be non-empty and at most ${maximumBytes} UTF-8 bytes`,
    );
  }
}

function assertOptionalSemantic(value: string | undefined, name: string): void {
  if (value !== undefined) assertBoundedString(value, name, 256);
}

function assertActivityRequest(request: ActivityRequest): void {
  assertBoundedString(request.kind, "kind", 128);
  if (!importanceValues.has(request.importance)) {
    throw invalidActivityProblem("importance is not a supported ActivityImportance");
  }
  if (!retentionValues.has(request.retentionClass)) {
    throw invalidActivityProblem("retentionClass is not a supported RetentionClass");
  }
  if (!sensitivityValues.has(request.sensitivity)) {
    throw invalidActivityProblem("sensitivity is not a supported Sensitivity");
  }
  const semantic = request.semantic;
  if (semantic) {
    assertOptionalSemantic(semantic.operationId, "operationId");
    assertOptionalSemantic(semantic.featureId, "featureId");
    assertOptionalSemantic(semantic.serviceId, "serviceId");
    assertOptionalSemantic(semantic.capabilityId, "capabilityId");
    assertOptionalSemantic(semantic.providerId, "providerId");
    assertOptionalSemantic(semantic.contractVersion, "contractVersion");
  }
  for (const link of request.links ?? []) {
    if (
      !["linked-to", "supersedes", "resumes", "fan-out", "fan-in"].includes(link.kind)
    ) {
      throw invalidActivityProblem("links contain an unsupported link kind");
    }
  }
}

function freezeOrigin(origin: HostExecutionOrigin): HostExecutionOrigin {
  if (
    !parseInstallationId(origin.installationId) ||
    !parseInstanceId(origin.instanceId) ||
    !parseBootId(origin.bootId) ||
    !parseContinuityEpochId(origin.continuityEpochId) ||
    !parseHostOwnershipToken(origin.hostOwnershipToken)
  ) {
    throw invalidOriginProblem();
  }
  return Object.freeze({ ...origin });
}

function freezeLinks(links: readonly ActivityLink[]): readonly ActivityLink[] {
  return Object.freeze(links.map((link) => Object.freeze({ ...link })));
}

function createExecutionContext(
  request: ActivityRequest,
  origin: HostExecutionOrigin,
  time: TimeService,
  parentActivityId: ActivityId | undefined,
  causationActivityId: ActivityId | undefined,
  otel: LineageTelemetryContext,
): ExecutionContext {
  assertActivityRequest(request);
  const semantic = Object.freeze({ ...(request.semantic ?? {}) });
  const telemetry = projectTelemetryCorrelation(otel);
  const context: ExecutionContext = {
    activityId: createActivityId(),
    kind: request.kind,
    startedAt: time.now(),
    ...(parentActivityId ? { parentActivityId } : {}),
    ...(causationActivityId ? { causationActivityId } : {}),
    links: freezeLinks(request.links ?? []),
    origin,
    semantic,
    importance: request.importance,
    retentionClass: request.retentionClass,
    sensitivity: request.sensitivity,
    ...(telemetry ? { telemetry } : {}),
  };
  return Object.freeze(context);
}

export function createExecutionContextRuntime(
  origin: HostExecutionOrigin,
  time: TimeService,
): ExecutionContextRuntime {
  const trustedOrigin = freezeOrigin(origin);
  const storage = new AsyncLocalStorage<ExecutionStore | undefined>();

  const runScope = async <T>(
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
    parentActivityId: ActivityId | undefined,
    causationActivityId: ActivityId | undefined,
    parentOtel: LineageTelemetryContext,
  ): Promise<T> => {
    const execution = createExecutionContext(
      request,
      trustedOrigin,
      time,
      parentActivityId,
      causationActivityId,
      parentOtel,
    );
    const store: ExecutionStore = { execution, otelContext: parentOtel };
    return withTelemetryContext(parentOtel, () =>
      storage.run(store, () => operation(execution)),
    );
  };

  return {
    current: () => storage.getStore()?.execution,
    async runActivity<T>(
      request: ActivityRequest,
      operation: (context: ExecutionContext) => Promise<T>,
    ): Promise<T> {
      const parent = storage.getStore();
      const parentOtel = parent?.otelContext ?? activeTelemetryContext();
      return runScope(
        request,
        operation,
        parent?.execution.activityId,
        request.causationActivityId,
        parentOtel,
      );
    },
    capture<TArgs extends readonly unknown[], TResult>(
      callback: (...args: TArgs) => TResult,
    ): (...args: TArgs) => TResult {
      const captured = storage.getStore();
      const capturedOtel = captured?.otelContext ?? activeTelemetryContext();
      return (...args: TArgs) =>
        withTelemetryContext(capturedOtel, () =>
          storage.run(captured, () => callback(...args)),
        );
    },
    createLineageContextRef() {
      const current = storage.getStore()?.execution;
      if (!current) throw requiredContextRefProblem();
      return Object.freeze({
        schemaVersion: 1 as const,
        sourceActivityId: current.activityId,
        sourceInstanceId: current.origin.instanceId,
        sourceContinuityEpochId: current.origin.continuityEpochId,
        ...(current.telemetry ? { telemetry: current.telemetry } : {}),
      });
    },
    async runFromLineageContextRef<T>(
      ref: LineageContextRefV1,
      request: Omit<ActivityRequest, "causationActivityId">,
      operation: (context: ExecutionContext) => Promise<T>,
    ): Promise<T> {
      const decoded = decodeLineageContextRef(ref);
      if (
        decoded.sourceInstanceId !== trustedOrigin.instanceId ||
        decoded.sourceContinuityEpochId !== trustedOrigin.continuityEpochId
      ) {
        throw discontinuousContextRefProblem();
      }
      const parent = storage.getStore();
      const parentOtel = parent?.otelContext ?? activeTelemetryContext();
      return runScope(
        request,
        operation,
        undefined,
        decoded.sourceActivityId,
        parentOtel,
      );
    },
  };
}
