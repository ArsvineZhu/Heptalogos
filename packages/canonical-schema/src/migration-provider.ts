import type { Migration, MigrationProvider } from "kysely/migration";
import { foundationContinuityMigration } from "./migrations/0001-foundation-continuity.js";

const migrations: Readonly<Record<string, Migration>> = Object.freeze({
  "0001_foundation_continuity": foundationContinuityMigration,
});

export const canonicalMigrationProvider: MigrationProvider = {
  async getMigrations(): Promise<Record<string, Migration>> {
    return { ...migrations };
  },
};

export const canonicalMigrationNames = Object.freeze([
  "0001_foundation_continuity",
] as const);
