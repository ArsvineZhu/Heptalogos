import { describe, expect, it } from "vitest";
import { parseInstanceId } from "@heptalogos/foundation-contracts";
import { deriveHostAdvisoryKey } from "../../src/advisory-key.js";
import {
  acquireHostLeaseConnection,
  type HostLeaseClient,
  type HostLeaseClientFactory,
  type HostLeaseConnectionOptions,
} from "../../src/host-lease-connection.js";

const instanceId = parseInstanceId("0197cfe0-0000-7000-8000-000000000001");
if (instanceId === undefined) throw new Error("invalid test InstanceId");
const testInstanceId = instanceId;
const mutationAuthority = { assertCurrent(): void {} };

class FakeClient implements HostLeaseClient {
  readonly queries: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];
  endCalls = 0;
  connected = false;
  lockAcquired = true;
  queryFailure: Error | undefined;
  endFailure: Error | undefined;
  private errorListener: ((error: unknown) => void) | undefined;
  private endListener: (() => void) | undefined;

  on(event: "error" | "end", listener: (error?: unknown) => void): void {
    if (event === "error") this.errorListener = listener;
    else this.endListener = () => listener();
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async query<Row>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly Row[] }> {
    this.queries.push({ text, values });
    if (this.queryFailure !== undefined) throw this.queryFailure;
    return {
      rows: [{ acquired: this.lockAcquired } as Row],
    };
  }

  async end(): Promise<void> {
    this.endCalls += 1;
    if (this.endFailure !== undefined) throw this.endFailure;
    this.endListener?.();
  }

  emitError(error = new Error("test connection error")): void {
    this.errorListener?.(error);
  }

  emitEnd(): void {
    this.endListener?.();
  }
}

function makeFixture(
  mutationAuthority: HostLeaseConnectionOptions["mutationAuthority"] = {
    assertCurrent(): void {},
  },
): {
  readonly client: FakeClient;
  readonly factory: HostLeaseClientFactory;
  readonly options: HostLeaseConnectionOptions;
  readonly createdOptions: {
    readonly keepAlive?: boolean;
    readonly keepAliveInitialDelayMillis?: number;
    readonly connectionTimeoutMs?: number;
    readonly statementTimeoutMs?: number;
  };
} {
  const client = new FakeClient();
  const createdOptions: {
    readonly keepAlive?: boolean;
    readonly keepAliveInitialDelayMillis?: number;
    readonly connectionTimeoutMs?: number;
    readonly statementTimeoutMs?: number;
  } = {};
  const factory: HostLeaseClientFactory = {
    create(options) {
      Object.assign(createdOptions, options);
      return client;
    },
  };
  return {
    client,
    factory,
    createdOptions,
    options: {
      target: { host: "127.0.0.1", port: 55436, database: "heptalogos" },
      advisoryKey: deriveHostAdvisoryKey(testInstanceId),
      mutationAuthority,
      timing: {
        connectionTimeoutMs: 1_000,
        statementTimeoutMs: 1_000,
        fenceLockTimeoutMs: 1_000,
        keepAliveInitialDelayMs: 1_000,
      },
      passwordProvider: {
        async withHostLeasePassword<T>(
          use: (passwordUtf8: Uint8Array) => Promise<T>,
        ): Promise<T> {
          return use(new TextEncoder().encode("H".repeat(32)));
        },
      },
      clientFactory: factory,
    },
  };
}

describe("HostLeaseConnection", () => {
  it("uses one dedicated client and acquires the session advisory lease", async () => {
    const fixture = makeFixture();
    const connection = await acquireHostLeaseConnection(fixture.options);

    expect(connection.state).toBe("ACTIVE");
    expect(fixture.client.connected).toBe(true);
    expect(fixture.createdOptions).toMatchObject({
      keepAlive: true,
      keepAliveInitialDelayMillis: 1_000,
      connectionTimeoutMs: 1_000,
      statementTimeoutMs: 1_000,
    });
    expect(fixture.client.queries[0]).toMatchObject({
      text: expect.stringContaining("pg_try_advisory_lock"),
      values: [418239335, -2100844247],
    });
    await connection.close();
    expect(connection.state).toBe("CLOSED");
    expect(fixture.client.endCalls).toBe(1);
  });

  it("reports advisory lease contention without returning an active connection", async () => {
    const fixture = makeFixture();
    fixture.client.lockAcquired = false;

    await expect(acquireHostLeaseConnection(fixture.options)).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.lease.busy" },
    });
    expect(fixture.client.endCalls).toBe(1);
  });

  it("fences and aborts synchronously on an unexpected client error or end", async () => {
    const fixture = makeFixture();
    const connection = await acquireHostLeaseConnection(fixture.options);

    fixture.client.emitError();
    expect(connection.state).toBe("FENCED");
    expect(connection.signal.aborted).toBe(true);
    expect(() => connection.assertActive()).toThrowError();

    fixture.client.emitEnd();
    expect(connection.state).toBe("FENCED");
    await connection.close();
    expect(connection.state).toBe("CLOSED");
  });

  it("fences a query failure and never reconnects or reacquires", async () => {
    const fixture = makeFixture();
    const connection = await acquireHostLeaseConnection(fixture.options);
    fixture.client.queryFailure = new Error("query failed");

    await expect(connection.query("SELECT 1")).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.lease.query_failed" },
    });
    expect(connection.state).toBe("FENCED");
    expect(connection.signal.aborted).toBe(true);
    await connection.close();
    expect(fixture.client.endCalls).toBe(1);
  });

  it("fences when closing the dedicated client has an uncertain outcome", async () => {
    const fixture = makeFixture();
    const connection = await acquireHostLeaseConnection(fixture.options);
    fixture.client.endFailure = new Error("close failed");

    await expect(connection.close()).rejects.toMatchObject({
      problem: { problemCode: "host-ownership.lease.close_failed" },
    });
    expect(connection.state).toBe("FENCED");
    expect(connection.signal.aborted).toBe(true);
  });

  it.each([-1, 1.5, 24 * 60 * 60 * 1000 + 1, Number.NaN])(
    "rejects invalid keepalive timing: %s",
    async (keepAliveInitialDelayMs) => {
      const fixture = makeFixture();
      await expect(
        acquireHostLeaseConnection({
          ...fixture.options,
          timing: { ...fixture.options.timing, keepAliveInitialDelayMs },
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "host-ownership.lease.invalid_timing" },
      });
      expect(fixture.client.connected).toBe(false);
    },
  );

  it.each([1, 2] as const)(
    "does not return a Host lease when bootstrap authority is lost at boundary %s",
    async (assertionNumber) => {
      let calls = 0;
      const authority = {
        assertCurrent(): void {
          calls += 1;
          if (calls === assertionNumber) throw new Error("lease authority lost");
        },
      };
      const fixture = makeFixture(authority);
      await expect(acquireHostLeaseConnection(fixture.options)).rejects.toMatchObject({
        problem: { problemCode: "host-ownership.lease.connection_failed" },
      });
      expect(fixture.client.endCalls).toBe(1);
    },
  );
});
