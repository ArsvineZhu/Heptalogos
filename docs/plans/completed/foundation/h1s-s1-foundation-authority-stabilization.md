# H1-S1 Foundation Authority & Canonical-State Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove pre-production compatibility baggage and close all audited H1 Authority/recovery defects while preserving the proven PostgreSQL, locking, handoff and crash-consistency mechanics.

**Architecture:** S1 keeps existing package boundaries and mature mechanics. It resets H1 durable formats to canonical V1, makes previous revisions read-only evidence, makes root dependencies explicit, closes recovery/normal-boot routing gaps, makes ambiguous process identity fail closed, and performs bounded Host-maintenance/API cleanup. No H2 subsystem or speculative compatibility layer is introduced.

**Tech Stack:** TypeScript 7.0.2 canonical / TS6 compatibility lane, Vitest 4, XState 5, AJV/TypeBox, `@bybrave/proper-lockfile2`, PostgreSQL 18.6 mechanics through existing packages.

**Spec:** `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

## Execution record

`S1` completed on `dev/h1-stabilization` after the canonical-state, authority,
root, recovery, process-identity, maintenance-state, public-surface and
bounded-cleanup changes were implemented and locally verified. Live PostgreSQL
qualification remains a separate `NOT_RUN` S2 gate because
`HEPTALOGOS_TEST_PG_BIN` is not configured on this host.

## Global Constraints

- Execute only when `h1s-control-record.md` names this file as `governingPlan`.
- Preserve same-lease recovery: reclaim/acquire recovery ownership -> materialize recovered bootstrap context -> recover/prepare PostgreSQL -> normal Host handoff. Never release and reacquire between recovery proof and continuation.
- Preserve MaintenanceJournal current/previous durability, monotonic revisions, write-then-reload verification, and `RECOVERY_REQUIRED` previous-head logic; only historical payload compatibility and unsafe fallback Authority are removed.
- Preserve Host token/fence/advisory-lock semantics and PostgreSQL identity validation.
- No new runtime dependency is added in S1 unless an existing adopted dependency is proven incapable; current plan requires no new dependency.
- `PID_REUSED` is removed as positive H1 reclaim evidence; mismatch becomes `UNKNOWN`.
- B-level cleanup stops immediately if it expands into new subsystem work.
- Do not dispatch CI during S1.

---

### Task 1: Reset BootstrapState/BootstrapJournal/MaintenanceJournal to canonical PRE_PRODUCTION V1

**Files:**
- Modify: `packages/bootstrap-state/src/model.ts`
- Modify: `packages/bootstrap-state/src/codec.ts`
- Modify: `packages/bootstrap-state/src/journal.ts`
- Modify: `packages/bootstrap-state/src/maintenance-model.ts`
- Modify: `packages/bootstrap-state/src/maintenance-codec.ts`
- Modify: `packages/bootstrap-state/src/index.ts`
- Modify tests: `packages/bootstrap-state/src/codec.test.ts`
- Modify tests: `packages/bootstrap-state/src/store.test.ts`
- Modify tests: `packages/bootstrap-state/src/journal.test.ts`
- Modify tests: `packages/bootstrap-state/src/maintenance-codec.test.ts`
- Modify tests: `packages/bootstrap-state/src/maintenance-model.test.ts`
- Modify: `packages/bootstrap-state/src/platform-behavior.test.ts`
- Modify runtime consumers: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify runtime consumers: `packages/bootstrap-runtime/src/private-postgres-bootstrap.ts`
- Modify runtime consumers: `packages/bootstrap-runtime/src/maintenance-state-access.ts`
- Modify runtime consumers: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify runtime consumers: `packages/bootstrap-runtime/src/host-maintenance-recovery.ts`
- Modify: `packages/private-postgres/src/controller.ts`
- Modify private-postgres tests that assert `createPrivatePostgresInitializationProfileRevision()` or persisted initialization-profile identity.
- Modify runtime tests/fixtures that construct schema V2 or legacy target shapes.

**Interfaces:**
- Produces: the exact canonical V1 types in Spec §5.
- Later tasks assume no V2 type/domain/fallback exists.

- [ ] **Step 1: Write failing BootstrapState canonical-V1 tests**

Replace V1→V2/downgrade tests with tests equivalent to:

```ts
it("commits canonical V1 without private PostgreSQL and later adds V1 private PostgreSQL", async () => {
  const store = new BootstrapStateStore(await makeDirectory());
  await store.commit(makeStateV1(1));
  await store.commit({
    ...makeStateV1(2),
    privatePostgres: makePrivatePostgresV1(),
  });
  await expect(store.load()).resolves.toMatchObject({
    status: "CURRENT",
    value: { state: { schemaVersion: 1, revision: 2, privatePostgres: { schemaVersion: 1 } } },
  });
});

it("rejects the obsolete pre-reset outer V2 shape", () => {
  const parsed = parseBootstrapState(JSON.stringify(sealLegacyV2Fixture()));
  expect(parsed).toMatchObject({ ok: false });
});
```

The legacy fixture is test-local literal JSON; production code must not contain a legacy reader helper.

- [ ] **Step 2: Run the focused tests and confirm failure before implementation**

```bash
pnpm exec vitest run --root packages/bootstrap-state \
  src/codec.test.ts src/store.test.ts
```

Expected: FAIL because current code still has outer/inner V2 semantics.

- [ ] **Step 3: Implement canonical BootstrapState V1**

Make `PrivatePostgresBootstrapStateV1` contain the current authoritative fields including `bootstrapRoleName`. Make `BootstrapStateBodyV1.privatePostgres?` optional. Remove V2 interfaces/aliases/domain and make `sealBootstrapState`/`parseBootstrapState` use only `heptalogos.bootstrap-state/v1`.

Parser rules:

```text
schemaVersion == 1 -> validate canonical V1
schemaVersion > 1  -> bootstrap.state.unsupported_schema
anything else      -> bootstrap.state.invalid_schema
```

Do not add migration/upcast code.

- [ ] **Step 4: Write failing canonical BootstrapJournal tests**

Canonical V1 must require `installationId`/`instanceId` and match today's V2 writer shape. Add a literal legacy checkpoint lacking those fields and assert read rejection with `bootstrap.journal.invalid_entry`.

- [ ] **Step 5: Implement BootstrapJournal V1-only writer/reader**

Rename today's V2 interface/schema to V1; remove the old V1 schema and union. Change:

```ts
checkpoint(entry: BootstrapJournalCheckpointV1): Promise<void>
```

and make all runtime checkpoint writers emit `schemaVersion: 1`.

- [ ] **Step 6: Write failing MaintenanceJournal legacy-target rejection tests**

For `PRIVATE_POSTGRES_RESTART`, construct the old merged-M5A late-stage target:

```ts
target: {
  privatePostgres: "RUNNING_SAME_IDENTITY",
  hostOwnershipToken: targetToken,
  hostOwnershipRevision: "8",
  // hostBootId intentionally absent
}
```

At `HOST_TOKEN_PUBLISHED`, `BOOTSTRAP_RELEASE_ARMED`, and equivalent `RECOVERY_REQUIRED` shapes, parsing must fail unless the target ownership tuple satisfies current semantics.

- [ ] **Step 7: Remove legacy MaintenanceJournal compatibility**

Delete `resolveMaintenanceTargetHostBootId()`. Delete `legacyM5aTarget` and the recovery alternative that accepts token+revision without `hostBootId`. All recovery code reads `body.target.hostBootId` directly and treats an incomplete target fence as invalid.

- [ ] **Step 8: Update runtime consumers to canonical V1**

Required transformations include:

```text
BootstrapStateBodyV2 -> BootstrapStateBodyV1
BootstrapStateEnvelopeV2 -> BootstrapStateEnvelopeV1
PrivatePostgresBootstrapStateV2 -> PrivatePostgresBootstrapStateV1
schemaVersion: 2 journal checkpoints -> schemaVersion: 1
state.schemaVersion === 2 checks -> state.privatePostgres presence/current V1 identity checks
```

Remove M3/M4/M5A/M5B names from touched production error details; use semantic descriptions such as “authoritative private PostgreSQL identity is required”.

- [ ] **Step 9: Reset the Private PostgreSQL initialization-profile digest domain to canonical V1**

In `packages/private-postgres/src/controller.ts`, change only the compatibility-generation identity used by `createPrivatePostgresInitializationProfileRevision()`:

```ts
digestCanonicalJson(
  "heptalogos.private-postgres.initialization-profile/v1",
  profile as unknown as CanonicalJsonValue,
)
```

Delete expectations that treat the current `/v2` digest domain as supported historical input. Update profile-revision unit/integration expectations to the new canonical V1 digest. Do **not** change the profile fields, PostgreSQL 18.6 qualification, or `PRIVATE_POSTGRES_DATA_LAYOUT_VERSION = 1`.

- [ ] **Step 10: Replace legacy live-PG qualification cases**

Any PG-6A/legacy fixture that exists solely to prove no-`hostBootId` compatibility becomes a rejection test or is removed. Preserve the actual restart/recovery cases using the canonical explicit `hostBootId` shape.

- [ ] **Step 11: Run bootstrap-state, private-postgres and bootstrap-runtime unit suites**

```bash
pnpm nx run bootstrap-state:test
pnpm nx run private-postgres:test
pnpm nx run bootstrap-runtime:test
pnpm typecheck
pnpm tsc6
```

Expected: PASS; no exported V2 BootstrapState/BootstrapJournal types remain.

- [ ] **Step 12: Search for compatibility residue**

```bash
rg -n "BootstrapStateBodyV2|BootstrapStateEnvelopeV2|PrivatePostgresBootstrapStateV2|BootstrapJournalCheckpointV2|BOOTSTRAP_STATE_V2_DIGEST_DOMAIN|resolveMaintenanceTargetHostBootId|legacyM5a|legacy M5A|PG-6A|heptalogos\.private-postgres\.initialization-profile/v2" \
  packages scripts
```

Expected: no production residue; test/history names may remain only if explicitly testing rejection/historical evidence.

- [ ] **Step 13: Hold the canonical-format changes for the Authority checkpoint**

Do not commit yet. Continue directly to Task 2; canonical V1 shape and the rule that previous revisions cannot regain mutation Authority form one reviewable state-store contract and must land together.

---

### Task 2: Make previous revisions read-only evidence, never mutation Authority

**Files:**
- Modify: `packages/bootstrap-state/src/store.ts`
- Modify: `packages/bootstrap-state/src/store.test.ts`
- Modify: `packages/bootstrap-state/src/maintenance-store.ts`
- Modify: `packages/bootstrap-state/src/maintenance-store.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/private-postgres-bootstrap.ts`
- Modify: `packages/bootstrap-runtime/src/maintenance-state-access.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.ts`
- Modify corresponding tests.

**Interfaces:**
- Produces problem codes `bootstrap.state.current_authority_required` and `maintenance.journal.current_authority_required`.

- [ ] **Step 1: Flip the unsafe BootstrapState regression test**

Replace “commits the next revision after recovering previous” with:

```ts
it("never commits from RECOVERED_PREVIOUS", async () => {
  const directory = await makeDirectory();
  const store = new BootstrapStateStore(directory);
  await store.commit(makeState(1));
  await store.commit(makeState(2));
  await writeFile(join(directory, "bootstrap-state.json"), "corrupt");

  await expect(store.commit(makeState(2))).rejects.toMatchObject({
    problem: { problemCode: "bootstrap.state.current_authority_required" },
  });
  await expect(store.load()).resolves.toMatchObject({
    status: "RECOVERED_PREVIOUS",
    value: { state: { revision: 1 } },
  });
});
```

Also snapshot the two files before/after the failed commit and prove no mutation occurred.

- [ ] **Step 2: Implement `BootstrapStateStore.commit()` fail-closed behavior**

After `load()`:

```text
CORRUPT             -> existing ProblemError
RECOVERED_PREVIOUS  -> bootstrap.state.current_authority_required
EMPTY                -> expect revision 1
CURRENT              -> expect current.revision + 1
```

Delete schema downgrade logic if Task 1 has not already removed it.

- [ ] **Step 3: Add MaintenanceJournal current-corrupt/previous-valid advance test**

Corrupt `maintenance-state.json` while preserving a valid previous revision, then assert `advance()` fails with `maintenance.journal.current_authority_required` and does not rewrite either file.

- [ ] **Step 4: Implement `MaintenanceJournalStore.advance()` fail closed**

Only `CURRENT` can advance. `RECOVERED_PREVIOUS` is returned by `load()` for inspection but is never accepted as an advance base.

- [ ] **Step 5: Fail closed at runtime decision points**

Every runtime function that currently treats `CURRENT | RECOVERED_PREVIOUS` as a generic value must explicitly reject `RECOVERED_PREVIOUS` before using generation, private-PostgreSQL identity, operation pointers, or recovery scope.

Required boundaries include:

```text
prepareBootstrapPrelude / owned authoritative reload
private-postgres stateBody
maintenance-state require-current state
host-maintenance stateBody
inspectBootstrapRecovery maintenance observation
host-maintenance recovery requireBootstrapState
```

- [ ] **Step 6: Add runtime regression tests**

Prove at minimum:

```text
normal bootstrap + corrupt current/valid previous -> blocked
private-PG prepare + corrupt current/valid previous -> blocked
maintenance prepare + corrupt current/valid previous -> blocked
maintenance recovery + corrupt current/valid previous -> blocked
read-only inspection still reports RECOVERED_PREVIOUS/problem without mutation
```

- [ ] **Step 7: Run focused and package tests**

```bash
pnpm nx run bootstrap-state:test
pnpm nx run bootstrap-runtime:test
```

Expected: PASS.

- [ ] **Step 8: Commit the canonical-state Authority checkpoint**

```bash
git add packages/bootstrap-state packages/bootstrap-runtime packages/private-postgres
git commit -m "refactor: reset canonical state authority"
```

---

### Task 3: Make lifecycle-root dependencies explicit and minimal

**Files:**
- Modify: `packages/bootstrap-runtime/src/roots.ts`
- Modify: `packages/bootstrap-runtime/src/roots.test.ts`
- Modify: `packages/bootstrap-runtime/src/local-installation-owner.ts`
- Modify: `packages/bootstrap-runtime/src/local-installation-owner.test.ts`
- Modify every `resolveBootstrapPathProfile(...)` call site in `packages/bootstrap-runtime/` tests/fixtures.

**Interfaces:**
- Produces: `resolveBootstrapPathProfile(locator, requiredRoots)` with no default.

- [ ] **Step 1: Write the resolver isolation test**

Create a locator where `INSTANCE` exists but `BACKUP` points to an absolute nonexistent path. Assert:

```ts
const profile = await resolveBootstrapPathProfile(locator, ["INSTANCE"]);
expect(profile.list().map((root) => root.id)).toEqual(["INSTANCE"]);
expect(profile.resolve("INSTANCE").canonicalPath).toBeDefined();
expect(() => profile.resolve("BACKUP")).toThrow();
```

- [ ] **Step 2: Implement explicit required roots**

Change signature exactly to:

```ts
export async function resolveBootstrapPathProfile(
  locator: BootstrapLocatorV1,
  requiredRoots: readonly LifecycleRootId[],
): Promise<BootstrapPathProfile>
```

Resolve only the unique requested IDs. Reject an empty request with `bootstrap.root.empty_requirement` so call sites cannot accidentally create a meaningless profile. An unrequested root queried through `resolve()` throws `bootstrap.root.not_resolved`.

- [ ] **Step 3: Bound local-owner proof to INSTANCE**

`proveLocalInstallationOwner()` must resolve `["INSTANCE"]`, verify INSTANCE readability/ownership/write probe, and stop checking all lifecycle roots.

Add a test where BACKUP/CACHE/PACKAGE_STAGING are unavailable and local-owner proof still succeeds.

- [ ] **Step 4: Update normal/recovered bootstrap call sites**

Use:

```ts
const BOOTSTRAP_PRELUDE_ROOTS = ["INSTANCE", "DATA", "LOG", "TEMP"] as const;
```

for normal `prepareBootstrapPrelude()` and recovered bootstrap continuation that will prepare private PostgreSQL.

- [ ] **Step 5: Update recovery inspection/lease call sites**

Use `["INSTANCE"]` for:

```text
inspectBootstrapRecovery
acquireBootstrapRecoveryLease
reclaim path scope checks
local installation owner assertion scope
```

Recovery test fixtures that reconstruct a PostgreSQL descriptor use `["INSTANCE", "DATA", "LOG"]` before resolving those roots.

- [ ] **Step 6: Add unavailable-unrelated-root recovery test**

With valid INSTANCE evidence and nonexistent BACKUP/CACHE/PACKAGE_STAGING, `inspectBootstrapRecovery()` and `proveLocalInstallationOwner()` must behave exactly as if those unrelated roots were online.

- [ ] **Step 7: Prove requested-root failure still fails closed**

Make DATA unavailable and call normal `prepareBootstrapPrelude()`. Expect `bootstrap.root.not_found` for DATA; do not silently skip a required root.

- [ ] **Step 8: Run tests and typecheck**

```bash
pnpm nx run bootstrap-runtime:test
pnpm typecheck
pnpm tsc6
```

- [ ] **Step 9: Search for old one-argument calls**

```bash
rg -n "resolveBootstrapPathProfile\([^,\n]+\)" packages/bootstrap-runtime
```

Expected: no one-argument production/test call remains.

- [ ] **Step 10: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "fix: bound bootstrap lifecycle root dependencies"
```

---

### Task 4: Close no-lock witness and incomplete-maintenance routing gaps

**Files:**
- Create: `packages/bootstrap-runtime/src/maintenance-obligation.ts`
- Create/modify tests: `packages/bootstrap-runtime/src/maintenance-obligation.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery-command.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery-command.test.ts`
- Modify process fixture/test only as required to reproduce provider-lock cleanup: `packages/bootstrap-runtime/test/fixtures/recovery-owner-process.mjs`, `packages/bootstrap-runtime/src/bootstrap-recovery-process.integration.test.ts`.

**Interfaces:**
- Produces: one shared read-only maintenance obligation inspector.
- Normal bootstrap and recovery inspection consume the exact same incomplete-operation classification.

- [ ] **Step 1: Extract operation-reference/maintenance inspection without changing behavior**

Move `MAINTENANCE_OPERATION_REF_PREFIX`, operation-reference parsing, `maintenanceIsIncomplete`, and read-only MaintenanceJournal observation into `maintenance-obligation.ts`.

Expose internally:

```ts
export interface MaintenanceObligationInspection {
  readonly operationId?: MaintenanceOperationId;
  readonly maintenance?: MaintenanceJournalLoadResult;
  readonly incomplete: boolean;
  readonly problem?: Problem;
}

export async function inspectMaintenanceObligation(
  instanceRoot: string,
  state: BootstrapStateLoadResult,
): Promise<MaintenanceObligationInspection>
```

`RECOVERED_PREVIOUS` BootstrapState returns a problem, not a maintenance decision.

- [ ] **Step 2: Write the no-lock classifier matrix before changing `classify()`**

Add explicit tests for:

```text
no lock + dead ATTEMPT + no maintenance             -> NO_RECOVERY_REQUIRED
no lock + dead OWNER + no maintenance               -> NO_RECOVERY_REQUIRED
no lock + dead OWNER + incomplete maintenance       -> INCOMPLETE_MAINTENANCE
no lock + no witnesses + incomplete maintenance     -> INCOMPLETE_MAINTENANCE
no lock + SAME_PROCESS OWNER/ATTEMPT                 -> BLOCKED
no lock + UNKNOWN OWNER/ATTEMPT                      -> BLOCKED
no lock + RELEASING only                             -> NO_RECOVERY_REQUIRED
```

Do not weaken any lock-present stale/live/unknown test.

- [ ] **Step 3: Implement the matrix**

For `lock.present === false`, evaluate OWNER/ATTEMPT safety evidence before deciding maintenance/no-maintenance. Dead historical evidence does not itself create ownership. RELEASING-only evidence remains non-blocking.

For `lock.present === true`, retain stale threshold and positive process-death proof requirements.

- [ ] **Step 4: Add a real process provider-cleanup regression**

Extend the owner fixture with a role that acquires bootstrap ownership and exits the process without calling `lease.release()`, allowing `proper-lockfile2`'s exit handler to remove the provider lock while leaving the Heptalogos OWNER witness.

Parent test must prove:

```text
child exits
provider lock path is absent
OWNER witness remains
process is definitely dead
inspection is not permanently BLOCKED
new normal bootstrap ownership can be acquired when there is no incomplete maintenance
```

Do not use SIGKILL for this specific test because SIGKILL cannot run the provider exit cleanup being qualified.

- [ ] **Step 5: Gate normal bootstrap on incomplete maintenance before lock acquisition**

In `prepareBootstrapPrelude()` after preliminary state read, call `inspectMaintenanceObligation()`. If `problem` exists, throw it. If `incomplete === true`, throw:

```text
problemCode: bootstrap.recovery.maintenance_required
category: conflict
retryClass: manual
```

Include the exact operation ID in structured/internal detail where available; do not auto-run recovery.

- [ ] **Step 6: Recheck the obligation after ownership acquisition**

After authoritative BootstrapState reload under the newly held lease, call the same inspector again. If incomplete/problem is observed, release ownership through the existing error path and fail. This closes the read-before-lock TOCTOU window.

- [ ] **Step 7: Prove terminal historical operations do not block normal boot**

Add tests for `SUCCEEDED` and `ABORTED` journal outcomes referenced by BootstrapState; normal bootstrap may continue.

`FAILED`, `UNCERTAIN`, missing terminal outcome, or `RECOVERY_REQUIRED` remains incomplete and blocks normal boot.

- [ ] **Step 8: Prove bounded command routes no-lock incomplete maintenance**

`executeBootstrapRecoveryCommand(... RECOVER ...)` with no provider lock + dead historical witness + incomplete operation must choose `MAINTENANCE`, acquire a fresh recovery lease through the existing `INCOMPLETE_MAINTENANCE` path, and never route to bootstrap continuation.

- [ ] **Step 9: Run unit and process integration tests**

```bash
pnpm nx run bootstrap-runtime:test
pnpm nx run bootstrap-runtime:test:recovery-process
```

Expected: PASS.

- [ ] **Step 10: Hold recovery-routing changes for the adjudication checkpoint**

Do not commit yet. Continue directly to Task 5; no-lock witness classification and process-identity evidence jointly determine whether recovery may acquire Authority and therefore must land as one checkpoint.

---

### Task 5: Make ambiguous process identity fail closed instead of claiming PID reuse

**Files:**
- Modify: `packages/bootstrap-runtime/src/bootstrap-process-identity.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-process-identity.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-recovery.test.ts`
- Modify any test/evidence fixture referring to `PID_REUSED` as a successful reclaim proof.

**Interfaces:**
- Produces status union `SAME_PROCESS | PROCESS_DEAD | UNKNOWN`.

- [ ] **Step 1: Flip the same-PID start mismatch test**

Change expectation to:

```ts
it("classifies a live PID with start-time mismatch as UNKNOWN", async () => {
  const identity = currentBootstrapProcessIdentity();
  await expect(inspectBootstrapProcessIdentity({
    pid: identity.pid,
    startedAtMs: identity.startedAtMs - 10_000,
  })).resolves.toBe("UNKNOWN");
});
```

- [ ] **Step 2: Remove positive PID reuse classification**

Change type to:

```ts
export type BootstrapProcessIdentityStatus =
  "SAME_PROCESS" | "PROCESS_DEAD" | "UNKNOWN";
```

If PID exists and the `pidusage`-derived start estimate differs beyond tolerance, return `UNKNOWN`.

- [ ] **Step 3: Tighten stale-lock eligibility**

A present stale provider lock is reclaimable only when every relevant OWNER/ATTEMPT process status used as death proof is `PROCESS_DEAD`. Any `SAME_PROCESS` or `UNKNOWN` blocks.

- [ ] **Step 4: Preserve definite-death and ambiguity tests**

Required unit properties:

```text
self -> SAME_PROCESS
live child -> SAME_PROCESS
terminated child -> PROCESS_DEAD
live PID + mismatched start -> UNKNOWN
ambiguous kill probe -> UNKNOWN
pidusage failure while PID exists -> UNKNOWN
```

Required recovery property:

```text
stale lock + UNKNOWN process identity -> BLOCKED
```

- [ ] **Step 5: Run tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/bootstrap-process-identity.test.ts src/bootstrap-recovery.test.ts
pnpm nx run bootstrap-runtime:test:recovery-process
```

- [ ] **Step 6: Commit the recovery-adjudication checkpoint**

```bash
git add packages/bootstrap-runtime
git commit -m "fix: close bootstrap recovery adjudication gaps"
```

---

### Task 6: Collapse Host-maintenance duplicate state and narrow recovery provenance

**Files:**
- Modify: `packages/bootstrap-runtime/src/host-maintenance-machine.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify: `packages/bootstrap-runtime/src/managed-host.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-machine.test.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.test.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.test.ts`

**Interfaces:**
- Produces: XState tracker as the sole in-process maintenance state; `HostMaintenanceBootstrapContext` as the shared normal/recovery provenance type.

- [ ] **Step 1: Make `PreparedMaintenanceState` an alias, not a duplicate union**

In `managed-host.ts` import `HostMaintenanceState` and define:

```ts
export type PreparedMaintenanceState = HostMaintenanceState;
```

- [ ] **Step 2: Add a stage-to-event function with complete durable mapping**

In `host-maintenance.ts`, define one mapping used only after a successful journal advance:

```ts
function eventForCommittedStage(stage: MaintenanceStage): HostMaintenanceEvent | undefined {
  switch (stage) {
    case "HOST_QUIESCED": return { type: "QUIESCENCE_PROVEN" };
    case "HOST_TOKEN_REVOKED": return { type: "TOKEN_REVOKED" };
    case "HOST_LEASE_CLOSED": return { type: "WINDOW_ENTERED" };
    case "POSTGRES_STOPPED": return { type: "POSTGRES_STOPPED" };
    case "POSTGRES_READY": return { type: "POSTGRES_READY" };
    case "HOST_LEASE_ACQUIRED": return { type: "HOST_LEASE_ACQUIRED" };
    case "HOST_TOKEN_PUBLISHED": return { type: "HOST_REACQUIRED" };
    case "ABORTED": return { type: "ABORTED" };
    case "RECOVERY_REQUIRED": return { type: "RECOVERY_REQUIRED" };
    default: return undefined;
  }
}
```

Export `HostMaintenanceEvent` from the machine module only internally as needed; do not expose XState itself through package root.

- [ ] **Step 3: Remove `lifecycleState` completely**

Delete the mutable variable and `stateByStage`. Guards/error details use `tracker.state`. `PreparedPrivatePostgresMaintenance.state` returns `tracker.state`.

Remove direct duplicate `tracker.send(...)` calls for events now generated by successful `advance()`. `complete()` continues to emit `COMPLETED` only after release/completion work succeeds.

- [ ] **Step 4: Test that journal failure does not advance in-process state**

Inject a failing `journal.advance`. After failure, prove tracker/public state did not move to the requested committed stage. This establishes:

```text
durable journal commit -> then in-process state transition
```

- [ ] **Step 5: Introduce narrow `HostMaintenanceBootstrapContext`**

In `host-maintenance.ts` define the spec's narrow interface containing IDs, path profile and BootstrapJournal only. Change `HostMaintenanceOperationProvenance.bootstrap` and its password-provider helper to use it.

- [ ] **Step 6: Delete the fake recovered prelude context**

In `host-maintenance-recovery.ts`, replace the function that manufactures `OwnedBootstrapPreludeHandoffContext`/fresh session/always-throwing `assertReady` with a narrow context constructor that returns only `HostMaintenanceBootstrapContext`.

There must be no recovery-only fake `privatePostgresSession` and no `assertReady()` that exists solely to satisfy an over-wide type.

- [ ] **Step 7: Run maintenance unit/integration tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/host-maintenance-machine.test.ts \
  src/host-maintenance.test.ts \
  src/host-maintenance-recovery.test.ts
pnpm nx run bootstrap-runtime:test:integration
```

- [ ] **Step 8: Commit**

```bash
git add packages/bootstrap-runtime
git commit -m "refactor: collapse host maintenance state authority"
```

---

### Task 7: Narrow public Authority surface and finish bounded implementation cleanup

**Files:**
- Modify: `packages/bootstrap-runtime/src/index.ts`
- Modify internal tests that self-import raw package-root APIs.
- Modify: `packages/bootstrap-runtime/src/bootstrap-ownership.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-ownership.test.ts`
- Modify: `packages/private-postgres/src/controller.ts`
- Modify private-postgres tests covering effective path identity.
- Modify: `scripts/verify/boundaries.mjs`
- Modify boundary verifier tests if present.

**Interfaces:**
- Produces: bounded package-root recovery API and semantic permanent boundary names.

- [ ] **Step 1: Remove raw Authority exports from `bootstrap-runtime` package root**

Remove the spec-listed raw exports. Internal tests that need them import `./bootstrap-ownership.js`, `./bootstrap-recovery.js`, `./host-maintenance-recovery.js`, or `./maintenance-state-access.js` directly.

Keep `executeBootstrapRecoveryCommand`, `parseBootstrapRecoveryCommand`, read-only inspection/result types, normal bootstrap orchestration and public managed Host/key-provider contracts.

- [ ] **Step 2: Add a boundary gate for the package-root Authority surface**

In `scripts/verify/boundaries.mjs`, read `packages/bootstrap-runtime/src/index.ts` and fail if it exports any of:

```text
acquireBootstrapOwnership
acquireBootstrapRecoveryLease
reclaimAbandonedBootstrapOwnership
recoverAbandonedBootstrapToHost
recoverInterruptedHostMaintenance
openMaintenanceStateAccess
OwnedMaintenanceStateAccess
BOOTSTRAP_RECOVERY_STALE_MS
assertLocalInstallationOwnerFor
```

The error must be semantic, e.g. `raw bootstrap/recovery Authority primitive leaked through the public bootstrap-runtime contract`.

- [ ] **Step 3: Rename permanent M4 verifier identifiers/messages**

Rename `m4HostOwnershipSourcePrefix`/`m4AdapterSourcePaths` and user-visible verifier errors to semantic Host-ownership names. Keep the actual dependency restrictions unchanged.

Also replace touched permanent runtime comments/error messages that use M3/M4/M5A/M5B as current semantics.

- [ ] **Step 4: Make recovery heartbeat/provider timing explicit**

In `bootstrap-ownership.ts`, validate recovery heartbeat against the finite stale policy before writing ATTEMPT evidence:

```text
normal ownership: integer heartbeat >= 1000 ms
recovery ownership: integer heartbeat between 1000 and 15000 ms inclusive
```

Use a distinct problem such as `bootstrap.ownership.invalid_recovery_heartbeat` for the upper-bound violation. Add tests for 15_000 accepted and 15_001 rejected. Do not add configuration plumbing.

- [ ] **Step 5: Remove Windows lowercase canonical-path collapse**

In `private-postgres/src/controller.ts`, after all four path values are resolved with `realpath()`, compare canonical data/HBA paths directly with `===`. Remove `process.platform === "win32" ? toLowerCase() : ...`.

Preserve existing Windows case/path tests; add a unit-level assertion around the canonical comparison if needed, but do not create a platform abstraction or manipulate NTFS flags in H1-S.

- [ ] **Step 6: Run boundaries, package tests, and typechecks**

```bash
pnpm check:boundaries
pnpm nx run bootstrap-runtime:test
pnpm nx run private-postgres:test
pnpm typecheck
pnpm tsc6
```

- [ ] **Step 7: Search for permanent milestone-semantic leakage**

```bash
rg -n "M3|M4|M5A|M5B|m3|m4|m5a|m5b" \
  packages/*/src scripts/verify \
  -g '!**/*.test.ts'
```

Every remaining production/verifier match must be either removed or demonstrably historical/non-semantic; do not rename test fixture history merely for cosmetics.

- [ ] **Step 8: Commit**

```bash
git add packages/bootstrap-runtime packages/private-postgres scripts/verify
git commit -m "refactor: narrow Foundation authority surfaces"
```

---

### Task 8: S1 regression checkpoint and promotion to S2

**Files:**
- Modify: `docs/plans/active/foundation/h1s-control-record.md`
- Move: `docs/plans/active/foundation/h1s-s1-foundation-authority-stabilization.md` -> `docs/plans/completed/foundation/h1s-s1-foundation-authority-stabilization.md`
- Modify: `docs/plans/README.md`

**Interfaces:**
- Produces: behavior-complete S1 head and S2 execution gate OPEN.

- [ ] **Step 1: Run all local unit/static gates**

```bash
pnpm verify
```

Expected: PASS. Remember this does not include package integration targets.

- [ ] **Step 2: Run H1 integration targets explicitly**

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:recovery-process
```

If a target requires `HEPTALOGOS_TEST_PG_BIN`, verify the variable first rather than silently skipping:

```bash
test -n "$HEPTALOGOS_TEST_PG_BIN"
```

If the current host genuinely lacks a qualified PostgreSQL 18.6 bin root, record that target as `NOT_RUN` for S2 instead of reporting PASS; do not fake or mock the live result.

- [ ] **Step 3: Run real PostgreSQL recovery target when the bin root is available**

```bash
test -n "$HEPTALOGOS_TEST_PG_BIN"
pnpm nx run bootstrap-runtime:test:recovery-process:postgres
```

Expected on the qualified Ubuntu environment: PASS.

- [ ] **Step 4: Run focused searches for forbidden residue**

```bash
rg -n "BootstrapStateBodyV2|BootstrapStateEnvelopeV2|PrivatePostgresBootstrapStateV2|BootstrapJournalCheckpointV2|resolveMaintenanceTargetHostBootId|legacyM5a" packages scripts
rg -n "PID_REUSED" packages/bootstrap-runtime
```

Expected: no current production semantics. Any remaining test string must explicitly be a rejected legacy fixture, not supported behavior.

- [ ] **Step 5: Promote S2**

Update control:

```yaml
governingPlan: h1s-s2-clean-state-qualification-closure.md
S1.planState: COMPLETED
S1.executionGate: CLOSED
S2.executionGate: OPEN
```

Move S1 plan to completed and update `docs/plans/README.md`.

- [ ] **Step 6: Commit and push**

```bash
git add docs/plans
git commit -m "docs: promote H1 stabilization to S2"
git push
```

Do not mark the PR Ready yet; S2 still must reconcile qualification evidence and freeze the final candidate.
