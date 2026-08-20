import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Type } from "typebox";
import {
  canonicalizeJson,
  ProblemError,
  type CanonicalJsonValue,
  type Problem,
  type UuidV7Id,
} from "@heptalogos/foundation-contracts";
import type { BootstrapRuntimeGenerationId, ProductGenerationId } from "./model.js";

const require = createRequire(import.meta.url);
const writeFileAtomic = require("write-file-atomic") as (
  filename: string,
  data: string,
  options?: { readonly encoding?: BufferEncoding },
) => Promise<void>;

export type BootId = UuidV7Id<"BootId">;
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

const checkpointSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    bootId: Type.String({ minLength: 1 }),
    bootstrapActivityId: Type.String({ minLength: 1 }),
    attemptedBootstrapRuntimeGeneration: Type.String({ minLength: 1 }),
    attemptedProductGeneration: Type.String({ minLength: 1 }),
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
const journalSchema = Type.Array(checkpointSchema);
const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
});
const validateJournal = ajv.compile(journalSchema);

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

function journalText(entries: readonly BootstrapJournalCheckpointV1[]): string {
  return canonicalizeJson(entries as unknown as CanonicalJsonValue);
}

export class BootstrapJournal {
  private readonly journalDirectory: string;

  constructor(private readonly directory: string) {
    this.journalDirectory = join(directory, "bootstrap-journal");
  }

  async checkpoint(entry: BootstrapJournalCheckpointV1): Promise<void> {
    const existing = await this.readEntries(entry.bootId);
    const entries = [...existing, entry];
    this.assertValidEntries(entries);
    await mkdir(this.journalDirectory, { recursive: true });
    await writeFileAtomic(this.fileFor(entry.bootId), journalText(entries), {
      encoding: "utf8",
    });
  }

  async read(bootId: BootId): Promise<readonly BootstrapJournalCheckpointV1[]> {
    return this.readEntries(bootId);
  }

  private fileFor(bootId: BootId): string {
    return join(this.journalDirectory, `${bootId}.json`);
  }

  private async readEntries(
    bootId: BootId,
  ): Promise<readonly BootstrapJournalCheckpointV1[]> {
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
    } catch (error) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_json",
          "Bootstrap journal is not valid JSON",
          error instanceof Error ? error.message : "JSON parsing failed",
        ),
      );
    }

    if (!validateJournal(parsed)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal contains an invalid entry",
          ajv.errorsText(validateJournal.errors),
        ),
      );
    }

    const entries = parsed as BootstrapJournalCheckpointV1[];
    if (entries.some((entry) => entry.bootId !== bootId)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.boot_id_mismatch",
          "Bootstrap journal BootId does not match its file",
          "A per-BootId journal file contains a checkpoint for another boot",
        ),
      );
    }
    return entries;
  }

  private assertValidEntries(entries: readonly BootstrapJournalCheckpointV1[]): void {
    if (!validateJournal(entries)) {
      throw new ProblemError(
        journalProblem(
          "bootstrap.journal.invalid_entry",
          "Bootstrap journal checkpoint is invalid",
          ajv.errorsText(validateJournal.errors),
        ),
      );
    }
  }
}
