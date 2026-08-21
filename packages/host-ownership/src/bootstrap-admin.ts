import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";
import {
  HOST_LEASE_ROLE,
  HOST_LEASE_SCRAM_ITERATIONS,
  HOST_LEASE_SCRAM_SALT_BYTES,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
} from "./contracts.js";
import { encodePostgresScramSha256Verifier } from "./scram-verifier.js";

export interface BootstrapAdminQueryResult<Row> {
  readonly rows: readonly Row[];
}

export interface BootstrapAdminClient {
  query<Row>(
    text: string,
    values?: readonly unknown[],
  ): Promise<BootstrapAdminQueryResult<Row>>;
  end(): Promise<void>;
}

export interface BootstrapAdminConnectionOptions {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
}

export interface BootstrapAdminClientFactory {
  connect(options: BootstrapAdminConnectionOptions): Promise<BootstrapAdminClient>;
}

export interface BootstrapAdminPasswordProvider {
  withBootstrapPassword<T>(use: (passwordUtf8: Uint8Array) => Promise<T>): Promise<T>;
  withHostLeasePassword<T>(use: (passwordUtf8: Uint8Array) => Promise<T>): Promise<T>;
}

export interface BootstrapAdminProvisioningOptions {
  readonly port: number;
  readonly passwordProvider: BootstrapAdminPasswordProvider;
  /** Test-only structural seam; production uses the private pg adapter. */
  readonly clientFactory?: unknown;
}

export interface BootstrapAdminProvisioningResult {
  readonly ownerRoleCreated: boolean;
  readonly hostLeaseRoleCreated: boolean;
  readonly databaseCreated: boolean;
}

export interface BootstrapAdminSessionOptions {
  readonly port: number;
  readonly database: string;
  readonly passwordProvider: BootstrapAdminPasswordProvider;
  readonly clientFactory?: unknown;
}

interface RoleRow {
  readonly rolname: string;
  readonly rolcanlogin: boolean;
  readonly rolsuper: boolean;
  readonly rolcreatedb: boolean;
  readonly rolcreaterole: boolean;
  readonly rolreplication: boolean;
  readonly rolbypassrls: boolean;
  readonly rolconnlimit: number;
  readonly rolinherit: boolean;
}

interface DatabaseRow {
  readonly datname: string;
  readonly owner_name: string;
  readonly encoding_name: string;
}

const ROLE_QUERY = `
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole,
       rolreplication, rolbypassrls, rolconnlimit, rolinherit
FROM pg_catalog.pg_roles
WHERE rolname = $1
`;

const MEMBERSHIP_QUERY = `
SELECT granted_role.rolname AS granted_role, memberships.admin_option
FROM pg_catalog.pg_auth_members AS memberships
JOIN pg_catalog.pg_roles AS member ON member.oid = memberships.member
JOIN pg_catalog.pg_roles AS granted_role ON granted_role.oid = memberships.roleid
WHERE member.rolname = $1
`;

const DATABASE_QUERY = `
SELECT datname, pg_get_userbyid(datdba) AS owner_name,
       pg_encoding_to_char(encoding) AS encoding_name
FROM pg_catalog.pg_database
WHERE datname = $1
`;

function provisioningProblem(
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

function incompatibleRoleProblem(roleName: string): ProblemError {
  return provisioningProblem(
    "host-ownership.bootstrap_admin.incompatible_role",
    "Host ownership role is incompatible",
    `Existing PostgreSQL role ${roleName} does not satisfy the fixed least-privilege contract`,
  );
}

function incompatibleDatabaseProblem(): ProblemError {
  return provisioningProblem(
    "host-ownership.bootstrap_admin.incompatible_database",
    "Host ownership database is incompatible",
    `Existing PostgreSQL database ${HOST_OWNERSHIP_CANONICAL_DATABASE} does not satisfy the fixed ownership contract`,
  );
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw provisioningProblem(
      "host-ownership.bootstrap_admin.invalid_bootstrap_credential",
      "Bootstrap credential is invalid UTF-8",
      "The bootstrap PostgreSQL credential could not be decoded as UTF-8",
    );
  }
}

function roleIsExact(
  role: RoleRow,
  expectedLogin: boolean,
  expectedConnectionLimit: number,
): boolean {
  return (
    role.rolcanlogin === expectedLogin &&
    role.rolsuper === false &&
    role.rolcreatedb === false &&
    role.rolcreaterole === false &&
    role.rolreplication === false &&
    role.rolbypassrls === false &&
    role.rolconnlimit === expectedConnectionLimit &&
    role.rolinherit === false
  );
}

async function ensureRole(
  client: BootstrapAdminClient,
  roleName: string,
  expectedLogin: boolean,
  expectedConnectionLimit: number,
  verifier: string | undefined,
): Promise<boolean> {
  const roles = await client.query<RoleRow>(ROLE_QUERY, [roleName]);
  if (roles.rows.length > 1) throw incompatibleRoleProblem(roleName);
  const existing = roles.rows[0];
  if (existing !== undefined) {
    const memberships = await client.query(MEMBERSHIP_QUERY, [roleName]);
    if (
      !roleIsExact(existing, expectedLogin, expectedConnectionLimit) ||
      memberships.rows.length !== 0
    ) {
      throw incompatibleRoleProblem(roleName);
    }
    return false;
  }

  const privilegeClauses = [
    expectedLogin ? "LOGIN" : "NOLOGIN",
    "NOSUPERUSER",
    "NOCREATEDB",
    "NOCREATEROLE",
    "NOREPLICATION",
    "NOBYPASSRLS",
    "NOINHERIT",
  ];
  const connectionClause = expectedLogin ? " CONNECTION LIMIT 1" : "";
  const passwordClause =
    verifier === undefined ? "" : ` PASSWORD ${quoteLiteral(verifier)}`;
  await client.query(
    `CREATE ROLE ${quoteIdentifier(roleName)} ${privilegeClauses.join(" ")}${connectionClause}${passwordClause}`,
  );
  return true;
}

async function ensureDatabase(client: BootstrapAdminClient): Promise<boolean> {
  const databases = await client.query<DatabaseRow>(DATABASE_QUERY, [
    HOST_OWNERSHIP_CANONICAL_DATABASE,
  ]);
  if (databases.rows.length > 1) throw incompatibleDatabaseProblem();
  const existing = databases.rows[0];
  if (existing !== undefined) {
    if (
      existing.owner_name !== HOST_OWNERSHIP_OWNER_ROLE ||
      existing.encoding_name !== "UTF8" ||
      existing.datname !== HOST_OWNERSHIP_CANONICAL_DATABASE
    ) {
      throw incompatibleDatabaseProblem();
    }
    return false;
  }

  await client.query(
    `CREATE DATABASE ${quoteIdentifier(HOST_OWNERSHIP_CANONICAL_DATABASE)} OWNER ${quoteIdentifier(HOST_OWNERSHIP_OWNER_ROLE)} ENCODING 'UTF8' TEMPLATE template0`,
  );
  return true;
}

const defaultClientFactory: BootstrapAdminClientFactory = {
  async connect(options) {
    const client = new Client(options);
    await client.connect();
    return {
      async query<Row>(text: string, values: readonly unknown[] = []) {
        const result = await client.query(text, [...values]);
        return { rows: result.rows as Row[] };
      },
      end: () => client.end(),
    };
  },
};

export async function withBootstrapAdminClient<T>(
  options: BootstrapAdminSessionOptions,
  use: (client: BootstrapAdminClient) => Promise<T>,
): Promise<T> {
  const factory =
    (options.clientFactory as BootstrapAdminClientFactory | undefined) ??
    defaultClientFactory;
  return options.passwordProvider.withBootstrapPassword(async (passwordUtf8) => {
    const admin = await factory.connect({
      host: "127.0.0.1",
      port: options.port,
      database: options.database,
      user: "heptalogos_bootstrap",
      password: decodeUtf8(passwordUtf8),
    });
    try {
      return await use(admin);
    } finally {
      await admin.end();
    }
  });
}

export async function provisionHostOwnershipDatabase(
  options: BootstrapAdminProvisioningOptions,
): Promise<BootstrapAdminProvisioningResult> {
  return withBootstrapAdminClient(
    {
      port: options.port,
      database: "postgres",
      passwordProvider: options.passwordProvider,
      clientFactory: options.clientFactory,
    },
    async (admin) => {
      const ownerRoleCreated = await ensureRole(
        admin,
        HOST_OWNERSHIP_OWNER_ROLE,
        false,
        -1,
        undefined,
      );
      return options.passwordProvider.withHostLeasePassword(
        async (hostLeasePasswordUtf8) => {
          const verifier = encodePostgresScramSha256Verifier(hostLeasePasswordUtf8, {
            iterations: HOST_LEASE_SCRAM_ITERATIONS,
            salt: randomBytes(HOST_LEASE_SCRAM_SALT_BYTES),
          });
          const hostLeaseRoleCreated = await ensureRole(
            admin,
            HOST_LEASE_ROLE,
            true,
            1,
            verifier,
          );
          const databaseCreated = await ensureDatabase(admin);
          return { ownerRoleCreated, hostLeaseRoleCreated, databaseCreated };
        },
      );
    },
  );
}
