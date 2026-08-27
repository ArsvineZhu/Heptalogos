import { describe, expect, it } from "vitest";
import { parseInstanceId } from "@heptalogos/foundation-contracts";
import { deriveHostAdvisoryKey } from "../../src/advisory-key.js";
import type {
  BootstrapAdminClient,
  BootstrapAdminClientFactory,
} from "../../src/bootstrap-admin.js";
import {
  acquireBootstrapHostReservation,
  type BootstrapHostReservationOptions,
} from "../../src/bootstrap-admin.js";

const mutationAuthority = { assertCurrent(): void {} };

class FakeReservationClient implements BootstrapAdminClient {
  readonly queries: Array<{
    readonly text: string;
    readonly values: readonly unknown[];
  }> = [];
  readonly acquired: boolean;
  endCalls = 0;

  constructor(acquired: boolean) {
    this.acquired = acquired;
  }

  async query<Row>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly Row[] }> {
    this.queries.push({ text, values });
    if (text.includes("pg_try_advisory_lock")) {
      return { rows: [{ acquired: this.acquired } as Row] };
    }
    if (text.includes("pg_advisory_unlock")) {
      return { rows: [{ released: true } as Row] };
    }
    return { rows: [] };
  }

  async end(): Promise<void> {
    this.endCalls += 1;
  }
}

function makeOptions(
  acquired: boolean,
  mutationAuthority = { assertCurrent(): void {} },
): {
  readonly client: FakeReservationClient;
  readonly options: BootstrapHostReservationOptions;
} {
  const instanceId = parseInstanceId("0197cfe0-0000-7000-8000-000000000001");
  if (instanceId === undefined) throw new Error("invalid test InstanceId");
  const client = new FakeReservationClient(acquired);
  const factory: BootstrapAdminClientFactory = {
    async connect() {
      return client;
    },
  };
  return {
    client,
    options: {
      port: 55436,
      advisoryKey: deriveHostAdvisoryKey(instanceId),
      mutationAuthority,
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
          return use(new TextEncoder().encode("R".repeat(32)));
        },
        async withMigrationPassword<T>(
          use: (passwordUtf8: Uint8Array) => Promise<T>,
        ): Promise<T> {
          return use(new TextEncoder().encode("M".repeat(32)));
        },
      },
      clientFactory: factory,
    },
  };
}

describe("bootstrap Host reservation", () => {
  it("holds a bootstrap-admin advisory reservation until explicit release", async () => {
    const fixture = makeOptions(true);
    const reservation = await acquireBootstrapHostReservation(fixture.options);

    expect(reservation).toBeDefined();
    expect(fixture.client.queries[0]).toMatchObject({
      text: expect.stringContaining("pg_try_advisory_lock"),
    });
    await reservation?.release();
    expect(fixture.client.queries.at(-1)?.text).toContain("pg_advisory_unlock");
    expect(fixture.client.endCalls).toBe(1);
  });

  it("returns no reservation on contention and closes the admin session", async () => {
    const fixture = makeOptions(false);

    await expect(
      acquireBootstrapHostReservation(fixture.options),
    ).resolves.toBeUndefined();
    expect(fixture.client.endCalls).toBe(1);
  });

  it.each([1, 2] as const)(
    "does not retain a bootstrap reservation when authority is lost at boundary %s",
    async (assertionNumber) => {
      let calls = 0;
      const authority = {
        assertCurrent(): void {
          calls += 1;
          if (calls === assertionNumber) throw new Error("reservation authority lost");
        },
      };
      const fixture = makeOptions(true, authority);
      await expect(acquireBootstrapHostReservation(fixture.options)).rejects.toThrow(
        "reservation authority lost",
      );
      expect(fixture.client.endCalls).toBe(1);
    },
  );
});
