import type { NamespacedId } from "@heptalogos/foundation-contracts";
import type { HostPersistenceAuthority } from "@heptalogos/host-ownership";
import type { PersistenceMutationTransactionContext } from "@heptalogos/persistence";

export type SignalTopic = NamespacedId<"SignalTopic">;

export interface SignalSubscription {
  close(): Promise<void>;
}

export interface SignalListener {
  onWakeup(): void | Promise<void>;
  onRescanRequired(): void | Promise<void>;
  onBackgroundError(error: unknown): void;
}

export interface SignalService {
  subscribe(topic: SignalTopic, listener: SignalListener): Promise<SignalSubscription>;
}

export interface PostgresSignalRuntimeOptions {
  readonly connectionTimeoutMs: number;
  readonly reconnectBaseDelayMs: number;
  readonly reconnectMaxDelayMs: number;
  readonly onBackgroundError: (error: unknown) => void;
  readonly clientFactory?: SignalClientFactory;
}

export interface SignalClientOptions {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly connectionTimeoutMs: number;
}

export interface SignalNotification {
  readonly channel: string;
  readonly payload?: string;
}

export interface SignalClient {
  connect(): Promise<void>;
  query(text: string): Promise<void>;
  on(
    event: "notification" | "error" | "end",
    listener: (value?: unknown) => void,
  ): void;
  end(): Promise<void>;
}

export interface SignalClientFactory {
  create(options: SignalClientOptions): SignalClient;
}

export interface SignalPublisher {
  publish(
    transaction: PersistenceMutationTransactionContext,
    topic: SignalTopic,
  ): Promise<void>;
}

export type SignalHostAuthority = HostPersistenceAuthority;
