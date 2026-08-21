import { lstat, realpath, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { isAbsolute, join } from "node:path";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

const PASSWORD_FILE_PREFIX = "heptalogos-private-pg-";
// IMPLEMENTATION_CONSTANT: Node's portable restrictive file-mode request.
const RESTRICTIVE_PASSWORD_FILE_MODE = 0o600;

function credentialProblem(
  problemCode: string,
  title: string,
  detail: string,
  category: Problem["category"] = "unavailable",
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

async function resolveValidatedTempRoot(tempRoot: string): Promise<string> {
  if (!isAbsolute(tempRoot)) {
    throw credentialProblem(
      "private-postgres.credential_file.invalid_temp_root",
      "Private PostgreSQL temp root is not absolute",
      "The password file temp root must be an absolute validated directory",
      "validation",
    );
  }

  try {
    const entry = await lstat(tempRoot);
    if (!entry.isDirectory()) {
      throw credentialProblem(
        "private-postgres.credential_file.invalid_temp_root",
        "Private PostgreSQL temp root is not a directory",
        "The password file temp root must be a validated directory",
        "validation",
      );
    }
    return await realpath(tempRoot);
  } catch (error) {
    if (error instanceof ProblemError) throw error;
    throw credentialProblem(
      "private-postgres.credential_file.invalid_temp_root",
      "Private PostgreSQL temp root could not be validated",
      "The password file temp root could not be validated",
    );
  }
}

function assertValidBootstrapPassword(passwordUtf8: Uint8Array): void {
  if (
    passwordUtf8.byteLength === 0 ||
    Array.from(passwordUtf8).some(
      (byte) => byte === 0x00 || byte === 0x0a || byte === 0x0d,
    )
  ) {
    throw credentialProblem(
      "private-postgres.credential_file.invalid_password",
      "Private PostgreSQL bootstrap password is invalid",
      "The bootstrap password must be non-empty UTF-8 single-line data without NUL, LF, or CR bytes",
      "validation",
    );
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(passwordUtf8);
  } catch {
    throw credentialProblem(
      "private-postgres.credential_file.invalid_password",
      "Private PostgreSQL bootstrap password is invalid",
      "The bootstrap password must be valid UTF-8 single-line data",
      "validation",
    );
  }
}

export async function withRestrictedPasswordFile<T>(
  tempRoot: string,
  passwordUtf8: Uint8Array,
  use: (passwordFilePath: string) => Promise<T>,
): Promise<T> {
  assertValidBootstrapPassword(passwordUtf8);
  const canonicalTempRoot = await resolveValidatedTempRoot(tempRoot);
  const passwordFilePath = join(
    canonicalTempRoot,
    `${PASSWORD_FILE_PREFIX}${randomBytes(24).toString("hex")}.pw`,
  );
  const fileContents = Buffer.concat([Buffer.from(passwordUtf8), Buffer.from("\n")]);

  try {
    try {
      await writeFile(passwordFilePath, fileContents, {
        flag: "wx",
        mode: RESTRICTIVE_PASSWORD_FILE_MODE,
      });
    } catch {
      throw credentialProblem(
        "private-postgres.credential_file.create_failed",
        "Private PostgreSQL password file could not be created",
        "The restricted ephemeral PostgreSQL password file could not be created",
      );
    }
    return await use(passwordFilePath);
  } finally {
    fileContents.fill(0);
    try {
      await unlink(passwordFilePath);
    } catch (error) {
      if (!(
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      )) {
        throw credentialProblem(
          "private-postgres.credential_file.cleanup_failed",
          "Private PostgreSQL password file cleanup failed",
          "The restricted ephemeral PostgreSQL password file could not be removed",
        );
      }
    }
  }
}
