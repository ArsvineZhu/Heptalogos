/**
 * Provisions and verifies the DBOS vendor schema through the installed CLI
 * while preserving the Host migration Authority and product-schema boundary.
 * @module dbos-schema-provisioner
 */

import { Client } from "pg";
import {
  HOST_DURABLE_EXECUTION_ROLE,
  HOST_MIGRATION_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
  type HostCanonicalMigrationAuthority,
} from "@heptalogos/host-ownership";
import {
  type DurableExecutionPackageResolution,
  type DurableExecutionProcessOptions,
  type DurableExecutionProcessResult,
  type DurableExecutionSchemaProvisioner,
  type DurableExecutionSchemaProvisionerOptions,
} from "./contracts.js";
import { resolveDbosPackage } from "./dbos-package.js";
import { dbosProcessDiagnostic, runDbosCli } from "./dbos-process.js";
import { durableExecutionProblem } from "./problems.js";

interface DurableExecutionSchemaClient {
  connect(): Promise<unknown>;
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>;
  end(): Promise<void>;
}

interface DurableExecutionSchemaClientOptions {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: typeof HOST_OWNERSHIP_CANONICAL_DATABASE;
  readonly user: typeof HOST_MIGRATION_ROLE;
  readonly password: string;
  readonly connectionTimeoutMillis: number;
  readonly statementTimeout: number;
}

interface DurableExecutionSchemaClientFactory {
  create(options: DurableExecutionSchemaClientOptions): DurableExecutionSchemaClient;
}

type DbosPackageResolver = () => DurableExecutionPackageResolution;
type DbosCliRunner = (
  options: DurableExecutionProcessOptions,
) => Promise<DurableExecutionProcessResult>;

interface ProvisionerDependencies {
  readonly resolvePackage: DbosPackageResolver;
  readonly runCli: DbosCliRunner;
  readonly clientFactory: DurableExecutionSchemaClientFactory;
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const DBOS_SCHEMA = "dbos" as const;
const PRODUCT_SCHEMA = "heptalogos" as const;

const SESSION_AND_SCHEMA_QUERY = `
SELECT current_user,
       session_user,
       (
         SELECT pg_get_userbyid(nspowner)
         FROM pg_catalog.pg_namespace
         WHERE nspname = $2
       ) AS dbos_owner,
       has_schema_privilege($1, $2, 'USAGE') AS durable_schema_usage,
       has_schema_privilege($1, $2, 'CREATE') AS durable_schema_create,
       has_schema_privilege($1, $3, 'USAGE') AS durable_product_schema_usage,
       has_schema_privilege($1, $3, 'CREATE') AS durable_product_schema_create
`;

const REQUIRED_RELATIONS_QUERY = `
SELECT to_regclass('"dbos"."workflow_status"') AS dbos_workflow_status,
       to_regclass('"heptalogos"."work_item"') AS product_work_item,
       to_regclass('"heptalogos"."activity_record"') AS product_activity,
       to_regclass('"heptalogos"."evidence_record"') AS product_evidence
`;

const PRIVILEGE_QUERY = `
SELECT
  has_table_privilege($1, '"dbos"."workflow_status"', 'SELECT') AS dbos_select,
  has_table_privilege($1, '"dbos"."workflow_status"', 'INSERT') AS dbos_insert,
  has_table_privilege($1, '"dbos"."workflow_status"', 'UPDATE') AS dbos_update,
  has_table_privilege($1, '"dbos"."workflow_status"', 'DELETE') AS dbos_delete,
  has_table_privilege($1, '"heptalogos"."work_item"', 'SELECT') AS product_work_item_select,
  has_table_privilege($1, '"heptalogos"."work_item"', 'INSERT') AS product_work_item_insert,
  has_table_privilege($1, '"heptalogos"."work_item"', 'UPDATE') AS product_work_item_update,
  has_table_privilege($1, '"heptalogos"."work_item"', 'DELETE') AS product_work_item_delete,
  has_table_privilege($1, '"heptalogos"."activity_record"', 'SELECT') AS product_activity_select,
  has_table_privilege($1, '"heptalogos"."activity_record"', 'INSERT') AS product_activity_insert,
  has_table_privilege($1, '"heptalogos"."activity_record"', 'UPDATE') AS product_activity_update,
  has_table_privilege($1, '"heptalogos"."activity_record"', 'DELETE') AS product_activity_delete,
  has_table_privilege($1, '"heptalogos"."evidence_record"', 'SELECT') AS product_evidence_select,
  has_table_privilege($1, '"heptalogos"."evidence_record"', 'INSERT') AS product_evidence_insert,
  has_table_privilege($1, '"heptalogos"."evidence_record"', 'UPDATE') AS product_evidence_update,
  has_table_privilege($1, '"heptalogos"."evidence_record"', 'DELETE') AS product_evidence_delete
`;

interface SessionAndSchemaRow {
  readonly current_user: unknown;
  readonly session_user: unknown;
  readonly dbos_owner: unknown;
  readonly durable_schema_usage: unknown;
  readonly durable_schema_create: unknown;
  readonly durable_product_schema_usage: unknown;
  readonly durable_product_schema_create: unknown;
}

interface RequiredRelationsRow {
  readonly dbos_workflow_status: unknown;
  readonly product_work_item: unknown;
  readonly product_activity: unknown;
  readonly product_evidence: unknown;
}

interface PrivilegeRow {
  readonly dbos_select: unknown;
  readonly dbos_insert: unknown;
  readonly dbos_update: unknown;
  readonly dbos_delete: unknown;
  readonly product_work_item_select: unknown;
  readonly product_work_item_insert: unknown;
  readonly product_work_item_update: unknown;
  readonly product_work_item_delete: unknown;
  readonly product_activity_select: unknown;
  readonly product_activity_insert: unknown;
  readonly product_activity_update: unknown;
  readonly product_activity_delete: unknown;
  readonly product_evidence_select: unknown;
  readonly product_evidence_insert: unknown;
  readonly product_evidence_update: unknown;
  readonly product_evidence_delete: unknown;
}

const defaultClientFactory: DurableExecutionSchemaClientFactory = {
  create(options) {
    const client = new Client({
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      connectionTimeoutMillis: options.connectionTimeoutMillis,
      statement_timeout: options.statementTimeout,
      application_name: "heptalogos-durable-schema-verification",
      options: `-c role=${HOST_OWNERSHIP_OWNER_ROLE}`,
    });
    return client;
  },
};

function assertProvisionerOptions(
  options: DurableExecutionSchemaProvisionerOptions,
): void {
  if (
    !Number.isSafeInteger(options.processTimeoutMs) ||
    options.processTimeoutMs <= 0 ||
    !Number.isSafeInteger(options.connectionTimeoutMs) ||
    options.connectionTimeoutMs <= 0 ||
    !Number.isSafeInteger(options.statementTimeoutMs) ||
    options.statementTimeoutMs <= 0
  ) {
    throw durableExecutionProblem(
      "durable.execution.schema.invalid_options",
      "DBOS schema provisioning requires positive safe-integer timeout bounds",
    );
  }
}

function provisioningUrl(authority: HostCanonicalMigrationAuthority): string {
  return `postgresql://${HOST_MIGRATION_ROLE}@${authority.target.host}:${authority.target.port}/${HOST_OWNERSHIP_CANONICAL_DATABASE}`;
}

function processFailureDetail(result: DurableExecutionProcessResult): string {
  const diagnostic = dbosProcessDiagnostic(result);
  return diagnostic.length === 0
    ? `The DBOS schema CLI exited with code ${String(result.exitCode)}`
    : `The DBOS schema CLI exited with code ${String(result.exitCode)}: ${diagnostic}`;
}

async function withMigrationClient<T>(
  authority: HostCanonicalMigrationAuthority,
  options: DurableExecutionSchemaProvisionerOptions,
  clientFactory: DurableExecutionSchemaClientFactory,
  use: (client: DurableExecutionSchemaClient) => Promise<T>,
): Promise<T> {
  authority.assertCurrent();
  return authority.withMigrationDatabasePassword(async (passwordUtf8) => {
    authority.assertCurrent();
    const password = UTF8_DECODER.decode(passwordUtf8);
    const client = clientFactory.create({
      host: authority.target.host,
      port: authority.target.port,
      database: authority.target.database,
      user: HOST_MIGRATION_ROLE,
      password,
      connectionTimeoutMillis: options.connectionTimeoutMs,
      statementTimeout: options.statementTimeoutMs,
    });
    try {
      await client.connect();
      authority.assertCurrent();
      const result = await use(client);
      authority.assertCurrent();
      return result;
    } finally {
      await client.end();
    }
  });
}

async function queryWithAuthority<Row>(
  authority: HostCanonicalMigrationAuthority,
  client: DurableExecutionSchemaClient,
  text: string,
  values: readonly unknown[] = [],
): Promise<readonly Row[]> {
  authority.assertCurrent();
  const result = await client.query<Row>(text, values);
  authority.assertCurrent();
  return result.rows;
}

function isTrue(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

function isPresent(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

async function verifyProvisionedSchema(
  authority: HostCanonicalMigrationAuthority,
  options: DurableExecutionSchemaProvisionerOptions,
  clientFactory: DurableExecutionSchemaClientFactory,
): Promise<void> {
  await withMigrationClient(authority, options, clientFactory, async (client) => {
    const sessionRows = await queryWithAuthority<SessionAndSchemaRow>(
      authority,
      client,
      SESSION_AND_SCHEMA_QUERY,
      [HOST_DURABLE_EXECUTION_ROLE, DBOS_SCHEMA, PRODUCT_SCHEMA],
    );
    const session = sessionRows[0];
    if (
      sessionRows.length !== 1 ||
      session === undefined ||
      session.current_user !== HOST_OWNERSHIP_OWNER_ROLE ||
      session.session_user !== HOST_MIGRATION_ROLE ||
      session.dbos_owner !== HOST_OWNERSHIP_OWNER_ROLE ||
      !isTrue(session.durable_schema_usage) ||
      isTrue(session.durable_schema_create) ||
      isTrue(session.durable_product_schema_usage) ||
      isTrue(session.durable_product_schema_create)
    ) {
      throw durableExecutionProblem(
        "durable.execution.schema.verification_failed",
        "DBOS schema ownership or migration-session privilege boundaries are not current",
      );
    }

    const relationRows = await queryWithAuthority<RequiredRelationsRow>(
      authority,
      client,
      REQUIRED_RELATIONS_QUERY,
    );
    const relations = relationRows[0];
    if (
      relationRows.length !== 1 ||
      relations === undefined ||
      !isPresent(relations.dbos_workflow_status) ||
      !isPresent(relations.product_work_item) ||
      !isPresent(relations.product_activity) ||
      !isPresent(relations.product_evidence)
    ) {
      throw durableExecutionProblem(
        "durable.execution.schema.verification_failed",
        "DBOS or canonical product schema relations are missing",
      );
    }

    const privilegeRows = await queryWithAuthority<PrivilegeRow>(
      authority,
      client,
      PRIVILEGE_QUERY,
      [HOST_DURABLE_EXECUTION_ROLE],
    );
    const privileges = privilegeRows[0];
    if (privilegeRows.length !== 1 || privileges === undefined) {
      throw durableExecutionProblem(
        "durable.execution.schema.verification_failed",
        "DBOS privilege verification returned an invalid result",
      );
    }
    const dbosPrivileges = [
      privileges.dbos_select,
      privileges.dbos_insert,
      privileges.dbos_update,
      privileges.dbos_delete,
    ];
    const productPrivileges = [
      privileges.product_work_item_select,
      privileges.product_work_item_insert,
      privileges.product_work_item_update,
      privileges.product_work_item_delete,
      privileges.product_activity_select,
      privileges.product_activity_insert,
      privileges.product_activity_update,
      privileges.product_activity_delete,
      privileges.product_evidence_select,
      privileges.product_evidence_insert,
      privileges.product_evidence_update,
      privileges.product_evidence_delete,
    ];
    if (!dbosPrivileges.every(isTrue) || productPrivileges.some(isTrue)) {
      throw durableExecutionProblem(
        "durable.execution.schema.verification_failed",
        "The durable role does not have the exact DBOS runtime rights or product-schema denial",
      );
    }
  });
}

async function ensureCurrentWithDependencies(
  authority: HostCanonicalMigrationAuthority,
  options: DurableExecutionSchemaProvisionerOptions,
  dependencies: ProvisionerDependencies,
): Promise<void> {
  authority.assertCurrent();
  const packageResolution = dependencies.resolvePackage();
  authority.assertCurrent();
  const processResult = await authority.withMigrationDatabasePassword(
    async (passwordUtf8) => {
      authority.assertCurrent();
      const result = await dependencies.runCli({
        cliPath: packageResolution.cliPath,
        args: [
          "schema",
          provisioningUrl(authority),
          "--schema",
          DBOS_SCHEMA,
          "--app-role",
          HOST_DURABLE_EXECUTION_ROLE,
        ],
        timeoutMs: options.processTimeoutMs,
        env: {
          PGPASSWORD: UTF8_DECODER.decode(passwordUtf8),
          PGOPTIONS: `-c role=${HOST_OWNERSHIP_OWNER_ROLE}`,
        },
      });
      authority.assertCurrent();
      return result;
    },
  );
  if (processResult.exitCode !== 0) {
    throw durableExecutionProblem(
      "durable.execution.schema.provision_failed",
      processFailureDetail(processResult),
    );
  }
  authority.assertCurrent();
  await verifyProvisionedSchema(authority, options, dependencies.clientFactory);
  authority.assertCurrent();
}

/** Creates the DBOS vendor-schema provisioner with explicit operational bounds. */
export function createDurableExecutionSchemaProvisioner(
  options: DurableExecutionSchemaProvisionerOptions,
): DurableExecutionSchemaProvisioner {
  assertProvisionerOptions(options);
  return Object.freeze({
    ensureCurrent(authority: HostCanonicalMigrationAuthority): Promise<void> {
      return ensureCurrentWithDependencies(authority, options, {
        resolvePackage: resolveDbosPackage,
        runCli: runDbosCli,
        clientFactory: defaultClientFactory,
      });
    },
  });
}

/** Test-only constructor that keeps process and PostgreSQL effects injectable. */
export function createDurableExecutionSchemaProvisionerForTests(
  options: DurableExecutionSchemaProvisionerOptions,
  dependencies: ProvisionerDependencies,
): DurableExecutionSchemaProvisioner {
  assertProvisionerOptions(options);
  return Object.freeze({
    ensureCurrent(authority: HostCanonicalMigrationAuthority): Promise<void> {
      return ensureCurrentWithDependencies(authority, options, dependencies);
    },
  });
}
