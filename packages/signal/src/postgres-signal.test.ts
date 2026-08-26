import {
  createBootId,
  createContinuityEpochId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
} from "@heptalogos/foundation-contracts";
import {
  HOST_OWNERSHIP_CANONICAL_DATABASE,
  HOST_RUNTIME_ROLE,
  type HostPersistenceAuthority,
} from "@heptalogos/host-ownership";
import { describe, expect, it } from "vitest";
import {
  createPostgresSignalService,
  createSignalTopic,
  decodeSignalHint,
  encodeSignalHint,
  SIGNAL_CHANNEL,
  type SignalClient,
  type SignalClientFactory,
  type SignalNotification,
  type SignalTopic,
} from "./index.js";

class FakeSignalClient implements SignalClient {
  readonly queries: string[] = [];
  ended = false;
  private readonly listeners = new Map<string, ((value?: unknown) => void)[]>();

  constructor(private readonly connectError?: Error) {}

  async connect(): Promise<void> {
    if (this.connectError !== undefined) throw this.connectError;
  }

  async query(text: string): Promise<void> {
    this.queries.push(text);
  }

  on(
    event: "notification" | "error" | "end",
    listener: (value?: unknown) => void,
  ): void {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(listener);
    this.listeners.set(event, handlers);
  }

  async end(): Promise<void> {
    this.ended = true;
  }

  emitNotification(notification: SignalNotification): void {
    for (const listener of this.listeners.get("notification") ?? [])
      listener(notification);
  }

  emitEnd(): void {
    for (const listener of this.listeners.get("end") ?? []) listener();
  }
}

function authority(signal = new AbortController().signal): HostPersistenceAuthority {
  return {
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    bootId: createBootId(),
    continuityEpochId: createContinuityEpochId(),
    token: createHostOwnershipToken(),
    target: {
      host: "127.0.0.1",
      port: 5432,
      database: HOST_OWNERSHIP_CANONICAL_DATABASE,
      user: HOST_RUNTIME_ROLE,
    },
    signal,
    assertActive() {
      if (signal.aborted) throw new Error("authority aborted");
    },
    async withRuntimeDatabasePassword<T>(
      use: (passwordUtf8: Uint8Array) => Promise<T>,
    ) {
      return use(new TextEncoder().encode("signal-test-password"));
    },
  };
}

function options(
  factory: SignalClientFactory,
  onBackgroundError: (error: unknown) => void = () => {},
): {
  readonly connectionTimeoutMs: number;
  readonly reconnectBaseDelayMs: number;
  readonly reconnectMaxDelayMs: number;
  readonly clientFactory: SignalClientFactory;
  readonly onBackgroundError: (error: unknown) => void;
} {
  return {
    connectionTimeoutMs: 1_000,
    reconnectBaseDelayMs: 1,
    reconnectMaxDelayMs: 4,
    clientFactory: factory,
    onBackgroundError,
  };
}

function factoryFor(clients: readonly FakeSignalClient[]): SignalClientFactory {
  let index = 0;
  return {
    create() {
      const client = clients[Math.min(index, clients.length - 1)];
      index += 1;
      if (client === undefined) throw new Error("missing test client");
      return client;
    },
  };
}

async function waitFor(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 500;
  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  expect(condition()).toBe(true);
}

describe("Signal hint codec", () => {
  it("encodes the fixed V1 hint without durable WorkItem data", () => {
    const topic = createSignalTopic("work.available");
    const encoded = encodeSignalHint({ schemaVersion: 1, topic });

    expect(encoded).toBe('{"schemaVersion":1,"topic":"work.available"}');
    expect(decodeSignalHint(encoded)).toEqual({ schemaVersion: 1, topic });
    expect(encoded).not.toContain("workItemId");
    expect(encoded).not.toContain("payload");
  });

  it("rejects unknown fields, schema versions, and oversized notification payloads", () => {
    expect(() =>
      decodeSignalHint('{"schemaVersion":1,"topic":"work.available","extra":true}'),
    ).toThrowError(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "signal.hint.invalid" }),
      }),
    );
    expect(() =>
      decodeSignalHint('{"schemaVersion":2,"topic":"work.available"}'),
    ).toThrow();
    expect(() => decodeSignalHint("x".repeat(513))).toThrowError(
      expect.objectContaining({
        problem: expect.objectContaining({ problemCode: "signal.hint.too_large" }),
      }),
    );
  });
});

describe("PostgresSignalService", () => {
  it("filters topics, rescans after listener establishment, and closes idempotently", async () => {
    const client = new FakeSignalClient();
    const service = createPostgresSignalService(
      authority(),
      options(factoryFor([client])),
    );
    const matchingTopic = createSignalTopic("work.available");
    const otherTopic = createSignalTopic("runtime.changed");
    let matchingWakeups = 0;
    let otherWakeups = 0;
    let rescans = 0;
    const matching = await service.subscribe(matchingTopic, {
      onWakeup() {
        matchingWakeups += 1;
      },
      onRescanRequired() {
        rescans += 1;
      },
      onBackgroundError(error) {
        throw error;
      },
    });
    const other = await service.subscribe(otherTopic, {
      onWakeup() {
        otherWakeups += 1;
      },
      onRescanRequired() {
        rescans += 1;
      },
      onBackgroundError(error) {
        throw error;
      },
    });

    expect(client.queries).toEqual([`LISTEN "${SIGNAL_CHANNEL}"`]);
    expect(rescans).toBe(2);
    client.emitNotification({
      channel: SIGNAL_CHANNEL,
      payload: encodeSignalHint({ schemaVersion: 1, topic: matchingTopic }),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(matchingWakeups).toBe(1);
    expect(otherWakeups).toBe(0);

    await matching.close();
    await matching.close();
    await other.close();
    await other.close();
    expect(client.ended).toBe(true);
  });

  it("re-LISTENs and rescans after a connection end", async () => {
    const first = new FakeSignalClient();
    const second = new FakeSignalClient();
    const service = createPostgresSignalService(
      authority(),
      options(factoryFor([first, second])),
    );
    let rescans = 0;
    const subscription = await service.subscribe(createSignalTopic("work.available"), {
      onWakeup() {},
      onRescanRequired() {
        rescans += 1;
      },
      onBackgroundError() {},
    });

    first.emitEnd();
    await waitFor(() => second.queries.length === 1);
    expect(second.queries).toEqual([`LISTEN "${SIGNAL_CHANNEL}"`]);
    expect(rescans).toBe(2);
    await subscription.close();
  });

  it("normalizes initial listener failure to a canonical Problem", async () => {
    const client = new FakeSignalClient(new Error("connection refused"));
    const service = createPostgresSignalService(
      authority(),
      options(factoryFor([client])),
    );

    await expect(
      service.subscribe(createSignalTopic("work.available"), {
        onWakeup() {},
        onRescanRequired() {},
        onBackgroundError() {},
      }),
    ).rejects.toMatchObject({
      problem: { problemCode: "signal.listener.connection_failed" },
    });
  });

  it("reports malformed notifications through the background error seam", async () => {
    const client = new FakeSignalClient();
    const errors: unknown[] = [];
    const service = createPostgresSignalService(
      authority(),
      options(factoryFor([client]), (error) => errors.push(error)),
    );
    const subscription = await service.subscribe(createSignalTopic("work.available"), {
      onWakeup() {},
      onRescanRequired() {},
      onBackgroundError() {},
    });

    client.emitNotification({ channel: SIGNAL_CHANNEL, payload: undefined });
    await waitFor(() => errors.length === 1);
    expect(errors[0]).toMatchObject({
      problem: { problemCode: "signal.listener.invalid_notification" },
    });
    await subscription.close();
  });
});
