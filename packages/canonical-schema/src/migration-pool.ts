import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool, type PoolClient } from "pg";
import {
  HOST_MIGRATION_ROLE,
  HOST_OWNERSHIP_OWNER_ROLE,
  type HostCanonicalMigrationAuthority,
} from "@heptalogos/host-ownership";
import type { CanonicalSchemaRuntimeOptions } from "./contracts.js";
import { canonicalSchemaProblem } from "./problems.js";

export interface CanonicalDatabase {
  readonly instance_continuity: {
    readonly singleton: boolean;
    readonly instance_id: string;
    readonly continuity_epoch_id: string;
  };
  readonly activity_record: {
    readonly activity_id: string;
    readonly kind: string;
    readonly started_at: Date | string;
    readonly ended_at: Date | string | null;
    readonly parent_activity_id: string | null;
    readonly causation_activity_id: string | null;
    readonly installation_id: string;
    readonly instance_id: string;
    readonly boot_id: string;
    readonly continuity_epoch_id: string;
    readonly host_ownership_token: string | null;
    readonly product_generation_id: string | null;
    readonly package_generation_id: string | null;
    readonly micro_system_id: string | null;
    readonly micro_system_instance_id: string | null;
    readonly contribution_id: string | null;
    readonly importance: string;
    readonly retention_class: string;
    readonly sensitivity: string;
    readonly operation_id: string | null;
    readonly feature_id: string | null;
    readonly service_id: string | null;
    readonly capability_id: string | null;
    readonly provider_id: string | null;
    readonly contract_version: string | null;
    readonly outcome: string | null;
    readonly outcome_ref: string | null;
  };
  readonly work_item: {
    readonly work_item_id: string;
    readonly target_product_generation_id: string;
    readonly handler_micro_system_id: string;
    readonly handler_contribution_id: string;
    readonly handler_package_generation_id: string;
    readonly payload_version: number;
    readonly payload: unknown;
    readonly queue_profile_id: string;
    readonly resource_admission_class: string;
    readonly partition_key: string | null;
    readonly priority: number;
    readonly not_before: Date | string | null;
    readonly dedup_key: string | null;
    readonly created_continuity_epoch_id: string;
    readonly lineage_context_ref: unknown;
    readonly configuration_binding_policy: string;
    readonly config_revision_ref: string | null;
    readonly restore_replay_class: string;
    readonly dispatch_revision: string | number;
    readonly active_attempt_id: string | null;
    readonly state: string;
    readonly retry_class: string | null;
    readonly state_reason_code: string | null;
    readonly cancel_requested_at: Date | string | null;
    readonly cancellation_reason_code: string | null;
    readonly superseded_by: string | null;
    readonly outcome: unknown;
    readonly created_at: Date | string;
    readonly updated_at: Date | string;
  };
  readonly activity_link: {
    readonly source_activity_id: string;
    readonly link_kind: string;
    readonly target_activity_id: string;
  };
  readonly evidence_record: {
    readonly evidence_id: string;
    readonly activity_id: string;
    readonly evidence_kind: string;
    readonly evidence_contract_version: string;
    readonly recorded_at: Date | string;
    readonly subject_ref: string | null;
    readonly object_ref: string | null;
    readonly fact_ref: string | null;
    readonly retention_class: string;
    readonly sensitivity: string;
  };
}

export interface MigrationDatabase {
  readonly db: Kysely<CanonicalDatabase>;
  close(): Promise<void>;
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function reportBackgroundError(
  options: CanonicalSchemaRuntimeOptions,
  error: unknown,
): void {
  try {
    options.onBackgroundError(error);
  } catch {
    // Diagnostic sinks must not escape node-postgres event handlers.
  }
}

function attachErrorSinks(pool: Pool, options: CanonicalSchemaRuntimeOptions): void {
  pool.on("connect", (client: PoolClient) => {
    client.on("error", (error: unknown) => reportBackgroundError(options, error));
  });
  pool.on("error", (error: unknown) => reportBackgroundError(options, error));
}

export function createMigrationDatabase(
  authority: HostCanonicalMigrationAuthority,
  options: CanonicalSchemaRuntimeOptions,
): MigrationDatabase {
  const pool = new Pool({
    host: authority.target.host,
    port: authority.target.port,
    database: authority.target.database,
    user: authority.target.user,
    password: () =>
      authority.withMigrationDatabasePassword(async (passwordUtf8) =>
        UTF8_DECODER.decode(passwordUtf8),
      ),
    max: 1,
    application_name: "heptalogos-canonical-migration",
    connectionTimeoutMillis: options.connectionTimeoutMs,
    statement_timeout: options.statementTimeoutMs,
    lock_timeout: options.lockTimeoutMs,
    idle_in_transaction_session_timeout: options.idleInTransactionSessionTimeoutMs,
    options: `-c role=${HOST_OWNERSHIP_OWNER_ROLE} -c search_path=heptalogos,pg_catalog`,
  });
  attachErrorSinks(pool, options);
  const db = new Kysely<CanonicalDatabase>({
    dialect: new PostgresDialect({ pool }),
  });
  let closed = false;
  return {
    db,
    async close() {
      if (closed) return;
      closed = true;
      await db.destroy();
    },
  };
}

interface SchemaPreconditionRow {
  readonly current_user: unknown;
  readonly session_user: unknown;
  readonly current_schema: unknown;
  readonly schema_owner: unknown;
}

export async function verifyMigrationSchemaPrecondition(
  db: Kysely<CanonicalDatabase>,
): Promise<void> {
  let rows: readonly SchemaPreconditionRow[];
  try {
    rows = (
      await sql<SchemaPreconditionRow>`
        SELECT
          current_user,
          session_user,
          current_schema(),
          schema_owner
        FROM information_schema.schemata
        WHERE schema_name = 'heptalogos'
      `.execute(db)
    ).rows;
  } catch {
    throw canonicalSchemaProblem(
      "canonical-schema.schema_precondition_failed",
      "The migration authority could not verify the existing canonical schema owner",
      "integrity",
    );
  }

  const row = rows[0];
  if (
    rows.length !== 1 ||
    row === undefined ||
    row.session_user !== HOST_MIGRATION_ROLE ||
    row.current_user !== HOST_OWNERSHIP_OWNER_ROLE ||
    row.current_schema !== "heptalogos" ||
    row.schema_owner !== HOST_OWNERSHIP_OWNER_ROLE
  ) {
    throw canonicalSchemaProblem(
      "canonical-schema.schema_precondition_failed",
      "The existing canonical schema must be owned by heptalogos_owner through the heptalogos_migration session",
      "integrity",
    );
  }
}

export function assertCanonicalAuthority(
  authority: HostCanonicalMigrationAuthority,
): void {
  try {
    authority.assertCurrent();
  } catch {
    throw canonicalSchemaProblem(
      "canonical-schema.authority_lost",
      "Bootstrap ownership and the provisional Host lease must remain current throughout canonical initialization",
      "conflict",
    );
  }
}
