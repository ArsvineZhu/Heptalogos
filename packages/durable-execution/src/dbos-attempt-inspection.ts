/**
 * Reads DBOS workflow status for WorkQueue recovery diagnostics and returns
 * only the engine projection contract; canonical WorkItem state stays outside.
 * @module dbos-attempt-inspection
 */

import { createRequire } from "node:module";
import {
  parseDurableCodeVersion,
  parseWorkItemId,
  type DurableCodeVersion,
} from "@heptalogos/foundation-contracts";
import {
  createDispatchAttemptId,
  dispatchAttemptIdToWorkflowId,
  type DurableAttemptInspectionPort,
  type DurableAttemptInspectionRequest,
  type DurableAttemptProjection,
} from "@heptalogos/work-queue";
import { durableExecutionProblem } from "./problems.js";

/** Minimal DBOS status shape needed for engine projection classification. */
export interface DbosWorkflowStatus {
  readonly status: string;
  readonly applicationVersion?: string;
}

/** Status lookup seam kept behind the durable-execution boundary. */
export interface DbosWorkflowStatusDriver {
  /** Read one DBOS workflow status without exposing the vendor client type. */
  getWorkflowStatus(workflowID: string): Promise<DbosWorkflowStatus | null>;
}

interface DbosSdkInspectionSurface {
  getWorkflowStatus(workflowID: string): Promise<DbosWorkflowStatus | null>;
}

const dbosSdk = createRequire(import.meta.url)("@dbos-inc/dbos-sdk")
  .DBOS as DbosSdkInspectionSurface;

const defaultStatusDriver: DbosWorkflowStatusDriver = {
  getWorkflowStatus(workflowID) {
    return dbosSdk.getWorkflowStatus(workflowID);
  },
};

function invalidRequest(detail: string): never {
  throw durableExecutionProblem("durable.execution.inspection.invalid_request", detail);
}

function validateRequest(request: DurableAttemptInspectionRequest): void {
  if (parseWorkItemId(request.workItemId) === undefined) {
    invalidRequest("workItemId must be a valid WorkItemId");
  }
  if (!Number.isSafeInteger(request.dispatchRevision) || request.dispatchRevision < 1) {
    invalidRequest("dispatchRevision must be a positive safe integer");
  }
  if (
    createDispatchAttemptId(request.workItemId, request.dispatchRevision) !==
    request.dispatchAttemptId
  ) {
    invalidRequest("dispatchAttemptId does not match WorkItemId and dispatchRevision");
  }
}

function versionMismatch(
  applicationVersion: string | undefined,
): DurableAttemptProjection {
  return {
    kind: "VERSION_MISMATCH",
    applicationVersion: applicationVersion ?? "",
  };
}

function withVersion<
  TKind extends
    "ENGINE_SUCCESS" | "ENGINE_ERROR" | "ENGINE_CANCELLED" | "RECOVERY_EXHAUSTED",
>(
  kind: TKind,
  applicationVersion: string | undefined,
): Extract<DurableAttemptProjection, { readonly kind: TKind }> {
  return applicationVersion === undefined
    ? ({ kind } as Extract<DurableAttemptProjection, { readonly kind: TKind }>)
    : ({ kind, applicationVersion } as Extract<
        DurableAttemptProjection,
        { readonly kind: TKind }
      >);
}

function classifyStatus(
  status: DbosWorkflowStatus,
  expectedVersion: DurableCodeVersion,
): DurableAttemptProjection {
  const actualVersion = parseDurableCodeVersion(status.applicationVersion);
  if (actualVersion === undefined || actualVersion !== expectedVersion) {
    return versionMismatch(status.applicationVersion);
  }
  switch (status.status) {
    case "PENDING":
    case "ENQUEUED":
    case "DELAYED":
      return { kind: "ACTIVE", applicationVersion: actualVersion };
    case "SUCCESS":
      return withVersion("ENGINE_SUCCESS", status.applicationVersion);
    case "ERROR":
      return withVersion("ENGINE_ERROR", status.applicationVersion);
    case "CANCELLED":
      return withVersion("ENGINE_CANCELLED", status.applicationVersion);
    case "MAX_RECOVERY_ATTEMPTS_EXCEEDED":
      return withVersion("RECOVERY_EXHAUSTED", status.applicationVersion);
    default:
      return withVersion("ENGINE_ERROR", status.applicationVersion);
  }
}

/** Creates an engine-status inspection port for DBOS WorkItem projections. */
export function createDbosAttemptInspectionPort(options: {
  readonly durableCodeVersion: DurableCodeVersion;
}): DurableAttemptInspectionPort {
  return createDbosAttemptInspectionPortForTests(options, defaultStatusDriver);
}

/** Tests only: injects status lookup while retaining projection normalization. */
export function createDbosAttemptInspectionPortForTests(
  options: { readonly durableCodeVersion: DurableCodeVersion },
  driver: DbosWorkflowStatusDriver,
): DurableAttemptInspectionPort {
  if (parseDurableCodeVersion(options.durableCodeVersion) === undefined) {
    throw durableExecutionProblem(
      "durable.execution.inspection.invalid_request",
      "durableCodeVersion must be a lowercase SHA-256 digest",
    );
  }
  return Object.freeze({
    async inspect(
      request: DurableAttemptInspectionRequest,
    ): Promise<DurableAttemptProjection> {
      validateRequest(request);
      const workflowID = dispatchAttemptIdToWorkflowId(request.dispatchAttemptId);
      let status: DbosWorkflowStatus | null;
      try {
        status = await driver.getWorkflowStatus(workflowID);
      } catch (error) {
        throw durableExecutionProblem(
          "durable.execution.inspection.failed",
          "DBOS workflow status could not be read",
          error,
        );
      }
      return status === null
        ? { kind: "ABSENT" }
        : classifyStatus(status, options.durableCodeVersion);
    },
  });
}
