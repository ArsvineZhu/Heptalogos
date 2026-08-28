import { describe, expect, it } from "vitest";
import {
  createBootId,
  createHostOwnershipToken,
  parseInstanceId,
  type BootId,
  type HostOwnershipToken,
  type InstanceId,
} from "@heptalogos/foundation-contracts";
import type {
  BootstrapAdminClient,
  BootstrapAdminClientFactory,
  BootstrapAdminPasswordProvider,
} from "../../src/bootstrap-admin.js";
import {
  revokeHostOwnershipTokenForBootstrap,
  type RevokeHostOwnershipTokenOptions,
} from "../../src/ownership-revocation.js";

interface FenceRow {
  readonly singleton: boolean;
  readonly instance_id: string;
  readonly ownership_revision: string;
  readonly host_ownership_token: string | null;
  readonly boot_id: string | null;
}

class FakeAdminClient implements BootstrapAdminClient {
  readonly queries: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];
  row: FenceRow;
  failOn: string | undefined;
  commitError = false;
  afterCommitRow: FenceRow | undefined;

  constructor(instanceId: InstanceId, token: HostOwnershipToken, bootId: BootId) {
    this.row = {
      singleton: true,
      instance_id: instanceId,
      ownership_revision: "42",
      host_ownership_token: token,
      boot_id: bootId,
    };
  }

  async query<Row>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly Row[] }> {
    this.queries.push({ text, values });
    if (this.failOn !== undefined && text.includes(this.failOn)) {
      throw new Error(`injected query failure: ${this.failOn}`);
    }
    const normalized = text.replace(/\s+/gu, " ").trim();
    if (normalized.includes("FOR UPDATE")) {
      return { rows: [this.row as Row] };
    }
    if (normalized.startsWith("UPDATE")) {
      this.row = {
        ...this.row,
        ownership_revision: (BigInt(this.row.ownership_revision) + 1n).toString(),
        host_ownership_token: null,
        boot_id: null,
      };
      return { rows: [] };
    }
    if (normalized === "COMMIT") {
      if (this.commitError) throw new Error("injected ambiguous commit");
      return { rows: [] };
    }
    if (normalized.includes("SELECT singleton")) {
      return { rows: [this.afterCommitRow ?? this.row] as Row[] };
    }
    return { rows: [] };
  }

  async end(): Promise<void> {}
}

function fixture(): {
  readonly instanceId: InstanceId;
  readonly token: HostOwnershipToken;
  readonly bootId: BootId;
  readonly client: FakeAdminClient;
  readonly options: RevokeHostOwnershipTokenOptions;
} {
  const instanceId = parseInstanceId("0197cfe0-0000-7000-8000-000000000001");
  if (instanceId === undefined) throw new Error("invalid test InstanceId");
  const token = createHostOwnershipToken();
  const bootId = createBootId();
  const client = new FakeAdminClient(instanceId, token, bootId);
  const passwordProvider: BootstrapAdminPasswordProvider = {
    async withBootstrapPassword<T>(use: (value: Uint8Array) => Promise<T>) {
      return use(new TextEncoder().encode("B".repeat(32)));
    },
    async withHostLeasePassword<T>(use: (value: Uint8Array) => Promise<T>) {
      return use(new TextEncoder().encode("H".repeat(32)));
    },
    async withRuntimePassword<T>(use: (value: Uint8Array) => Promise<T>) {
      return use(new TextEncoder().encode("R".repeat(32)));
    },
    async withMigrationPassword<T>(use: (value: Uint8Array) => Promise<T>) {
      return use(new TextEncoder().encode("M".repeat(32)));
    },
    async withDurableExecutionPassword<T>(use: (value: Uint8Array) => Promise<T>) {
      return use(new TextEncoder().encode("D".repeat(32)));
    },
  };
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      return client;
    },
  };
  return {
    instanceId,
    token,
    bootId,
    client,
    options: {
      port: 55432,
      instanceId,
      bootId,
      token,
      lockTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
      passwordProvider,
      mutationAuthority: { assertCurrent() {} },
      clientFactory: factory,
    },
  };
}

describe("HostOwnershipToken bootstrap-admin revocation", () => {
  it("uses the fixed transaction order and returns exact decimal revisions", async () => {
    const fixtureValue = fixture();

    await expect(
      revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
    ).resolves.toEqual({
      previousRevision: "42",
      revokedRevision: "43",
    });

    const sql = fixtureValue.client.queries.map((query) => query.text).join("\n");
    expect(sql).toContain("BEGIN");
    expect(sql).toContain("set_config('lock_timeout'");
    expect(sql).toContain("set_config('statement_timeout'");
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain("host_ownership_token = NULL");
    expect(sql).toContain("boot_id = NULL");
    expect(sql).toContain("COMMIT");
    expect(fixtureValue.client.row).toMatchObject({
      ownership_revision: "43",
      host_ownership_token: null,
      boot_id: null,
    });
  });

  it("increments large PostgreSQL bigint revisions without JS-number coercion", async () => {
    const fixtureValue = fixture();
    fixtureValue.client.row = {
      ...fixtureValue.client.row,
      ownership_revision: "9007199254740993",
    };

    await expect(
      revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
    ).resolves.toEqual({
      previousRevision: "9007199254740993",
      revokedRevision: "9007199254740994",
    });
  });

  it.each(["instance", "token", "boot", "revision"] as const)(
    "fails closed on a mismatched fence %s",
    async (kind) => {
      const fixtureValue = fixture();
      if (kind === "instance") {
        fixtureValue.client.row = {
          ...fixtureValue.client.row,
          instance_id: "0197cfe0-0000-7000-8000-000000000002",
        };
      } else if (kind === "token") {
        fixtureValue.client.row = {
          ...fixtureValue.client.row,
          host_ownership_token: createHostOwnershipToken(),
        };
      } else if (kind === "boot") {
        fixtureValue.client.row = {
          ...fixtureValue.client.row,
          boot_id: createBootId(),
        };
      } else {
        fixtureValue.client.row = {
          ...fixtureValue.client.row,
          ownership_revision: "not-decimal",
        };
      }

      await expect(
        revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
      ).rejects.toMatchObject({
        problem: { problemCode: `host-ownership.revocation.${kind}_mismatch` },
      });
      expect(
        fixtureValue.client.queries.some((query) =>
          query.text.trimStart().startsWith("UPDATE"),
        ),
      ).toBe(false);
    },
  );

  it("classifies a failure before COMMIT as known-not-committed", async () => {
    const fixtureValue = fixture();
    fixtureValue.client.failOn = "UPDATE";

    await expect(
      revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
    ).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.revocation.known_not_committed" },
    });
    expect(fixtureValue.client.queries.map((query) => query.text)).toContain(
      "ROLLBACK",
    );
  });

  it("classifies an ambiguous COMMIT response without claiming revocation", async () => {
    const fixtureValue = fixture();
    fixtureValue.client.commitError = true;

    await expect(
      revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
    ).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.revocation.commit_uncertain" },
    });
  });

  it("classifies a committed but mismatched reread as unverified", async () => {
    const fixtureValue = fixture();
    fixtureValue.client.afterCommitRow = {
      ...fixtureValue.client.row,
      ownership_revision: "44",
    };

    await expect(
      revokeHostOwnershipTokenForBootstrap(fixtureValue.options),
    ).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.revocation.committed_unverified" },
    });
  });

  it("does not mutate after bootstrap authority is lost before BEGIN", async () => {
    const fixtureValue = fixture();
    const options = {
      ...fixtureValue.options,
      mutationAuthority: {
        assertCurrent() {
          throw new Error("bootstrap authority lost");
        },
      },
    };

    await expect(revokeHostOwnershipTokenForBootstrap(options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.revocation.known_not_committed" },
    });
    expect(fixtureValue.client.queries).toHaveLength(0);
  });
});
