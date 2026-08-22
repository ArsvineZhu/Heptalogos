import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  canonicalizeJson,
  parseUuidV7Id,
  ProblemError,
  type CanonicalJsonValue,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  canonicalMaintenanceJournalText,
  parseMaintenanceJournal,
  sealMaintenanceJournal,
} from "./maintenance-codec.js";
import type {
  MaintenanceJournalBodyV1,
  MaintenanceJournalEnvelopeV1,
  MaintenanceJournalLoadResult,
  MaintenanceJournalRecoveryHead,
  MaintenanceOperationId,
} from "./maintenance-model.js";
import { writeAtomicPublishedFile } from "./atomic-file.js";

const CURRENT_FILENAME = "maintenance-state.json";
const PREVIOUS_FILENAME = "maintenance-state.previous.json";

type Candidate =
  | { readonly kind: "MISSING" }
  | { readonly kind: "INVALID"; readonly problem: Problem }
  | { readonly kind: "VALID"; readonly value: MaintenanceJournalEnvelopeV1 };

function storeProblem(problemCode: string, title: string, detail: string): Problem {
  return {
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "manual",
    title,
    detail,
  };
}

function operationId(value: unknown): MaintenanceOperationId {
  const parsed = parseUuidV7Id("MaintenanceOperationId", value);
  if (parsed === undefined) {
    throw new ProblemError(
      storeProblem(
        "maintenance.journal.invalid_operation_id",
        "Maintenance operation identity is invalid",
        "MaintenanceJournal paths require a valid UUIDv7 MaintenanceOperationId",
      ),
    );
  }
  return parsed;
}

function pathFor(root: string, id: MaintenanceOperationId): string {
  return join(root, "maintenance-journal", id);
}

function stateText(value: MaintenanceJournalEnvelopeV1): string {
  return canonicalizeJson(value as unknown as CanonicalJsonValue);
}

export class MaintenanceJournalStore {
  private readonly operationTails = new Map<string, Promise<void>>();

  constructor(
    private readonly instanceRoot: string,
    private readonly assertAuthority?: () => void,
  ) {}

  async load(operation: MaintenanceOperationId): Promise<MaintenanceJournalLoadResult> {
    this.assertAuthority?.();
    const id = operationId(operation);
    return this.withOperationLock(id, () => {
      this.assertAuthority?.();
      return this.loadUnlocked(id);
    });
  }

  async loadRecoveryHead(
    operation: MaintenanceOperationId,
  ): Promise<MaintenanceJournalRecoveryHead> {
    this.assertAuthority?.();
    const id = operationId(operation);
    return this.withOperationLock(id, () => {
      this.assertAuthority?.();
      return this.loadRecoveryHeadUnlocked(id);
    });
  }

  async create(body: MaintenanceJournalBodyV1): Promise<MaintenanceJournalEnvelopeV1> {
    const id = operationId(body.operationId);
    return this.withOperationLock(id, async () => {
      this.assertAuthority?.();
      const existing = await this.loadUnlocked(id);
      if (existing.status !== "EMPTY") {
        throw new ProblemError(
          storeProblem(
            "maintenance.journal.already_exists",
            "Maintenance journal already exists",
            "A MaintenanceJournal operation cannot be created over an existing operation",
          ),
        );
      }
      if (body.revision !== 1) {
        throw new ProblemError(
          storeProblem(
            "maintenance.journal.revision_conflict",
            "Maintenance journal revision is not the initial revision",
            "The first MaintenanceJournal revision must be 1",
          ),
        );
      }
      return this.publishUnlocked(id, body, undefined);
    });
  }

  async advance(body: MaintenanceJournalBodyV1): Promise<MaintenanceJournalEnvelopeV1> {
    const id = operationId(body.operationId);
    return this.withOperationLock(id, async () => {
      this.assertAuthority?.();
      const current = await this.loadUnlocked(id);
      if (current.status === "EMPTY") {
        throw new ProblemError(
          storeProblem(
            "maintenance.journal.not_found",
            "Maintenance journal does not exist",
            "A MaintenanceJournal revision cannot advance before revision 1 is created",
          ),
        );
      }
      if (current.status === "CORRUPT") {
        throw new ProblemError(current.problem);
      }
      const expectedRevision = current.value.state.revision + 1;
      if (body.revision !== expectedRevision) {
        throw new ProblemError(
          storeProblem(
            "maintenance.journal.revision_conflict",
            "Maintenance journal revision conflict",
            `Expected revision ${expectedRevision}, got ${body.revision}`,
          ),
        );
      }
      return this.publishUnlocked(id, body, current.value);
    });
  }

  private async publishUnlocked(
    id: MaintenanceOperationId,
    body: MaintenanceJournalBodyV1,
    previous: MaintenanceJournalEnvelopeV1 | undefined,
  ): Promise<MaintenanceJournalEnvelopeV1> {
    const sealed = sealMaintenanceJournal(body);
    const parsed = parseMaintenanceJournal(stateText(sealed));
    if (!parsed.ok) throw new ProblemError(parsed.problem);

    const directory = pathFor(this.instanceRoot, id);
    this.assertAuthority?.();
    await mkdir(directory, { recursive: true });
    if (previous !== undefined) {
      this.assertAuthority?.();
      await writeAtomicPublishedFile(
        join(directory, PREVIOUS_FILENAME),
        canonicalMaintenanceJournalText(previous),
      );
    }
    this.assertAuthority?.();
    await writeAtomicPublishedFile(
      join(directory, CURRENT_FILENAME),
      canonicalMaintenanceJournalText(parsed.value),
    );

    this.assertAuthority?.();
    const committed = await this.readCandidate(join(directory, CURRENT_FILENAME));
    if (
      committed.kind !== "VALID" ||
      committed.value.state.revision !== body.revision ||
      committed.value.digest.hex !== parsed.value.digest.hex
    ) {
      throw new ProblemError(
        storeProblem(
          "maintenance.journal.commit_verification_failed",
          "Committed MaintenanceJournal could not be verified",
          "The newly written MaintenanceJournal revision did not reload with the expected digest",
        ),
      );
    }
    return committed.value;
  }

  private async loadUnlocked(
    id: MaintenanceOperationId,
  ): Promise<MaintenanceJournalLoadResult> {
    this.assertAuthority?.();
    const directory = pathFor(this.instanceRoot, id);
    const current = await this.readCandidate(join(directory, CURRENT_FILENAME));
    const previous = await this.readCandidate(join(directory, PREVIOUS_FILENAME));

    if (current.kind === "VALID") {
      if (current.value.state.operationId !== id) {
        return {
          status: "CORRUPT",
          problem: storeProblem(
            "maintenance.journal.operation_id_mismatch",
            "Maintenance journal operation identity does not match its path",
            "The current MaintenanceJournal body does not match the operation directory",
          ),
        };
      }
      return { status: "CURRENT", value: current.value };
    }

    if (previous.kind === "VALID") {
      if (previous.value.state.operationId !== id) {
        return {
          status: "CORRUPT",
          problem: storeProblem(
            "maintenance.journal.operation_id_mismatch",
            "Maintenance journal operation identity does not match its path",
            "The previous MaintenanceJournal body does not match the operation directory",
          ),
        };
      }
      return {
        status: "RECOVERED_PREVIOUS",
        value: previous.value,
        problem:
          current.kind === "MISSING"
            ? storeProblem(
                "maintenance.journal.current_missing",
                "Current MaintenanceJournal revision is missing",
                "The previous valid MaintenanceJournal revision was recovered",
              )
            : current.problem,
      };
    }

    if (current.kind === "MISSING" && previous.kind === "MISSING") {
      return { status: "EMPTY" };
    }

    return {
      status: "CORRUPT",
      problem: storeProblem(
        "maintenance.journal.no_valid_revision",
        "No valid MaintenanceJournal revision is available",
        "Current and previous MaintenanceJournal files are missing or invalid",
      ),
    };
  }

  private async loadRecoveryHeadUnlocked(
    id: MaintenanceOperationId,
  ): Promise<MaintenanceJournalRecoveryHead> {
    this.assertAuthority?.();
    const directory = pathFor(this.instanceRoot, id);
    const current = await this.readCandidate(join(directory, CURRENT_FILENAME));
    const previous = await this.readCandidate(join(directory, PREVIOUS_FILENAME));

    if (current.kind !== "VALID") {
      throw new ProblemError(
        current.kind === "INVALID"
          ? current.problem
          : storeProblem(
              "maintenance.journal.recovery_head_current_missing",
              "Current MaintenanceJournal revision is missing",
              "A validated recovery head requires a current MaintenanceJournal revision",
            ),
      );
    }
    if (current.value.state.operationId !== id) {
      throw new ProblemError(
        storeProblem(
          "maintenance.journal.operation_id_mismatch",
          "Maintenance journal operation identity does not match its path",
          "The current MaintenanceJournal body does not match the operation directory",
        ),
      );
    }

    const expectedPreviousRevision = current.value.state.revision - 1;
    const coherentPrevious =
      previous.kind === "VALID" &&
      previous.value.state.operationId === id &&
      previous.value.state.revision === expectedPreviousRevision
        ? previous.value
        : undefined;

    if (current.value.state.lastCompletedStage === "RECOVERY_REQUIRED") {
      if (previous.kind === "INVALID") {
        throw new ProblemError(previous.problem);
      }
      if (coherentPrevious === undefined) {
        throw new ProblemError(
          storeProblem(
            previous.kind === "MISSING"
              ? "maintenance.journal.recovery_head_previous_missing"
              : "maintenance.journal.recovery_head_previous_incoherent",
            "Previous MaintenanceJournal revision is not a validated recovery head",
            "RECOVERY_REQUIRED requires the immediately previous valid revision for progress recovery",
          ),
        );
      }
      return {
        current: current.value,
        previous: coherentPrevious,
        effectiveProgressStage: coherentPrevious.state.lastCompletedStage,
      };
    }

    return {
      current: current.value,
      ...(coherentPrevious === undefined ? {} : { previous: coherentPrevious }),
      effectiveProgressStage: current.value.state.lastCompletedStage,
    };
  }

  private async readCandidate(path: string): Promise<Candidate> {
    let text: string;
    try {
      text = await readFile(path, "utf8");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return { kind: "MISSING" };
      }
      throw error;
    }

    const parsed = parseMaintenanceJournal(text);
    return parsed.ok
      ? { kind: "VALID", value: parsed.value }
      : { kind: "INVALID", problem: parsed.problem };
  }

  private withOperationLock<T>(
    id: MaintenanceOperationId,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = this.operationTails.get(id) ?? Promise.resolve();
    const current = previous.then(operation, operation);
    const barrier = current.then(
      () => undefined,
      () => undefined,
    );
    this.operationTails.set(id, barrier);
    return current.finally(() => {
      if (this.operationTails.get(id) === barrier) {
        this.operationTails.delete(id);
      }
    });
  }
}
