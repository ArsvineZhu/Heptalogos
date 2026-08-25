import { describe, expect, it } from "vitest";
import { parseInstanceId } from "@heptalogos/foundation-contracts";
import {
  HOST_LEASE_ROLE,
  HOST_MIGRATION_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
  HOST_OWNERSHIP_SCHEMA,
  HOST_RUNTIME_ROLE,
} from "./contracts.js";
import {
  type BootstrapAdminClient,
  type BootstrapAdminClientFactory,
  type BootstrapAdminPasswordProvider,
} from "./bootstrap-admin.js";
import { ensureHostOwnershipSchema } from "./ownership-schema.js";

const mutationAuthority = { assertCurrent(): void {} };

interface SchemaState {
  schemaExists: boolean;
  tableExists: boolean;
  functionExists?: boolean;
  schemaOwner?: string;
  tableOwner?: string;
  functionOwner?: string;
  functionSecurityDefiner?: boolean;
  functionLanguage?: string;
  functionResult?: string;
  functionSource?: string;
  functionConfig?: readonly string[] | null;
  readonly columns?: readonly {
    readonly column_name: string;
    readonly data_type: string;
    readonly not_null: boolean;
  }[];
  readonly constraints?: readonly {
    readonly conname: string;
    readonly contype: string;
    readonly definition: string;
  }[];
  readonly fenceRows: Array<Record<string, unknown>>;
  databaseAcl: AclFixtureRow[];
  publicSchemaAcl: AclFixtureRow[];
  schemaAcl: AclFixtureRow[];
  tableAcl: AclFixtureRow[];
  functionAcl?: AclFixtureRow[];
  readonly columnAcl?: AclFixtureRow[];
}

interface AclFixtureRow {
  readonly column_name?: string;
  readonly grantor?: string;
  readonly grantee: string;
  readonly privilege_type: string;
  readonly is_grantable?: boolean;
}

/*
 * The pre-hardening fixture format intentionally defaults fields added by the
 * PostgreSQL ACL projection. Existing fixtures represent ordinary non-grantable
 * edges; adversarial tests set is_grantable explicitly.
 */
function normalizeAclRows(rows: readonly AclFixtureRow[]): AclFixtureRow[] {
  return rows.map((row) => ({
    ...row,
    grantor: row.grantor ?? HOST_OWNERSHIP_OWNER_ROLE,
    is_grantable: row.is_grantable ?? false,
  }));
}

/*
 * Keep the fake aligned with the production query split so the column ACL
 * regression can fail before the production validator starts reading attacl.
 */
function existingSchemaState(overrides: Partial<SchemaState> = {}): SchemaState {
  return {
    schemaExists: true,
    tableExists: true,
    functionExists: true,
    fenceRows: [
      {
        singleton: true,
        instance_id: "0197cfe0-0000-7000-8000-000000000001",
        ownership_revision: "0",
        host_ownership_token: null,
        boot_id: null,
      },
    ],
    databaseAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "CONNECT" }],
    publicSchemaAcl: [],
    schemaAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "USAGE" }],
    tableAcl: [
      { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
      { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
    ],
    functionAcl: [{ grantee: HOST_RUNTIME_ROLE, privilege_type: "EXECUTE" }],
    ...overrides,
  };
}

type SchemaFault =
  | "before-schema-create"
  | "after-schema-create"
  | "before-fence-insert"
  | "after-fence-initialized";

const exactColumns = [
  { column_name: "singleton", data_type: "boolean", not_null: true },
  { column_name: "instance_id", data_type: "uuid", not_null: true },
  { column_name: "ownership_revision", data_type: "bigint", not_null: true },
  { column_name: "host_ownership_token", data_type: "uuid", not_null: false },
  { column_name: "boot_id", data_type: "uuid", not_null: false },
];

const exactConstraints = [
  {
    conname: "host_ownership_fence_revision_check",
    contype: "c",
    definition: "CHECK (ownership_revision >= 0)",
  },
  {
    conname: "host_ownership_fence_singleton_check",
    contype: "c",
    definition: "CHECK (singleton)",
  },
  {
    conname: "host_ownership_fence_singleton_pkey",
    contype: "p",
    definition: "PRIMARY KEY (singleton)",
  },
];

const exactFunctionSource = `
SELECT f.singleton,
       f.instance_id,
       f.ownership_revision,
       f.host_ownership_token,
       f.boot_id
FROM "heptalogos"."host_ownership_fence" AS f
WHERE f.singleton = true
FOR SHARE
`.trim();

class FakeSchemaClient implements BootstrapAdminClient {
  readonly calls: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];

  constructor(
    private readonly state: SchemaState,
    private fault: SchemaFault | undefined = undefined,
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
    if (normalized.includes("FROM pg_catalog.pg_database")) {
      return { rows: normalizeAclRows(this.state.databaseAcl) as Row[] };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_namespace") &&
      normalized.includes("aclexplode")
    ) {
      return {
        rows: (String(values[0]) === "public"
          ? normalizeAclRows(this.state.publicSchemaAcl)
          : normalizeAclRows(this.state.schemaAcl)) as Row[],
      };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_proc") &&
      normalized.includes("aclexplode")
    ) {
      return {
        rows: normalizeAclRows(
          this.state.functionAcl ?? [
            { grantee: HOST_RUNTIME_ROLE, privilege_type: "EXECUTE" },
          ],
        ) as Row[],
      };
    }
    if (normalized.includes("FROM pg_catalog.pg_proc")) {
      return {
        rows: this.state.functionExists
          ? ([
              {
                owner_name: this.state.functionOwner ?? HOST_OWNERSHIP_OWNER_ROLE,
                security_definer: this.state.functionSecurityDefiner ?? true,
                language_name: this.state.functionLanguage ?? "sql",
                result_definition:
                  this.state.functionResult ??
                  "TABLE(singleton boolean, instance_id uuid, ownership_revision bigint, host_ownership_token uuid, boot_id uuid)",
                source: this.state.functionSource ?? exactFunctionSource,
                config: this.state.functionConfig ?? ["search_path=pg_catalog"],
              },
            ] as Row[])
          : [],
      };
    }
    if (normalized.includes("FROM pg_catalog.pg_namespace")) {
      return {
        rows: this.state.schemaExists
          ? ([
              {
                schema_name: HOST_OWNERSHIP_SCHEMA,
                owner_name: this.state.schemaOwner ?? HOST_OWNERSHIP_OWNER_ROLE,
              },
            ] as Row[])
          : [],
      };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_class") &&
      normalized.includes("aclexplode")
    ) {
      return { rows: normalizeAclRows(this.state.tableAcl) as Row[] };
    }
    if (normalized.includes("FROM pg_catalog.pg_class")) {
      return {
        rows: this.state.tableExists
          ? ([
              {
                table_name: "host_ownership_fence",
                owner_name: this.state.tableOwner ?? HOST_OWNERSHIP_OWNER_ROLE,
                relkind: "r",
              },
            ] as Row[])
          : [],
      };
    }
    if (normalized.includes("FROM pg_catalog.pg_attribute")) {
      if (normalized.includes("aclexplode")) {
        return {
          rows: normalizeAclRows(this.state.columnAcl ?? []) as Row[],
        };
      }
      return { rows: (this.state.columns ?? exactColumns) as Row[] };
    }
    if (normalized.includes("FROM pg_catalog.pg_constraint")) {
      return { rows: (this.state.constraints ?? exactConstraints) as Row[] };
    }
    if (normalized.includes("SELECT singleton")) {
      return { rows: this.state.fenceRows as Row[] };
    }
    if (
      normalized.startsWith("CREATE SCHEMA") ||
      normalized.startsWith("CREATE TABLE") ||
      normalized.startsWith("CREATE FUNCTION") ||
      normalized.startsWith("ALTER TABLE") ||
      normalized.startsWith("ALTER FUNCTION") ||
      normalized.startsWith("REVOKE") ||
      normalized.startsWith("GRANT")
    ) {
      if (normalized.startsWith("CREATE SCHEMA")) {
        if (this.fault === "before-schema-create") {
          this.fault = undefined;
          throw new Error("injected before schema create");
        }
        this.state.schemaExists = true;
        this.state.schemaOwner = HOST_OWNERSHIP_OWNER_ROLE;
        if (this.fault === "after-schema-create") {
          this.fault = undefined;
          throw new Error("injected after schema create");
        }
      }
      if (normalized.startsWith("CREATE TABLE")) {
        this.state.tableExists = true;
        this.state.tableOwner = HOST_OWNERSHIP_OWNER_ROLE;
      }
      if (normalized.startsWith("CREATE FUNCTION")) {
        this.state.functionExists = true;
        this.state.functionOwner = HOST_OWNERSHIP_OWNER_ROLE;
      }
      if (normalized.startsWith("ALTER FUNCTION")) {
        this.state.functionOwner = HOST_OWNERSHIP_OWNER_ROLE;
      }
      if (normalized.startsWith("REVOKE ALL ON DATABASE")) {
        this.state.databaseAcl = this.state.databaseAcl.filter(
          (row) => row.grantee !== "PUBLIC",
        );
      }
      if (normalized.startsWith("GRANT CONNECT ON DATABASE")) {
        const grantee = normalized.includes(`\"${HOST_MIGRATION_ROLE}\"`)
          ? HOST_MIGRATION_ROLE
          : normalized.includes(`\"${HOST_RUNTIME_ROLE}\"`)
            ? HOST_RUNTIME_ROLE
            : HOST_LEASE_ROLE;
        this.state.databaseAcl = [
          ...this.state.databaseAcl.filter(
            (row) => !(row.grantee === grantee && row.privilege_type === "CONNECT"),
          ),
          { grantee, privilege_type: "CONNECT" },
        ];
      }
      if (normalized === "REVOKE CREATE ON SCHEMA public FROM PUBLIC") {
        this.state.publicSchemaAcl = this.state.publicSchemaAcl.filter(
          (row) => !(row.grantee === "PUBLIC" && row.privilege_type === "CREATE"),
        );
      }
      if (
        normalized.startsWith("REVOKE ALL ON SCHEMA") &&
        normalized.includes("FROM PUBLIC")
      ) {
        this.state.schemaAcl = this.state.schemaAcl.filter(
          (row) => row.grantee !== "PUBLIC",
        );
      }
      if (normalized.startsWith("GRANT USAGE ON SCHEMA")) {
        const grantee = normalized.includes(`\"${HOST_RUNTIME_ROLE}\"`)
          ? HOST_RUNTIME_ROLE
          : HOST_LEASE_ROLE;
        this.state.schemaAcl = [
          ...this.state.schemaAcl.filter(
            (row) => !(row.grantee === grantee && row.privilege_type === "USAGE"),
          ),
          { grantee, privilege_type: "USAGE" },
        ];
      }
      if (
        normalized.startsWith("REVOKE ALL ON TABLE") &&
        normalized.includes("FROM PUBLIC")
      ) {
        this.state.tableAcl = this.state.tableAcl.filter(
          (row) => row.grantee !== "PUBLIC",
        );
      }
      if (normalized.startsWith("GRANT SELECT, UPDATE ON TABLE")) {
        this.state.tableAcl = [
          ...this.state.tableAcl.filter((row) => row.grantee !== HOST_LEASE_ROLE),
          { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
          { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
        ];
      }
      if (normalized.startsWith("GRANT SELECT ON TABLE")) {
        this.state.tableAcl = [
          ...this.state.tableAcl.filter((row) => row.grantee !== HOST_RUNTIME_ROLE),
          { grantee: HOST_RUNTIME_ROLE, privilege_type: "SELECT" },
        ];
      }
      if (
        normalized.startsWith("REVOKE ALL ON FUNCTION") &&
        normalized.includes("FROM PUBLIC")
      ) {
        this.state.functionAcl = (this.state.functionAcl ?? []).filter(
          (row) => row.grantee !== "PUBLIC",
        );
      }
      if (normalized.startsWith("GRANT EXECUTE ON FUNCTION")) {
        this.state.functionAcl = [
          ...(this.state.functionAcl ?? []).filter(
            (row) => row.grantee !== HOST_RUNTIME_ROLE,
          ),
          { grantee: HOST_RUNTIME_ROLE, privilege_type: "EXECUTE" },
        ];
      }
      return { rows: [] };
    }
    if (normalized.startsWith("INSERT INTO")) {
      if (this.fault === "before-fence-insert") {
        this.fault = undefined;
        throw new Error("injected before fence singleton insert");
      }
      this.state.fenceRows.push({
        singleton: true,
        instance_id: values[0],
        ownership_revision: "0",
        host_ownership_token: null,
        boot_id: null,
      });
      if (this.fault === "after-fence-initialized") {
        this.fault = undefined;
        throw new Error("injected after fence initialized");
      }
      return { rows: [] };
    }
    throw new Error(`unexpected query: ${text}`);
  }

  async end(): Promise<void> {}
}

function makeOptions(
  instanceId: string,
  state: SchemaState,
  fault?: SchemaFault,
  authority: Parameters<
    typeof ensureHostOwnershipSchema
  >[0]["mutationAuthority"] = mutationAuthority,
): {
  readonly client: FakeSchemaClient;
  readonly options: Parameters<typeof ensureHostOwnershipSchema>[0];
} {
  const client = new FakeSchemaClient(state, fault);
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      return client;
    },
  };
  const passwordProvider: BootstrapAdminPasswordProvider = {
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
      return use(new TextEncoder().encode("R".repeat(32)));
    },
    async withMigrationPassword<T>(
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ): Promise<T> {
      return use(new TextEncoder().encode("M".repeat(32)));
    },
  };
  const parsedInstanceId = parseInstanceId(instanceId);
  if (parsedInstanceId === undefined) throw new Error("invalid test InstanceId");
  return {
    client,
    options: {
      port: 55436,
      instanceId: parsedInstanceId,
      mutationAuthority: authority,
      passwordProvider,
      clientFactory: factory,
    },
  };
}

describe("HostOwnershipFence schema", () => {
  it("creates the canonical schema, table, grants, and singleton row", async () => {
    const state: SchemaState = {
      schemaExists: false,
      tableExists: false,
      fenceRows: [],
      databaseAcl: [
        { grantee: "PUBLIC", privilege_type: "CONNECT" },
        { grantee: "PUBLIC", privilege_type: "TEMPORARY" },
      ],
      publicSchemaAcl: [
        { grantee: "PUBLIC", privilege_type: "CREATE" },
        { grantee: "PUBLIC", privilege_type: "USAGE" },
      ],
      schemaAcl: [],
      tableAcl: [],
    };
    const fixture = makeOptions("0197cfe0-0000-7000-8000-000000000001", state);

    await expect(ensureHostOwnershipSchema(fixture.options)).resolves.toMatchObject({
      schemaCreated: true,
      tableCreated: true,
      fenceRowInitialized: true,
    });

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).toContain(`CREATE SCHEMA \"${HOST_OWNERSHIP_SCHEMA}\"`);
    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain(
      `ALTER TABLE \"${HOST_OWNERSHIP_SCHEMA}\".\"host_ownership_fence\" OWNER TO \"${HOST_OWNERSHIP_OWNER_ROLE}\"`,
    );
    expect(sql).toContain("REVOKE ALL ON DATABASE");
    expect(sql).toContain("REVOKE ALL ON SCHEMA");
    expect(sql).toContain(
      `GRANT CONNECT ON DATABASE \"${HOST_OWNERSHIP_CANONICAL_DATABASE}\"`,
    );
    expect(sql).toContain(
      `GRANT CONNECT ON DATABASE \"${HOST_OWNERSHIP_CANONICAL_DATABASE}\" TO \"heptalogos_runtime\"`,
    );
    expect(sql).toContain(`GRANT USAGE ON SCHEMA \"${HOST_OWNERSHIP_SCHEMA}\"`);
    expect(sql).toContain(
      `GRANT USAGE ON SCHEMA \"${HOST_OWNERSHIP_SCHEMA}\" TO \"heptalogos_runtime\"`,
    );
    expect(sql).toContain("GRANT SELECT, UPDATE ON");
    expect(sql).toContain(
      'GRANT SELECT ON TABLE "heptalogos"."host_ownership_fence" TO "heptalogos_runtime"',
    );
    expect(sql).toContain('CREATE FUNCTION "heptalogos"."lock_host_ownership_fence"()');
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("FOR SHARE");
    expect(sql).toContain(
      'REVOKE ALL ON FUNCTION "heptalogos"."lock_host_ownership_fence"() FROM PUBLIC',
    );
    expect(sql).toContain(
      'GRANT EXECUTE ON FUNCTION "heptalogos"."lock_host_ownership_fence"() TO "heptalogos_runtime"',
    );
    expect(sql).toContain("INSERT INTO");
  });

  it("accepts an exact existing schema and fence row without recreating it", async () => {
    const state: SchemaState = {
      schemaExists: true,
      tableExists: true,
      fenceRows: [
        {
          singleton: true,
          instance_id: "0197cfe0-0000-7000-8000-000000000001",
          ownership_revision: "0",
          host_ownership_token: null,
          boot_id: null,
        },
      ],
      databaseAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "CONNECT" }],
      publicSchemaAcl: [],
      schemaAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "USAGE" }],
      tableAcl: [
        { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
        { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
      ],
    };
    const fixture = makeOptions("0197cfe0-0000-7000-8000-000000000001", state);

    await expect(ensureHostOwnershipSchema(fixture.options)).resolves.toMatchObject({
      schemaCreated: false,
      tableCreated: false,
      fenceRowInitialized: false,
    });

    const sql = fixture.client.calls.map((call) => call.text).join("\n");
    expect(sql).not.toContain("CREATE SCHEMA");
    expect(sql).not.toContain("CREATE TABLE");
    expect(sql).not.toContain("INSERT INTO");
  });

  it("fails closed when the singleton row belongs to another InstanceId", async () => {
    const state: SchemaState = {
      schemaExists: true,
      tableExists: true,
      fenceRows: [
        {
          singleton: true,
          instance_id: "0197cfe0-0000-7000-8000-000000000099",
          ownership_revision: "0",
          host_ownership_token: null,
          boot_id: null,
        },
      ],
      databaseAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "CONNECT" }],
      publicSchemaAcl: [],
      schemaAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "USAGE" }],
      tableAcl: [
        { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
        { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
      ],
    };
    const fixture = makeOptions("0197cfe0-0000-7000-8000-000000000001", state);

    await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.schema.instance_mismatch" },
    });
  });

  it("fails closed on incompatible ownership schema metadata or privileges", async () => {
    const baseState: SchemaState = {
      schemaExists: true,
      tableExists: true,
      fenceRows: [
        {
          singleton: true,
          instance_id: "0197cfe0-0000-7000-8000-000000000001",
          ownership_revision: "0",
          host_ownership_token: null,
          boot_id: null,
        },
      ],
      databaseAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "CONNECT" }],
      publicSchemaAcl: [],
      schemaAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "USAGE" }],
      tableAcl: [
        { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
        { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
      ],
    };

    const wrongOwner = makeOptions("0197cfe0-0000-7000-8000-000000000001", {
      ...baseState,
      schemaOwner: "unexpected_owner",
    });
    await expect(ensureHostOwnershipSchema(wrongOwner.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.schema.incompatible" },
    });

    const wrongGrant = makeOptions("0197cfe0-0000-7000-8000-000000000001", {
      ...baseState,
      tableAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "INSERT" }],
    });
    await expect(ensureHostOwnershipSchema(wrongGrant.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.schema.incompatible" },
    });

    const wrongColumn = makeOptions("0197cfe0-0000-7000-8000-000000000001", {
      ...baseState,
      columns: exactColumns.slice(0, 4),
    });
    await expect(ensureHostOwnershipSchema(wrongColumn.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.schema.incompatible" },
    });
  });

  it.each([
    "before-schema-create",
    "after-schema-create",
    "before-fence-insert",
    "after-fence-initialized",
  ] as const)("resumes after partial schema fault: %s", async (fault) => {
    const state: SchemaState = {
      schemaExists: false,
      tableExists: false,
      fenceRows: [],
      databaseAcl: [
        { grantee: "PUBLIC", privilege_type: "CONNECT" },
        { grantee: "PUBLIC", privilege_type: "TEMPORARY" },
      ],
      publicSchemaAcl: [
        { grantee: "PUBLIC", privilege_type: "CREATE" },
        { grantee: "PUBLIC", privilege_type: "USAGE" },
      ],
      schemaAcl: [],
      tableAcl: [],
    };
    const fixture = makeOptions("0197cfe0-0000-7000-8000-000000000001", state, fault);

    await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toThrow(
      "injected",
    );
    fixture.client.clearFault();
    await expect(ensureHostOwnershipSchema(fixture.options)).resolves.toMatchObject({
      schemaCreated: expect.any(Boolean),
      tableCreated: expect.any(Boolean),
      fenceRowInitialized: expect.any(Boolean),
    });
    expect(state.schemaExists).toBe(true);
    expect(state.tableExists).toBe(true);
    expect(state.fenceRows).toHaveLength(1);
    expect(state.fenceRows[0]).toMatchObject({
      singleton: true,
      instance_id: "0197cfe0-0000-7000-8000-000000000001",
      ownership_revision: "0",
    });
  });

  it("fails closed on an unexpected explicit database, schema, or table grantee", async () => {
    const baseState: SchemaState = {
      schemaExists: true,
      tableExists: true,
      fenceRows: [
        {
          singleton: true,
          instance_id: "0197cfe0-0000-7000-8000-000000000001",
          ownership_revision: "0",
          host_ownership_token: null,
          boot_id: null,
        },
      ],
      databaseAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "CONNECT" }],
      publicSchemaAcl: [],
      schemaAcl: [{ grantee: HOST_LEASE_ROLE, privilege_type: "USAGE" }],
      tableAcl: [
        { grantee: HOST_LEASE_ROLE, privilege_type: "SELECT" },
        { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
      ],
    };
    const cases: Array<
      Partial<Pick<SchemaState, "databaseAcl" | "schemaAcl" | "tableAcl">>
    > = [
      {
        databaseAcl: [
          { grantee: "host_ownership_intruder", privilege_type: "CONNECT" },
        ],
      },
      { schemaAcl: [{ grantee: "host_ownership_intruder", privilege_type: "USAGE" }] },
      { tableAcl: [{ grantee: "host_ownership_intruder", privilege_type: "SELECT" }] },
    ];
    for (const change of cases) {
      const fixture = makeOptions("0197cfe0-0000-7000-8000-000000000001", {
        ...baseState,
        ...change,
      });
      await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toMatchObject({
        problem: { problemCode: "host-ownership.schema.incompatible" },
      });
    }
  });

  it.each([
    {
      scope: "database",
      change: {
        databaseAcl: [
          {
            grantee: HOST_LEASE_ROLE,
            privilege_type: "CONNECT",
            is_grantable: true,
          },
        ],
      },
    },
    {
      scope: "schema",
      change: {
        schemaAcl: [
          {
            grantee: HOST_LEASE_ROLE,
            privilege_type: "USAGE",
            is_grantable: true,
          },
        ],
      },
    },
    {
      scope: "table",
      change: {
        tableAcl: [
          {
            grantee: HOST_LEASE_ROLE,
            privilege_type: "SELECT",
            is_grantable: true,
          },
          { grantee: HOST_LEASE_ROLE, privilege_type: "UPDATE" },
        ],
      },
    },
  ])(
    "fails closed when a $scope privilege has WITH GRANT OPTION",
    async ({ change }) => {
      const fixture = makeOptions(
        "0197cfe0-0000-7000-8000-000000000001",
        existingSchemaState(change),
      );
      await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toMatchObject({
        problem: { problemCode: "host-ownership.schema.incompatible" },
      });
    },
  );

  it.each([
    {
      description: "host lease role receives an unauthorized INSERT column grant",
      columnAcl: [
        {
          column_name: "instance_id",
          grantee: HOST_LEASE_ROLE,
          privilege_type: "INSERT",
        },
      ],
    },
    {
      description: "an intruder receives a column UPDATE grant",
      columnAcl: [
        {
          column_name: "host_ownership_token",
          grantee: "host_ownership_intruder",
          privilege_type: "UPDATE",
        },
      ],
    },
  ])("fails closed when $description exists", async ({ columnAcl }) => {
    const fixture = makeOptions(
      "0197cfe0-0000-7000-8000-000000000001",
      existingSchemaState({ columnAcl }),
    );
    await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.schema.incompatible" },
    });
  });

  it.each([1, 2] as const)(
    "stops schema mutation when bootstrap authority is lost at boundary %s",
    async (assertionNumber) => {
      let calls = 0;
      const authority = {
        assertCurrent(): void {
          calls += 1;
          if (calls === assertionNumber) throw new Error("schema authority lost");
        },
      };
      const state: SchemaState = {
        schemaExists: false,
        tableExists: false,
        fenceRows: [],
        databaseAcl: [
          { grantee: "PUBLIC", privilege_type: "CONNECT" },
          { grantee: "PUBLIC", privilege_type: "TEMPORARY" },
        ],
        publicSchemaAcl: [],
        schemaAcl: [],
        tableAcl: [],
      };
      const fixture = makeOptions(
        "0197cfe0-0000-7000-8000-000000000001",
        state,
        undefined,
        authority,
      );
      await expect(ensureHostOwnershipSchema(fixture.options)).rejects.toThrow(
        "schema authority lost",
      );
      if (assertionNumber === 1) {
        expect(fixture.client.calls.map((call) => call.text).join("\n")).not.toContain(
          "REVOKE ALL ON DATABASE",
        );
      } else {
        expect(fixture.client.calls.map((call) => call.text).join("\n")).toContain(
          "REVOKE ALL ON DATABASE",
        );
      }
    },
  );
});
