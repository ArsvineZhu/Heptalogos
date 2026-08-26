import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCanonicalSchemaInitializer } from "@heptalogos/canonical-schema";
import {
  BootstrapStateStore,
  BOOTSTRAP_STATE_DIGEST_DOMAIN,
} from "@heptalogos/bootstrap-state";
import {
  asContentDigest,
  createContinuityEpochId,
  createInstanceId,
  digestCanonicalJson,
  type CanonicalJsonValue,
} from "@heptalogos/foundation-contracts";
import { HOST_RUNTIME_ROLE } from "@heptalogos/host-ownership";
import {
  BOOTSTRAP_PASSWORD,
  CANONICAL_OPTIONS,
  HOST_TIMING,
  MIGRATION_PASSWORD,
  RUNTIME_PASSWORD,
  boot,
  cleanupCanonicalPostgresFixtures,
  currentState,
  expectQueryDenied,
  makeFixture,
  makeKeyProvider,
  mutateAsBootstrap,
  prepareOwned,
  qualifiedPgBin,
  queryAs,
  stopManagedHostWithoutRuntime,
} from "./test-support/canonical-postgres.js";

const describeRealPostgres = qualifiedPgBin === undefined ? describe.skip : describe;

afterEach(async () => {
  await cleanupCanonicalPostgresFixtures();
});

describeRealPostgres.sequential(
  "Canonical canonical continuity PostgreSQL qualification",
  () => {
    it("C1 materializes the BootstrapState epoch before managed Host exposure", async () => {
      const fixture = await makeFixture();
      const result = await boot(fixture);
      expect(result.host.continuityEpochId).toBe(result.epoch);
      expect(result.host.persistence.continuityEpochId).toBe(result.epoch);
      await expect(
        queryAs(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
        ),
      ).resolves.toMatchObject({
        rows: [{ instance_id: fixture.instanceId, continuity_epoch_id: result.epoch }],
      });
      await expect(
        queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT name FROM "heptalogos"."foundation_schema_migration"`,
        ),
      ).resolves.toMatchObject({ rows: [{ name: "0001_foundation_baseline" }] });
      await expect(
        queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'heptalogos'
             AND table_name IN ('instance_continuity', 'activity_record', 'activity_link', 'evidence_record')
           ORDER BY table_name`,
        ),
      ).resolves.toMatchObject({
        rows: [
          { table_name: "activity_link" },
          { table_name: "activity_record" },
          { table_name: "evidence_record" },
          { table_name: "instance_continuity" },
        ],
      });
      await expect(
        queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'heptalogos' AND table_name = 'activity_record'
           ORDER BY ordinal_position`,
        ),
      ).resolves.toMatchObject({
        rows: [
          { column_name: "activity_id" },
          { column_name: "kind" },
          { column_name: "started_at" },
          { column_name: "ended_at" },
          { column_name: "parent_activity_id" },
          { column_name: "causation_activity_id" },
          { column_name: "installation_id" },
          { column_name: "instance_id" },
          { column_name: "boot_id" },
          { column_name: "continuity_epoch_id" },
          { column_name: "host_ownership_token" },
          { column_name: "product_generation_id" },
          { column_name: "package_generation_id" },
          { column_name: "micro_system_id" },
          { column_name: "micro_system_instance_id" },
          { column_name: "contribution_id" },
          { column_name: "importance" },
          { column_name: "retention_class" },
          { column_name: "sensitivity" },
          { column_name: "operation_id" },
          { column_name: "feature_id" },
          { column_name: "service_id" },
          { column_name: "capability_id" },
          { column_name: "provider_id" },
          { column_name: "contract_version" },
          { column_name: "outcome" },
          { column_name: "outcome_ref" },
        ],
      });
      await expect(
        queryAs(
          fixture,
          "heptalogos_bootstrap",
          BOOTSTRAP_PASSWORD,
          `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,
                  ccu.column_name AS foreign_column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
           JOIN information_schema.constraint_column_usage ccu
             ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
           WHERE tc.constraint_type = 'FOREIGN KEY'
             AND tc.table_schema = 'heptalogos'
           ORDER BY tc.table_name, kcu.column_name`,
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            table_name: "activity_link",
            column_name: "source_activity_id",
            foreign_table_name: "activity_record",
            foreign_column_name: "activity_id",
          },
          {
            table_name: "evidence_record",
            column_name: "activity_id",
            foreign_table_name: "activity_record",
            foreign_column_name: "activity_id",
          },
        ],
      });
      await expect(
        queryAs(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          `SELECT has_table_privilege(current_user, 'heptalogos.activity_record', 'SELECT') AS activity_select,
                  has_table_privilege(current_user, 'heptalogos.activity_record', 'INSERT') AS activity_insert,
                  has_table_privilege(current_user, 'heptalogos.activity_record', 'UPDATE') AS activity_update,
                  has_table_privilege(current_user, 'heptalogos.activity_record', 'DELETE') AS activity_delete,
                  has_table_privilege(current_user, 'heptalogos.evidence_record', 'SELECT') AS evidence_select,
                  has_table_privilege(current_user, 'heptalogos.evidence_record', 'INSERT') AS evidence_insert,
                  has_table_privilege(current_user, 'heptalogos.evidence_record', 'UPDATE') AS evidence_update,
                  has_table_privilege(current_user, 'heptalogos.evidence_record', 'DELETE') AS evidence_delete`,
        ),
      ).resolves.toMatchObject({
        rows: [
          {
            activity_select: true,
            activity_insert: true,
            activity_update: false,
            activity_delete: false,
            evidence_select: true,
            evidence_insert: true,
            evidence_update: false,
            evidence_delete: false,
          },
        ],
      });
      await stopManagedHostWithoutRuntime(result.host);
    }, 180_000);

    it("C2 preserves the epoch across a second boot with a new Host identity", async () => {
      const fixture = await makeFixture();
      const first = await boot(fixture);
      const firstBoot = first.host.bootId;
      const firstToken = first.host.token;
      await first.host.shutdownKeepingPrivatePostgres({
        async quiesce() {
          return { async resumeAfterAbort() {} };
        },
      });
      const second = await boot(fixture);
      expect(second.host.bootId).not.toBe(firstBoot);
      expect(second.host.token).not.toBe(firstToken);
      expect(second.epoch).toBe(first.epoch);
      expect(second.host.continuityEpochId).toBe(first.epoch);
      await stopManagedHostWithoutRuntime(second.host);
    }, 240_000);

    it("C3 retries the committed epoch after authority loss between migration and materialization", async () => {
      const fixture = await makeFixture();
      const realInitializer = createCanonicalSchemaInitializer(CANONICAL_OPTIONS);
      let assertCount = 0;
      const interruptedInitializer = async (
        context: Parameters<typeof realInitializer>[0],
      ) => {
        const authority = {
          ...context.authority,
          assertCurrent() {
            assertCount += 1;
            if (assertCount === 3) {
              throw new Error("test interruption after migration");
            }
            context.authority.assertCurrent();
          },
        };
        await realInitializer({ ...context, authority });
      };
      const prepared = await prepareOwned(fixture);
      await expect(
        prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
          initializeCanonicalHost: interruptedInitializer,
          keyProvider: makeKeyProvider(),
          timing: HOST_TIMING,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "canonical-schema.authority_lost" },
      });
      const state = await currentState(fixture);
      expect(state.status).toBe("CURRENT");
      if (state.status !== "CURRENT") throw new Error("BootstrapState was not current");
      expect(state.value.state.continuityEpochId).toBe(prepared.epoch);
      await prepared.owned.close();
      const retry = await boot(fixture);
      expect(retry.epoch).toBe(prepared.epoch);
      await stopManagedHostWithoutRuntime(retry.host);
    }, 240_000);

    it.each([
      ["C4", "epoch", "canonical-schema.continuity_epoch_mismatch"],
      ["C5", "instance", "canonical-schema.continuity_instance_mismatch"],
    ] as const)(
      "%s rejects a canonical continuity %s mismatch without overwrite",
      async (_name, kind, problemCode) => {
        const fixture = await makeFixture();
        const first = await boot(fixture);
        const alternate =
          kind === "epoch" ? createContinuityEpochId() : createInstanceId();
        const statement =
          kind === "epoch"
            ? `UPDATE "heptalogos"."instance_continuity" SET continuity_epoch_id = $1`
            : `UPDATE "heptalogos"."instance_continuity" SET instance_id = $1`;
        await stopManagedHostWithoutRuntime(first.host);
        const prepared = await prepareOwned(fixture);
        await mutateAsBootstrap(fixture, statement, [alternate]);
        await expect(
          prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
            initializeCanonicalHost:
              createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
            keyProvider: makeKeyProvider(),
            timing: HOST_TIMING,
          }),
        ).rejects.toMatchObject({ problem: { problemCode } });
        await prepared.owned.close();
        const verification = await prepareOwned(fixture);
        try {
          const row = await queryAs(
            fixture,
            "heptalogos_bootstrap",
            BOOTSTRAP_PASSWORD,
            `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
          );
          expect(
            row.rows[0]?.[kind === "epoch" ? "continuity_epoch_id" : "instance_id"],
          ).toBe(alternate);
        } finally {
          await verification.ready.stop().catch(() => undefined);
          await verification.owned.close().catch(() => undefined);
        }
      },
      240_000,
    );

    it("C6 and C7 keep migration and runtime authorities distinct and read-only", async () => {
      const fixture = await makeFixture();
      const result = await boot(fixture);
      await expect(
        queryAs(
          fixture,
          "heptalogos_migration",
          MIGRATION_PASSWORD,
          "SELECT session_user, current_user",
          [],
          "-c role=heptalogos_owner -c search_path=heptalogos,pg_catalog",
        ),
      ).resolves.toMatchObject({
        rows: [
          { session_user: "heptalogos_migration", current_user: "heptalogos_owner" },
        ],
      });
      await expectQueryDenied(
        fixture,
        HOST_RUNTIME_ROLE,
        RUNTIME_PASSWORD,
        "SET ROLE heptalogos_owner",
      );
      await expectQueryDenied(
        fixture,
        HOST_RUNTIME_ROLE,
        RUNTIME_PASSWORD,
        "SET ROLE heptalogos_migration",
      );
      await expect(
        queryAs(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          `SELECT instance_id, continuity_epoch_id FROM "heptalogos"."instance_continuity"`,
        ),
      ).resolves.toMatchObject({
        rows: [{ instance_id: fixture.instanceId, continuity_epoch_id: result.epoch }],
      });
      for (const statement of [
        `INSERT INTO "heptalogos"."instance_continuity" (singleton, instance_id, continuity_epoch_id) VALUES (false, $1, $2)`,
        `UPDATE "heptalogos"."instance_continuity" SET instance_id = $1`,
        `DELETE FROM "heptalogos"."instance_continuity"`,
        `CREATE TABLE "heptalogos"."canonical_runtime_denied" (id integer)`,
      ]) {
        await expectQueryDenied(
          fixture,
          HOST_RUNTIME_ROLE,
          RUNTIME_PASSWORD,
          statement,
          [fixture.instanceId, result.epoch],
        );
      }
      await stopManagedHostWithoutRuntime(result.host);
    }, 180_000);

    it("C8 rejects corrupted current migration history", async () => {
      const fixture = await makeFixture();
      const first = await boot(fixture);
      await stopManagedHostWithoutRuntime(first.host);
      const prepared = await prepareOwned(fixture);
      await mutateAsBootstrap(
        fixture,
        `DELETE FROM "heptalogos"."foundation_schema_migration"`,
      );
      await expect(
        prepared.owned.handoffPrivatePostgresToHost(prepared.ready, {
          initializeCanonicalHost: createCanonicalSchemaInitializer(CANONICAL_OPTIONS),
          keyProvider: makeKeyProvider(),
          timing: HOST_TIMING,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "canonical-schema.migration_failed" },
      });
      await prepared.owned.close();
    }, 180_000);
  },
);

describe("Canonical BootstrapState unsupported development shape", () => {
  it("C9 rejects current V1 bytes without ContinuityEpochId", async () => {
    const directory = await mkdtemp(
      join(tmpdir(), "heptalogos-canonical-unsupported-state-"),
    );
    try {
      const body = {
        schemaVersion: 1,
        revision: 1,
        activeBootstrapRuntimeGeneration: asContentDigest(
          "BootstrapRuntimeGenerationId",
          digestCanonicalJson("test.bootstrap-runtime/v1", { generation: "bootstrap" }),
        ),
        activeProductGeneration: asContentDigest(
          "ProductGenerationId",
          digestCanonicalJson("test.product-generation/v1", { generation: "product" }),
        ),
      } as unknown as CanonicalJsonValue;
      const envelope = {
        state: body,
        digest: digestCanonicalJson(BOOTSTRAP_STATE_DIGEST_DOMAIN, body),
      };
      await writeFile(
        join(directory, "bootstrap-state.json"),
        JSON.stringify(envelope),
      );
      const loaded = await new BootstrapStateStore(directory).load();
      expect(loaded.status).toBe("CORRUPT");
      if (loaded.status === "CORRUPT") {
        expect(loaded.problem.problemCode).toBe("bootstrap.state.invalid_schema");
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
