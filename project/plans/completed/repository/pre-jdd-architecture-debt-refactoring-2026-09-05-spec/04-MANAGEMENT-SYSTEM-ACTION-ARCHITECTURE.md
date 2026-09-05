# 04 — Management SystemAction Architecture

## 1. Problem

The current fixed `SystemActionRequest` union is legitimate Product semantics.
The implementation is not locally owned: the same `actionId` is interpreted in
many separate switches.

Current lifecycle concerns include:

```text
normalize
preconditions
owners
impact
reconcile decision
execute
postcondition verification
```

This is current, observed change amplification.

## 2. Preserve public semantics

Keep:

- current Management API;
- current action IDs and versions;
- plan/execute two-step semantics;
- plan digest and precondition fencing;
- explicit reauthentication/current auth semantics;
- owning System Service execution;
- deterministic postcondition verification;
- Evidence/lineage behavior.

Do not introduce Approval/Policy/durable ManagementOperation merely because
future Architecture contains those concepts. They are not current consumers in
this Plan.

## 3. Static contract catalog

Split the large contract source internally if useful:

```text
contracts/
  common.ts
  auth.ts
  read-models.ts
  system-actions.ts
  index.ts
```

or an equivalent small grouping.

The package root continues to export the current public Management contract.
This is a current source organization change, not a compatibility facade.

The static catalog remains data describing:

- actionId;
- actionVersion;
- input/output schema refs;
- target kind;
- risk class;
- apply mode.

## 4. Runtime action families

Create:

```text
src/system-actions/
  types.ts
  configuration.ts
  secret.ts
  ai-runtime.ts
  subject.ts
  catalog.ts
```

Group related current actions:

```text
configuration
  configuration.revision.create
  configuration.activate

secret
  secret.set
  secret.replace
  secret.revoke

ai-runtime
  gateway-profile.set
  model-profile.set
  model-binding.set

subject
  subject.start
  subject.stop
```

Do not create ten tiny modules unless implementation clarity materially improves.

## 5. Handler contract

Use a small internal typed contract conceptually equivalent to:

```ts
type ActionFor<I extends ProductSystemActionId> = Extract<
  SystemActionRequest,
  { actionId: I }
>;

interface SystemActionHandler<I extends ProductSystemActionId> {
  readonly actionIds: readonly I[];

  normalize(request: ActionFor<I>): ActionFor<I>;

  preconditions(
    action: ActionFor<I>,
    context: SystemActionContext,
  ): Promise<readonly TargetPrecondition[]>;

  affectedOwners(
    action: ActionFor<I>,
    context: SystemActionContext,
  ): Promise<readonly ProductSemanticId[]>;

  impact(
    action: ActionFor<I>,
    context: SystemActionContext,
  ): Promise<SystemActionImpact>;

  execute(
    action: ActionFor<I>,
    context: SystemActionContext,
    expectedDigest?: string | null,
  ): Promise<CanonicalJsonValue>;

  verify(
    action: ActionFor<I>,
    result: CanonicalJsonValue,
    context: SystemActionContext,
  ): Promise<boolean>;

  reconcilesSubjectRuntime(action: ActionFor<I>): boolean;
}
```

Exact type aliases may be simplified to avoid TypeScript generic gymnastics.
The important contract is responsibility co-location.

## 6. Catalog behavior

`catalog.ts` builds a finite mapping:

```text
ProductSystemActionId → current family handler
```

At construction:

- duplicate action ownership is rejected;
- every static current action ID has exactly one runtime handler;
- unknown IDs are rejected before plan/execute.

This is not a plugin registry. It has no package discovery, dynamic loading,
priority, fallback, version negotiation, or extension lifecycle.

## 7. Plan flow after refactor

```text
request
→ static schema validation / action lookup
→ handler.normalize
→ handler.preconditions
→ handler.affectedOwners
→ handler.impact
→ build SystemChangePlan
→ digest
```

No action-specific switch remains in the Management facade.

## 8. Execute flow after refactor

```text
authenticate / reauthenticate
→ verify plan digest
→ lookup same handler
→ recompute current preconditions
→ compare
→ handler.execute
→ handler.verify
→ reconcile Subject runtime if handler says current action requires it
→ Evidence/result
```

The facade owns cross-action security/plan semantics. The handler owns the
action-specific facts.

## 9. Required production dependencies

Rewrite `ManagementServiceOptions` so current production-required dependencies
are not optional for legacy tests:

- Product owners;
- Execution context where current plan semantics require it;
- current read/mutation Activity runners or the concrete execution service from
  which they are derived.

Do not support an auth-only production ManagementService mode.

If authentication logic benefits from an internal component split, that is
authorized because auth/session and SystemAction execution are independent
reasons to change. Do not create a second public service contract.

## 10. Unit tests

Replace legacy auth-only production construction with:

- explicit minimal Product owner fakes; or
- direct tests of the extracted internal auth/session component.

Add one focused catalog test:

```text
set(static ProductSystemActionId)
==
set(runtime handler actionIds)
```

and prove no duplicates.

Do not add a repository-wide “action registry completeness gate”.

## 11. Acceptance

After refactor:

- adding/changing one action family does not require editing multiple
  action-specific switches in the Management facade;
- no `switch(action.actionId)` remains in multiple cross-cutting lifecycle
  helpers;
- public Management wire semantics remain unchanged;
- current integration scenarios pass through normal plan/execute.
