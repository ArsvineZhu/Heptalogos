import { sql, type Kysely } from "kysely";
import type { Migration } from "kysely/migration";
import type { CanonicalDatabase } from "../migration-pool.js";

export const foundationContinuityMigration: Migration = {
  async up(db: Kysely<CanonicalDatabase>): Promise<void> {
    await db.schema
      .withSchema("heptalogos")
      .createTable("instance_continuity")
      .addColumn("singleton", "boolean", (column) => column.notNull().primaryKey())
      .addColumn("instance_id", "uuid", (column) => column.notNull())
      .addColumn("continuity_epoch_id", "uuid", (column) => column.notNull())
      .addCheckConstraint("instance_continuity_singleton_check", sql`singleton`)
      .execute();

    await sql`
      REVOKE ALL ON TABLE "heptalogos"."instance_continuity" FROM PUBLIC
    `.execute(db);
    await sql`
      GRANT SELECT ON TABLE "heptalogos"."instance_continuity" TO "heptalogos_runtime"
    `.execute(db);
  },
};
