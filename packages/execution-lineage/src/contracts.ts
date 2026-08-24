import type {
  ActivityId,
  BootId,
  ContinuityEpochId,
  HostOwnershipToken,
  InstallationId,
  Instant,
  InstanceId,
  RetentionClass,
  Sensitivity,
} from "@heptalogos/foundation-contracts";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";

export interface HostExecutionOrigin {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly hostOwnershipToken: HostOwnershipToken;
}

export type ActivityImportance = "diagnostic" | "routine" | "significant" | "critical";

export interface ActivityLink {
  readonly kind: "linked-to" | "supersedes" | "resumes" | "fan-out" | "fan-in";
  readonly targetActivityId: ActivityId;
}

export interface ActivityTelemetryCorrelation {
  readonly traceId: string;
  readonly spanId: string;
  readonly traceFlags: number;
}

export interface ExecutionContext {
  readonly activityId: ActivityId;
  readonly kind: string;
  readonly startedAt: Instant;
  readonly parentActivityId?: ActivityId;
  readonly causationActivityId?: ActivityId;
  readonly links: readonly ActivityLink[];
  readonly origin: HostExecutionOrigin;
  readonly semantic: Readonly<{
    operationId?: string;
    featureId?: string;
    serviceId?: string;
    capabilityId?: string;
    providerId?: string;
    contractVersion?: string;
  }>;
  readonly importance: ActivityImportance;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
  readonly telemetry?: ActivityTelemetryCorrelation;
}

export interface ActivityRequest {
  readonly kind: string;
  readonly causationActivityId?: ActivityId;
  readonly links?: readonly ActivityLink[];
  readonly semantic?: ExecutionContext["semantic"];
  readonly importance: ActivityImportance;
  readonly retentionClass: RetentionClass;
  readonly sensitivity: Sensitivity;
}

export interface LineageContextRefV1 {
  readonly schemaVersion: 1;
  readonly sourceActivityId: ActivityId;
  readonly sourceInstanceId: InstanceId;
  readonly sourceContinuityEpochId: ContinuityEpochId;
  readonly telemetry?: ActivityTelemetryCorrelation;
}

export type LineageContextRef = LineageContextRefV1;

export interface BootstrapRetainedActivityDraft {
  readonly activityId: ActivityId;
  readonly startedAt: Instant;
  readonly endedAt: Instant;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly outcome: "SUCCEEDED" | "FAILED";
  readonly outcomeRef?: string;
}

export interface ExecutionLineageService {
  retainCurrent(
    transaction: PersistenceMutationTransactionContext,
    context: ExecutionContext,
  ): Promise<void>;
  retainBootstrapReference(
    transaction: PersistenceMutationTransactionContext,
    draft: BootstrapRetainedActivityDraft,
  ): Promise<void>;
}

export interface ExecutionContextRuntime {
  current(): ExecutionContext | undefined;
  runActivity<T>(
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
  capture<TArgs extends readonly unknown[], TResult>(
    callback: (...args: TArgs) => TResult,
  ): (...args: TArgs) => TResult;
  createLineageContextRef(): LineageContextRefV1;
  runFromLineageContextRef<T>(
    ref: LineageContextRefV1,
    request: Omit<ActivityRequest, "causationActivityId">,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
}
