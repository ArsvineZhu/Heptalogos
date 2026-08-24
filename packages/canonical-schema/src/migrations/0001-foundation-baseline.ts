import { sql, type Kysely } from "kysely";
import type { Migration } from "kysely/migration";
import type { CanonicalDatabase } from "../migration-pool.js";

const schema = "heptalogos";

export const foundationBaselineMigration: Migration = {
  async up(db: Kysely<CanonicalDatabase>): Promise<void> {
    await db.schema
      .withSchema(schema)
      .createTable("instance_continuity")
      .addColumn("singleton", "boolean", (column) => column.notNull().primaryKey())
      .addColumn("instance_id", "uuid", (column) => column.notNull())
      .addColumn("continuity_epoch_id", "uuid", (column) => column.notNull())
      .addCheckConstraint("instance_continuity_singleton_check", sql`singleton`)
      .execute();

    await db.schema
      .withSchema(schema)
      .createTable("activity_record")
      .addColumn("activity_id", "uuid", (column) => column.notNull().primaryKey())
      .addColumn("kind", "text", (column) => column.notNull())
      .addColumn("started_at", "timestamptz(3)", (column) => column.notNull())
      .addColumn("ended_at", "timestamptz(3)")
      .addColumn("parent_activity_id", "uuid")
      .addColumn("causation_activity_id", "uuid")
      .addColumn("installation_id", "uuid", (column) => column.notNull())
      .addColumn("instance_id", "uuid", (column) => column.notNull())
      .addColumn("boot_id", "uuid", (column) => column.notNull())
      .addColumn("continuity_epoch_id", "uuid", (column) => column.notNull())
      .addColumn("host_ownership_token", "uuid")
      .addColumn("importance", "text", (column) => column.notNull())
      .addColumn("retention_class", "text", (column) => column.notNull())
      .addColumn("sensitivity", "text", (column) => column.notNull())
      .addColumn("operation_id", "text")
      .addColumn("feature_id", "text")
      .addColumn("service_id", "text")
      .addColumn("capability_id", "text")
      .addColumn("provider_id", "text")
      .addColumn("contract_version", "text")
      .addColumn("outcome", "text")
      .addColumn("outcome_ref", "text")
      .addCheckConstraint(
        "activity_record_kind_check",
        sql`btrim(kind) <> '' AND octet_length(kind) BETWEEN 1 AND 128`,
      )
      .addCheckConstraint(
        "activity_record_importance_check",
        sql`importance IN ('diagnostic', 'routine', 'significant', 'critical')`,
      )
      .addCheckConstraint(
        "activity_record_retention_check",
        sql`retention_class IN ('operational', 'retained', 'audit')`,
      )
      .addCheckConstraint(
        "activity_record_sensitivity_check",
        sql`sensitivity IN ('public', 'operational', 'sensitive', 'pii', 'secret')`,
      )
      .addCheckConstraint(
        "activity_record_outcome_check",
        sql`outcome IS NULL OR outcome IN ('SUCCEEDED', 'FAILED', 'CANCELLED')`,
      )
      .addCheckConstraint(
        "activity_record_completion_pair_check",
        sql`(ended_at IS NULL AND outcome IS NULL) OR (ended_at IS NOT NULL AND outcome IS NOT NULL)`,
      )
      .addCheckConstraint(
        "activity_record_operation_id_check",
        sql`operation_id IS NULL OR (btrim(operation_id) <> '' AND octet_length(operation_id) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_feature_id_check",
        sql`feature_id IS NULL OR (btrim(feature_id) <> '' AND octet_length(feature_id) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_service_id_check",
        sql`service_id IS NULL OR (btrim(service_id) <> '' AND octet_length(service_id) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_capability_id_check",
        sql`capability_id IS NULL OR (btrim(capability_id) <> '' AND octet_length(capability_id) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_provider_id_check",
        sql`provider_id IS NULL OR (btrim(provider_id) <> '' AND octet_length(provider_id) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_contract_version_check",
        sql`contract_version IS NULL OR (btrim(contract_version) <> '' AND octet_length(contract_version) BETWEEN 1 AND 256)`,
      )
      .addCheckConstraint(
        "activity_record_outcome_ref_check",
        sql`outcome_ref IS NULL OR (btrim(outcome_ref) <> '' AND octet_length(outcome_ref) BETWEEN 1 AND 1024)`,
      )
      .execute();

    await db.schema
      .withSchema(schema)
      .createTable("activity_link")
      .addColumn("source_activity_id", "uuid", (column) =>
        column.notNull().references(`${schema}.activity_record.activity_id`),
      )
      .addColumn("link_kind", "text", (column) => column.notNull())
      .addColumn("target_activity_id", "uuid", (column) => column.notNull())
      .addPrimaryKeyConstraint("activity_link_pkey", [
        "source_activity_id",
        "link_kind",
        "target_activity_id",
      ])
      .addCheckConstraint(
        "activity_link_kind_check",
        sql`link_kind IN ('linked-to', 'supersedes', 'resumes', 'fan-out', 'fan-in')`,
      )
      .execute();

    await db.schema
      .withSchema(schema)
      .createTable("evidence_record")
      .addColumn("evidence_id", "uuid", (column) => column.notNull().primaryKey())
      .addColumn("activity_id", "uuid", (column) =>
        column.notNull().references(`${schema}.activity_record.activity_id`),
      )
      .addColumn("evidence_kind", "text", (column) => column.notNull())
      .addColumn("evidence_contract_version", "text", (column) => column.notNull())
      .addColumn("recorded_at", "timestamptz(3)", (column) => column.notNull())
      .addColumn("subject_ref", "text")
      .addColumn("object_ref", "text")
      .addColumn("fact_ref", "text")
      .addColumn("retention_class", "text", (column) => column.notNull())
      .addColumn("sensitivity", "text", (column) => column.notNull())
      .addCheckConstraint(
        "evidence_record_kind_check",
        sql`btrim(evidence_kind) <> '' AND octet_length(evidence_kind) BETWEEN 1 AND 128`,
      )
      .addCheckConstraint(
        "evidence_record_contract_version_check",
        sql`btrim(evidence_contract_version) <> '' AND octet_length(evidence_contract_version) BETWEEN 1 AND 128`,
      )
      .addCheckConstraint(
        "evidence_record_subject_ref_check",
        sql`subject_ref IS NULL OR (btrim(subject_ref) <> '' AND octet_length(subject_ref) BETWEEN 1 AND 1024)`,
      )
      .addCheckConstraint(
        "evidence_record_object_ref_check",
        sql`object_ref IS NULL OR (btrim(object_ref) <> '' AND octet_length(object_ref) BETWEEN 1 AND 1024)`,
      )
      .addCheckConstraint(
        "evidence_record_fact_ref_check",
        sql`fact_ref IS NULL OR (btrim(fact_ref) <> '' AND octet_length(fact_ref) BETWEEN 1 AND 1024)`,
      )
      .addCheckConstraint(
        "evidence_record_retention_check",
        sql`retention_class IN ('operational', 'retained', 'audit')`,
      )
      .addCheckConstraint(
        "evidence_record_sensitivity_check",
        sql`sensitivity IN ('public', 'operational', 'sensitive', 'pii', 'secret')`,
      )
      .execute();

    for (const table of [
      "instance_continuity",
      "activity_record",
      "activity_link",
      "evidence_record",
    ]) {
      await sql`
        REVOKE ALL ON TABLE "heptalogos".${sql.ref(table)} FROM PUBLIC
      `.execute(db);
    }
    await sql`
      GRANT SELECT ON TABLE "heptalogos"."instance_continuity" TO "heptalogos_runtime"
    `.execute(db);
    for (const table of ["activity_record", "activity_link", "evidence_record"]) {
      await sql`
        GRANT SELECT, INSERT ON TABLE "heptalogos".${sql.ref(table)} TO "heptalogos_runtime"
      `.execute(db);
    }
  },
};
