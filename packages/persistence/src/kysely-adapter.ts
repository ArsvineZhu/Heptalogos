import { Kysely, PostgresDialect } from "kysely";
import type { Pool } from "pg";

type InternalDatabase = Record<string, Record<string, unknown>>;
export type PersistenceDatabase = Kysely<InternalDatabase>;

export function createKyselyAdapter(pool: Pool): PersistenceDatabase {
  return new Kysely({
    dialect: new PostgresDialect({ pool }),
  });
}
