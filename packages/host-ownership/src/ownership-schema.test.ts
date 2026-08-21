import { describe, expect, it } from "vitest";
import { parseInstanceId } from "@heptalogos/foundation-contracts";
import {
  HOST_LEASE_ROLE,
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_OWNERSHIP_OWNER_ROLE,
  HOST_OWNERSHIP_SCHEMA,
} from "./contracts.js";
import {
  type BootstrapAdminClient,
  type BootstrapAdminClientFactory,
  type BootstrapAdminPasswordProvider,
} from "./bootstrap-admin.js";
import { ensureHostOwnershipSchema } from "./ownership-schema.js";

interface SchemaState {
  schemaExists: boolean;
  tableExists: boolean;
  schemaOwner?: string;
  tableOwner?: string;
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
  readonly databaseAcl: Array<{
    readonly grantee: string;
    readonly privilege_type: string;
  }>;
  readonly publicSchemaAcl: Array<{
    readonly grantee: string;
    readonly privilege_type: string;
  }>;
  readonly schemaAcl: Array<{
    readonly grantee: string;
    readonly privilege_type: string;
  }>;
  readonly tableAcl: Array<{
    readonly grantee: string;
    readonly privilege_type: string;
  }>;
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
      return { rows: this.state.databaseAcl as Row[] };
    }
    if (
      normalized.includes("FROM pg_catalog.pg_namespace") &&
      normalized.includes("aclexplode")
    ) {
      return {
        rows: (String(values[0]) === "public"
          ? this.state.publicSchemaAcl
          : this.state.schemaAcl) as Row[],
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
      return { rows: this.state.tableAcl as Row[] };
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
      normalized.startsWith("ALTER TABLE") ||
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
  };
  const parsedInstanceId = parseInstanceId(instanceId);
  if (parsedInstanceId === undefined) throw new Error("invalid test InstanceId");
  return {
    client,
    options: {
      port: 55436,
      instanceId: parsedInstanceId,
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
    expect(sql).toContain(`GRANT USAGE ON SCHEMA \"${HOST_OWNERSHIP_SCHEMA}\"`);
    expect(sql).toContain("GRANT SELECT, UPDATE ON");
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
});
