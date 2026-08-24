import type { Migration, MigrationProvider } from "kysely/migration";
import { foundationBaselineMigration } from "./migrations/0001-foundation-baseline.js";

const migrations: Readonly<Record<string, Migration>> = Object.freeze({
  "0001_foundation_baseline": foundationBaselineMigration,
});

export const canonicalMigrationProvider: MigrationProvider = {
  async getMigrations(): Promise<Record<string, Migration>> {
    return { ...migrations };
  },
};

export const canonicalMigrationNames = Object.freeze([
  "0001_foundation_baseline",
] as const);
