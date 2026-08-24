import { describe, expect, it } from "vitest";
import {
  HOST_LEASE_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
  HOST_RUNTIME_ROLE,
  HOST_MIGRATION_ROLE,
} from "./contracts.js";
import {
  type BootstrapAdminClient,
  type BootstrapAdminClientFactory,
  inspectCanonicalHostDatabase,
  inspectHostOwnershipCanonicalSnapshot,
  type BootstrapAdminProvisioningOptions,
  provisionHostOwnershipDatabase,
} from "./bootstrap-admin.js";
import { encodePostgresScramSha256Verifier } from "./scram-verifier.js";

const HOST_PASSWORD = new TextEncoder().encode("H".repeat(32));
const HOST_SALT = new TextEncoder().encode("salt-for-test-16");
const EXACT_HOST_VERIFIER = encodePostgresScramSha256Verifier(HOST_PASSWORD, {
  iterations: 4096,
  salt: HOST_SALT,
});
const RUNTIME_PASSWORD = new TextEncoder().encode("R".repeat(32));
const RUNTIME_SALT = new TextEncoder().encode("runtime-salt-016");
const EXACT_RUNTIME_VERIFIER = encodePostgresScramSha256Verifier(RUNTIME_PASSWORD, {
  iterations: 4096,
  salt: RUNTIME_SALT,
});
const MIGRATION_PASSWORD = new TextEncoder().encode("M".repeat(32));
const MIGRATION_SALT = new TextEncoder().encode("migration-salt16");
const EXACT_MIGRATION_VERIFIER = encodePostgresScramSha256Verifier(MIGRATION_PASSWORD, {
  iterations: 4096,
  salt: MIGRATION_SALT,
});
const mutationAuthority = { assertCurrent(): void {} };

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
  readonly rolpassword: string | null;
}

interface DatabaseRow {
  readonly datname: string;
  readonly owner_name: string;
  readonly encoding_name: string;
}

interface MembershipRow {
  readonly member_role: string;
  readonly granted_role: string;
  readonly admin_option: boolean;
  readonly inherit_option?: boolean;
  readonly set_option?: boolean;
}

interface FakeState {
  readonly roles: Map<string, RoleRow>;
  readonly databases: Map<string, DatabaseRow>;
  membershipRows?: MembershipRow[];
}

type ProvisionFault =
  | "after-owner-role-create"
  | "before-host-role-create"
  | "after-host-role-create"
  | "before-database-create"
  | "after-database-create";

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
    rolpassword: login
      ? name === HOST_RUNTIME_ROLE
        ? EXACT_RUNTIME_VERIFIER
        : name === HOST_MIGRATION_ROLE
          ? EXACT_MIGRATION_VERIFIER
          : EXACT_HOST_VERIFIER
      : null,
  };
}

function exactDatabase(): DatabaseRow {
  return {
    datname: HOST_OWNERSHIP_CANONICAL_DATABASE,
    owner_name: HOST_OWNERSHIP_OWNER_ROLE,
    encoding_name: "UTF8",
  };
}

function exactProvisionedState(
  migrationRole: RoleRow = exactRole(HOST_MIGRATION_ROLE, true, 1),
  membershipRows: MembershipRow[] = [
    {
      member_role: HOST_MIGRATION_ROLE,
      granted_role: HOST_OWNERSHIP_OWNER_ROLE,
      admin_option: false,
      inherit_option: false,
      set_option: true,
    },
  ],
): FakeState {
  return {
    roles: new Map([
      [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
      [HOST_LEASE_ROLE, exactRole(HOST_LEASE_ROLE, true, 1)],
      [HOST_RUNTIME_ROLE, exactRole(HOST_RUNTIME_ROLE, true, -1)],
      [HOST_MIGRATION_ROLE, migrationRole],
    ]),
    databases: new Map([[HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase()]]),
    membershipRows,
  };
}

class FakeClient implements BootstrapAdminClient {
  readonly calls: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];

  constructor(
    private readonly state: FakeState,
    private fault: ProvisionFault | undefined,
  ) {}

  clearFault(): void {
    this.fault = undefined;
  }

  async query<Row>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly Row[] }> {
    this.calls.push({ text, values });
    const normalized = text.replace(/\s+/gu, " ").trim();
    if (normalized.includes("FROM pg_catalog.pg_auth_members")) {
      return { rows: (this.state.membershipRows ?? []) as Row[] };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_roles") ||
      normalized.includes("FROM pg_catalog.pg_authid")
    ) {
      const roles = values
        .map((value) => this.state.roles.get(String(value)))
        .filter((role): role is RoleRow => role !== undefined);
      return { rows: roles as Row[] };
    }
    if (normalized.includes("FROM pg_catalog.pg_database")) {
      const database = this.state.databases.get(String(values[0]));
      return { rows: database === undefined ? [] : [database as Row] };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_namespace") ||
      normalized.includes("FROM pg_catalog.pg_class") ||
      normalized.includes('FROM "heptalogos"."host_ownership_fence"')
    ) {
      return { rows: [] };
    }
    if (normalized.startsWith("CREATE ROLE")) {
      const host = normalized.includes(`\"${HOST_LEASE_ROLE}\"`);
      const runtime = normalized.includes(`\"${HOST_RUNTIME_ROLE}\"`);
      const migration = normalized.includes(`\"${HOST_MIGRATION_ROLE}\"`);
      if (host && this.fault === "before-host-role-create") {
        this.fault = undefined;
        throw new Error("injected before host role create");
      }
      const name = host
        ? HOST_LEASE_ROLE
        : runtime
          ? HOST_RUNTIME_ROLE
          : migration
            ? HOST_MIGRATION_ROLE
            : HOST_OWNERSHIP_OWNER_ROLE;
      this.state.roles.set(
        name,
        exactRole(name, host || runtime || migration, host || migration ? 1 : -1),
      );
      if (
        (!host && this.fault === "after-owner-role-create") ||
        (host && this.fault === "after-host-role-create")
      ) {
        this.fault = undefined;
        throw new Error(`injected after ${host ? "host" : "owner"} role create`);
      }
      return { rows: [] };
    }
    if (
      normalized.startsWith("REVOKE CONNECT") ||
      normalized.startsWith("GRANT CONNECT")
    ) {
      return { rows: [] };
    }
    if (normalized.startsWith("GRANT")) {
      this.state.membershipRows = [
        {
          member_role: HOST_MIGRATION_ROLE,
          granted_role: HOST_OWNERSHIP_OWNER_ROLE,
          admin_option: false,
          inherit_option: false,
          set_option: true,
        },
      ];
      return { rows: [] };
    }
    if (normalized.startsWith("CREATE DATABASE")) {
      if (this.fault === "before-database-create") {
        this.fault = undefined;
        throw new Error("injected before database create");
      }
      this.state.databases.set(HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase());
      if (this.fault === "after-database-create") {
        this.fault = undefined;
        throw new Error("injected after database create");
      }
      return { rows: [] };
    }
    throw new Error(`unexpected query: ${text}`);
  }

  async end(): Promise<void> {}
}

function makeFixture(
  state: FakeState,
  authority: BootstrapAdminProvisioningOptions["mutationAuthority"] = mutationAuthority,
): {
  readonly client: FakeClient;
  readonly factory: BootstrapAdminClientFactory;
  readonly options: BootstrapAdminProvisioningOptions;
} {
  const client = new FakeClient(state, undefined);
  const connections = { count: 0 };
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      connections.count += 1;
      return client;
    },
  };
  const options: BootstrapAdminProvisioningOptions = {
    port: 55436,
    mutationAuthority: authority,
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
      async withRuntimePassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(RUNTIME_PASSWORD);
      },
      async withMigrationPassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("M".repeat(32)));
      },
    },
  };
  return { client, factory, options };
}

function makeFaultFixture(
  state: FakeState,
  fault: ProvisionFault,
  authority: BootstrapAdminProvisioningOptions["mutationAuthority"] = mutationAuthority,
): {
  readonly client: FakeClient;
  readonly options: BootstrapAdminProvisioningOptions;
} {
  const client = new FakeClient(state, fault);
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      return client;
    },
  };
  const options: BootstrapAdminProvisioningOptions = {
    port: 55436,
    mutationAuthority: authority,
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
        return use(HOST_PASSWORD);
      },
      async withRuntimePassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(RUNTIME_PASSWORD);
      },
      async withMigrationPassword<T>(
        use: (passwordUtf8: Uint8Array) => Promise<T>,
      ): Promise<T> {
        return use(new TextEncoder().encode("M".repeat(32)));
      },
    },
  };
  return { client, options };
}

function authorityThatFailsAt(assertionNumber: number): {
  readonly authority: BootstrapAdminProvisioningOptions["mutationAuthority"];
  readonly calls: () => number;
} {
  let calls = 0;
  return {
    authority: {
      assertCurrent() {
        calls += 1;
        if (calls === assertionNumber) throw new Error("bootstrap authority lost");
      },
    },
    calls: () => calls,
  };
}

describe("bootstrap host ownership database provisioning", () => {
  it("creates missing least-privilege roles and canonical UTF8 database without plaintext", async () => {
    const fixture = makeFixture({ roles: new Map(), databases: new Map() });

    await expect(
      provisionHostOwnershipDatabase(fixture.options),
    ).resolves.toMatchObject({
      ownerRoleCreated: true,
      hostLeaseRoleCreated: true,
      runtimeRoleCreated: true,
      migrationRoleCreated: true,
      databaseCreated: true,
    });

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).toContain(`CREATE ROLE \"${HOST_OWNERSHIP_OWNER_ROLE}\"`);
    expect(sql).toContain(`CREATE ROLE \"${HOST_LEASE_ROLE}\"`);
    expect(sql).toContain('CREATE ROLE "heptalogos_migration"');
    expect(sql).toContain(
      "NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT",
    );
    expect(sql).toContain(
      "LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 1",
    );
    expect(sql).toContain(`CREATE DATABASE \"${HOST_OWNERSHIP_CANONICAL_DATABASE}\"`);
    expect(sql).toContain(
      `REVOKE CONNECT ON DATABASE \"${HOST_OWNERSHIP_CANONICAL_DATABASE}\" FROM PUBLIC`,
    );
    expect(sql).toContain("GRANT CONNECT ON DATABASE");
    expect(sql).toContain(HOST_MIGRATION_ROLE);
    expect(sql).toContain("SCRAM-SHA-256$4096:");
    expect(sql).not.toContain("B".repeat(32));
    expect(sql).not.toContain("H".repeat(32));
  });

  it("creates a distinct least-privilege runtime role", async () => {
    const fixture = makeFixture({ roles: new Map(), databases: new Map() });

    await provisionHostOwnershipDatabase(fixture.options);

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).toContain(
      'CREATE ROLE "heptalogos_runtime" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT -1',
    );
  });

  it("provisions the migration role with the exact membership closure", async () => {
    const state: FakeState = { roles: new Map(), databases: new Map() };
    const fixture = makeFixture(state);

    await provisionHostOwnershipDatabase(fixture.options);

    expect(state.roles.get(HOST_MIGRATION_ROLE)).toMatchObject(
      exactRole(HOST_MIGRATION_ROLE, true, 1),
    );
    expect(state.membershipRows).toEqual([
      {
        member_role: HOST_MIGRATION_ROLE,
        granted_role: HOST_OWNERSHIP_OWNER_ROLE,
        admin_option: false,
        inherit_option: false,
        set_option: true,
      },
    ]);
    await provisionHostOwnershipDatabase(fixture.options);
    const membershipQuery = fixture.client.calls.find((call) =>
      call.text.includes("FROM pg_catalog.pg_auth_members"),
    );
    expect(membershipQuery?.text).toContain("inherit_option");
    expect(membershipQuery?.text).toContain("set_option");
  });

  it("rejects an incompatible existing migration role", async () => {
    const fixture = makeFixture(
      exactProvisionedState({
        ...exactRole(HOST_MIGRATION_ROLE, true, 1),
        rolconnlimit: 2,
      }),
    );

    await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toMatchObject(
      { problem: { problemCode: "host-ownership.bootstrap_admin.incompatible_role" } },
    );
  });

  it("rejects wrong or extra protected-role membership edges", async () => {
    const fixture = makeFixture(
      exactProvisionedState(exactRole(HOST_MIGRATION_ROLE, true, 1), [
        {
          member_role: HOST_MIGRATION_ROLE,
          granted_role: HOST_RUNTIME_ROLE,
          admin_option: false,
          inherit_option: false,
          set_option: true,
        },
        {
          member_role: HOST_RUNTIME_ROLE,
          granted_role: HOST_OWNERSHIP_OWNER_ROLE,
          admin_option: false,
          inherit_option: false,
          set_option: true,
        },
      ]),
    );

    await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toMatchObject(
      { problem: { problemCode: "host-ownership.bootstrap_admin.incompatible_role" } },
    );
  });

  it("rejects a migration credential mismatch without resetting it", async () => {
    const fixture = makeFixture(
      exactProvisionedState({
        ...exactRole(HOST_MIGRATION_ROLE, true, 1),
        rolpassword: EXACT_RUNTIME_VERIFIER,
      }),
    );

    await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toMatchObject(
      {
        problem: { problemCode: "host-ownership.bootstrap_admin.credential_mismatch" },
      },
    );
    expect(fixture.client.calls.map((call) => call.text).join("\n")).not.toContain(
      "ALTER ROLE",
    );
  });

  it("accepts exact existing objects without ALTER or password reset", async () => {
    const fixture = makeFixture({
      roles: new Map([
        [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
        [HOST_LEASE_ROLE, exactRole(HOST_LEASE_ROLE, true, 1)],
        [HOST_RUNTIME_ROLE, exactRole(HOST_RUNTIME_ROLE, true, -1)],
        [HOST_MIGRATION_ROLE, exactRole(HOST_MIGRATION_ROLE, true, 1)],
      ]),
      databases: new Map([[HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase()]]),
      membershipRows: [
        {
          member_role: HOST_MIGRATION_ROLE,
          granted_role: HOST_OWNERSHIP_OWNER_ROLE,
          admin_option: false,
          inherit_option: false,
          set_option: true,
        },
      ],
    });

    await expect(
      provisionHostOwnershipDatabase(fixture.options),
    ).resolves.toMatchObject({
      ownerRoleCreated: false,
      hostLeaseRoleCreated: false,
      runtimeRoleCreated: false,
      migrationRoleCreated: false,
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

  it("fails closed on an existing host credential mismatch without resetting it", async () => {
    const fixture = makeFixture({
      roles: new Map([
        [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
        [
          HOST_LEASE_ROLE,
          {
            ...exactRole(HOST_LEASE_ROLE, true, 1),
            rolpassword: encodePostgresScramSha256Verifier(
              new TextEncoder().encode("W".repeat(32)),
              { iterations: 4096, salt: HOST_SALT },
            ),
          },
        ],
      ]),
      databases: new Map(),
    });

    await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toMatchObject(
      {
        problem: { problemCode: "host-ownership.bootstrap_admin.credential_mismatch" },
      },
    );
    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).not.toContain("ALTER ROLE");
    expect(sql).not.toContain("PASSWORD");
  });

  it.each([
    "after-owner-role-create",
    "before-host-role-create",
    "after-host-role-create",
    "before-database-create",
    "after-database-create",
  ] as const)("resumes after partial provisioning fault: %s", async (fault) => {
    const state: FakeState = { roles: new Map(), databases: new Map() };
    const fixture = makeFaultFixture(state, fault);

    await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toThrow(
      "injected",
    );
    fixture.client.clearFault();
    await expect(
      provisionHostOwnershipDatabase(fixture.options),
    ).resolves.toMatchObject({
      ownerRoleCreated: expect.any(Boolean),
      hostLeaseRoleCreated: expect.any(Boolean),
      databaseCreated: expect.any(Boolean),
    });
    expect(state.roles.get(HOST_OWNERSHIP_OWNER_ROLE)).toMatchObject(
      exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1),
    );
    expect(state.roles.get(HOST_LEASE_ROLE)).toMatchObject(
      exactRole(HOST_LEASE_ROLE, true, 1),
    );
    expect(state.databases.get(HOST_OWNERSHIP_CANONICAL_DATABASE)).toEqual(
      exactDatabase(),
    );
  });

  it.each([1, 2] as const)(
    "stops provisioning when bootstrap authority is lost at mutation boundary %s",
    async (assertionNumber) => {
      const state: FakeState = { roles: new Map(), databases: new Map() };
      const authority = authorityThatFailsAt(assertionNumber);
      const fixture = makeFixture(state, authority.authority);

      await expect(provisionHostOwnershipDatabase(fixture.options)).rejects.toThrow(
        "bootstrap authority lost",
      );
      if (assertionNumber === 1) {
        expect(fixture.client.calls.map((call) => call.text).join("\n")).not.toContain(
          "CREATE ROLE",
        );
      } else {
        expect(state.roles.has(HOST_OWNERSHIP_OWNER_ROLE)).toBe(true);
        expect(state.roles.has(HOST_LEASE_ROLE)).toBe(false);
      }
    },
  );

  it("rejects every protected-role membership direction", async () => {
    const directions = [
      [HOST_OWNERSHIP_OWNER_ROLE, HOST_LEASE_ROLE],
      [HOST_LEASE_ROLE, HOST_OWNERSHIP_OWNER_ROLE],
      ["m4_intruder", HOST_OWNERSHIP_OWNER_ROLE],
      [HOST_OWNERSHIP_OWNER_ROLE, "m4_intruder"],
    ] as const;
    for (const [member_role, granted_role] of directions) {
      const fixture = makeFixture({
        roles: new Map([
          [HOST_OWNERSHIP_OWNER_ROLE, exactRole(HOST_OWNERSHIP_OWNER_ROLE, false, -1)],
          [HOST_LEASE_ROLE, exactRole(HOST_LEASE_ROLE, true, 1)],
        ]),
        databases: new Map(),
        membershipRows: [{ member_role, granted_role, admin_option: false }],
      });
      await expect(
        provisionHostOwnershipDatabase(fixture.options),
      ).rejects.toMatchObject({
        problem: { problemCode: "host-ownership.bootstrap_admin.incompatible_role" },
      });
    }
  });

  it("inspects the canonical database without provisioning mutation", async () => {
    const absent = makeFixture({ roles: new Map(), databases: new Map() });
    await expect(
      inspectCanonicalHostDatabase({
        port: absent.options.port,
        passwordProvider: absent.options.passwordProvider,
        mutationAuthority,
        clientFactory: absent.options.clientFactory,
      }),
    ).resolves.toEqual({ exists: false });
    expect(absent.client.calls.map((call) => call.text).join("\n")).not.toContain(
      "CREATE",
    );

    const present = makeFixture({
      roles: new Map(),
      databases: new Map([[HOST_OWNERSHIP_CANONICAL_DATABASE, exactDatabase()]]),
    });
    await expect(
      inspectCanonicalHostDatabase({
        port: present.options.port,
        passwordProvider: present.options.passwordProvider,
        mutationAuthority,
        clientFactory: present.options.clientFactory,
      }),
    ).resolves.toMatchObject({ exists: true, database: exactDatabase() });
  });

  it("includes the migration principal in the canonical ownership snapshot", async () => {
    const fixture = makeFixture(exactProvisionedState());

    const snapshot = await inspectHostOwnershipCanonicalSnapshot({
      port: fixture.options.port,
      passwordProvider: fixture.options.passwordProvider,
      clientFactory: fixture.options.clientFactory,
    });

    expect(snapshot.roles.map((role) => role.rolname).sort()).toEqual(
      [
        HOST_LEASE_ROLE,
        HOST_MIGRATION_ROLE,
        HOST_OWNERSHIP_OWNER_ROLE,
        HOST_RUNTIME_ROLE,
      ].sort(),
    );
    const roleQuery = fixture.client.calls.find((call) =>
      call.text.includes("FROM pg_catalog.pg_roles"),
    );
    expect(roleQuery?.text).toContain("rolname IN ($1, $2, $3, $4)");
    expect(roleQuery?.values).toEqual([
      HOST_OWNERSHIP_OWNER_ROLE,
      HOST_LEASE_ROLE,
      HOST_RUNTIME_ROLE,
      HOST_MIGRATION_ROLE,
    ]);
  });
});
