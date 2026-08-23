import { describe, expect, it } from "vitest";
import {
  createBootId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  createUuidV7Id,
  digestCanonicalJson,
  type Sha256Digest,
} from "@heptalogos/foundation-contracts";
import {
  createMaintenanceOperationId,
  parseMaintenanceJournal,
  sealMaintenanceJournal,
} from "./maintenance-codec.js";
import type { MaintenanceJournalBodyV1 } from "./maintenance-model.js";

const INSTANT = "2026-08-22T08:30:00.000Z";

function digest(domain: string): Sha256Digest {
  return digestCanonicalJson(domain, { fixture: true });
}

function makeBody(
  overrides: Partial<MaintenanceJournalBodyV1> = {},
): MaintenanceJournalBodyV1 {
  return {
    schemaVersion: 1,
    revision: 1,
    operationId: createMaintenanceOperationId(),
    activityId: createUuidV7Id("ActivityId"),
    installationId: createInstallationId(),
    instanceId: createInstanceId(),
    bootId: createBootId(),
    operationType: "PRIVATE_POSTGRES_RESTART",
    source: {
      hostOwnershipToken: createHostOwnershipToken(),
      hostOwnershipRevision: "4",
      postgresClusterSystemIdentifier: "12345678901234567890",
      persistedPort: 55432,
    },
    target: { privatePostgres: "RUNNING_SAME_IDENTITY" },
    verifiedPrerequisites: {
      bootstrapStateDigest: digest("heptalogos.bootstrap-state/v1"),
      privatePostgresInitializationProfileRevision: digest(
        "heptalogos.private-postgres.initialization-profile/v1",
      )
        .hex as MaintenanceJournalBodyV1["verifiedPrerequisites"]["privatePostgresInitializationProfileRevision"],
    },
    lastCompletedStage: "BOOTSTRAP_OWNERSHIP_ACQUIRED",
    updatedAt: INSTANT,
    ...overrides,
  };
}

describe("MaintenanceJournal V1 model and codec", () => {
  it("creates UUIDv7 operation identities and round-trips a valid body", () => {
    const body = makeBody();
    const envelope = sealMaintenanceJournal(body);

    expect(createMaintenanceOperationId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(parseMaintenanceJournal(JSON.stringify(envelope))).toEqual({
      ok: true,
      value: envelope,
    });
  });

  it.each([
    "operationId",
    "activityId",
    "installationId",
    "instanceId",
    "bootId",
    "source.hostOwnershipToken",
  ] as const)("rejects invalid UUID identity: %s", (field) => {
    const body = makeBody();
    const invalid = structuredClone(body) as unknown as Record<string, unknown>;
    if (field.startsWith("source.")) {
      invalid.source = { ...body.source, hostOwnershipToken: "not-a-uuid" };
    } else {
      invalid[field] = "not-a-uuid";
    }

    expect(
      parseMaintenanceJournal(
        JSON.stringify(
          sealMaintenanceJournal(invalid as unknown as MaintenanceJournalBodyV1),
        ),
      ),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_schema" },
    });
  });

  it.each(["-1", "1.5", "01", 4, ""])(
    "rejects non-canonical ownership revision %j",
    (revision) => {
      const body = makeBody({
        source: { ...makeBody().source, hostOwnershipRevision: revision as string },
      });
      expect(
        parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
      ).toMatchObject({
        ok: false,
        problem: { problemCode: "maintenance.journal.invalid_schema" },
      });
    },
  );

  it.each([0, 65536, 1.5, "55432"])("rejects invalid persisted port %j", (port) => {
    const body = makeBody({
      source: { ...makeBody().source, persistedPort: port as number },
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_schema" },
    });
  });

  it("rejects unknown fields, coercion, and implicit defaults", () => {
    const envelope = sealMaintenanceJournal(makeBody());
    const unknown = {
      ...envelope,
      state: { ...envelope.state, unexpected: true },
    };
    expect(parseMaintenanceJournal(JSON.stringify(unknown))).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_schema" },
    });

    const coerced = {
      ...envelope,
      state: { ...envelope.state, revision: "1" },
    };
    expect(parseMaintenanceJournal(JSON.stringify(coerced))).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_schema" },
    });
  });

  it("rejects unsupported future schemas and digest-domain tampering", () => {
    const envelope = sealMaintenanceJournal(makeBody());
    expect(
      parseMaintenanceJournal(
        JSON.stringify({ ...envelope, state: { ...envelope.state, schemaVersion: 2 } }),
      ),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.unsupported_schema" },
    });

    expect(
      parseMaintenanceJournal(
        JSON.stringify({
          ...envelope,
          digest: { ...envelope.digest, domain: "wrong" },
        }),
      ),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.digest_mismatch" },
    });
  });

  it.each([
    {
      stage: "ABORTED" as const,
      terminalOutcome: undefined,
    },
    {
      stage: "RECOVERY_REQUIRED" as const,
      terminalOutcome: "ABORTED" as const,
    },
    {
      stage: "BOOTSTRAP_RELEASE_ARMED" as const,
      terminalOutcome: undefined,
    },
  ])("enforces terminal stage invariants: $stage", ({ stage, terminalOutcome }) => {
    const body = makeBody({
      lastCompletedStage: stage,
      ...(terminalOutcome === undefined ? {} : { terminalOutcome }),
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_semantics" },
    });
  });

  it("requires or forbids release-armed target ownership according to operation type", () => {
    const restart = makeBody({
      operationType: "PRIVATE_POSTGRES_RESTART",
      lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
      target: { privatePostgres: "RUNNING_SAME_IDENTITY" },
      terminalOutcome: "SUCCEEDED",
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(restart))),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_semantics" },
    });

    const stop = makeBody({
      operationType: "PRIVATE_POSTGRES_STOP",
      lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
      target: { privatePostgres: "STOPPED" },
      terminalOutcome: "SUCCEEDED",
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(stop))),
    ).toMatchObject({
      ok: true,
    });
  });

  it("requires candidate token and BootId without revision at publication arm", () => {
    const token = createHostOwnershipToken();
    const bootId = createBootId();
    const valid = makeBody({
      lastCompletedStage: "HOST_TOKEN_PUBLICATION_ARMED",
      target: {
        privatePostgres: "RUNNING_SAME_IDENTITY",
        hostOwnershipToken: token,
        hostBootId: bootId,
      },
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(valid))),
    ).toMatchObject({
      ok: true,
    });

    for (const target of [
      { privatePostgres: "RUNNING_SAME_IDENTITY" as const, hostOwnershipToken: token },
      { privatePostgres: "RUNNING_SAME_IDENTITY" as const, hostBootId: bootId },
      {
        privatePostgres: "RUNNING_SAME_IDENTITY" as const,
        hostOwnershipToken: token,
        hostBootId: bootId,
        hostOwnershipRevision: "9",
      },
    ]) {
      expect(
        parseMaintenanceJournal(
          JSON.stringify(
            sealMaintenanceJournal(
              makeBody({ lastCompletedStage: "HOST_TOKEN_PUBLICATION_ARMED", target }),
            ),
          ),
        ),
      ).toMatchObject({
        ok: false,
        problem: { problemCode: "maintenance.journal.invalid_semantics" },
      });
    }
  });

  it.each(["HOST_TOKEN_PUBLISHED", "BOOTSTRAP_RELEASE_ARMED"] as const)(
    "rejects the legacy token/revision target without hostBootId at %s",
    (stage) => {
      const body = makeBody({
        lastCompletedStage: stage,
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: createHostOwnershipToken(),
          hostOwnershipRevision: "9",
        },
      });
      const parsed = parseMaintenanceJournal(
        JSON.stringify(sealMaintenanceJournal(body)),
      );
      expect(parsed).toMatchObject({
        ok: false,
        problem: { problemCode: "maintenance.journal.invalid_semantics" },
      });
    },
  );

  it("rejects the legacy target at RECOVERY_REQUIRED", () => {
    const body = makeBody({
      lastCompletedStage: "RECOVERY_REQUIRED",
      terminalOutcome: "FAILED",
      target: {
        privatePostgres: "RUNNING_SAME_IDENTITY",
        hostOwnershipToken: createHostOwnershipToken(),
        hostOwnershipRevision: "9",
      },
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_semantics" },
    });
  });

  it.each(["HOST_TOKEN_PUBLISHED", "BOOTSTRAP_RELEASE_ARMED"] as const)(
    "requires token, BootId, and revision at %s",
    (stage) => {
      const token = createHostOwnershipToken();
      const bootId = createBootId();
      const valid = makeBody({
        lastCompletedStage: stage,
        target: {
          privatePostgres: "RUNNING_SAME_IDENTITY",
          hostOwnershipToken: token,
          hostBootId: bootId,
          hostOwnershipRevision: "9",
        },
        ...(stage === "BOOTSTRAP_RELEASE_ARMED"
          ? { terminalOutcome: "SUCCEEDED" as const }
          : {}),
      });
      expect(
        parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(valid))),
      ).toMatchObject({
        ok: true,
      });

      for (const target of [
        {
          privatePostgres: "RUNNING_SAME_IDENTITY" as const,
          hostOwnershipToken: token,
          hostBootId: bootId,
        },
        {
          privatePostgres: "RUNNING_SAME_IDENTITY" as const,
          hostOwnershipToken: token,
        },
        {
          privatePostgres: "RUNNING_SAME_IDENTITY" as const,
          hostOwnershipRevision: "9",
        },
      ]) {
        expect(
          parseMaintenanceJournal(
            JSON.stringify(
              sealMaintenanceJournal(makeBody({ lastCompletedStage: stage, target })),
            ),
          ),
        ).toMatchObject({
          ok: false,
          problem: { problemCode: "maintenance.journal.invalid_semantics" },
        });
      }
    },
  );

  it.each([
    "HOST_LEASE_ACQUIRED",
    "HOST_TOKEN_PUBLICATION_ARMED",
    "HOST_TOKEN_PUBLISHED",
    "BOOTSTRAP_RELEASE_ARMED",
  ] as const)("forbids STOP target ownership fields at %s", (stage) => {
    const body = makeBody({
      operationType: "PRIVATE_POSTGRES_STOP",
      lastCompletedStage: stage,
      target: {
        privatePostgres: "STOPPED",
        hostBootId: createBootId(),
      },
    });
    expect(
      parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
    ).toMatchObject({
      ok: false,
      problem: { problemCode: "maintenance.journal.invalid_semantics" },
    });
  });

  it.each([
    {
      operationType: "PRIVATE_POSTGRES_RESTART" as const,
      privatePostgres: "RUNNING_SAME_IDENTITY" as const,
      target: { hostOwnershipToken: createHostOwnershipToken() },
    },
    {
      operationType: "PRIVATE_POSTGRES_RESTART" as const,
      privatePostgres: "RUNNING_SAME_IDENTITY" as const,
      target: { hostOwnershipRevision: "5" },
    },
    {
      operationType: "PRIVATE_POSTGRES_STOP" as const,
      privatePostgres: "STOPPED" as const,
      target: { hostOwnershipToken: createHostOwnershipToken() },
    },
    {
      operationType: "PRIVATE_POSTGRES_STOP" as const,
      privatePostgres: "STOPPED" as const,
      target: { hostOwnershipRevision: "5" },
    },
  ])(
    "rejects partial release-armed target ownership: $operationType/$target",
    ({ operationType, privatePostgres, target }) => {
      const body = makeBody({
        operationType,
        lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
        target: { privatePostgres, ...target },
      });
      expect(
        parseMaintenanceJournal(JSON.stringify(sealMaintenanceJournal(body))),
      ).toMatchObject({
        ok: false,
        problem: { problemCode: "maintenance.journal.invalid_semantics" },
      });
    },
  );
});
