import { describe, expect, it } from "vitest";
import { Kysely, PostgresDialect } from "kysely";
import type { Pool, PoolClient } from "pg";
import { createCanonicalSchemaInitializer } from "./initializer.js";
import { foundationBaselineMigration } from "./migrations/0001-foundation-baseline.js";
import type { CanonicalDatabase } from "./migration-pool.js";
import {
  canonicalMigrationNames,
  canonicalMigrationProvider,
} from "./migration-provider.js";
import { verifyObservedContinuityRow } from "./continuity.js";
import {
  createContinuityEpochId,
  createInstanceId,
} from "@heptalogos/foundation-contracts";

describe("canonical schema adapter", () => {
  it("materializes the current WorkItem and Contribution-origin schema", async () => {
    const statements: string[] = [];
    const client = {
      query: async (query: unknown) => {
        if (typeof query === "string") statements.push(query);
        else if (typeof query === "object" && query !== null && "text" in query) {
          statements.push(String(query.text));
        }
        return { rows: [], rowCount: 0 };
      },
      release() {},
    } as unknown as PoolClient;
    const pool = {
      connect: async () => client,
      end: async () => undefined,
    } as unknown as Pool;
    const database = new Kysely<CanonicalDatabase>({
      dialect: new PostgresDialect({ pool }),
    });

    try {
      await foundationBaselineMigration.up(database);
    } finally {
      await database.destroy();
    }

    const sql = statements.join("\n");
    expect(sql).toContain('create table "heptalogos"."work_item"');
    expect(sql).toContain('"contribution_id"');
    expect(sql).toContain('"work_item_dispatchable_index"');
    expect(sql).toContain('"work_item_dedup_unique"');
    expect(sql).toContain("p_contribution_id");
  });

  it("publishes exactly one static migration without a filesystem provider", async () => {
    expect(canonicalMigrationNames).toEqual(["0001_foundation_baseline"]);
    await expect(canonicalMigrationProvider.getMigrations()).resolves.toEqual(
      expect.objectContaining({
        "0001_foundation_baseline": expect.objectContaining({
          up: expect.any(Function),
        }),
      }),
    );
  });

  it("exposes only the injected initializer seam during scaffolding", () => {
    expect(typeof createCanonicalSchemaInitializer).toBe("function");
  });

  it("accepts an exact continuity row and rejects identity mismatches", () => {
    const instanceId = createInstanceId();
    const epoch = createContinuityEpochId();
    expect(() =>
      verifyObservedContinuityRow(
        { singleton: true, instance_id: instanceId, continuity_epoch_id: epoch },
        instanceId,
        epoch,
      ),
    ).not.toThrow();

    const instanceMismatch = () =>
      verifyObservedContinuityRow(
        {
          singleton: true,
          instance_id: createInstanceId(),
          continuity_epoch_id: epoch,
        },
        instanceId,
        epoch,
      );
    expect(instanceMismatch).toThrow();
    try {
      instanceMismatch();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "canonical-schema.continuity_instance_mismatch" },
      });
    }

    const epochMismatch = () =>
      verifyObservedContinuityRow(
        {
          singleton: true,
          instance_id: instanceId,
          continuity_epoch_id: createContinuityEpochId(),
        },
        instanceId,
        epoch,
      );
    expect(epochMismatch).toThrow();
    try {
      epochMismatch();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "canonical-schema.continuity_epoch_mismatch" },
      });
    }
  });
});
