/**
 * Adapts the public DBOSClient queue surface for pre-launch profile checks.
 * The caller-owned pool remains outside the client wrapper and is never closed
 * by client destruction.
 * @module dbos-client
 */

import { createRequire } from "node:module";
import type { Pool } from "pg";
import type { HostDurableExecutionAuthority } from "@heptalogos/host-ownership";
import type {
  DbosQueueHandle,
  DbosQueueRegistrationDriver,
  DbosQueueRegistrationOptions,
} from "./dbos-queue-profiles.js";

interface DurableExecutionPoolHandle {
  end(): Promise<void>;
}

/** Bounds the public DBOSClient instance used during queue preflight. */
export interface DbosQueueClientOptions {
  readonly poolSize: number;
  readonly pollingConcurrency: number;
  readonly connectionTimeoutMs: number;
}

/** Public DBOSClient methods retained behind the Heptalogos adapter boundary. */
interface DbosClientSurface {
  registerQueue(
    name: string,
    options: DbosQueueRegistrationOptions,
  ): Promise<DbosQueueHandle>;
  destroy(): Promise<void>;
}

interface DbosClientFactorySurface {
  create(options: {
    readonly systemDatabaseUrl: string;
    readonly systemDatabasePool: Pool;
    readonly systemDatabaseSchemaName: "dbos";
    readonly systemDatabasePoolSize: number;
    readonly systemDatabasePollingConcurrency: number;
    readonly applicationName: "heptalogos";
  }): Promise<DbosClientSurface>;
}

/** Queue-registration client retained behind the durable-execution boundary. */
export interface DbosQueueClient extends DbosQueueRegistrationDriver {
  /** Release the client wrapper without closing the caller-owned pool. */
  destroy(): Promise<void>;
}

const dbosClient = createRequire(import.meta.url)("@dbos-inc/dbos-sdk")
  .DBOSClient as DbosClientFactorySurface;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function connectionUrl(
  authority: HostDurableExecutionAuthority,
  password: string,
  connectionTimeoutMs: number,
): string {
  const target = authority.target;
  const timeoutSeconds = Math.max(1, Math.ceil(connectionTimeoutMs / 1_000));
  return `postgresql://${encodeURIComponent(target.user)}:${encodeURIComponent(password)}@${target.host}:${target.port}/${target.database}?connect_timeout=${timeoutSeconds}&sslmode=disable`;
}

/** Create a queue-registration driver backed by the public DBOSClient API. */
export async function createDbosQueueClient(
  authority: HostDurableExecutionAuthority,
  pool: DurableExecutionPoolHandle,
  options: DbosQueueClientOptions,
): Promise<DbosQueueClient> {
  return authority.withDurableExecutionDatabasePassword(async (passwordUtf8) => {
    const client = await dbosClient.create({
      systemDatabaseUrl: connectionUrl(
        authority,
        utf8Decoder.decode(passwordUtf8),
        options.connectionTimeoutMs,
      ),
      systemDatabasePool: pool as unknown as Pool,
      systemDatabaseSchemaName: "dbos",
      systemDatabasePoolSize: options.poolSize,
      systemDatabasePollingConcurrency: options.pollingConcurrency,
      applicationName: "heptalogos",
    });
    return Object.freeze({
      registerQueue: (
        name: string,
        registration: DbosQueueRegistrationOptions,
      ): Promise<DbosQueueHandle> => client.registerQueue(name, registration),
      destroy: (): Promise<void> => client.destroy(),
    });
  });
}
