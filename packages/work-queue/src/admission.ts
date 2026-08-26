import {
  parseInstant,
  type CanonicalJsonValue,
  type Instant,
  type MicroSystemId,
  type ContributionId,
} from "@heptalogos/foundation-contracts";
import type {
  ExecutionContext,
  LineageContextRefV1,
} from "@heptalogos/execution-lineage";
import type {
  ResourceAdmissionClassId,
  WorkAdmissionDecision,
  WorkConfigurationBinding,
  WorkHandlerTarget,
  WorkQueueProfileId,
} from "./contracts.js";
import { workQueueProblem } from "./problems.js";

export interface WorkAdmissionRequest {
  readonly execution: ExecutionContext;
  readonly target: WorkHandlerTarget;
  readonly payload: CanonicalJsonValue;
  readonly queueProfileId: WorkQueueProfileId;
  readonly resourceAdmissionClass: ResourceAdmissionClassId;
  readonly partitionKey?: string;
  readonly priority: number;
  readonly notBefore?: Instant;
  readonly dedupKey?: string;
  readonly configurationBinding: WorkConfigurationBinding;
  readonly createdContinuityEpochId: import("@heptalogos/foundation-contracts").ContinuityEpochId;
  readonly lineageContextRef: LineageContextRefV1;
  readonly handlerMicroSystemId: MicroSystemId;
  readonly handlerContributionId: ContributionId;
}

export interface WorkAdmissionPort {
  beforeCreate(
    input: WorkAdmissionRequest,
  ): WorkAdmissionDecision | Promise<WorkAdmissionDecision>;
}

function assertReasonCode(reasonCode: unknown): void {
  if (
    typeof reasonCode !== "string" ||
    reasonCode.trim().length === 0 ||
    new TextEncoder().encode(reasonCode).byteLength > 256
  ) {
    throw workQueueProblem(
      "work.admission.invalid_decision",
      "WorkAdmission decision reasonCode must be a bounded non-empty string",
    );
  }
}

function assertNotBefore(value: unknown, decision: string): Instant {
  const parsed = parseInstant(value);
  if (parsed === undefined) {
    throw workQueueProblem(
      "work.admission.invalid_decision",
      `${decision} requires a canonical notBefore Instant`,
    );
  }
  return parsed;
}

function laterInstant(left: Instant | undefined, right: Instant): Instant {
  if (left === undefined) return right;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

export function applyWorkAdmissionDecision(
  requestedNotBefore: Instant | undefined,
  decision: WorkAdmissionDecision,
): Instant | undefined {
  if (typeof decision !== "object" || decision === null) {
    throw workQueueProblem(
      "work.admission.invalid_decision",
      "WorkAdmission returned no decision object",
    );
  }
  switch (decision.decision) {
    case "ALLOW":
      return requestedNotBefore;
    case "DELAY":
      assertReasonCode(decision.reasonCode);
      return laterInstant(
        requestedNotBefore,
        assertNotBefore(decision.notBefore, "DELAY"),
      );
    case "THROTTLE":
      assertReasonCode(decision.reasonCode);
      if (decision.notBefore === undefined) {
        throw workQueueProblem(
          "work.admission.invalid_decision",
          "THROTTLE requires an explicit notBefore Instant during creation",
        );
      }
      return laterInstant(
        requestedNotBefore,
        assertNotBefore(decision.notBefore, "THROTTLE"),
      );
    case "REJECT_OPTIONAL":
      assertReasonCode(decision.reasonCode);
      throw workQueueProblem(
        "work.admission.rejected_optional",
        `WorkAdmission rejected optional work: ${decision.reasonCode}`,
      );
    case "REJECT_NEW_WORK":
      assertReasonCode(decision.reasonCode);
      throw workQueueProblem(
        "work.admission.rejected_new_work",
        `WorkAdmission rejected new work: ${decision.reasonCode}`,
      );
    default:
      throw workQueueProblem(
        "work.admission.invalid_decision",
        "WorkAdmission returned an unsupported decision",
      );
  }
}
