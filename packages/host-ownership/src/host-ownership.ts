import {
  parseBootId,
  parseHostOwnershipToken,
  ProblemError,
  type BootId,
  type HostOwnershipToken,
  type InstanceId,
  type Problem,
} from "@heptalogos/foundation-contracts";
import { HOST_OWNERSHIP_FENCE_TABLE, HOST_OWNERSHIP_SCHEMA } from "./contracts.js";
import type { HostLeaseConnection } from "./host-lease-connection.js";

export interface PublishHostOwnershipTokenOptions {
  readonly connection: HostLeaseConnection;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly fenceLockTimeoutMs: number;
  readonly statementTimeoutMs: number;
}

interface FenceRow {
  readonly singleton: boolean;
  readonly instance_id: string;
  readonly ownership_revision: string | number;
  readonly host_ownership_token: string | null;
  readonly boot_id: string | null;
}

const FENCE_FOR_UPDATE = `
SELECT instance_id, ownership_revision, host_ownership_token, boot_id
FROM "${HOST_OWNERSHIP_SCHEMA}"."${HOST_OWNERSHIP_FENCE_TABLE}"
WHERE singleton = true
FOR UPDATE
`;

const FENCE_AFTER_COMMIT = `
SELECT singleton, instance_id, ownership_revision, host_ownership_token, boot_id
FROM "${HOST_OWNERSHIP_SCHEMA}"."${HOST_OWNERSHIP_FENCE_TABLE}"
WHERE singleton = true
`;

function publicationProblem(
  problemCode: string,
  title: string,
  detail: string,
): ProblemError {
  const problem: Problem = {
    schemaVersion: 1,
    problemCode,
    category: "host-ownership",
    retryClass: "manual",
    title,
    detail,
  };
  return new ProblemError(problem);
}

function invalidFenceProblem(): ProblemError {
  return publicationProblem(
    "host-ownership.fence.incompatible",
    "HostOwnershipFence row is incompatible",
    "The canonical HostOwnershipFence row did not satisfy the expected singleton identity shape",
  );
}

function instanceMismatchProblem(): ProblemError {
  return publicationProblem(
    "host-ownership.fence.instance_mismatch",
    "HostOwnershipFence belongs to another instance",
    "The current HostOwnershipFence row has a different InstanceId",
  );
}

function publicationUnverifiedProblem(): ProblemError {
  return publicationProblem(
    "host-ownership.fence.publication_unverified",
    "HostOwnershipToken publication could not be verified",
    "The committed HostOwnershipFence row did not contain the new token and BootId",
  );
}

function publicationFailedProblem(): ProblemError {
  return publicationProblem(
    "host-ownership.fence.publication_failed",
    "HostOwnershipToken publication failed",
    "The HostOwnershipFence publication transaction failed",
  );
}

function isRevision(value: string | number): boolean {
  return /^\d+$/u.test(String(value));
}

function assertFenceRow(row: FenceRow, instanceId: InstanceId): void {
  if (
    row.singleton !== true ||
    row.instance_id !== instanceId ||
    !isRevision(row.ownership_revision) ||
    (row.host_ownership_token !== null &&
      parseHostOwnershipToken(row.host_ownership_token) === undefined) ||
    (row.boot_id !== null && parseBootId(row.boot_id) === undefined)
  ) {
    if (row.instance_id !== instanceId) throw instanceMismatchProblem();
    throw invalidFenceProblem();
  }
}

function assertPublishedRow(
  row: FenceRow,
  instanceId: InstanceId,
  token: HostOwnershipToken,
  bootId: BootId,
): void {
  if (
    row.singleton !== true ||
    row.instance_id !== instanceId ||
    row.host_ownership_token !== token ||
    row.boot_id !== bootId
  ) {
    throw publicationUnverifiedProblem();
  }
}

export async function publishHostOwnershipToken(
  options: PublishHostOwnershipTokenOptions,
): Promise<void> {
  const { connection } = options;
  connection.assertActive();
  let transactionOpen = false;
  try {
    await connection.query("BEGIN");
    transactionOpen = true;
    await connection.query("SELECT set_config('lock_timeout', $1, true)", [
      `${options.fenceLockTimeoutMs}ms`,
    ]);
    await connection.query("SELECT set_config('statement_timeout', $1, true)", [
      `${options.statementTimeoutMs}ms`,
    ]);
    const locked = await connection.query<FenceRow>(FENCE_FOR_UPDATE);
    if (locked.rows.length !== 1) throw invalidFenceProblem();
    assertFenceRow(locked.rows[0], options.instanceId);
    await connection.query(
      `UPDATE "${HOST_OWNERSHIP_SCHEMA}"."${HOST_OWNERSHIP_FENCE_TABLE}"
SET ownership_revision = ownership_revision + 1,
    host_ownership_token = $1,
    boot_id = $2
WHERE singleton = true`,
      [options.token, options.bootId],
    );
    await connection.query("COMMIT");
    transactionOpen = false;

    const verified = await connection.query<FenceRow>(FENCE_AFTER_COMMIT);
    if (verified.rows.length !== 1) throw publicationUnverifiedProblem();
    assertPublishedRow(
      verified.rows[0],
      options.instanceId,
      options.token,
      options.bootId,
    );
  } catch (error) {
    if (transactionOpen && connection.state === "ACTIVE") {
      await connection.query("ROLLBACK").catch(() => undefined);
    }
    if (connection.state === "ACTIVE") connection.fence("token publication failure");
    if (error instanceof ProblemError) throw error;
    throw publicationFailedProblem();
  }
}
