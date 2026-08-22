import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";
import {
  canonicalBootstrapOwnerWitnessText,
  parseBootstrapOwnerWitness,
  sealBootstrapOwnerWitness,
} from "./bootstrap-owner-witness-codec.js";
import type {
  BootstrapLockGenerationId,
  BootstrapOwnerWitnessBodyV1,
  BootstrapOwnerWitnessEnvelopeV1,
} from "./bootstrap-owner-witness-model.js";
import { writeAtomicPublishedFile } from "./atomic-file.js";

const OWNER_FILENAME = ".heptalogos-bootstrap-owner.json";
const ATTEMPT_DIRECTORY = ".heptalogos-bootstrap-attempts";

function storeProblem(
  problemCode: string,
  title: string,
  detail: string,
): ProblemError {
  const problem: Problem = {
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "manual",
    title,
    detail,
  };
  return new ProblemError(problem);
}

function requirePhase(
  witness: BootstrapOwnerWitnessBodyV1,
  phase: BootstrapOwnerWitnessBodyV1["phase"],
): void {
  if (witness.phase !== phase) {
    throw storeProblem(
      "bootstrap.owner_witness.phase_mismatch",
      "Bootstrap owner witness phase is invalid",
      `Expected a ${phase} witness`,
    );
  }
}

function requireValidEnvelope(
  text: string,
  path: string,
): BootstrapOwnerWitnessEnvelopeV1 {
  const parsed = parseBootstrapOwnerWitness(text);
  if (!parsed.ok) {
    throw new ProblemError({
      ...parsed.problem,
      detail: `${parsed.problem.detail ?? parsed.problem.title}: ${path}`,
    });
  }
  return parsed.value;
}

export class BootstrapOwnerWitnessStore {
  private readonly ownerPath: string;
  private readonly attemptsPath: string;

  constructor(private readonly instanceRoot: string) {
    this.ownerPath = join(instanceRoot, OWNER_FILENAME);
    this.attemptsPath = join(instanceRoot, ATTEMPT_DIRECTORY);
  }

  async readOwner(): Promise<BootstrapOwnerWitnessEnvelopeV1 | undefined> {
    return this.readOptional(this.ownerPath);
  }

  async publishOwner(
    witness: BootstrapOwnerWitnessBodyV1,
  ): Promise<BootstrapOwnerWitnessEnvelopeV1> {
    requirePhase(witness, "OWNER");
    const sealed = sealBootstrapOwnerWitness(witness);
    const validated = requireValidEnvelope(JSON.stringify(sealed), this.ownerPath);
    await writeAtomicPublishedFile(
      this.ownerPath,
      canonicalBootstrapOwnerWitnessText(validated),
    );
    const reloaded = await this.readOwner();
    if (
      reloaded === undefined ||
      reloaded.witness.lockGenerationId !== witness.lockGenerationId ||
      reloaded.digest.hex !== validated.digest.hex
    ) {
      throw storeProblem(
        "bootstrap.owner_witness.publication_unverified",
        "Bootstrap owner witness publication is unverified",
        "The owner witness did not reload with the exact published generation and digest",
      );
    }
    return reloaded;
  }

  async createAttempt(
    witness: BootstrapOwnerWitnessBodyV1,
  ): Promise<BootstrapOwnerWitnessEnvelopeV1> {
    requirePhase(witness, "ATTEMPT");
    await mkdir(this.attemptsPath, { recursive: true });
    const path = this.attemptPath(witness.lockGenerationId);
    const sealed = sealBootstrapOwnerWitness(witness);
    const validated = requireValidEnvelope(JSON.stringify(sealed), path);
    await writeAtomicPublishedFile(path, canonicalBootstrapOwnerWitnessText(validated));
    return requireValidEnvelope(await readFile(path, "utf8"), path);
  }

  async listAttempts(): Promise<readonly BootstrapOwnerWitnessEnvelopeV1[]> {
    let entries;
    try {
      entries = await readdir(this.attemptsPath, { withFileTypes: true });
    } catch (error) {
      if (isCode(error, "ENOENT")) return [];
      throw error;
    }

    const witnesses = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const path = this.attemptPathFromName(entry.name);
          return requireValidEnvelope(await readFile(path, "utf8"), path);
        }),
    );
    return witnesses;
  }

  async removeAttempt(lockGenerationId: BootstrapLockGenerationId): Promise<void> {
    await rm(this.attemptPath(lockGenerationId), { force: true });
  }

  async removeOwnerIfGeneration(
    lockGenerationId: BootstrapLockGenerationId,
  ): Promise<boolean> {
    const current = await this.readOwner();
    if (
      current === undefined ||
      current.witness.lockGenerationId !== lockGenerationId
    ) {
      return false;
    }
    await rm(this.ownerPath, { force: true });
    return true;
  }

  private async readOptional(
    path: string,
  ): Promise<BootstrapOwnerWitnessEnvelopeV1 | undefined> {
    let text: string;
    try {
      text = await readFile(path, "utf8");
    } catch (error) {
      if (isCode(error, "ENOENT")) return undefined;
      throw error;
    }
    return requireValidEnvelope(text, path);
  }

  private attemptPath(lockGenerationId: BootstrapLockGenerationId): string {
    return join(this.attemptsPath, `${lockGenerationId}.json`);
  }

  private attemptPathFromName(name: string): string {
    return join(this.attemptsPath, name);
  }
}

function isCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
