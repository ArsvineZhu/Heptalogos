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
