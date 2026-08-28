# H1-S Independent Review Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use a task-by-task execution workflow with a fresh verification checkpoint after each task. Do not execute final CI or merge until an independent re-review explicitly returns PASS.

**Goal:** Correct the remaining H1-S runtime correctness and candidate-governance defects so H1 can be honestly requalified, independently reviewed, final-CI verified, and closed without entering H2.

**Architecture:** Preserve the approved H1-S canonical V1 reset and existing bootstrap ↔ Host ownership model. Fix only: MaintenanceJournal success terminality, Host-maintenance state/journal transition atomicity, recovery error-path Authority revalidation, exact `(base_sha, head_sha)` candidate verification, and post-merge truth reconciliation. Do not add a new subsystem or compatibility layer.

**Tech Stack:** Node.js 24.19.0; pnpm 11.22.0; Nx; TypeScript 7.0.2 canonical + TypeScript 6.0.2 compatibility lane; Vitest; XState; PostgreSQL 18.6; `pg`; `@bybrave/proper-lockfile2`.

**Spec:** `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

**Review baseline:**

- Reviewed base: `master@257ad6fe73924bcd1c9a00cad6a15938d6e6a2da`
- Branch: `dev/h1-stabilization`
- PR: `#11`
- Current branch HEAD observed during review: `803ea6994fea6234e6ce42f79d69b5f92eaddc64`
- Prior H1-S behavior evidence SHA: `1640c232a4629644c3588ebd108f887e7c786f77`
- `.codegraph/.gitignore` at current HEAD is a user-added non-behavioral change. Preserve it; do not revert or classify it as an implementation defect.

## Global Constraints

1. H1 remains `OPEN`; H2 remains `NOT_ELIGIBLE` throughout this correction branch.
2. Do not implement H2 capability, redesign package topology, replace PostgreSQL/XState/locking providers, or add a new subsystem.
3. `CompatibilityEpoch = PRE_PRODUCTION`; do not reintroduce V2/legacy readers, migration shims, or historical-format compatibility.
4. `RECOVERED_PREVIOUS` remains inspection evidence only and must never authorize mutation.
5. All MaintenanceJournal and BootstrapState mutation remains fenced by authentic bootstrap ownership.
6. All behavior/evidence/doc mutations must be complete before the next independent review freeze.
7. Any behavior-affecting correction invalidates the old behavior candidate as the current H1-S authorization target. Fresh local/integration/real-PG qualification is mandatory.
8. Ordinary correction commits do not dispatch final CI.
9. Do not modify or remove `.codegraph/.gitignore`.
10. If any fix requires a new subsystem, new durable database, schema-generation compatibility mechanism, or H2 capability, STOP and return for architecture review.

---

### Review Findings This Plan Closes

#### RC-1 — Successful maintenance is classified as incomplete on the next normal boot

Current production success paths leave `MaintenanceJournal.lastCompletedStage = BOOTSTRAP_RELEASE_ARMED` without a terminal outcome, while `inspectMaintenanceObligation()` treats every journal without `terminalOutcome` as incomplete. `BootstrapState.lastCommittedOperationRef` remains pointed at that operation. Therefore a successful STOP/RESTART can cause the next `prepareBootstrapPrelude()` to fail with `bootstrap.recovery.maintenance_required`.

The existing prelude tests construct synthetic `SUCCEEDED`/`ABORTED` journal bodies that the successful production path does not produce, so they do not prove post-maintenance boot continuity.

#### RC-2 — Host-maintenance can commit an illegal durable stage before XState rejects it

`host-maintenance.ts::advance()` currently:

1. persists the next MaintenanceJournal revision;
2. updates the local `body`;
3. only then calls `tracker.send(event)`.

An illegal mapped transition can therefore mutate durable progress before the sole in-process state machine rejects it.

#### RC-3 — Recovery error journaling does not require current BootstrapState Authority

The `recoverInterruptedHostMaintenance()` catch path appends `RECOVERY_REQUIRED` whenever the bootstrap lease is held and the reloaded BootstrapState is merely `!== CORRUPT`. This includes `EMPTY` and `RECOVERED_PREVIOUS`, and it does not re-check that `lastCommittedOperationRef` still selects the same operation.

#### RC-4 — Final CI proves ancestry, not that the reviewed base branch is still current

The current workflow proves `base_sha` is an ancestor of `target_sha`, but does not prove that the current `master` ref still equals `base_sha`.

#### RC-5 — H1 closes at merge, but repository truth is forbidden from recording that closure

The current control/playbook says post-merge reconciliation is read-only/non-mutating while roadmap/control remain `H1: OPEN / H2: NOT_ELIGIBLE`. Without a bounded post-merge truth reconciliation, the repository remains permanently stale after a successful closure event.

#### RC-6 — Bounded guard hardening: package-root raw Authority check can be bypassed by `export *`

The current verifier scans for raw exported names. A future `export * from "./bootstrap-recovery.js"` could bypass that name scan. The current index is safe; this is a bounded mechanical hardening item.

---

## Execution Order

```text
R0 truth/control reopen
  ↓
R1 canonical maintenance terminality
  ↓
R2 real post-maintenance boot continuity
  ↓
R3 prevalidate XState transition before durable commit
  ↓
R4 fence recovery error journaling by current BootstrapState Authority
  ↓
R5 candidate-pair + closure governance correction
  ↓
R6 bounded export guard hardening
  ↓
R7 full requalification + evidence reconciliation
  ↓
FREEZE NEW (base_sha, head_sha)
  ↓
independent re-review
  ↓ PASS only
manual final CI
  ↓ PASS only
squash merge
  ↓
separate post-merge truth reconciliation PR
  ↓
H2 eligible
```

---

### Task 0: Reopen H1-S Review-Correction Truth

**Files:**

- Create: `docs/plans/active/foundation/h1s-review-correction.md`
- Move: `docs/plans/completed/foundation/h1s-control-record.md` -> `docs/plans/active/foundation/h1s-control-record.md`
- Modify: `docs/plans/README.md`
- Modify: PR #11 body after the commit is pushed

**Interfaces:**

- Consumes: completed S0/S1/S2 records.
- Produces: one active review-correction plan and an honest control state.

- [ ] **Step 1: Install this plan at the canonical active-plan path**

Copy this document verbatim to:

```text
docs/plans/active/foundation/h1s-review-correction.md
```

- [ ] **Step 2: Reopen only the control record, not S0/S1/S2**

Set current truth to:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: REVIEW_CORRECTION_ACTIVE
H1: OPEN
H2: NOT_ELIGIBLE
executionStatus: REVIEW_CORRECTION_ACTIVE
externalClosureGates: RESET_AFTER_REQUEST_CHANGES
```

Keep S0/S1/S2 as completed historical phases. Add:

```yaml
reviewCorrection:
  plan: h1s-review-correction.md
  planState: ACTIVE
  executionGate: OPEN
governingPlan: h1s-review-correction.md
```

Record:

```text
independent review: REQUEST_CHANGES
reviewed repository head: 803ea6994fea6234e6ce42f79d69b5f92eaddc64
reason: RC-1..RC-5
```

Do not mark `.codegraph/.gitignore` as a defect.

- [ ] **Step 3: Update plan navigation**

`docs/plans/README.md` must show this correction plan and control record under Active. S0/S1/S2 remain under Completed.

- [ ] **Step 4: Run document/repository structural gates**

```bash
pnpm check:repository
pnpm check:agents
pnpm check:corpus
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/plans
git commit -m "docs: reopen H1 stabilization review correction"
```

---

#### Task 1: Make MaintenanceJournal Success Terminality Reachable and Canonical

**Files:**

- Modify: `packages/bootstrap-state/src/maintenance-codec.ts`
- Modify: `packages/bootstrap-state/src/maintenance-codec.test.ts`
- Modify: `packages/bootstrap-runtime/src/maintenance-obligation.ts`
- Modify: `packages/bootstrap-runtime/src/maintenance-obligation.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.test.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.ts`
- Modify: `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

**Interfaces:**

- Consumes: canonical MaintenanceJournal V1.
- Produces: one reachable, explicit successful durable terminal shape:
  `lastCompletedStage = BOOTSTRAP_RELEASE_ARMED` + `terminalOutcome = SUCCEEDED`.

**Required invariant:**

```text
successful maintenance target reached
→ BOOTSTRAP_RELEASE_ARMED / SUCCEEDED is committed while bootstrap Authority is still held
→ bootstrap ownership release is attempted
→ later normal bootstrap treats that referenced operation as complete

earlier progress stage
→ never becomes complete merely because terminalOutcome says SUCCEEDED
```

- [ ] **Step 1: Write failing codec semantic tests**

Add exact cases:

```ts
it("accepts BOOTSTRAP_RELEASE_ARMED only as successful terminal completion", () => {
  const body = makeJournal({
    lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
    terminalOutcome: "SUCCEEDED",
  });
  expect(parseMaintenanceJournal(canonical(body)).ok).toBe(true);
});

it("rejects SUCCEEDED on an earlier progress stage", () => {
  const body = makeJournal({
    lastCompletedStage: "POSTGRES_STOPPED",
    terminalOutcome: "SUCCEEDED",
  });
  expect(parseMaintenanceJournal(canonical(body))).toMatchObject({
    ok: false,
    problem: { problemCode: "maintenance.journal.invalid_semantics" },
  });
});

it("rejects BOOTSTRAP_RELEASE_ARMED without SUCCEEDED", () => {
  const body = makeJournal({
    lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
  });
  expect(parseMaintenanceJournal(canonical(body))).toMatchObject({
    ok: false,
    problem: { problemCode: "maintenance.journal.invalid_semantics" },
  });
});
```

Keep:

```text
ABORTED            ↔ terminalOutcome ABORTED
RECOVERY_REQUIRED  ↔ terminalOutcome FAILED | UNCERTAIN
```

No other stage may carry a terminal outcome.

- [ ] **Step 2: Run the focused codec tests and confirm RED**

```bash
pnpm exec vitest run --root packages/bootstrap-state src/maintenance-codec.test.ts
```

Expected: the new `BOOTSTRAP_RELEASE_ARMED / SUCCEEDED` contract fails under the current codec.

- [ ] **Step 3: Implement the canonical terminal semantics**

In `semanticProblem()` enforce:

```ts
if (body.lastCompletedStage === "BOOTSTRAP_RELEASE_ARMED") {
  if (body.terminalOutcome !== "SUCCEEDED") {
    return "maintenance.journal.invalid_semantics";
  }
} else if (body.lastCompletedStage === "ABORTED") {
  if (body.terminalOutcome !== "ABORTED") {
    return "maintenance.journal.invalid_semantics";
  }
} else if (body.lastCompletedStage === "RECOVERY_REQUIRED") {
  if (body.terminalOutcome !== "FAILED" && body.terminalOutcome !== "UNCERTAIN") {
    return "maintenance.journal.invalid_semantics";
  }
} else if (body.terminalOutcome !== undefined) {
  return "maintenance.journal.invalid_semantics";
}
```

Retain the existing target-ownership tuple checks.

- [ ] **Step 4: Change production success writers**

In both direct maintenance executors, advance to:

```ts
await window.advance("BOOTSTRAP_RELEASE_ARMED", {
  terminalOutcome: "SUCCEEDED",
});
```

For restart, preserve the exact target Host tuple in the same committed body.

In recovery `nextBody()`, preserve `terminalOutcome: "SUCCEEDED"` for `BOOTSTRAP_RELEASE_ARMED`; do not strip it.

Successful recovery STOP/RESTART must also commit:

```text
BOOTSTRAP_RELEASE_ARMED
terminalOutcome = SUCCEEDED
```

before releasing bootstrap ownership.

- [ ] **Step 5: Replace the incomplete classifier with stage/outcome semantics**

`maintenanceIsIncomplete()` must return false only for canonical completed outcomes:

```ts
function maintenanceIsIncomplete(value: MaintenanceJournalLoadResult): boolean {
  if (value.status !== "CURRENT") return false;
  const body = value.value.state;
  return !(
    (body.lastCompletedStage === "BOOTSTRAP_RELEASE_ARMED" &&
      body.terminalOutcome === "SUCCEEDED") ||
    (body.lastCompletedStage === "ABORTED" && body.terminalOutcome === "ABORTED")
  );
}
```

`FAILED`, `UNCERTAIN`, `RECOVERY_REQUIRED`, and every pre-release progress stage remain incomplete.

- [ ] **Step 6: Correct synthetic prelude tests**

Remove the old implication that this is valid:

```text
POSTGRES_STOPPED + SUCCEEDED -> normal boot allowed
```

Add:

```text
BOOTSTRAP_RELEASE_ARMED + SUCCEEDED -> normal boot allowed
ABORTED + ABORTED                  -> normal boot allowed
POSTGRES_STOPPED + no outcome      -> blocked
RECOVERY_REQUIRED + FAILED         -> blocked
RECOVERY_REQUIRED + UNCERTAIN      -> blocked
```

- [ ] **Step 7: Update the approved H1-S spec**

Add the exact durable completion rule to the MaintenanceJournal/recovery section:

```text
BOOTSTRAP_RELEASE_ARMED + SUCCEEDED
= target state has been durably established while bootstrap ownership is still held
= historical operation no longer blocks future normal bootstrap

bootstrap lock/provider reality still independently gates concurrent ownership acquisition
```

State explicitly that no new `COMPLETED` MaintenanceStage is introduced.

- [ ] **Step 8: Run focused tests**

```bash
pnpm exec vitest run --root packages/bootstrap-state \
  src/maintenance-codec.test.ts src/maintenance-store.test.ts

pnpm exec vitest run --root packages/bootstrap-runtime \
  src/maintenance-obligation.test.ts \
  src/bootstrap-prelude.test.ts \
  src/host-maintenance.test.ts \
  src/host-maintenance-recovery.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add \
  packages/bootstrap-state/src/maintenance-codec.ts \
  packages/bootstrap-state/src/maintenance-codec.test.ts \
  packages/bootstrap-runtime/src/maintenance-obligation.ts \
  packages/bootstrap-runtime/src/maintenance-obligation.test.ts \
  packages/bootstrap-runtime/src/bootstrap-prelude.test.ts \
  packages/bootstrap-runtime/src/host-maintenance.ts \
  packages/bootstrap-runtime/src/host-maintenance-recovery.ts \
  docs/engineering/specs/h1-stabilization-foundation-authority-reset.md

git commit -m "fix: close maintenance completion semantics"
```

---

#### Task 2: Prove Real Post-Maintenance Bootstrap Continuity

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-maintenance.integration.test.ts`

**Interfaces:**

- Consumes: Task 1 terminal semantics.
- Produces: real PostgreSQL regression evidence that successful maintenance does not poison the next bootstrap.

- [ ] **Step 1: Add a real PostgreSQL restart-continuity test**

Create one end-to-end scenario:

```text
fresh fixture
→ prepareBootstrapPrelude
→ acquire bootstrap ownership
→ prepare private PostgreSQL 18.6
→ handoff to Host A
→ RESTART_PRIVATE_POSTGRES
→ receive Host B
→ verify Host A CLOSED
→ verify Host B ACTIVE
→ shutdownKeepingPrivatePostgres Host B
→ call prepareBootstrapPrelude(anchorRoot) again
→ acquire ownership succeeds
→ preparePrivatePostgres succeeds against the same cluster identity
→ cleanly close/stop
```

Assert the successful maintenance journal is:

```ts
expect(journal.value.state).toMatchObject({
  lastCompletedStage: "BOOTSTRAP_RELEASE_ARMED",
  terminalOutcome: "SUCCEEDED",
});
```

Assert the second bootstrap does **not** fail with `bootstrap.recovery.maintenance_required`.

- [ ] **Step 2: Add a real PostgreSQL stop-continuity test**

Scenario:

```text
Host A
→ STOP_PRIVATE_POSTGRES
→ result STOPPED
→ new prepareBootstrapPrelude(anchorRoot)
→ acquire ownership
→ preparePrivatePostgres
→ same clusterSystemIdentifier
→ PostgreSQL returns READY
```

- [ ] **Step 3: Verify the PostgreSQL 18.6 toolchain before running**

Use the current qualified environment variable:

```bash
test -n "$HEPTALOGOS_TEST_PG_BIN"
test -x "$HEPTALOGOS_TEST_PG_BIN/postgres"
"$HEPTALOGOS_TEST_PG_BIN/postgres" --version
```

Required version output:

```text
postgres (PostgreSQL) 18.6
```

If the recorded temporary root no longer exists, rematerialize the exact PostgreSQL 18.6 qualification runtime using the repository's existing Q-PRIVATE-POSTGRES-01 procedure. Do not substitute a different patch version and do not skip while reporting PASS.

- [ ] **Step 4: Run the real integration target**

```bash
pnpm nx run bootstrap-runtime:test:integration
```

Expected: all existing cases plus both new continuity cases PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/bootstrap-runtime/src/host-maintenance.integration.test.ts
git commit -m "test: prove post-maintenance bootstrap continuity"
```

---

#### Task 3: Prevalidate XState Transition Before Durable Journal Mutation

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-maintenance-machine.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-machine.test.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.test.ts`

**Interfaces:**

- Produces:、

  ```ts
  interface HostMaintenanceTracker {
    readonly state: HostMaintenanceState;
    can(event: HostMaintenanceEvent): boolean;
    assertCan(event: HostMaintenanceEvent): void;
    send(event: HostMaintenanceEvent): void;
  }
  ```

**Required ordering:**

```text
derive event
→ assert transition is legal
→ persist MaintenanceJournal revision
→ update body
→ perform already-validated in-process transition
```

- [ ] **Step 1: Add `assertCan()` to the tracker**

Implement:

```ts
assertCan(event) {
  const state = stateByValue[String(snapshot.value)];
  if (!snapshot.can(event)) throw invalidTransition(state, event);
},
send(event) {
  this.assertCan(event);
  snapshot = transition(machine, snapshot, event)[0];
},
```

Use an implementation shape that does not rely on dynamic `this` binding if the returned object is destructured.

- [ ] **Step 2: Add machine tests**

Prove:

```text
PREPARED + POSTGRES_READY -> bootstrap.maintenance.invalid_transition
state remains PREPARED

ENTERED + POSTGRES_READY -> bootstrap.maintenance.invalid_transition
state remains ENTERED
```

- [ ] **Step 3: Prevalidate inside `advance()`**

Change:

```ts
const event = eventForCommittedStage(stage);
if (event !== undefined) tracker.assertCan(event);

await access.journal.advance(next);
body = next;

if (event !== undefined) tracker.send(event);
```

Do not send the event before durable commit; the precheck must be non-mutating.

- [ ] **Step 4: Add a regression proving illegal progress is not durably committed**

Inject an entered-window executor that requests an illegal mapped transition, e.g. `POSTGRES_READY` while tracker is `ENTERED`.

Assert:

```text
error = bootstrap.maintenance.invalid_transition
trace does NOT contain journal.advance:POSTGRES_READY
public tracker state never becomes POSTGRES_READY
normal recovery-required handling may run after the original failure, but the illegal stage itself was never committed
```

Retain the existing inverse test:

```text
journal advance failure -> tracker does not advance
```

Together they prove both directions of the durable/in-process boundary.

- [ ] **Step 5: Run focused tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/host-maintenance-machine.test.ts \
  src/host-maintenance.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  packages/bootstrap-runtime/src/host-maintenance-machine.ts \
  packages/bootstrap-runtime/src/host-maintenance-machine.test.ts \
  packages/bootstrap-runtime/src/host-maintenance.ts \
  packages/bootstrap-runtime/src/host-maintenance.test.ts

git commit -m "fix: prevalidate maintenance state transitions"
```

---

#### Task 4: Fence Recovery Error Journaling by Current BootstrapState Authority

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance-recovery.test.ts`

**Interfaces:**

- Consumes:
  - authentic held bootstrap lease;
  - current BootstrapState;
  - exact committed MaintenanceJournal operation pointer;
  - current private PostgreSQL identity.
- Produces: a best-effort `RECOVERY_REQUIRED` append only while all four remain true.

- [ ] **Step 1: Add failing regression cases**

Drive `recoverInterruptedHostMaintenance()` into an error after `mutationStarted = true`, then make the error-finalization BootstrapState reload return each of:

```text
RECOVERED_PREVIOUS
EMPTY
CURRENT with lastCommittedOperationRef changed to another operation
CURRENT with privatePostgres identity mismatch
CURRENT with exact same pointer and identity
```

Expected:

```text
first four:
  original failure is rethrown
  no RECOVERY_REQUIRED journal revision is appended

last case:
  original failure is rethrown
  best-effort RECOVERY_REQUIRED revision is appended
```

- [ ] **Step 2: Centralize the finalization authority check**

Before appending `RECOVERY_REQUIRED` in the catch path:

```ts
const current = await access.state.load();
if (current.status !== "CURRENT") {
  throw recoveryProblem(
    "bootstrap.recovery.current_state_required_for_error_journal",
    "Current BootstrapState is required for recovery error journaling",
    "Recovery will not mutate MaintenanceJournal after current BootstrapState authority is lost",
  );
}

requireBootstrapState(current, profile, options.privatePostgres);

if (
  current.value.state.lastCommittedOperationRef !==
  maintenanceOperationRef(initialInspection.operationId)
) {
  throw recoveryProblem(
    "bootstrap.recovery.operation_pointer_changed",
    "BootstrapState operation pointer changed during recovery finalization",
    "Recovery will not append to a MaintenanceJournal that is no longer selected by current BootstrapState",
    "conflict",
  );
}
```

The helper may be factored, but do not introduce a new service or public API.

- [ ] **Step 3: Preserve the first failure**

All error-finalization failures remain best-effort evidence failures. They must not replace the original operational failure thrown to the caller.

- [ ] **Step 4: Run focused recovery tests**

```bash
pnpm exec vitest run --root packages/bootstrap-runtime \
  src/host-maintenance-recovery.test.ts \
  src/bootstrap-recovery.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run real process recovery**

```bash
pnpm nx run bootstrap-runtime:test:recovery-process
pnpm nx run bootstrap-runtime:test:recovery-process:postgres
```

If PostgreSQL is required, first prove the exact 18.6 toolchain as in Task 2.

- [ ] **Step 6: Commit**

```bash
git add \
  packages/bootstrap-runtime/src/host-maintenance-recovery.ts \
  packages/bootstrap-runtime/src/host-maintenance-recovery.test.ts

git commit -m "fix: fence recovery error journaling"
```

---

#### Task 5: Close Exact Candidate-Pair and H1 Closure-Governance Gaps

**Files:**

- Modify: `.github/workflows/verify.yml`
- Modify: `AGENTS.md`
- Modify: `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- Modify: `docs/engineering/playbooks/repository/h-stage-stabilization-closure.md`
- Modify: `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- Modify: `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`
- Modify: `docs/plans/active/foundation/h1s-control-record.md`

**Interfaces:**

- Produces:
  - final CI that verifies both reviewed target identity and current base-ref identity;
  - a bounded post-merge truth-reconciliation protocol;
  - conditional, not mandatory, phased control records for future Hn-S.

- [ ] **Step 1: Make final-pre-merge CI verify the live base ref**

The workflow already verifies:

```text
HEAD == target_sha
base_sha is an ancestor of target_sha
```

Add an explicit fetch/read of current `master` and require:

```text
current origin/master == base_sha
```

Use an exact shell-independent Node check. For example, before the candidate-pair script:

```yaml
- name: Fetch reviewed base branch
  run: git fetch --no-tags origin master:refs/remotes/origin/master
```

Then the Node check must include:

```js
const currentBase = execFileSync("git", ["rev-parse", "refs/remotes/origin/master"], {
  encoding: "utf8",
}).trim();

if (currentBase !== process.env.BASE_SHA) {
  console.error(`reviewed base ${process.env.BASE_SHA} moved to ${currentBase}`);
  process.exit(1);
}
```

Keep the ancestry check too.

- [ ] **Step 2: Add exact pre-merge commands to the playbook**

Immediately before merge:

```bash
git fetch --no-tags origin master
test "$(git rev-parse origin/master)" = "$REVIEWED_BASE_SHA"
test "$(git rev-parse HEAD)" = "$REVIEWED_HEAD_SHA"
```

Also re-read PR metadata and require its base/head SHAs to equal the same pair.

Any mismatch:

```text
review invalid
final CI invalid
merge forbidden
```

- [ ] **Step 3: Correct post-merge reconciliation semantics**

Replace “post-merge reconciliation is read-only/non-mutating forever” with:

```text
The merged behavior candidate is immutable after review/final CI.

After squash merge, repository truth may be reconciled only through a separate
docs/evidence-only PR that:
- changes no production code;
- changes no tests or behavior contract;
- cites externally observed review/CI/merge evidence;
- changes current stage truth from Hn OPEN to CLOSED only when the tuple actually occurred;
- runs repository/corpus/document gates;
- does not rerun or rewrite the already-merged behavior candidate.
```

For H1 specifically:

```text
squash merge succeeds
→ H1 semantic closure event occurred
→ post-merge truth-reconciliation PR records H1: CLOSED / H2: ELIGIBLE
→ H2 execution may start only after that reconciliation PR is merged
```

This prevents the repository from permanently claiming `H1: OPEN`.

- [ ] **Step 4: Make phased control records conditional for future Hn-S**

Change the generic H-stage governance from:

```text
every Hn-S = control record + phase plans
```

to:

```text
default:
  one bounded stabilization plan + one branch + one PR

escalate when serial phases are genuinely required:
  control record + phased plans
```

Keep the existing H1-S control record; do not delete/restructure it during this correction.

- [ ] **Step 5: Synchronize the H1-S spec**

Update its candidate-identity and closure sections to the same rules. Do not change H1 runtime architecture in this task.

- [ ] **Step 6: Run governance/static gates**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm format:check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add \
  .github/workflows/verify.yml \
  AGENTS.md \
  Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md \
  docs/engineering/playbooks/repository/h-stage-stabilization-closure.md \
  docs/engineering/playbooks/repository/milestone-pr-closure.md \
  docs/engineering/specs/h1-stabilization-foundation-authority-reset.md \
  docs/plans/active/foundation/h1s-control-record.md

git commit -m "fix: close H-stage candidate governance"
```

---

#### Task 6: Bounded Public Authority Export-Guard Hardening

**Classification:** B — execute only if it remains a local verifier edit; expected scope is under roughly 30 lines plus focused verification. If it expands beyond that, record/defer it.

**Files:**

- Modify: `scripts/verify/boundaries.mjs`

**Interfaces:**

- Produces: a guard against both named raw exports and `export *` from sensitive bootstrap Authority modules.

- [ ] **Step 1: Keep the existing forbidden-name scan**

Do not weaken the current raw export-name list.

- [ ] **Step 2: Reject export-star from sensitive modules**

Reject package-root forms matching:

```text
export * from "./bootstrap-ownership.js"
export * from "./bootstrap-recovery.js"
export * from "./host-maintenance-recovery.js"
export * from "./maintenance-state-access.js"
```

Use a fixed set of exact module specifiers. Do not add a parser dependency.

- [ ] **Step 3: Run the boundary gate**

```bash
pnpm check:boundaries
```

Expected: PASS on the current safe index.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify/boundaries.mjs
git commit -m "chore: harden bootstrap authority export guard"
```

---

#### Task 7: Full H1-S Requalification on the Corrected Behavior

**Files:**

- Modify: `Architecture_Corpus/qualification/results/Q-BOOT-01.md`
- Modify: `Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md`
- Modify: `Architecture_Corpus/qualification/results/qualification-status.json`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`
- Modify: `docs/plans/active/foundation/h1s-control-record.md`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify: `docs/plans/README.md`

**Interfaces:**

- Produces: a new behavior candidate and current evidence ledger.
- Invalidates: `1640c232a4629644c3588ebd108f887e7c786f77` as the current corrected behavior candidate. It remains historical evidence only.

- [ ] **Step 1: Verify clean repository state**

```bash
git status --short
```

Expected: empty.

- [ ] **Step 2: Run full repository verification**

```bash
pnpm verify
```

Expected: PASS.

- [ ] **Step 3: Run H1 package tests explicitly**

```bash
pnpm nx run bootstrap-state:test
pnpm nx run private-postgres:test
pnpm nx run host-ownership:test
pnpm nx run bootstrap-runtime:test
```

Expected: PASS with zero failures.

- [ ] **Step 4: Verify exact PostgreSQL 18.6 runtime**

```bash
test -n "$HEPTALOGOS_TEST_PG_BIN"
for tool in postgres initdb pg_ctl pg_controldata pg_isready; do
  "$HEPTALOGOS_TEST_PG_BIN/$tool" --version
done
```

Every tool must report PostgreSQL `18.6`.

- [ ] **Step 5: Run all current-host H1 live integration/recovery targets**

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:recovery-process
pnpm nx run bootstrap-runtime:test:recovery-process:postgres
```

No target may be silently skipped and counted as PASS.

- [ ] **Step 6: Capture the corrected behavior candidate SHA**

```bash
git rev-parse HEAD
```

Record that SHA as the new H1-S behavior candidate in current qualification evidence.

Do not reuse `1640c232...` as current evidence after behavior changed.

- [ ] **Step 7: Reconcile only current properties**

Current ledger must include fresh claims for:

```text
maintenance_success_terminal_v1
post_restart_normal_boot_continuity
post_stop_normal_boot_continuity
illegal_host_maintenance_transition_not_durably_committed
recovery_error_journal_requires_current_bootstrap_state
recovery_error_journal_requires_current_operation_pointer
```

Keep existing H1-S properties only if they remain verified by the fresh run.

Keep genuinely unrun properties as `NOT_RUN`:

```text
Windows real PostgreSQL
macOS real PostgreSQL
source-less recovery/shipping closure
service-account ACL
hardware power-loss
independent review
final cross-platform CI
squash merge
```

- [ ] **Step 8: Regenerate corpus integrity files using the existing repository procedure**

Run the repository's corpus generation/check command, then:

```bash
pnpm check:corpus
pnpm check:repository
```

Do not hand-edit hashes inconsistently.

- [ ] **Step 9: Close the correction implementation phase, but not H1**

Set:

```yaml
H1_STABILIZATION: REVIEW_CORRECTION_IMPLEMENTATION_COMPLETE
H1: OPEN
H2: NOT_ELIGIBLE
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

Move:

- `h1s-review-correction.md`
- `h1s-control-record.md`

back to `docs/plans/completed/foundation/` only after all repository/evidence mutations are done.

- [ ] **Step 10: Commit the final repository/evidence candidate**

```bash
git add Architecture_Corpus docs
git commit -m "docs: reconcile H1 stabilization review correction"
```

- [ ] **Step 11: Run one final local verification on the exact resulting HEAD**

```bash
pnpm verify
git status --short
git rev-parse HEAD
```

Required:

- `pnpm verify`: PASS
- worktree: clean
- record exact final repository HEAD

No repository mutation after this point until independent re-review is complete.

---

#### Task 8: Freeze the New Review Candidate

**Files:**

- PR #11 metadata only; no repository commit.

- [ ] **Step 1: Fetch the live base**

```bash
git fetch --no-tags origin master
export REVIEWED_BASE_SHA="$(git rev-parse origin/master)"
export REVIEWED_HEAD_SHA="$(git rev-parse HEAD)"
```

Required base before review:

```text
257ad6fe73924bcd1c9a00cad6a15938d6e6a2da
```

If `origin/master` moved, STOP. Rebase/update the branch, rerun Task 7, and freeze a new pair.

- [ ] **Step 2: Verify ancestry and clean state**

```bash
git merge-base --is-ancestor "$REVIEWED_BASE_SHA" "$REVIEWED_HEAD_SHA"
git status --short
```

Expected: ancestry command exit 0; worktree empty.

- [ ] **Step 3: Update PR #11 body**

Record separately:

```text
Reviewed base SHA
Corrected behavior candidate SHA
Final repository candidate HEAD
```

Mention that `.codegraph/.gitignore` is a user-added non-behavioral repository change already included in the final repository candidate. No special waiver is required; the actual final HEAD is what review binds to.

- [ ] **Step 4: Request independent re-review**

Do not run final CI yet.

Required result before proceeding:

```text
independent review exact (base_sha, head_sha) = PASS
```

Any new repository commit or base-branch movement invalidates the review.

---

#### Task 9: Final CI, Squash Merge, and Separate Truth Reconciliation

**Precondition:** independent review PASS on the exact frozen pair.

- [ ] **Step 1: Run manual final CI**

Dispatch `verify-manual` with:

```text
base_sha   = exact reviewed base
target_sha = exact reviewed head
reason     = final-pre-merge
```

Required:

```text
Ubuntu  PASS
macOS   PASS
Windows PASS
```

The workflow must also prove current `origin/master == base_sha`.

- [ ] **Step 2: Reverify the pair immediately before merge**

```bash
git fetch --no-tags origin master
test "$(git rev-parse origin/master)" = "$REVIEWED_BASE_SHA"
test "$(git rev-parse HEAD)" = "$REVIEWED_HEAD_SHA"
```

Also verify PR #11's GitHub base/head SHAs are identical.

- [ ] **Step 3: Squash merge PR #11**

Use squash merge with expected head SHA.

Do not create a post-review commit on `dev/h1-stabilization`.

- [ ] **Step 4: Delete the stabilization branch**

Only after merge success.

- [ ] **Step 5: Open a separate docs/evidence-only post-merge truth-reconciliation PR**

Allowed files are current-truth/evidence/governance documents only, for example:

```text
docs/roadmap/development-roadmap.md
docs/plans/completed/foundation/h1s-control-record.md
Architecture_Corpus/qualification/results/Q-BOOT-01.md
Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md
Architecture_Corpus/qualification/results/qualification-status.json
Architecture_Corpus/manifest.json
Architecture_Corpus/SHA256SUMS.txt
```

It must record externally observed facts:

```yaml
H1_STABILIZATION: CLOSED
H1: CLOSED
H2: ELIGIBLE
independent_review_exact_candidate: PASS
manual_final_ci_ubuntu: PASS
manual_final_ci_macos: PASS
manual_final_ci_windows: PASS
squash_merge: PASS
```

Include the exact reviewed pair, workflow run ID, and squash-merge SHA.

No production code or tests may change in this reconciliation PR.

- [ ] **Step 6: Run docs/repository gates for reconciliation**

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm format:check
```

- [ ] **Step 7: Merge the truth-reconciliation PR**

Only after this repository truth is reconciled may the next H2 implementation plan become active.

---

## Required Regression Matrix Before Re-Review

| Property                                                      | Required evidence                                |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Canonical BootstrapState/BootstrapJournal/private-PG V1       | unit + `pnpm verify`                             |
| Previous revision never authorizes mutation                   | unit                                             |
| INSTANCE-only recovery/root closure                           | unit/process                                     |
| Dead no-lock witness does not permanently block               | unit + process                                   |
| UNKNOWN process identity blocks reclaim                       | unit/process                                     |
| Incomplete maintenance blocks normal boot                     | unit                                             |
| Successful maintenance does not block next boot               | **new unit + real PG integration**               |
| Illegal XState transition cannot commit illegal journal stage | **new unit**                                     |
| Recovery error journaling requires CURRENT BootstrapState     | **new unit**                                     |
| Recovery error journaling requires exact operation pointer    | **new unit**                                     |
| Private PostgreSQL integration                                | PostgreSQL 18.6                                  |
| Host ownership integration                                    | PostgreSQL 18.6                                  |
| Bootstrap-runtime integration                                 | PostgreSQL 18.6                                  |
| Non-PG real process recovery                                  | process target                                   |
| PG real process recovery                                      | PostgreSQL 18.6 process target                   |
| Exact candidate base/head                                     | workflow + premerge check                        |
| Windows/macOS/source-less/ACL/power-loss                      | remain honest `NOT_RUN` unless actually executed |

---

## Stop Rules

STOP and return for architecture review if any correction requires:

```text
new H2 capability
new subsystem/service
BootstrapState V2 or MaintenanceJournal V2
legacy PRE_PRODUCTION compatibility/migration support
a second durable state store
changing PostgreSQL/HostOwnershipFence architecture
allowing RECOVERED_PREVIOUS mutation
arbitrary operation-pointer clearing without a defined durable semantic
direct master mutation to bypass PR governance
```

Also STOP if the review-correction work grows into approximately another full milestone rather than these bounded defects.

---

## Expected Commit Sequence

```text
1. docs: reopen H1 stabilization review correction
2. fix: close maintenance completion semantics
3. test: prove post-maintenance bootstrap continuity
4. fix: prevalidate maintenance state transitions
5. fix: fence recovery error journaling
6. fix: close H-stage candidate governance
7. chore: harden bootstrap authority export guard       # bounded B item
8. docs: reconcile H1 stabilization review correction
```

Corrective review commits after this sequence are exceptional; they are not planned work.

## Completion Condition

This correction plan is complete only when:

```text
all RC-1..RC-5 mandatory defects are closed
+ RC-6 is either locally closed or explicitly deferred as B
+ fresh H1 local/integration/real-PG qualification passes
+ evidence ledger is current and candidate-bound
+ repository is clean
+ a new exact (base_sha, head_sha) is frozen
```

At that point the branch is **ready for independent re-review**, not yet authorized for final CI or merge.

---

## Execution record (2026-08-23)

```yaml
planState: COMPLETED
behaviorCandidateSha: 3cc589b667b0cd64342881caf7d382c2d960a928
localQualification: PASS
pnpm_verify: PASS
bootstrap_state_unit: PASS (111 passed, 3 skipped)
private_postgres_unit: PASS (58 passed)
host_ownership_unit: PASS (75 passed)
bootstrap_runtime_unit: PASS (195 passed, 2 skipped)
private_postgres_integration: PASS (20/20)
host_ownership_integration: PASS (8/8)
bootstrap_runtime_integration: PASS (30/30)
recovery_process: PASS (4/4)
recovery_process_postgres: PASS (2/2)
postgres_version: PostgreSQL 18.6
postgres_platform: Windows x64 extracted EDB qualification runtime
linux_real_postgres: NOT_RUN
macos_real_postgres: NOT_RUN
source_less_shipping: NOT_RUN
service_account_acl: NOT_RUN
hardware_power_loss: NOT_RUN
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
externalClosureGates: PENDING
```

No push, PR, CI dispatch, independent review request, or merge was performed
by this execution. The branch is ready for independent re-review of the exact
candidate; final CI and merge remain unauthorized until that review passes.
