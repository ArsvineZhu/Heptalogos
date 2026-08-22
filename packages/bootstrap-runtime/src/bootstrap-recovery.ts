import { stat } from "node:fs/promises";
import { join } from "node:path";
import {
  BootstrapJournal,
  BootstrapOwnerWitnessStore,
  BootstrapStateStore,
  MaintenanceJournalStore,
  type BootstrapActivityId,
  type BootstrapOwnerWitnessEnvelopeV1,
  type BootstrapStateLoadResult,
  type MaintenanceJournalLoadResult,
  type MaintenanceOperationId,
} from "@heptalogos/bootstrap-state";
import {
  createBootId,
  createUuidV7Id,
  parseUuidV7Id,
  type BootId,
  type InstallationId,
  type InstanceId,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  inspectBootstrapProcessIdentity,
  type BootstrapProcessIdentityStatus,
} from "./bootstrap-process-identity.js";
import { loadBootstrapLocator } from "./locator.js";
import { resolveBootstrapPathProfile } from "./roots.js";

const BOOTSTRAP_LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";
const BOOTSTRAP_STATE_DIRECTORY = "bootstrap-state";
const LOCK_STALE_THRESHOLD_MS = 30_000;
const MAINTENANCE_OPERATION_REF_PREFIX = "maintenance-journal/v1/";

export type BootstrapRecoveryDisposition =
  | "NO_RECOVERY_REQUIRED"
  | "ACTIVE_BOOTSTRAP_OWNER"
  | "ABANDONED_OWNER_ELIGIBLE"
  | "INCOMPLETE_MAINTENANCE"
  | "BLOCKED";

export interface BootstrapRecoveryInspection {
  readonly anchorRoot: string;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly instanceRoot: string;
  readonly recoveryBootId: BootId;
  readonly recoveryActivityId: BootstrapActivityId;
  readonly disposition: BootstrapRecoveryDisposition;
  readonly lockPresent: boolean;
  readonly lockAgeMs?: number;
  readonly owner?: BootstrapOwnerWitnessEnvelopeV1;
  readonly ownerProcessStatus?: BootstrapProcessIdentityStatus;
  readonly attempts: readonly BootstrapOwnerWitnessEnvelopeV1[];
  readonly attemptProcessStatuses: readonly BootstrapProcessIdentityStatus[];
  readonly bootstrapState: BootstrapStateLoadResult;
  readonly operationId?: MaintenanceOperationId;
  readonly maintenance?: MaintenanceJournalLoadResult;
  readonly problem?: Problem;
}

interface LockObservation {
  readonly present: boolean;
  readonly ageMs?: number;
  readonly problem?: Problem;
}

interface MaintenanceObservation {
  readonly operationId?: MaintenanceOperationId;
  readonly maintenance?: MaintenanceJournalLoadResult;
  readonly incomplete: boolean;
  readonly problem?: Problem;
}

function problem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "integrity",
): Problem {
  return {
    schemaVersion: 1,
    problemCode,
    category,
    retryClass: "manual",
    title,
    detail,
  };
}

function isCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function problemCodeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("problem" in error)) {
    return undefined;
  }
  const value = error.problem;
  if (typeof value !== "object" || value === null || !("problemCode" in value)) {
    return undefined;
  }
  return typeof value.problemCode === "string" ? value.problemCode : undefined;
}

function checkpoint(
  installationId: InstallationId,
  instanceId: InstanceId,
  bootId: BootId,
  activityId: BootstrapActivityId,
  outcome: "STARTED" | "SUCCEEDED" | "FAILED",
  problemCode?: string,
): Parameters<BootstrapJournal["checkpoint"]>[0] {
  return {
    schemaVersion: 2,
    bootId,
    bootstrapActivityId: activityId,
    installationId,
    instanceId,
    stage: "bootstrap.recovery.inspect",
    at: new Date().toISOString(),
    outcome,
    ...(problemCode === undefined ? {} : { problemCode }),
  };
}

async function observeLock(instanceRoot: string): Promise<LockObservation> {
  try {
    const entry = await stat(join(instanceRoot, BOOTSTRAP_LOCK_DIRECTORY));
    return {
      present: true,
      ageMs: Math.max(0, Date.now() - entry.mtimeMs),
    };
  } catch (error) {
    if (isCode(error, "ENOENT")) return { present: false };
    return {
      present: false,
      problem: problem(
        "bootstrap.recovery.lock_inspection_failed",
        "Bootstrap lock could not be inspected",
        "The bootstrap lock could not be stat-ed without changing it",
        "unavailable",
      ),
    };
  }
}

function operationIdFromReference(
  reference: string | undefined,
): MaintenanceOperationId | undefined {
  if (
    reference === undefined ||
    !reference.startsWith(MAINTENANCE_OPERATION_REF_PREFIX)
  ) {
    return undefined;
  }
  const value = reference.slice(MAINTENANCE_OPERATION_REF_PREFIX.length);
  return parseUuidV7Id("MaintenanceOperationId", value);
}

function maintenanceIsIncomplete(value: MaintenanceJournalLoadResult): boolean {
  if (value.status !== "CURRENT") return false;
  return (
    value.value.state.terminalOutcome === undefined ||
    value.value.state.terminalOutcome === "FAILED" ||
    value.value.state.terminalOutcome === "UNCERTAIN" ||
    value.value.state.lastCompletedStage === "RECOVERY_REQUIRED"
  );
}

async function observeMaintenance(
  instanceRoot: string,
  state: BootstrapStateLoadResult,
): Promise<MaintenanceObservation> {
  if (state.status === "CORRUPT") {
    return { incomplete: false, problem: state.problem };
  }
  if (state.status === "EMPTY") return { incomplete: false };

  const reference = state.value.state.lastCommittedOperationRef;
  if (reference === undefined) return { incomplete: false };

  const operationId = operationIdFromReference(reference);
  if (operationId === undefined) {
    return {
      incomplete: false,
      problem: problem(
        "bootstrap.recovery.invalid_operation_reference",
        "Bootstrap maintenance operation reference is invalid",
        "BootstrapState lastCommittedOperationRef is not a supported MaintenanceJournal V1 reference",
        "validation",
      ),
    };
  }

  let maintenance: MaintenanceJournalLoadResult;
  try {
    maintenance = await new MaintenanceJournalStore(instanceRoot).load(operationId);
  } catch (error) {
    return {
      operationId,
      incomplete: false,
      problem: problem(
        "bootstrap.recovery.maintenance_load_failed",
        "MaintenanceJournal could not be inspected",
        problemCodeOf(error) ??
          "The MaintenanceJournal could not be loaded without mutation",
        "unavailable",
      ),
    };
  }

  if (maintenance.status === "EMPTY") {
    return {
      operationId,
      maintenance,
      incomplete: false,
      problem: problem(
        "bootstrap.recovery.maintenance_missing",
        "Committed MaintenanceJournal is missing",
        "BootstrapState points to a MaintenanceJournal operation that has no readable revision",
      ),
    };
  }
  if (maintenance.status === "CORRUPT") {
    return {
      operationId,
      maintenance,
      incomplete: false,
      problem: maintenance.problem,
    };
  }
  if (maintenance.status === "RECOVERED_PREVIOUS") {
    return {
      operationId,
      maintenance,
      incomplete: false,
      problem: maintenance.problem,
    };
  }

  return {
    operationId,
    maintenance,
    incomplete: maintenanceIsIncomplete(maintenance),
  };
}

function classify(
  lock: LockObservation,
  ownerProcessStatus: BootstrapProcessIdentityStatus | undefined,
  attemptProcessStatuses: readonly BootstrapProcessIdentityStatus[],
  maintenance: MaintenanceObservation,
): BootstrapRecoveryDisposition {
  if (lock.problem !== undefined || maintenance.problem !== undefined) {
    return "BLOCKED";
  }

  const statuses = [
    ...(ownerProcessStatus === undefined ? [] : [ownerProcessStatus]),
    ...attemptProcessStatuses,
  ];
  if (statuses.includes("SAME_PROCESS")) return "ACTIVE_BOOTSTRAP_OWNER";
  if (statuses.includes("UNKNOWN")) return "BLOCKED";

  if (!lock.present) {
    if (statuses.length > 0) return "BLOCKED";
    return maintenance.incomplete ? "INCOMPLETE_MAINTENANCE" : "NO_RECOVERY_REQUIRED";
  }

  if ((lock.ageMs ?? 0) < LOCK_STALE_THRESHOLD_MS) return "BLOCKED";
  if (statuses.length === 0) return "BLOCKED";

  // An old lock with only PROCESS_DEAD/PID_REUSED evidence is the one case in
  // which the existing lock protocol may be asked to reclaim ownership. The
  // maintenance pointer is returned alongside this disposition so the later
  // executor can recover the bounded operation under the newly held lease.
  return "ABANDONED_OWNER_ELIGIBLE";
}

export async function inspectBootstrapRecovery(
  anchorRoot: string,
): Promise<BootstrapRecoveryInspection> {
  const locator = await loadBootstrapLocator(anchorRoot);
  const paths = await resolveBootstrapPathProfile(locator);
  const instanceRoot = paths.resolve("INSTANCE").canonicalPath;
  const installationId = locator.installationId;
  const instanceId = locator.instanceId;
  const recoveryBootId = createBootId();
  const recoveryActivityId = createUuidV7Id("ActivityId");
  const journal = new BootstrapJournal(instanceRoot);

  await journal.checkpoint(
    checkpoint(
      installationId,
      instanceId,
      recoveryBootId,
      recoveryActivityId,
      "STARTED",
    ),
  );

  try {
    const lock = await observeLock(instanceRoot);
    const witnessStore = new BootstrapOwnerWitnessStore(instanceRoot);
    let owner: BootstrapOwnerWitnessEnvelopeV1 | undefined;
    let attempts: readonly BootstrapOwnerWitnessEnvelopeV1[] = [];
    let witnessProblem: Problem | undefined;
    try {
      owner = await witnessStore.readOwner();
      attempts = await witnessStore.listAttempts();
    } catch (error) {
      witnessProblem = problem(
        "bootstrap.recovery.witness_inspection_failed",
        "Bootstrap owner witness could not be inspected",
        problemCodeOf(error) ??
          "Bootstrap owner or attempt witness evidence is corrupt or unavailable",
      );
    }

    const ownerProcessStatus =
      owner === undefined
        ? undefined
        : await inspectBootstrapProcessIdentity({
            pid: owner.witness.pid,
            startedAtMs: owner.witness.processStartedAtMs,
          });
    const attemptProcessStatuses = await Promise.all(
      attempts.map((attempt) =>
        inspectBootstrapProcessIdentity({
          pid: attempt.witness.pid,
          startedAtMs: attempt.witness.processStartedAtMs,
        }),
      ),
    );

    let bootstrapState: BootstrapStateLoadResult = { status: "EMPTY" };
    let stateProblem: Problem | undefined;
    try {
      bootstrapState = await new BootstrapStateStore(
        join(instanceRoot, BOOTSTRAP_STATE_DIRECTORY),
      ).load();
    } catch (error) {
      stateProblem = problem(
        "bootstrap.recovery.state_inspection_failed",
        "BootstrapState could not be inspected",
        problemCodeOf(error) ?? "BootstrapState could not be loaded read-only",
        "unavailable",
      );
    }

    const maintenance =
      stateProblem === undefined
        ? await observeMaintenance(instanceRoot, bootstrapState)
        : { incomplete: false, problem: stateProblem };
    const effectiveProblem = lock.problem ?? witnessProblem ?? maintenance.problem;
    const disposition = classify(
      effectiveProblem === undefined ? lock : { ...lock, problem: effectiveProblem },
      ownerProcessStatus,
      attemptProcessStatuses,
      maintenance,
    );

    await journal.checkpoint(
      checkpoint(
        installationId,
        instanceId,
        recoveryBootId,
        recoveryActivityId,
        "SUCCEEDED",
        disposition === "BLOCKED" ? effectiveProblem?.problemCode : undefined,
      ),
    );

    return {
      anchorRoot,
      installationId,
      instanceId,
      instanceRoot,
      recoveryBootId,
      recoveryActivityId,
      disposition,
      lockPresent: lock.present,
      ...(lock.ageMs === undefined ? {} : { lockAgeMs: lock.ageMs }),
      ...(owner === undefined ? {} : { owner, ownerProcessStatus }),
      attempts,
      attemptProcessStatuses,
      bootstrapState,
      ...(maintenance.operationId === undefined
        ? {}
        : { operationId: maintenance.operationId }),
      ...(maintenance.maintenance === undefined
        ? {}
        : { maintenance: maintenance.maintenance }),
      ...(effectiveProblem === undefined ? {} : { problem: effectiveProblem }),
    };
  } catch (error) {
    await journal
      .checkpoint(
        checkpoint(
          installationId,
          instanceId,
          recoveryBootId,
          recoveryActivityId,
          "FAILED",
          problemCodeOf(error),
        ),
      )
      .catch(() => undefined);
    throw error;
  }
}

export { LOCK_STALE_THRESHOLD_MS as BOOTSTRAP_RECOVERY_STALE_MS };
