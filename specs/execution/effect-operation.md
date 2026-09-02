# Effect Operation Contract

## Scope

This Spec defines the canonical Heptalogos truth for one consequential external
effect. It distinguishes dispatch admission, an attempted external call, and
knowledge of the resulting external effect. It does not define a network
protocol, provider registry, retry engine, scheduler, or compensation model.

## Ownership

`effect-operation` owns `EffectOperation` semantics and canonical repository
transitions. `persistence` owns Host-fenced transaction mechanics;
`execution-lineage` and `evidence` own causal and retained evidence contracts.
`work-queue` owns `WorkItem` truth. DBOS state and provider acknowledgements
are observations or projections, not EffectOperation Authority.

## Contract

An EffectOperation is a versioned, immutable-request record:

```ts
interface EffectOperation {
  readonly schemaVersion: 1;
  readonly effectOperationId: EffectOperationId;
  readonly effectKind: EffectKindId;
  readonly requestVersion: number;
  readonly request: CanonicalJsonValue;
  readonly state: "PREPARED" | "DISPATCHING" | "SUCCEEDED" | "FAILED" | "UNCERTAIN";
  readonly lineageContextRef: LineageContextRef;
  readonly dispatchHostOwnershipToken?: HostOwnershipToken;
  readonly outcome?: EffectOutcome;
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
}
```

`EffectOperationId` is the caller-supplied stable external request key. The
caller MUST generate it before durable handoff. `requestVersion` MUST be a
positive integer. The request is canonicalized without mutation or silent
coercion and MUST NOT change after successful preparation.

The V1 outcome contract is:

```ts
type EffectOutcome =
  | {
      readonly schemaVersion: 1;
      readonly status: "SUCCEEDED";
      readonly receipt?: CanonicalJsonValue;
    }
  | { readonly schemaVersion: 1; readonly status: "FAILED"; readonly problem: Problem }
  | {
      readonly schemaVersion: 1;
      readonly status: "UNCERTAIN";
      readonly problem?: Problem;
    };
```

Unsupported schema or outcome versions MUST fail explicitly. `PRE_PRODUCTION`
means the current V1 shape is rewritten in place; development history does
not create a compatibility reader, bridge migration, alias, or fallback.

## Invariants

- `EFFECT-001` Preparation MUST require the current `ExecutionContext` and commit the prepared record with retained prepare Activity and required Evidence through the Host-fenced mutation.
- `EFFECT-002` Existing preparation is idempotent only when effect kind, request version, and canonical request are identical. Any difference MUST fail with an identity conflict.
- `EFFECT-003` Legal transitions are `PREPARED → DISPATCHING`, `DISPATCHING → SUCCEEDED | FAILED | UNCERTAIN`, and `UNCERTAIN → SUCCEEDED | FAILED` during read-only reconciliation. `SUCCEEDED` and `FAILED` are terminal.
- `EFFECT-004` `PREPARED → DISPATCHING` MUST be a Host-fenced compare-and-set mutation. Concurrent callers MUST have at most one admission winner.
- `EFFECT-005` Only the caller that commits dispatch admission MAY invoke the injected dispatch port. A dispatch caller that observes `DISPATCHING` MUST return it unchanged and MUST NOT recover or mutate it; observing any other state MUST NOT invoke the port.
- `EFFECT-006` The port receives `EffectOperationId` as the external request key. The current contract admits one dispatch per operation and MUST NOT create automatic redispatch.
- `EFFECT-007` Ownership or cancellation lost before the external call MUST prevent the call when the current Host signal proves admission is no longer valid. A definitive no-effect result MAY be `FAILED`; otherwise completion is fail-closed.
- `EFFECT-008` Once the external call may have started, an exception, cancellation, timeout, or missing canonical outcome MUST be `UNCERTAIN` unless positive evidence proves `FAILED`.
- `EFFECT-009` An explicitly recovered `DISPATCHING` operation MUST be Host-fenced to `UNCERTAIN` and MUST NOT be dispatched again, including after a crash before the call. The owner MUST expose this as `recoverDispatch()`; `dispatch()` MUST NOT infer recovery from a live `DISPATCHING` observation.
- `EFFECT-010` `UNCERTAIN` is stable current truth. It MUST NOT become `DISPATCHING` automatically and MUST NOT cause a WorkItem retry merely because the effect is uncertain.
- `EFFECT-011` Reconciliation MUST accept only `UNCERTAIN`, use the exact matching read-only reconciliation operation, and never call dispatch. `UNKNOWN` leaves `UNCERTAIN`; only positive success or failure evidence may refine it.
- `EFFECT-012` State-changing effect Activities MUST retain Lineage and Evidence distinctions for preparation, dispatch admission, outcome, recovery to uncertainty, and reconciliation.
- `EFFECT-013` Stale Host ownership MUST prevent effect completion or reconciliation refinement.
- `EFFECT-014` A WorkHandler that durably establishes `SUCCEEDED`, `FAILED`, or `UNCERTAIN` has completed its WorkItem obligation. WorkItem success and external-effect success are different facts.

## Operations

The owner exposes `get`, `prepare`, `dispatch`, explicit `recoverDispatch`, and
`reconcile`. `recoverDispatch` requires a current ExecutionContext, accepts no
dispatch port, performs one Host-fenced `DISPATCHING → UNCERTAIN` transition,
and fails stop on mutation/evidence/lineage failure. It rejects `PREPARED`
recovery and does not retry itself. A dispatch adapter returns knowledge, not
retry policy:

```ts
interface EffectDispatchPort {
  readonly effectKind: EffectKindId;
  dispatch(input: {
    readonly effectOperationId: EffectOperationId;
    readonly externalRequestKey: string;
    readonly requestVersion: number;
    readonly request: CanonicalJsonValue;
    readonly signal: AbortSignal;
  }): Promise<
    | { readonly status: "SUCCEEDED"; readonly receipt?: CanonicalJsonValue }
    | { readonly status: "FAILED"; readonly problem: Problem }
    | { readonly status: "UNCERTAIN"; readonly problem?: Problem }
  >;
  reconcile?(input: {
    readonly effectOperationId: EffectOperationId;
    readonly externalRequestKey: string;
    readonly requestVersion: number;
    readonly request: CanonicalJsonValue;
    readonly signal: AbortSignal;
  }): Promise<
    | { readonly status: "SUCCEEDED"; readonly receipt?: CanonicalJsonValue }
    | { readonly status: "FAILED"; readonly problem: Problem }
    | { readonly status: "UNKNOWN" }
  >;
}
```

An adapter's `FAILED` result MUST have a positive basis that the requested
effect did not succeed. A thrown or rejected dispatch is normalized to
`UNCERTAIN`; the service MUST NOT infer failure from transport silence.

## Lifecycle and failure semantics

Mutation transactions MUST contain only canonical row changes and required
Lineage/Evidence work. External I/O MUST occur after committed dispatch
admission and outside the mutation transaction. A final outcome commit failure
MUST NOT invoke the external port again in the same execution path.

If the current Host loses authority after dispatch admission, the stale caller
MUST NOT commit an outcome. An explicitly authorized replacement handling path
may observe `DISPATCHING` and apply bounded recovery to `UNCERTAIN`; a concurrent
dispatch observer MUST leave the live state unchanged. Lease reacquisition,
external rollback, background reconciliation scheduling, and recovery-of-recovery
are outside this contract.

## References

- [`Work Item`](./work-item.md)
- [`Durable Dispatch`](./durable-dispatch.md)
- [`Execution Lineage`](./execution-lineage.md)
- [`Evidence`](./evidence.md)
- [`Persistence Transactions`](../data/persistence-transactions.md)
- [`Contract Versioning`](../core/contract-versioning.md)
- [`effect-operation`](../../packages/execution/effect-operation/README.md)
