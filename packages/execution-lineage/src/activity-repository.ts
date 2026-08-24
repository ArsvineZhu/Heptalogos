import { CompiledQuery } from "kysely";
import {
  formatInstant,
  parseActivityId,
  parseInstant,
} from "@heptalogos/foundation-contracts";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";
import type { PersistenceInternalTransaction } from "@heptalogos/persistence/foundation-repository";
import { useFoundationMutationTransaction } from "@heptalogos/persistence/foundation-repository";
import type {
  BootstrapRetainedActivityDraft,
  ExecutionContext,
  ExecutionLineageService,
} from "./contracts.js";
import {
  activityAlreadyRetainedProblem,
  bootstrapReferenceConflictProblem,
  bootstrapReferenceDiscontinuityProblem,
  currentActivityMismatchProblem,
  originMismatchProblem,
  retentionNotDurableProblem,
  invalidActivityProblem,
} from "./problems.js";
import { runWithLineageSuppressed } from "./suppression.js";

async function executeSql(
  transaction: PersistenceInternalTransaction,
  text: string,
  parameters: readonly unknown[] = [],
): Promise<readonly Record<string, unknown>[]> {
  const result = await transaction.executeQuery<Record<string, unknown>>(
    CompiledQuery.raw(text, [...parameters]),
  );
  return result.rows;
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function assertBounded(value: string | undefined, name: string, maximum: number): void {
  if (
    value !== undefined &&
    (value.trim().length === 0 || utf8Length(value) > maximum)
  ) {
    throw invalidActivityProblem(
      `${name} must be non-empty and at most ${maximum} UTF-8 bytes`,
    );
  }
}

function assertCurrentActivity(
  transaction: PersistenceMutationTransactionContext,
  context: ExecutionContext,
): void {
  if (context.activityId !== transaction.execution.activityId) {
    throw currentActivityMismatchProblem();
  }
  const origin = context.origin;
  const execution = transaction.execution;
  if (
    origin.installationId !== execution.installationId ||
    origin.instanceId !== execution.instanceId ||
    origin.bootId !== execution.bootId ||
    origin.continuityEpochId !== execution.continuityEpochId ||
    origin.hostOwnershipToken !== execution.hostOwnershipToken
  ) {
    throw originMismatchProblem();
  }
  if (context.retentionClass === "ephemeral") {
    throw retentionNotDurableProblem();
  }
  assertBounded(context.kind, "kind", 128);
  for (const value of [
    context.semantic.operationId,
    context.semantic.featureId,
    context.semantic.serviceId,
    context.semantic.capabilityId,
    context.semantic.providerId,
    context.semantic.contractVersion,
  ]) {
    assertBounded(value, "Activity semantic field", 256);
  }
  for (const link of context.links) {
    if (!parseActivityId(link.targetActivityId)) {
      throw invalidActivityProblem("Activity link target must be a UUIDv7 ActivityId");
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function outcomeRef(value: string | undefined): string | null {
  return value ?? null;
}

async function insertCurrentActivity(
  transaction: PersistenceInternalTransaction,
  context: ExecutionContext,
): Promise<void> {
  try {
    await executeSql(
      transaction,
      `INSERT INTO "heptalogos"."activity_record" (
        activity_id, kind, started_at, ended_at, parent_activity_id,
        causation_activity_id, installation_id, instance_id, boot_id,
        continuity_epoch_id, host_ownership_token, importance, retention_class,
        sensitivity, operation_id, feature_id, service_id, capability_id,
        provider_id, contract_version, outcome, outcome_ref
      ) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, NULL, NULL)`,
      [
        context.activityId,
        context.kind,
        context.startedAt,
        context.parentActivityId ?? null,
        context.causationActivityId ?? null,
        context.origin.installationId,
        context.origin.instanceId,
        context.origin.bootId,
        context.origin.continuityEpochId,
        context.origin.hostOwnershipToken,
        context.importance,
        context.retentionClass,
        context.sensitivity,
        context.semantic.operationId ?? null,
        context.semantic.featureId ?? null,
        context.semantic.serviceId ?? null,
        context.semantic.capabilityId ?? null,
        context.semantic.providerId ?? null,
        context.semantic.contractVersion ?? null,
      ],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw activityAlreadyRetainedProblem();
    throw error;
  }

  for (const link of context.links) {
    await executeSql(
      transaction,
      `INSERT INTO "heptalogos"."activity_link" (
        source_activity_id, link_kind, target_activity_id
      ) VALUES ($1, $2, $3)`,
      [context.activityId, link.kind, link.targetActivityId],
    );
  }
}

function assertBootstrapDraft(
  transaction: PersistenceMutationTransactionContext,
  draft: BootstrapRetainedActivityDraft,
): void {
  if (
    draft.instanceId !== transaction.execution.instanceId ||
    draft.continuityEpochId !== transaction.execution.continuityEpochId
  ) {
    throw bootstrapReferenceDiscontinuityProblem();
  }
  assertBounded(draft.outcomeRef, "outcomeRef", 1024);
}

interface BootstrapRow {
  readonly activity_id: string;
  readonly kind: string;
  readonly started_at: unknown;
  readonly ended_at: unknown;
  readonly installation_id: string;
  readonly instance_id: string;
  readonly boot_id: string;
  readonly continuity_epoch_id: string;
  readonly host_ownership_token: string | null;
  readonly importance: string;
  readonly retention_class: string;
  readonly sensitivity: string;
  readonly outcome: string | null;
  readonly outcome_ref: string | null;
}

function persistedInstant(value: unknown): string | undefined {
  if (value instanceof Date) return formatInstant(value);
  if (typeof value === "string") return parseInstant(value);
  return undefined;
}

function bootstrapRowMatches(
  row: BootstrapRow,
  draft: BootstrapRetainedActivityDraft,
): boolean {
  return (
    row.activity_id === draft.activityId &&
    row.kind === "bootstrap.handoff" &&
    persistedInstant(row.started_at) === draft.startedAt &&
    persistedInstant(row.ended_at) === draft.endedAt &&
    row.installation_id === draft.installationId &&
    row.instance_id === draft.instanceId &&
    row.boot_id === draft.bootId &&
    row.continuity_epoch_id === draft.continuityEpochId &&
    row.host_ownership_token === null &&
    row.importance === "significant" &&
    row.retention_class === "retained" &&
    row.sensitivity === "operational" &&
    row.outcome === draft.outcome &&
    row.outcome_ref === outcomeRef(draft.outcomeRef)
  );
}

async function retainBootstrap(
  transaction: PersistenceInternalTransaction,
  draft: BootstrapRetainedActivityDraft,
): Promise<void> {
  await executeSql(
    transaction,
    `INSERT INTO "heptalogos"."activity_record" (
      activity_id, kind, started_at, ended_at, parent_activity_id,
      causation_activity_id, installation_id, instance_id, boot_id,
      continuity_epoch_id, host_ownership_token, importance, retention_class,
      sensitivity, operation_id, feature_id, service_id, capability_id,
      provider_id, contract_version, outcome, outcome_ref
    ) VALUES ($1, 'bootstrap.handoff', $2, $3, NULL, NULL, $4, $5, $6, $7,
      NULL, 'significant', 'retained', 'operational', NULL, NULL, NULL, NULL,
      NULL, NULL, $8, $9) ON CONFLICT (activity_id) DO NOTHING`,
    [
      draft.activityId,
      draft.startedAt,
      draft.endedAt,
      draft.installationId,
      draft.instanceId,
      draft.bootId,
      draft.continuityEpochId,
      draft.outcome,
      outcomeRef(draft.outcomeRef),
    ],
  );
  const rows = await executeSql(
    transaction,
    `SELECT activity_id, kind, started_at, ended_at, installation_id,
       instance_id, boot_id, continuity_epoch_id, host_ownership_token,
       importance, retention_class, sensitivity, outcome, outcome_ref
     FROM "heptalogos"."activity_record" WHERE activity_id = $1`,
    [draft.activityId],
  );
  const row = rows[0] as unknown as BootstrapRow | undefined;
  if (row === undefined || !bootstrapRowMatches(row, draft)) {
    throw bootstrapReferenceConflictProblem();
  }
}

export function createExecutionLineageService(): ExecutionLineageService {
  return {
    async retainCurrent(transaction, context) {
      assertCurrentActivity(transaction, context);
      await runWithLineageSuppressed(() =>
        useFoundationMutationTransaction(transaction, async (databaseTransaction) => {
          await insertCurrentActivity(databaseTransaction, context);
        }),
      );
    },
    async retainBootstrapReference(transaction, draft) {
      assertBootstrapDraft(transaction, draft);
      await runWithLineageSuppressed(() =>
        useFoundationMutationTransaction(transaction, async (databaseTransaction) => {
          await retainBootstrap(databaseTransaction, draft);
        }),
      );
    },
  };
}
