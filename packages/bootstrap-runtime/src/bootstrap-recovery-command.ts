import { type MaintenanceOperationId } from "@heptalogos/bootstrap-state";
import {
  parseUuidV7Id,
  ProblemError,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  inspectBootstrapRecovery,
  type BootstrapRecoveryInspection,
} from "./bootstrap-recovery.js";
import {
  recoverInterruptedHostMaintenance,
  type HostMaintenanceRecoveryOptions,
} from "./host-maintenance-recovery.js";
import type { PrivatePostgresMaintenanceResult } from "./managed-host.js";

export type BootstrapRecoveryCommand =
  | { readonly kind: "INSPECT" }
  | {
      readonly kind: "RECOVER";
      readonly expectedOperationId?: MaintenanceOperationId;
    };

export type BootstrapRecoveryCommandResult =
  | {
      readonly kind: "INSPECTED";
      readonly inspection: BootstrapRecoveryInspection;
    }
  | {
      readonly kind: "RECOVERED";
      readonly operationId: MaintenanceOperationId;
      readonly result: PrivatePostgresMaintenanceResult;
    };

export interface BootstrapRecoveryCommandContext {
  readonly recovery: Omit<
    HostMaintenanceRecoveryOptions,
    "anchorRoot" | "expectedOperationId"
  >;
}

function commandProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "validation",
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category,
    retryClass: "manual",
    title,
    detail,
  });
}

export function parseBootstrapRecoveryCommand(
  value: unknown,
): BootstrapRecoveryCommand {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    throw commandProblem(
      "bootstrap.recovery.command_invalid",
      "Bootstrap recovery command is invalid",
      "Only INSPECT and RECOVER are supported recovery commands",
    );
  }
  const kind = value.kind;
  if (kind === "INSPECT") return { kind: "INSPECT" };
  if (kind !== "RECOVER") {
    throw commandProblem(
      "bootstrap.recovery.command_invalid",
      "Bootstrap recovery command is invalid",
      "Only INSPECT and RECOVER are supported recovery commands",
    );
  }
  const expected =
    "expectedOperationId" in value ? value.expectedOperationId : undefined;
  if (expected === undefined) return { kind: "RECOVER" };
  const operationId = parseUuidV7Id("MaintenanceOperationId", expected);
  if (operationId === undefined) {
    throw commandProblem(
      "bootstrap.recovery.command_invalid",
      "Bootstrap recovery command operation identity is invalid",
      "expectedOperationId must be a valid UUIDv7 MaintenanceOperationId",
    );
  }
  return { kind: "RECOVER", expectedOperationId: operationId };
}

export async function executeBootstrapRecoveryCommand(
  anchorRoot: string,
  command: BootstrapRecoveryCommand,
  context?: BootstrapRecoveryCommandContext,
): Promise<BootstrapRecoveryCommandResult> {
  const normalized = parseBootstrapRecoveryCommand(command);
  const inspection = await inspectBootstrapRecovery(anchorRoot);
  if (normalized.kind === "INSPECT") {
    return { kind: "INSPECTED", inspection };
  }

  if (
    normalized.expectedOperationId !== undefined &&
    inspection.operationId !== normalized.expectedOperationId
  ) {
    throw commandProblem(
      "bootstrap.recovery.operation_mismatch",
      "Requested recovery operation does not match current operation",
      "The bounded recovery command refuses to recover a different MaintenanceJournal implicitly",
      "conflict",
    );
  }
  if (context === undefined) {
    throw commandProblem(
      "bootstrap.recovery.command_context_required",
      "Recovery execution context is required",
      "INSPECT is read-only; RECOVER requires the fixed local recovery execution context",
    );
  }
  if (inspection.operationId === undefined) {
    throw commandProblem(
      "bootstrap.recovery.operation_required",
      "A committed MaintenanceJournal operation is required",
      "RECOVER cannot select an operation when BootstrapState has no committed operation pointer",
      "conflict",
    );
  }

  const result = await recoverInterruptedHostMaintenance({
    ...context.recovery,
    anchorRoot,
    expectedOperationId: normalized.expectedOperationId,
  });
  return {
    kind: "RECOVERED",
    operationId: inspection.operationId,
    result,
  };
}
