import {
  createBootId,
  createContinuityEpochId,
  createEffectKindId,
  createEffectOperationId,
  createEvidenceId,
  createHostOwnershipToken,
  createInstallationId,
  createInstanceId,
  formatInstant,
  type EffectOperationId,
  type Instant,
} from "@heptalogos/foundation-contracts";
import {
  createExecutionContextRuntime,
  type ExecutionContextRuntime,
} from "@heptalogos/execution-lineage";
import type { EvidenceService } from "@heptalogos/evidence";
import type {
  PersistenceExecutionMetadata,
  PersistenceMutationTransactionContext,
  PersistenceReadTransactionContext,
  PersistenceService,
} from "@heptalogos/persistence";
import type { TimeService } from "@heptalogos/time-service";
import { describe, expect, it } from "vitest";
import { createEffectOperationService } from "../../src/index.js";
import type {
  EffectDispatchPort,
  EffectOperation,
  EffectOutcome,
} from "../../src/contracts.js";
import type {
  EffectDispatchAdmission,
  EffectOperationRepository,
  EffectRecoveryResult,
  EffectRefinementResult,
} from "../../src/repository.js";

const effectKind = createEffectKindId("synthetic.external-write");

function makeTime(): TimeService {
  const now = formatInstant(new Date("2026-08-31T00:00:00.000Z"));
  return {
    now: () => now,
    monotonicNow: () => 0n as never,
    elapsedSince: () => 0n as never,
  };
}

function makeExecution(): ExecutionContextRuntime {
  return createExecutionContextRuntime(
    {
      installationId: createInstallationId(),
      instanceId: createInstanceId(),
      bootId: createBootId(),
      continuityEpochId: createContinuityEpochId(),
      hostOwnershipToken: createHostOwnershipToken(),
    },
    makeTime(),
  );
}

function makeFixture() {
  const execution = makeExecution();
  const time = makeTime();
  let operation: EffectOperation | undefined;

  const repository: EffectOperationRepository & {
    forceDispatching(): void;
  } = {
    forceDispatching() {
      if (operation === undefined) throw new Error("operation is not prepared");
      operation = Object.freeze({
        ...operation,
        state: "DISPATCHING",
        dispatchHostOwnershipToken: createHostOwnershipToken(),
        updatedAt: time.now(),
      });
    },
    async get(_context: PersistenceReadTransactionContext, id: EffectOperationId) {
      return operation?.effectOperationId === id ? operation : undefined;
    },
    async getInMutation(
      _context: PersistenceMutationTransactionContext,
      id: EffectOperationId,
    ) {
      return operation?.effectOperationId === id ? operation : undefined;
    },
    async insertPrepared(_context, input) {
      if (operation !== undefined) {
        const same =
          operation.effectOperationId === input.effectOperationId &&
          operation.effectKind === input.effectKind &&
          operation.requestVersion === input.requestVersion &&
          JSON.stringify(operation.request) === input.request.canonical;
        if (!same) throw new Error("identity conflict");
        return { status: "EXISTING", operation };
      }
      operation = Object.freeze({
        schemaVersion: 1 as const,
        effectOperationId: input.effectOperationId,
        effectKind: input.effectKind,
        requestVersion: input.requestVersion,
        request: input.request.value,
        state: "PREPARED" as const,
        lineageContextRef: input.lineageContextRef,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      });
      return { status: "CREATED", operation };
    },
    async beginDispatch(
      context: PersistenceMutationTransactionContext,
      id: EffectOperationId,
      updatedAt: Instant,
    ): Promise<EffectDispatchAdmission> {
      if (operation === undefined || operation.effectOperationId !== id) {
        throw new Error("operation is not prepared");
      }
      if (operation.state !== "PREPARED") {
        return { status: "OBSERVED", operation };
      }
      operation = Object.freeze({
        ...operation,
        state: "DISPATCHING" as const,
        dispatchHostOwnershipToken: context.execution.hostOwnershipToken,
        updatedAt,
      });
      return { status: "ADMITTED", operation };
    },
    async completeDispatch(
      _context: PersistenceMutationTransactionContext,
      id: EffectOperationId,
      outcome: EffectOutcome,
      updatedAt: Instant,
    ) {
      if (operation === undefined || operation.effectOperationId !== id) {
        throw new Error("operation is missing");
      }
      if (operation.state !== "DISPATCHING") throw new Error("invalid transition");
      operation = Object.freeze({
        ...operation,
        state: outcome.status,
        outcome,
        updatedAt,
      });
      return operation;
    },
    async recoverDispatchAsUncertain(
      _context: PersistenceMutationTransactionContext,
      id: EffectOperationId,
      outcome: Extract<EffectOutcome, { readonly status: "UNCERTAIN" }>,
      updatedAt: Instant,
    ): Promise<EffectRecoveryResult> {
      if (operation === undefined || operation.effectOperationId !== id) {
        throw new Error("operation is missing");
      }
      if (operation.state !== "DISPATCHING") return { changed: false, operation };
      operation = Object.freeze({
        ...operation,
        state: "UNCERTAIN" as const,
        outcome,
        updatedAt,
      });
      return { changed: true, operation };
    },
    async refineUncertain(
      _context: PersistenceMutationTransactionContext,
      id: EffectOperationId,
      outcome: Extract<EffectOutcome, { readonly status: "SUCCEEDED" | "FAILED" }>,
      updatedAt: Instant,
    ): Promise<EffectRefinementResult> {
      if (operation === undefined || operation.effectOperationId !== id) {
        throw new Error("operation is missing");
      }
      if (operation.state !== "UNCERTAIN") return { changed: false, operation };
      operation = Object.freeze({
        ...operation,
        state: outcome.status,
        outcome,
        updatedAt,
      });
      return { changed: true, operation };
    },
  };

  const persistence: PersistenceService = {
    state: "OPEN",
    async read<T>(
      callback: (context: PersistenceReadTransactionContext) => Promise<T>,
    ) {
      return callback({ mode: "READ" });
    },
    async mutate<T>(
      callback: (context: PersistenceMutationTransactionContext) => Promise<T>,
    ) {
      const context = execution.current();
      if (context === undefined) throw new Error("missing test execution");
      const executionMetadata: PersistenceExecutionMetadata = {
        activityId: context.activityId,
        installationId: context.origin.installationId,
        instanceId: context.origin.instanceId,
        bootId: context.origin.bootId,
        continuityEpochId: context.origin.continuityEpochId,
        hostOwnershipToken: context.origin.hostOwnershipToken,
      };
      return callback({ mode: "MUTATION", execution: executionMetadata });
    },
    async close() {},
  };
  const lineage = {
    async retainCurrent() {},
    async completeCurrent() {},
    async retainBootstrapReference() {},
  };
  const evidence: EvidenceService = {
    async recordRequired(transaction, draft) {
      return {
        ...draft,
        evidenceId: createEvidenceId(),
        activityId: transaction.execution.activityId,
        recordedAt: time.now(),
      };
    },
  };
  const service = createEffectOperationService({
    persistence,
    execution,
    lineage,
    evidence,
    time,
    repository,
  });
  return { service, execution, repository, time };
}

function request(effectOperationId: EffectOperationId = createEffectOperationId()) {
  return {
    effectOperationId,
    effectKind,
    requestVersion: 1,
    request: { message: "hello" },
  };
}

async function prepared(fixture: ReturnType<typeof makeFixture>) {
  return fixture.execution.runActivity(
    {
      kind: "test.work-handler",
      importance: "routine",
      retentionClass: "retained",
      sensitivity: "operational",
    },
    () => fixture.service.prepare(request()),
  );
}

function port(
  dispatch: EffectDispatchPort["dispatch"],
  reconcile?: EffectDispatchPort["reconcile"],
): EffectDispatchPort {
  return { effectKind, dispatch, ...(reconcile === undefined ? {} : { reconcile }) };
}

describe("EffectOperation service", () => {
  it("fails closed without a current ExecutionContext", async () => {
    const fixture = makeFixture();
    await expect(fixture.service.prepare(request())).rejects.toMatchObject({
      problem: { problemCode: "effect.context.required" },
    });
  });

  it("normalizes a thrown dispatch to UNCERTAIN and never redispatches", async () => {
    const fixture = makeFixture();
    const operation = await prepared(fixture);
    let calls = 0;
    const effectPort = port(async () => {
      calls += 1;
      throw new Error("transport ended after write");
    });

    const uncertain = await fixture.execution.runActivity(
      {
        kind: "test.dispatch",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () => fixture.service.dispatch(operation.operation.effectOperationId, effectPort),
    );
    const replay = await fixture.execution.runActivity(
      {
        kind: "test.retry",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () => fixture.service.dispatch(operation.operation.effectOperationId, effectPort),
    );

    expect(uncertain.state).toBe("UNCERTAIN");
    expect(replay.state).toBe("UNCERTAIN");
    expect(calls).toBe(1);
  });

  it("accepts definitive failure and never calls a terminal operation again", async () => {
    const fixture = makeFixture();
    const operation = await prepared(fixture);
    let calls = 0;
    const effectPort = port(async () => {
      calls += 1;
      return {
        status: "FAILED",
        problem: {
          schemaVersion: 1,
          problemCode: "synthetic.no-effect",
          category: "unavailable",
          retryClass: "manual",
          title: "The sink rejected the write",
        },
      };
    });

    const failed = await fixture.execution.runActivity(
      {
        kind: "test.dispatch",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () => fixture.service.dispatch(operation.operation.effectOperationId, effectPort),
    );
    const replay = await fixture.execution.runActivity(
      {
        kind: "test.retry",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () => fixture.service.dispatch(operation.operation.effectOperationId, effectPort),
    );

    expect(failed.state).toBe("FAILED");
    expect(replay.state).toBe("FAILED");
    expect(calls).toBe(1);
  });

  it("recovers DISPATCHING to UNCERTAIN without invoking the adapter", async () => {
    const fixture = makeFixture();
    const operation = await prepared(fixture);
    fixture.repository.forceDispatching();
    let calls = 0;

    const recovered = await fixture.execution.runActivity(
      {
        kind: "test.recovery",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () =>
        fixture.service.dispatch(
          operation.operation.effectOperationId,
          port(async () => {
            calls += 1;
            return { status: "SUCCEEDED" };
          }),
        ),
    );

    expect(recovered.state).toBe("UNCERTAIN");
    expect(calls).toBe(0);
  });

  it("reconciles UNKNOWN without dispatch and refines positive evidence", async () => {
    const fixture = makeFixture();
    const operation = await prepared(fixture);
    let dispatchCalls = 0;
    let reconcileCalls = 0;
    const uncertainPort = port(
      async () => {
        dispatchCalls += 1;
        throw new Error("ambiguous");
      },
      async () => {
        reconcileCalls += 1;
        return { status: "UNKNOWN" };
      },
    );
    await fixture.execution.runActivity(
      {
        kind: "test.dispatch",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () =>
        fixture.service.dispatch(operation.operation.effectOperationId, uncertainPort),
    );
    const unknown = await fixture.execution.runActivity(
      {
        kind: "test.reconcile",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () =>
        fixture.service.reconcile(operation.operation.effectOperationId, uncertainPort),
    );
    expect(unknown.state).toBe("UNCERTAIN");
    expect(dispatchCalls).toBe(1);
    expect(reconcileCalls).toBe(1);

    const positivePort = port(
      async () => {
        dispatchCalls += 1;
        throw new Error("must not dispatch");
      },
      async () => ({ status: "SUCCEEDED", receipt: { accepted: true } }),
    );
    const refined = await fixture.execution.runActivity(
      {
        kind: "test.reconcile-positive",
        importance: "routine",
        retentionClass: "retained",
        sensitivity: "operational",
      },
      () =>
        fixture.service.reconcile(operation.operation.effectOperationId, positivePort),
    );
    expect(refined.state).toBe("SUCCEEDED");
    expect(dispatchCalls).toBe(1);
  });
});
