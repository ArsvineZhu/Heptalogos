import { sql, type Kysely } from "kysely";
import { HOST_RUNTIME_ROLE } from "@heptalogos/host-ownership";
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
      .addColumn("product_generation_id", "text")
      .addColumn("package_generation_id", "text")
      .addColumn("micro_system_id", "text")
      .addColumn("micro_system_instance_id", "uuid")
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
        "activity_record_runtime_identity_check",
        sql`
          product_generation_id IS NULL OR
          product_generation_id ~ '^[0-9a-f]{64}$'
        `,
      )
      .addCheckConstraint(
        "activity_record_package_generation_check",
        sql`
          package_generation_id IS NULL OR
          package_generation_id ~ '^[0-9a-f]{64}$'
        `,
      )
      .addCheckConstraint(
        "activity_record_package_requires_product_check",
        sql`package_generation_id IS NULL OR product_generation_id IS NOT NULL`,
      )
      .addCheckConstraint(
        "activity_record_micro_system_requires_product_check",
        sql`micro_system_id IS NULL OR product_generation_id IS NOT NULL`,
      )
      .addCheckConstraint(
        "activity_record_runtime_pair_check",
        sql`(micro_system_id IS NULL AND micro_system_instance_id IS NULL)
          OR (micro_system_id IS NOT NULL AND micro_system_instance_id IS NOT NULL)`,
      )
      .addCheckConstraint(
        "activity_record_micro_system_id_shape_check",
        sql`
          micro_system_id IS NULL OR
          (octet_length(micro_system_id) BETWEEN 1 AND 128 AND
            micro_system_id ~ '^[a-z][a-z0-9]*(\\.[a-z0-9]+|-[a-z0-9]+)*$')
        `,
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

    await sql`
      CREATE OR REPLACE FUNCTION "heptalogos"."complete_activity_record"(
        p_activity_id uuid,
        p_installation_id uuid,
        p_instance_id uuid,
        p_boot_id uuid,
        p_continuity_epoch_id uuid,
        p_host_ownership_token uuid,
        p_product_generation_id text,
        p_package_generation_id text,
        p_micro_system_id text,
        p_micro_system_instance_id uuid,
        p_ended_at timestamptz,
        p_outcome text,
        p_outcome_ref text
      )
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = heptalogos, pg_catalog
      AS $function$
      DECLARE
        retained RECORD;
      BEGIN
        IF p_ended_at IS NULL
          OR p_outcome IS NULL
          OR p_outcome NOT IN ('SUCCEEDED', 'FAILED', 'CANCELLED')
          OR (
            p_outcome_ref IS NOT NULL AND
            (btrim(p_outcome_ref) = '' OR octet_length(p_outcome_ref) > 1024)
          )
        THEN
          RETURN 'INVALID_COMPLETION';
        END IF;

        SELECT
          installation_id,
          instance_id,
          boot_id,
          continuity_epoch_id,
          host_ownership_token,
          product_generation_id,
          package_generation_id,
          micro_system_id,
          micro_system_instance_id,
          ended_at,
          outcome,
          outcome_ref
        INTO retained
        FROM "heptalogos"."activity_record"
        WHERE activity_id = p_activity_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RETURN 'NOT_FOUND';
        END IF;

        IF retained.installation_id IS DISTINCT FROM p_installation_id
          OR retained.instance_id IS DISTINCT FROM p_instance_id
          OR retained.boot_id IS DISTINCT FROM p_boot_id
          OR retained.continuity_epoch_id IS DISTINCT FROM p_continuity_epoch_id
          OR retained.host_ownership_token IS DISTINCT FROM p_host_ownership_token
          OR retained.product_generation_id IS DISTINCT FROM p_product_generation_id
          OR retained.package_generation_id IS DISTINCT FROM p_package_generation_id
          OR retained.micro_system_id IS DISTINCT FROM p_micro_system_id
          OR retained.micro_system_instance_id IS DISTINCT FROM p_micro_system_instance_id
        THEN
          RETURN 'ORIGIN_MISMATCH';
        END IF;

        IF retained.ended_at IS NULL AND retained.outcome IS NULL THEN
          UPDATE "heptalogos"."activity_record"
          SET ended_at = p_ended_at,
              outcome = p_outcome,
              outcome_ref = p_outcome_ref
          WHERE activity_id = p_activity_id;
          RETURN 'COMPLETED';
        END IF;

        IF retained.ended_at IS NOT DISTINCT FROM p_ended_at
          AND retained.outcome IS NOT DISTINCT FROM p_outcome
          AND retained.outcome_ref IS NOT DISTINCT FROM p_outcome_ref
        THEN
          RETURN 'IDEMPOTENT';
        END IF;

        RETURN 'CONFLICT';
      END;
      $function$;
    `.execute(db);

    await sql`
      REVOKE ALL ON FUNCTION "heptalogos"."complete_activity_record"(
        uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, uuid,
        timestamptz, text, text
      ) FROM PUBLIC
    `.execute(db);

    await sql`
      GRANT EXECUTE ON FUNCTION "heptalogos"."complete_activity_record"(
        uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, uuid,
        timestamptz, text, text
      ) TO ${sql.ref(HOST_RUNTIME_ROLE)}
    `.execute(db);
  },
};
