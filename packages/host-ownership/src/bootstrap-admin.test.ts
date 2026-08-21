import { describe, expect, it } from "vitest";
import {
  HOST_LEASE_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
} from "./contracts.js";
import {
  type BootstrapAdminClient,
  type BootstrapAdminClientFactory,
  type BootstrapAdminProvisioningOptions,
  provisionHostOwnershipDatabase,
} from "./bootstrap-admin.js";

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

interface FakeState {
  readonly roles: Map<string, RoleRow>;
  readonly databases: Map<string, DatabaseRow>;
}

function exactRole(name: string, login: boolean, connectionLimit: number): RoleRow {
  return {
    rolname: name,
    rolcanlogin: login,
    rolsuper: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
    rolconnlimit: connectionLimit,
    rolinherit: false,
  };
}

function exactDatabase(): DatabaseRow {
  return {
    datname: HOST_OWNERSHIP_CANONICAL_DATABASE,
    owner_name: HOST_OWNERSHIP_OWNER_ROLE,
    encoding_name: "UTF8",
  };
}

class FakeClient implements BootstrapAdminClient {
  readonly calls: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];

  constructor(private readonly state: FakeState) {}

  async query<Row>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly Row[] }> {
    this.calls.push({ text, values });
    const normalized = text.replace(/\s+/gu, " ").trim();
    if (normalized.includes("FROM pg_catalog.pg_roles")) {
      const role = this.state.roles.get(String(values[0]));
      return { rows: role === undefined ? [] : [role as Row] };
    }
    if (normalized.includes("FROM pg_catalog.pg_auth_members")) {
      return { rows: [] };
    }
    if (normalized.includes("FROM pg_catalog.pg_database")) {
      const database = this.state.databases.get(String(values[0]));
      return { rows: database === undefined ? [] : [database as Row] };
    }
    if (normalized.startsWith("CREATE ROLE")) {
      const host = normalized.includes(`\"${HOST_LEASE_ROLE}\"`);
      const name = host ? HOST_LEASE_ROLE : HOST_OWNERSHIP_OWNER_ROLE;
      this.state.roles.set(name, exactRole(name, host, host ? 1 : -1));
      return { rows: [] };
    }
    if (normalized.startsWith("CREATE DATABASE")) {
      this.state.databases.set(HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase());
      return { rows: [] };
    }
    throw new Error(`unexpected query: ${text}`);
  }

  async end(): Promise<void> {}
}

function makeFixture(state: FakeState): {
  readonly client: FakeClient;
  readonly factory: BootstrapAdminClientFactory;
  readonly options: BootstrapAdminProvisioningOptions;
} {
  const client = new FakeClient(state);
  const connections = { count: 0 };
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      connections.count += 1;
      return client;
    },
  };
  const options: BootstrapAdminProvisioningOptions = {
    port: 55436,
    clientFactory: factory,
    passwordProvider: {
      async withBootstrapPassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("B".repeat(32)));
      },
      async withHostLeasePassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("H".repeat(32)));
      },
    },
  };
  return { client, factory, options };
}

describe("bootstrap host ownership database provisioning", () => {
  it("creates missing least-privilege roles and canonical UTF8 database without plaintext", async () => {
    const fixture = makeFixture({ roles: new Map(), databases: new Map() });

    await expect(
      provisionHostOwnershipDatabase(fixture.options),
    ).resolves.toMatchObject({
      ownerRoleCreated: true,
      hostLeaseRoleCreated: true,
      databaseCreated: true,
    });

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).toContain(`CREATE ROLE \"${HOST_OWNERSHIP_OWNER_ROLE}\"`);
    expect(sql).toContain(`CREATE ROLE \"${HOST_LEASE_ROLE}\"`);
    expect(sql).toContain(
      "NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT",
    );
    expect(sql).toContain(
      "LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 1",
    );
    expect(sql).toContain(`CREATE DATABASE \"${HOST_OWNERSHIP_CANONICAL_DATABASE}\"`);
    expect(sql).toContain("SCRAM-SHA-256$4096:");
    expect(sql).not.toContain("B".repeat(32));
    expect(sql).not.toContain("H".repeat(32));
  });

  it("accepts exact existing objects without ALTER or password reset", async () => {
    const fixture = makeFixture({
      roles: new Map([
        [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
        [HOST_LEASE_ROLE, exactRole(HOST_LEASE_ROLE, true, 1)],
      ]),
      databases: new Map([[HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase()]]),
    });

    await expect(
      provisionHostOwnershipDatabase(fixture.options),
    ).resolves.toMatchObject({
      ownerRoleCreated: false,
      hostLeaseRoleCreated: false,
      databaseCreated: false,
    });

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).not.toContain("CREATE ROLE");
    expect(sql).not.toContain("CREATE DATABASE");
    expect(sql).not.toContain("ALTER ROLE");
  });

  it("fails closed on incompatible roles or database ownership", async () => {
    const roleFixture = makeFixture({
      roles: new Map([[HOST_LEASE_ROLE, { ...exactRole(HOST_LEASE_ROLE, true, 2) }]]),
      databases: new Map(),
    });
    await expect(
      provisionHostOwnershipDatabase(roleFixture.options),
    ).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.bootstrap_admin.incompatible_role" },
    });

    const databaseFixture = makeFixture({
      roles: new Map([
        [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
        [HOST_LEASE_ROLE, exactRole(HOST_LEASE_ROLE, true, 1)],
      ]),
      databases: new Map([
        [
          HOST_OWNERSHIP_CANONICAL_DATABASE,
          { ...exactDatabase(), owner_name: "unexpected_owner" },
        ],
      ]),
    });
    await expect(
      provisionHostOwnershipDatabase(databaseFixture.options),
    ).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.bootstrap_admin.incompatible_database" },
    });
  });
});
