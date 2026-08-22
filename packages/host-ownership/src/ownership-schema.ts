import {
  parseBootId,
  parseHostOwnershipToken,
  ProblemError,
  type InstanceId,
  type Problem,
} from "@heptalogos/foundation-contracts";
import {
  HOST_LEASE_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_FENCE_TABLE,
  HOST_OWNERSHIP_OWNER_ROLE,
  HOST_OWNERSHIP_SCHEMA,
} from "./contracts.js";
import {
  type BootstrapAdminClient,
  type BootstrapAdminPasswordProvider,
  withBootstrapAdminClient,
} from "./bootstrap-admin.js";
import type { BootstrapMutationAuthority } from "./bootstrap-authority.js";

export interface OwnershipSchemaOptions {
  readonly port: number;
  readonly instanceId: InstanceId;
  readonly passwordProvider: BootstrapAdminPasswordProvider;
  readonly mutationAuthority: BootstrapMutationAuthority;
  readonly clientFactory?: unknown;
}

export interface OwnershipSchemaResult {
  readonly schemaCreated: boolean;
  readonly tableCreated: boolean;
  readonly fenceRowInitialized: boolean;
}

interface SchemaRow {
  readonly schema_name: string;
  readonly owner_name: string;
}

interface TableRow {
  readonly table_name: string;
  readonly owner_name: string;
  readonly relkind: string;
}

interface ColumnRow {
  readonly column_name: string;
  readonly data_type: string;
  readonly not_null: boolean;
}

interface ConstraintRow {
  readonly conname: string;
  readonly contype: string;
  readonly definition: string;
}

interface AclRow {
  readonly grantee: string;
  readonly privilege_type: string;
  readonly owner_name?: string;
}

interface FenceRow {
  readonly singleton: boolean;
  readonly instance_id: string;
  readonly ownership_revision: string | number;
  readonly host_ownership_token: string | null;
  readonly boot_id: string | null;
}

const SCHEMA_QUERY = `
SELECT n.nspname AS schema_name, pg_get_userbyid(n.nspowner) AS owner_name
FROM pg_catalog.pg_namespace AS n
WHERE n.nspname = $1
`;

const DATABASE_ACL_QUERY = `
SELECT pg_get_userbyid(databases.datdba) AS owner_name,
       CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
       acl.privilege_type
FROM pg_catalog.pg_database AS databases
CROSS JOIN LATERAL aclexplode(
  COALESCE(databases.datacl, acldefault('d', databases.datdba))
) AS acl
WHERE databases.datname = $1
`;

const SCHEMA_ACL_QUERY = `
SELECT pg_get_userbyid(namespaces.nspowner) AS owner_name,
       CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
       acl.privilege_type
FROM pg_catalog.pg_namespace AS namespaces
CROSS JOIN LATERAL aclexplode(
  COALESCE(namespaces.nspacl, acldefault('n', namespaces.nspowner))
) AS acl
WHERE namespaces.nspname = $1
`;

const TABLE_QUERY = `
SELECT c.relname AS table_name, pg_get_userbyid(c.relowner) AS owner_name,
       c.relkind
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = $1 AND c.relname = $2
`;

const COLUMN_QUERY = `
SELECT a.attname AS column_name, format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null
FROM pg_catalog.pg_attribute AS a
JOIN pg_catalog.pg_class AS c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = $1 AND c.relname = $2
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attnum
`;

const CONSTRAINT_QUERY = `
SELECT conname, contype, pg_get_constraintdef(oid, true) AS definition
FROM pg_catalog.pg_constraint
WHERE conrelid = $1::regclass
ORDER BY conname
`;

const TABLE_ACL_QUERY = `
SELECT pg_get_userbyid(tables.relowner) AS owner_name,
       CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
       acl.privilege_type
FROM pg_catalog.pg_class AS tables
JOIN pg_catalog.pg_namespace AS namespaces ON namespaces.oid = tables.relnamespace
CROSS JOIN LATERAL aclexplode(
  COALESCE(tables.relacl, acldefault('r', tables.relowner))
) AS acl
WHERE namespaces.nspname = $1 AND tables.relname = $2
`;

const FENCE_QUERY = `
SELECT singleton, instance_id, ownership_revision, host_ownership_token, boot_id
FROM "heptalogos"."host_ownership_fence"
ORDER BY singleton
`;

function schemaProblem(
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

function incompatibleSchemaProblem(detail: string): ProblemError {
  return schemaProblem(
    "host-ownership.schema.incompatible",
    "Host ownership schema is incompatible",
    detail,
  );
}

function instanceMismatchProblem(): ProblemError {
  return schemaProblem(
    "host-ownership.schema.instance_mismatch",
    "Host ownership fence belongs to another instance",
    "The canonical HostOwnershipFence singleton row has a different InstanceId",
  );
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function explicitAcl(rows: readonly AclRow[]): readonly AclRow[] {
  // PostgreSQL reports the object's implicit owner privileges through
  // acldefault(). They are authority inherent to the canonical owner, not
  // grant edges that Host ownership must manage. Every other explicit edge
  // remains visible and is validated closed-world.
  return rows.filter(
    (row) => row.owner_name === undefined || row.grantee !== row.owner_name,
  );
}

function aclKeys(rows: readonly AclRow[]): Set<string> {
  return new Set(rows.map((row) => `${row.grantee}:${row.privilege_type}`));
}

function assertAclSubset(
  rows: readonly AclRow[],
  allowed: ReadonlySet<string>,
  detail: string,
): void {
  for (const edge of aclKeys(explicitAcl(rows))) {
    if (!allowed.has(edge)) throw incompatibleSchemaProblem(detail);
  }
}

function assertAclExact(
  rows: readonly AclRow[],
  expected: ReadonlySet<string>,
  detail: string,
): void {
  const actual = aclKeys(explicitAcl(rows));
  if (
    actual.size !== expected.size ||
    [...actual].some((edge) => !expected.has(edge))
  ) {
    throw incompatibleSchemaProblem(detail);
  }
}

async function authorizedMutation<Row = never>(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
  text: string,
  values?: readonly unknown[],
): Promise<{ readonly rows: readonly Row[] }> {
  authority.assertCurrent();
  const result = await client.query<Row>(text, values);
  authority.assertCurrent();
  return result;
}

function assertExactColumns(rows: readonly ColumnRow[]): void {
  const expected = [
    ["singleton", "boolean", true],
    ["instance_id", "uuid", true],
    ["ownership_revision", "bigint", true],
    ["host_ownership_token", "uuid", false],
    ["boot_id", "uuid", false],
  ] as const;
  if (
    rows.length !== expected.length ||
    rows.some(
      (row, index) =>
        row.column_name !== expected[index][0] ||
        row.data_type !== expected[index][1] ||
        row.not_null !== expected[index][2],
    )
  ) {
    throw incompatibleSchemaProblem(
      "HostOwnershipFence columns do not match the canonical schema",
    );
  }
}

function normalizeDefinition(definition: string): string {
  return definition.replace(/\s+/gu, " ").trim().toLowerCase();
}

function assertExactConstraints(rows: readonly ConstraintRow[]): void {
  const actual = new Set(
    rows.map((row) => `${row.contype}:${normalizeDefinition(row.definition)}`),
  );
  const expected = new Set([
    "p:primary key (singleton)",
    "c:check (singleton)",
    "c:check (ownership_revision >= 0)",
  ]);
  if (
    rows.length !== expected.size ||
    [...expected].some((constraint) => !actual.has(constraint))
  ) {
    throw incompatibleSchemaProblem(
      "HostOwnershipFence constraints do not match the canonical schema",
    );
  }
}

function assertFenceRow(row: FenceRow, instanceId: InstanceId): void {
  const revision = String(row.ownership_revision);
  if (
    row.singleton !== true ||
    row.instance_id !== instanceId ||
    !/^\d+$/u.test(revision) ||
    (row.host_ownership_token !== null &&
      parseHostOwnershipToken(row.host_ownership_token) === undefined) ||
    (row.boot_id !== null && parseBootId(row.boot_id) === undefined)
  ) {
    throw incompatibleSchemaProblem(
      "HostOwnershipFence singleton row does not match the canonical shape",
    );
  }
}

async function ensureDatabasePrivileges(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
): Promise<void> {
  const rows = await client.query<AclRow>(DATABASE_ACL_QUERY, [
    HOST_OWNERSHIP_CANONICAL_DATABASE,
  ]);
  assertAclSubset(
    rows.rows,
    new Set(["PUBLIC:CONNECT", "PUBLIC:TEMPORARY", `${HOST_LEASE_ROLE}:CONNECT`]),
    "Unexpected explicit database privilege exists on the canonical database",
  );
  await authorizedMutation(
    client,
    authority,
    `REVOKE ALL ON DATABASE ${quoteIdentifier(HOST_OWNERSHIP_CANONICAL_DATABASE)} FROM PUBLIC`,
  );
  await authorizedMutation(
    client,
    authority,
    `GRANT CONNECT ON DATABASE ${quoteIdentifier(HOST_OWNERSHIP_CANONICAL_DATABASE)} TO ${quoteIdentifier(HOST_LEASE_ROLE)}`,
  );
  const verified = await client.query<AclRow>(DATABASE_ACL_QUERY, [
    HOST_OWNERSHIP_CANONICAL_DATABASE,
  ]);
  assertAclExact(
    verified.rows,
    new Set([`${HOST_LEASE_ROLE}:CONNECT`]),
    "Canonical database privileges do not match the closed-world contract",
  );
}

async function ensurePublicSchemaPrivileges(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
): Promise<void> {
  const rows = await client.query<AclRow>(SCHEMA_ACL_QUERY, ["public"]);
  assertAclSubset(
    rows.rows,
    new Set(["PUBLIC:USAGE", "PUBLIC:CREATE"]),
    "Unexpected explicit privilege exists on the public schema",
  );
  const preserved = new Set(
    [...aclKeys(explicitAcl(rows.rows))].filter((edge) => edge !== "PUBLIC:CREATE"),
  );
  await authorizedMutation(
    client,
    authority,
    "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
  );
  const verified = await client.query<AclRow>(SCHEMA_ACL_QUERY, ["public"]);
  assertAclExact(
    verified.rows,
    preserved,
    "Public schema privileges do not match the closed-world contract",
  );
}

async function ensureProductSchema(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
): Promise<boolean> {
  const rows = await client.query<SchemaRow>(SCHEMA_QUERY, [HOST_OWNERSHIP_SCHEMA]);
  if (rows.rows.length > 1) {
    throw incompatibleSchemaProblem(
      "Multiple canonical Heptalogos schemas were observed",
    );
  }
  const existing = rows.rows[0];
  const schemaCreated = existing === undefined;
  if (existing !== undefined && existing.owner_name !== HOST_OWNERSHIP_OWNER_ROLE) {
    throw incompatibleSchemaProblem(
      "The Heptalogos schema owner is not heptalogos_owner",
    );
  }

  if (schemaCreated) {
    await authorizedMutation(
      client,
      authority,
      `CREATE SCHEMA ${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)} AUTHORIZATION ${quoteIdentifier(HOST_OWNERSHIP_OWNER_ROLE)}`,
    );
  } else {
    const acl = await client.query<AclRow>(SCHEMA_ACL_QUERY, [HOST_OWNERSHIP_SCHEMA]);
    assertAclSubset(
      acl.rows,
      new Set(["PUBLIC:USAGE", "PUBLIC:CREATE", `${HOST_LEASE_ROLE}:USAGE`]),
      "Unexpected explicit privilege exists on the Heptalogos schema",
    );
  }
  await authorizedMutation(
    client,
    authority,
    `REVOKE ALL ON SCHEMA ${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)} FROM PUBLIC`,
  );
  await authorizedMutation(
    client,
    authority,
    `GRANT USAGE ON SCHEMA ${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)} TO ${quoteIdentifier(HOST_LEASE_ROLE)}`,
  );
  const verified = await client.query<AclRow>(SCHEMA_ACL_QUERY, [
    HOST_OWNERSHIP_SCHEMA,
  ]);
  assertAclExact(
    verified.rows,
    new Set([`${HOST_LEASE_ROLE}:USAGE`]),
    "Heptalogos schema privileges do not match the closed-world contract",
  );
  return schemaCreated;
}

async function ensureFenceTable(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
): Promise<boolean> {
  const rows = await client.query<TableRow>(TABLE_QUERY, [
    HOST_OWNERSHIP_SCHEMA,
    HOST_OWNERSHIP_FENCE_TABLE,
  ]);
  if (rows.rows.length > 1) {
    throw incompatibleSchemaProblem("Multiple HostOwnershipFence tables were observed");
  }
  const existing = rows.rows[0];
  const tableCreated = existing === undefined;
  const tableRef = `${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)}.${quoteIdentifier(HOST_OWNERSHIP_FENCE_TABLE)}`;
  if (existing !== undefined) {
    if (
      existing.owner_name !== HOST_OWNERSHIP_OWNER_ROLE ||
      existing.relkind !== "r" ||
      existing.table_name !== HOST_OWNERSHIP_FENCE_TABLE
    ) {
      throw incompatibleSchemaProblem(
        "HostOwnershipFence table ownership or kind is incompatible",
      );
    }
    const columns = await client.query<ColumnRow>(COLUMN_QUERY, [
      HOST_OWNERSHIP_SCHEMA,
      HOST_OWNERSHIP_FENCE_TABLE,
    ]);
    assertExactColumns(columns.rows);
    const constraints = await client.query<ConstraintRow>(CONSTRAINT_QUERY, [
      `${HOST_OWNERSHIP_SCHEMA}.${HOST_OWNERSHIP_FENCE_TABLE}`,
    ]);
    assertExactConstraints(constraints.rows.filter((row) => row.contype !== "n"));
    const acl = await client.query<AclRow>(TABLE_ACL_QUERY, [
      HOST_OWNERSHIP_SCHEMA,
      HOST_OWNERSHIP_FENCE_TABLE,
    ]);
    assertAclSubset(
      acl.rows,
      new Set([
        "PUBLIC:SELECT",
        "PUBLIC:INSERT",
        "PUBLIC:UPDATE",
        "PUBLIC:DELETE",
        "PUBLIC:TRUNCATE",
        "PUBLIC:REFERENCES",
        "PUBLIC:TRIGGER",
        `${HOST_LEASE_ROLE}:SELECT`,
        `${HOST_LEASE_ROLE}:UPDATE`,
      ]),
      "Unexpected explicit privilege exists on HostOwnershipFence",
    );
  } else {
    await authorizedMutation(
      client,
      authority,
      `
CREATE TABLE ${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)}.${quoteIdentifier(HOST_OWNERSHIP_FENCE_TABLE)} (
  singleton boolean NOT NULL,
  instance_id uuid NOT NULL,
  ownership_revision bigint NOT NULL,
  host_ownership_token uuid NULL,
  boot_id uuid NULL,
  CONSTRAINT host_ownership_fence_singleton_pkey PRIMARY KEY (singleton),
  CONSTRAINT host_ownership_fence_singleton_check CHECK (singleton),
  CONSTRAINT host_ownership_fence_revision_check CHECK (ownership_revision >= 0)
)`,
    );
    await authorizedMutation(
      client,
      authority,
      `ALTER TABLE ${tableRef} OWNER TO ${quoteIdentifier(HOST_OWNERSHIP_OWNER_ROLE)}`,
    );
  }
  await authorizedMutation(
    client,
    authority,
    `REVOKE ALL ON TABLE ${tableRef} FROM PUBLIC`,
  );
  await authorizedMutation(
    client,
    authority,
    `GRANT SELECT, UPDATE ON TABLE ${tableRef} TO ${quoteIdentifier(HOST_LEASE_ROLE)}`,
  );
  const verified = await client.query<AclRow>(TABLE_ACL_QUERY, [
    HOST_OWNERSHIP_SCHEMA,
    HOST_OWNERSHIP_FENCE_TABLE,
  ]);
  assertAclExact(
    verified.rows,
    new Set([`${HOST_LEASE_ROLE}:SELECT`, `${HOST_LEASE_ROLE}:UPDATE`]),
    "HostOwnershipFence privileges do not match the closed-world contract",
  );
  return tableCreated;
}

async function ensureFenceRow(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
  instanceId: InstanceId,
): Promise<boolean> {
  const rows = await client.query<FenceRow>(FENCE_QUERY);
  if (rows.rows.length > 1) {
    throw incompatibleSchemaProblem(
      "Multiple HostOwnershipFence singleton rows were observed",
    );
  }
  const existing = rows.rows[0];
  if (existing !== undefined) {
    if (existing.instance_id !== instanceId) throw instanceMismatchProblem();
    assertFenceRow(existing, instanceId);
    return false;
  }
  await authorizedMutation(
    client,
    authority,
    `
INSERT INTO ${quoteIdentifier(HOST_OWNERSHIP_SCHEMA)}.${quoteIdentifier(HOST_OWNERSHIP_FENCE_TABLE)}
  (singleton, instance_id, ownership_revision, host_ownership_token, boot_id)
VALUES (true, $1, 0, NULL, NULL)
`,
    [instanceId],
  );
  return true;
}

export async function ensureHostOwnershipSchema(
  options: OwnershipSchemaOptions,
): Promise<OwnershipSchemaResult> {
  return withBootstrapAdminClient(
    {
      port: options.port,
      database: HOST_OWNERSHIP_CANONICAL_DATABASE,
      passwordProvider: options.passwordProvider,
      clientFactory: options.clientFactory,
    },
    async (client) => {
      await ensureDatabasePrivileges(client, options.mutationAuthority);
      await ensurePublicSchemaPrivileges(client, options.mutationAuthority);
      const schemaCreated = await ensureProductSchema(
        client,
        options.mutationAuthority,
      );
      const tableCreated = await ensureFenceTable(client, options.mutationAuthority);
      const fenceRowInitialized = await ensureFenceRow(
        client,
        options.mutationAuthority,
        options.instanceId,
      );
      return { schemaCreated, tableCreated, fenceRowInitialized };
    },
  );
}
