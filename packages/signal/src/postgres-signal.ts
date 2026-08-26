import { CompiledQuery } from "kysely";
import { Client } from "pg";
import {
  decodeSignalHint,
  encodeSignalHint,
  parseSignalTopic,
  SIGNAL_CHANNEL,
} from "./hint-codec.js";
import type {
  PostgresSignalRuntimeOptions,
  SignalClient,
  SignalClientFactory,
  SignalClientOptions,
  SignalHostAuthority,
  SignalListener,
  SignalNotification,
  SignalPublisher,
  SignalService,
  SignalSubscription,
  SignalTopic,
} from "./contracts.js";
import { signalProblem } from "./problems.js";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";
import type { PersistenceInternalTransaction } from "@heptalogos/persistence/foundation-repository";
import { useFoundationMutationTransaction } from "@heptalogos/persistence/foundation-repository";
import { ProblemError } from "@heptalogos/foundation-contracts";

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

const defaultClientFactory: SignalClientFactory = {
  create(options: SignalClientOptions): SignalClient {
    const client = new Client({
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      connectionTimeoutMillis: options.connectionTimeoutMs,
      application_name: "heptalogos-signal-listener",
    });
    return {
      async connect() {
        await client.connect();
      },
      async query(text) {
        await client.query(text);
      },
      on(event, listener) {
        if (event === "notification") {
          client.on("notification", (notification) => listener(notification));
        } else if (event === "error") {
          client.on("error", (error) => listener(error));
        } else {
          client.on("end", () => listener());
        }
      },
      end: () => client.end(),
    };
  },
};

interface SubscriptionEntry {
  readonly topic: SignalTopic;
  readonly listener: SignalListener;
  closed: boolean;
}

function normalizeError(problemCode: string, error: unknown): unknown {
  return error instanceof ProblemError
    ? error
    : signalProblem(problemCode, "PostgreSQL Signal listener operation failed", error);
}

function assertOptions(options: PostgresSignalRuntimeOptions): void {
  if (
    !Number.isSafeInteger(options.connectionTimeoutMs) ||
    options.connectionTimeoutMs <= 0 ||
    !Number.isSafeInteger(options.reconnectBaseDelayMs) ||
    options.reconnectBaseDelayMs < 0 ||
    !Number.isSafeInteger(options.reconnectMaxDelayMs) ||
    options.reconnectMaxDelayMs < options.reconnectBaseDelayMs
  ) {
    throw signalProblem(
      "signal.listener.invalid_options",
      "Signal listener timing options are invalid",
    );
  }
}

export class PostgresSignalService implements SignalService {
  private readonly subscriptions = new Set<SubscriptionEntry>();
  private readonly clientFactory: SignalClientFactory;
  private client: SignalClient | undefined;
  private connectPromise: Promise<void> | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectAttempt = 0;
  private closing = false;
  private closePromise: Promise<void> | undefined;

  constructor(
    private readonly authority: SignalHostAuthority,
    private readonly options: PostgresSignalRuntimeOptions,
  ) {
    assertOptions(options);
    this.clientFactory = options.clientFactory ?? defaultClientFactory;
    this.authority.signal.addEventListener(
      "abort",
      () => {
        void this.close().catch((error) => this.report(error));
      },
      { once: true },
    );
  }

  async subscribe(
    topic: SignalTopic,
    listener: SignalListener,
  ): Promise<SignalSubscription> {
    if (parseSignalTopic(topic) === undefined) {
      throw signalProblem("signal.topic.invalid", "Signal topic is invalid");
    }
    if (this.closing || this.authority.signal.aborted) {
      throw signalProblem(
        "signal.listener.closed",
        "Signal listener admission is closed",
      );
    }
    const entry: SubscriptionEntry = { topic, listener, closed: false };
    this.subscriptions.add(entry);
    try {
      const wasConnected = this.client !== undefined;
      await this.ensureConnected();
      if (wasConnected) await this.invokeRescan(entry);
    } catch (error) {
      this.subscriptions.delete(entry);
      throw error;
    }
    if (this.client !== undefined && !this.hasRescannedEntry(entry)) {
      await this.invokeRescan(entry);
    }
    return {
      close: async () => {
        if (entry.closed) return;
        entry.closed = true;
        this.subscriptions.delete(entry);
        if (this.subscriptions.size === 0) await this.closeClient();
      },
    };
  }

  private readonly rescanned = new WeakSet<SubscriptionEntry>();

  private hasRescannedEntry(entry: SubscriptionEntry): boolean {
    return this.rescanned.has(entry);
  }

  private async invokeRescan(entry: SubscriptionEntry): Promise<void> {
    if (entry.closed) return;
    this.rescanned.add(entry);
    try {
      await entry.listener.onRescanRequired();
    } catch (error) {
      this.report(normalizeError("signal.listener.connection_failed", error));
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client !== undefined) return;
    if (this.connectPromise !== undefined) return this.connectPromise;
    this.connectPromise = this.connect().finally(() => {
      this.connectPromise = undefined;
    });
    return this.connectPromise;
  }

  private async connect(): Promise<void> {
    this.authority.assertActive();
    const isReconnect = this.reconnectAttempt > 0;
    const client = await this.authority.withRuntimeDatabasePassword(
      async (passwordUtf8) => {
        this.authority.assertActive();
        let password: string;
        try {
          password = utf8Decoder.decode(passwordUtf8);
        } catch (error) {
          throw signalProblem(
            "signal.listener.connection_failed",
            "Signal credential is invalid UTF-8",
            error,
          );
        }
        return this.clientFactory.create({
          host: this.authority.target.host,
          port: this.authority.target.port,
          database: this.authority.target.database,
          user: this.authority.target.user,
          password,
          connectionTimeoutMs: this.options.connectionTimeoutMs,
        });
      },
    );
    this.attachClient(client);
    try {
      await client.connect();
      this.authority.assertActive();
      await client.query(`LISTEN "${SIGNAL_CHANNEL}"`);
      this.authority.assertActive();
      this.client = client;
      this.reconnectAttempt = 0;
      if (isReconnect) {
        for (const entry of this.subscriptions) await this.invokeRescan(entry);
      }
    } catch (error) {
      await client.end().catch(() => undefined);
      throw normalizeError("signal.listener.connection_failed", error);
    }
  }

  private attachClient(client: SignalClient): void {
    client.on("notification", (value) => {
      void this.handleNotification(value).catch((error) => this.report(error));
    });
    client.on("error", (error) => this.handleClientFailure(error));
    client.on("end", () => this.handleClientFailure(undefined));
  }

  private async handleNotification(value: unknown): Promise<void> {
    if (this.closing || this.client === undefined) return;
    const notification = value as SignalNotification | undefined;
    if (
      notification === undefined ||
      notification.channel !== SIGNAL_CHANNEL ||
      typeof notification.payload !== "string"
    ) {
      throw signalProblem(
        "signal.listener.invalid_notification",
        "Signal notification did not contain the fixed channel and text hint",
      );
    }
    const hint = decodeSignalHint(notification.payload);
    await Promise.all(
      [...this.subscriptions]
        .filter((entry) => !entry.closed && entry.topic === hint.topic)
        .map((entry) => entry.listener.onWakeup()),
    );
  }

  private handleClientFailure(error: unknown): void {
    if (this.closing || this.client === undefined) return;
    const client = this.client;
    this.client = undefined;
    this.report(normalizeError("signal.listener.connection_failed", error));
    void client.end().catch((endError) => this.report(endError));
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (
      this.closing ||
      this.authority.signal.aborted ||
      this.subscriptions.size === 0 ||
      this.reconnectTimer !== undefined
    ) {
      return;
    }
    const delay = Math.min(
      this.options.reconnectMaxDelayMs,
      this.options.reconnectBaseDelayMs * 2 ** this.reconnectAttempt,
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.ensureConnected().catch((error) => {
        this.report(error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private report(error: unknown): void {
    try {
      this.options.onBackgroundError(error);
    } catch {
      // Background diagnostics cannot replace listener lifecycle handling.
    }
    for (const entry of this.subscriptions) {
      try {
        entry.listener.onBackgroundError(error);
      } catch {
        // Subscriber diagnostics cannot escape the listener loop.
      }
    }
  }

  private async closeClient(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    if (client !== undefined) await client.end().catch((error) => this.report(error));
  }

  private async close(): Promise<void> {
    if (this.closePromise !== undefined) return this.closePromise;
    this.closing = true;
    if (this.reconnectTimer !== undefined) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.closePromise = this.closeClient();
    await this.closePromise;
  }
}

export function createPostgresSignalService(
  authority: SignalHostAuthority,
  options: PostgresSignalRuntimeOptions,
): SignalService {
  return new PostgresSignalService(authority, options);
}

async function executeNotify(
  transaction: PersistenceInternalTransaction,
  encoded: string,
): Promise<void> {
  await transaction.executeQuery(
    CompiledQuery.raw(`SELECT pg_notify('${SIGNAL_CHANNEL}', $1)`, [encoded]),
  );
}

export const postgresSignalPublisher: SignalPublisher = {
  async publish(
    transaction: PersistenceMutationTransactionContext,
    topic: SignalTopic,
  ) {
    try {
      const encoded = encodeSignalHint({ schemaVersion: 1, topic });
      await useFoundationMutationTransaction(transaction, (databaseTransaction) =>
        executeNotify(databaseTransaction, encoded),
      );
    } catch (error) {
      if (error instanceof ProblemError) throw error;
      throw signalProblem(
        "signal.publish.failed",
        "PostgreSQL Signal publication failed",
        error,
      );
    }
  },
};
