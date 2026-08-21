import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  canonicalizeJson,
  type BootId,
  type InstallationId,
  type InstanceId,
  ProblemError,
  SHA256_HEX_PATTERN,
  type CanonicalJsonValue,
  type Problem,
  parseBootId,
  parseInstallationId,
  parseInstanceId,
  type UuidV7Id,
  UUID_V7_PATTERN,
} from "@heptalogos/foundation-contracts";
import type { BootstrapRuntimeGenerationId, ProductGenerationId } from "./model.js";
import { writeAtomicPublishedFile } from "./atomic-file.js";

export type BootstrapActivityId = UuidV7Id<"ActivityId">;
export type BootstrapStageOutcome = "STARTED" | "SUCCEEDED" | "FAILED";

export interface BootstrapJournalCheckpointV1 {
  readonly schemaVersion: 1;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly attemptedBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly attemptedProductGeneration: ProductGenerationId;
  readonly stage: string;
  readonly at: string;
  readonly outcome: BootstrapStageOutcome;
  readonly problemCode?: string;
}

export interface BootstrapJournalCheckpointV2 {
  readonly schemaVersion: 2;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly attemptedBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly attemptedProductGeneration?: ProductGenerationId;
  readonly stage: string;
  readonly at: string;
  readonly outcome: BootstrapStageOutcome;
  readonly problemCode?: string;
}

export type BootstrapJournalCheckpoint =
  BootstrapJournalCheckpointV1 | BootstrapJournalCheckpointV2;

const checkpointSchemaV1 = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    bootId: Type.String({ pattern: UUID_V7_PATTERN }),
    bootstrapActivityId: Type.String({ pattern: UUID_V7_PATTERN }),
    attemptedBootstrapRuntimeGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    attemptedProductGeneration: Type.String({ pattern: SHA256_HEX_PATTERN }),
    stage: Type.String({ minLength: 1 }),
    at: Type.String({ minLength: 1 }),
    outcome: Type.Union([
      Type.Literal("STARTED"),
      Type.Literal("SUCCEEDED"),
      Type.Literal("FAILED"),
    ]),
    problemCode: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);
const checkpointSchemaV2 = Type.Object(
  {
    schemaVersion: Type.Literal(2),
    bootId: Type.String({ pattern: UUID_V7_PATTERN }),
    bootstrapActivityId: Type.String({ pattern: UUID_V7_PATTERN }),
    installationId: Type.String({ pattern: UUID_V7_PATTERN }),
    instanceId: Type.String({ pattern: UUID_V7_PATTERN }),
    attemptedBootstrapRuntimeGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    attemptedProductGeneration: Type.Optional(
      Type.String({ pattern: SHA256_HEX_PATTERN }),
    ),
    stage: Type.String({ minLength: 1 }),
    at: Type.String({ minLength: 1 }),
    outcome: Type.Union([
      Type.Literal("STARTED"),
      Type.Literal("SUCCEEDED"),
      Type.Literal("FAILED"),
    ]),
    problemCode: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);
const checkpointSchema = Type.Union([checkpointSchemaV1, checkpointSchemaV2]);
const journalSchema = Type.Array(checkpointSchema);
const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
});
const validateJournal = ajv.compile(journalSchema);
const CANONICAL_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function isCanonicalInstant(value: string): boolean {
  if (!CANONICAL_INSTANT_PATTERN.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function journalProblem(problemCode: string, title: string, detail: string): Problem {
  return {
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "manual",
    title,
    detail,
  };
}

function requireBootId(value: unknown): BootId {
  const bootId = parseBootId(value);
  if (!bootId) {
    throw new ProblemError(
      journalProblem(
        "bootstrap.journal.invalid_boot_id",
        "Bootstrap journal BootId is invalid",
        "BootId must be a valid RFC 9562 UUIDv7",
      ),
    );
  }
  return bootId;
}

function journalText(entries: readonly BootstrapJournalCheckpoint[]): string {
  return canonicalizeJson(entries as unknown as CanonicalJsonValue);
}

export class BootstrapJournal {
  private readonly journalDirectory: string;
  private readonly checkpointTails = new Map<string, Promise<void>>();

  constructor(private readonly directory: string) {
    this.journalDirectory = join(directory, "bootstrap-journal");
  }

  async checkpoint(entry: BootstrapJournalCheckpointV2): Promise<void> {
    const bootId = requireBootId(entry.bootId);
    this.assertValidV2Identities(entry);

    await this.serializeCheckpoint(bootId, async () => {
      const existing = await this.readEntries(bootId);
      const entries = [...existing, entry];
      this.assertValidEntries(entries);
      await mkdir(this.journalDirectory, { recursive: true });
      await writeAtomicPublishedFile(this.fileFor(bootId), journalText(entries));
    });
  }

  async read(bootId: BootId): Promise<readonly BootstrapJournalCheckpoint[]> {
    return this.readEntries(requireBootId(bootId));
  }

  private fileFor(bootId: unknown): string {
    const validatedBootId = requireBootId(bootId);
    return join(this.journalDirectory, `${validatedBootId}.json`);
  }

  private async serializeCheckpoint(
    bootId: BootId,
    operation: () => Promise<void>,
  ): Promise<void> {
    const previous = this.checkpointTails.get(bootId) ?? Promise.resolve();

    const current = previous.then(operation, operation);
    const barrier = current.then(
      () => undefined,
      () => undefined,
    );

    this.checkpointTails.set(bootId, barrier);

    try {
      await current;
    } finally {
      if (this.checkpointTails.get(bootId) === barrier) {
        this.checkpointTails.delete(bootId);
      }
    }
  }

  private async readEntries(
    bootId: BootId,
  ): Promise<readonly BootstrapJournalCheckpoint[]> {
    let text: string;
    try {
      text = await readFile(this.fileFor(bootId), "utf8");
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_json",
          "Bootstrap journal is not valid JSON",
          "Bootstrap journal JSON could not be parsed",
        ),
      );
    }

    if (!validateJournal(parsed)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal contains an invalid entry",
          "Bootstrap journal checkpoint does not match the supported schema",
        ),
      );
    }

    const entries = parsed as BootstrapJournalCheckpoint[];
    if (entries.some((entry) => !isCanonicalInstant(entry.at))) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal contains an invalid entry",
          "Bootstrap journal checkpoint does not match the supported schema",
        ),
      );
    }
    if (entries.some((entry) => entry.bootId !== bootId)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.boot_id_mismatch",
          "Bootstrap journal BootId does not match its file",
          "A per-BootId journal file contains a checkpoint for another boot",
        ),
      );
    }
    for (const entry of entries) {
      if (entry.schemaVersion === 2) this.assertValidV2Identities(entry);
    }
    return entries;
  }

  private assertValidEntries(entries: readonly BootstrapJournalCheckpoint[]): void {
    if (
      !validateJournal(entries) ||
      entries.some((entry) => !isCanonicalInstant(entry.at))
    ) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal checkpoint is invalid",
          "Bootstrap journal checkpoint does not match the supported schema",
        ),
      );
    }
  }

  private assertValidV2Identities(entry: BootstrapJournalCheckpointV2): void {
    if (!parseInstallationId(entry.installationId)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal contains an invalid entry",
          "Bootstrap journal checkpoint does not match the supported schema",
        ),
      );
    }
    if (!parseInstanceId(entry.instanceId)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal contains an invalid entry",
          "Bootstrap journal checkpoint does not match the supported schema",
        ),
      );
    }
  }
}

export type { BootId } from "@heptalogos/foundation-contracts";
