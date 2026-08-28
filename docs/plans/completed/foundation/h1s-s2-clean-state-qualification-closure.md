# H1-S2 Clean-State Qualification & Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the stabilized H1 implementation from canonical clean state, replace obsolete current evidence with candidate-bound evidence, complete all repository mutations, then close H1 through exact-candidate independent review, cross-platform CI and squash merge.

**Architecture:** S2 does not add Foundation functionality. It verifies the S1 behavior candidate using explicit unit/integration/live-PG layers, updates the current qualification ledger without pretending deferred product boundaries passed, moves all implementation plans to completed before candidate freeze, then performs external review/CI/merge gates without further repository commits.

**Tech Stack:** existing pnpm/Nx/Vitest verification targets, PostgreSQL 18.6 qualification bin root where available, Architecture Corpus qualification ledger, GitHub independent review/manual Actions/squash merge.

**Spec:** `docs/engineering/specs/h1-stabilization-foundation-authority-reset.md`

## Global Constraints

- Execute only when `h1s-control-record.md` names this file as `governingPlan`.
- No production behavior change is allowed in S2. If a correctness defect is discovered, return to S1: fix code/tests, rerun S1 gates, then resume S2 with a new behavior SHA.
- `pnpm verify PASS` is not live PostgreSQL qualification.
- Never convert `NOT_RUN` to PASS without executing claim-matched evidence.
- Historical M5A/M5B evidence may remain as historical narrative; it cannot remain in the current property ledger when the behavior no longer exists.
- Complete every repository mutation before independent review. After review begins, any commit invalidates authorization.
- Final candidate identity is `(base_sha, head_sha)`.

---

### Task 1: Freeze and qualify the S1 behavior candidate from canonical state

**Files:**

- No production files should change.
- Test changes are also forbidden unless S1 is reopened.

**Interfaces:**

- Consumes: S1 head.
- Produces: `behavior_candidate_sha` and raw test outputs used by Task 2 evidence reconciliation.

- [ ] **Step 1: Confirm no production/test edits are pending**

```bash
git status --short
BEHAVIOR_SHA="$(git rev-parse HEAD)"
echo "$BEHAVIOR_SHA"
```

Expected: clean worktree. Save `BEHAVIOR_SHA` in the execution notes; Task 2 writes it into evidence.

- [ ] **Step 2: Verify the qualified PostgreSQL bin root when available**

If `HEPTALOGOS_TEST_PG_BIN` is configured:

```bash
test -n "$HEPTALOGOS_TEST_PG_BIN"
for tool in postgres initdb pg_ctl pg_controldata pg_isready; do
  "$HEPTALOGOS_TEST_PG_BIN/$tool" --version
done
```

Expected: every tool reports PostgreSQL `18.6`. If not, mark real-PG targets `BLOCKED`/`NOT_RUN` as appropriate; do not use a mismatched toolchain.

- [ ] **Step 3: Run repository verification**

```bash
pnpm verify
```

Record exact PASS/FAIL. This covers repository gates/unit tests/build but not the explicit integration targets below.

- [ ] **Step 4: Run all H1 integration targets**

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
pnpm nx run bootstrap-runtime:test:recovery-process
```

Record each separately; do not collapse them into a single generic PASS.

- [ ] **Step 5: Run live recovery/real-PG target**

When PostgreSQL 18.6 is qualified:

```bash
pnpm nx run bootstrap-runtime:test:recovery-process:postgres
```

This must run using fresh test roots and canonical V1 writers only. No fixture may preseed an obsolete V2/legacy M5A format then rely on migration.

- [ ] **Step 6: Run explicit canonical-state/recovery focus tests**

```bash
pnpm exec vitest run --root packages/bootstrap-state \
  src/codec.test.ts \
  src/store.test.ts \
  src/journal.test.ts \
  src/maintenance-codec.test.ts \
  src/maintenance-store.test.ts

pnpm exec vitest run --root packages/bootstrap-runtime \
  src/roots.test.ts \
  src/local-installation-owner.test.ts \
  src/bootstrap-process-identity.test.ts \
  src/bootstrap-recovery.test.ts \
  src/bootstrap-prelude.test.ts \
  src/bootstrap-recovery-command.test.ts \
  src/host-maintenance.test.ts \
  src/host-maintenance-recovery.test.ts
```

Expected: all PASS.

- [ ] **Step 7: Verify no legacy/current-claim residue in implementation**

```bash
rg -n "BootstrapStateBodyV2|BootstrapStateEnvelopeV2|PrivatePostgresBootstrapStateV2|BootstrapJournalCheckpointV2|resolveMaintenanceTargetHostBootId|legacyM5a|heptalogos\.private-postgres\.initialization-profile/v2" packages scripts
rg -n "PID_REUSED" packages/bootstrap-runtime
```

Only explicit rejected-legacy test literals/history are permitted.

---

### Task 2: Replace obsolete current qualification properties with H1-S evidence

**Files:**

- Modify: `Architecture_Corpus/qualification/results/qualification-status.json`
- Modify: `Architecture_Corpus/qualification/results/Q-BOOT-01.md`
- Modify: `Architecture_Corpus/qualification/results/Q-PRIVATE-POSTGRES-01.md`
- Modify: `Architecture_Corpus/qualification/results/README.md`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify: `docs/plans/active/foundation/h1s-control-record.md`
- Move: `docs/plans/active/foundation/h1s-s2-clean-state-qualification-closure.md` -> `docs/plans/completed/foundation/h1s-s2-clean-state-qualification-closure.md`
- Move: `docs/plans/active/foundation/h1s-control-record.md` -> `docs/plans/completed/foundation/h1s-control-record.md`
- Modify: `docs/plans/README.md`

**Interfaces:**

- Consumes: exact `BEHAVIOR_SHA` and raw test results from Task 1.
- Produces: the final repository candidate; after this task no repository mutation is allowed unless the candidate is invalidated and S1/S2 are reopened.

- [ ] **Step 1: Rewrite Q-BOOT current property ledger**

Remove obsolete current evidence keys/metadata including:

```text
process_identity_pid_reused
m5b_pid_reuse_fail_closed
m5bLegacyM5aLivePg6a
m5bLegacyM5aJournalV1Compatibility
```

Preserve old candidate/review blocks only under clearly labelled historical/superseded narrative.

Add current keys with the actual Task 1 result:

```text
canonical_bootstrap_state_v1
canonical_bootstrap_journal_v1
canonical_private_postgres_initialization_profile_v1
legacy_preproduction_bootstrap_shape_rejected
legacy_preproduction_maintenance_shape_rejected
recovered_previous_bootstrap_state_read_only
recovered_previous_maintenance_journal_read_only
recovery_declared_root_closure
unrequested_root_unavailable_nonblocking
normal_boot_incomplete_maintenance_blocked
no_lock_dead_attempt_nonblocking
no_lock_dead_owner_nonblocking
incomplete_maintenance_no_lock_routes_recovery
process_identity_start_mismatch_unknown
ambiguous_process_identity_blocks_reclaim
host_maintenance_single_in_process_state_source
raw_recovery_authority_not_public
```

Set `evidenceSource.h1sBehaviorCandidateSha` to `BEHAVIOR_SHA`. Do not create a self-referential final evidence-commit SHA field.

- [ ] **Step 2: Rewrite Q-PRIVATE-POSTGRES current property**

Remove current `v1_to_v2_under_bootstrap_ownership` and replace it with:

```text
canonical_v1_private_postgres_identity_commit
```

Its PASS requires the current test to show the optional canonical V1 BootstrapState gains canonical V1 private-PostgreSQL identity under held bootstrap ownership.

Keep exact PostgreSQL identity/lifecycle/secret/runtime-profile evidence that remains behaviorally valid.

- [ ] **Step 3: Keep product residuals honest**

Unless they were actually rerun, retain:

```text
windows_real_postgres_recovery: NOT_RUN (for the H1-S candidate if not run)
macos_real_postgres_recovery: NOT_RUN
source_less_recovery/shipping: NOT_RUN
service_account_acl: NOT_RUN
hardware_power_loss/power_loss_cross_platform: NOT_RUN
```

Historical M5B final CI PASS remains historical M5B evidence, not H1-S final-gate evidence.

- [ ] **Step 4: Update qualification README semantics**

State explicitly:

```text
qualification-status.json = current property ledger
Q-*.md historical sections = evidence history, not current behavior contract
independent review/final CI/squash merge = external repository candidate closure evidence, not self-recorded in a post-review commit
```

- [ ] **Step 5: Update roadmap to implementation-complete / external-gates-pending**

Do not write `H1 CLOSED` yet. Write the conditional state:

```text
H1 functional implementation: COMPLETE
H1-S repository implementation/qualification: COMPLETE at BEHAVIOR_SHA plus this evidence-only candidate
H1: OPEN pending exact-candidate independent review + final CI + squash merge
H2: NOT_ELIGIBLE until that closure tuple is satisfied
```

The same text remains correct after merge because it defines closure by the externally verifiable tuple rather than falsely embedding a future PASS.

- [ ] **Step 6: Mark implementation plans complete before candidate freeze**

Move S2 and control record to `docs/plans/completed/foundation/`. Update `docs/plans/README.md` so there is no executable H1-S active plan and so completed records list S0/S1/S2/control.

The control record's final repository state must say:

```yaml
executionStatus: IMPLEMENTATION_COMPLETE
governingPlan: NONE
externalClosureGates: PENDING
```

These are control-record fields, not implementation-plan state values. The S2 plan itself uses the valid plan state `COMPLETED`.

- [ ] **Step 7: Regenerate Corpus manifest/checksums**

Use the deterministic S0 regeneration command, then:

```bash
pnpm check:corpus
```

- [ ] **Step 8: Run the final local repository gate after all evidence/doc moves**

```bash
pnpm verify
```

Expected: PASS.

- [ ] **Step 9: Commit the final repository candidate**

```bash
git add Architecture_Corpus docs
git commit -m "docs: reconcile H1 stabilization qualification"
git push
```

This commit is the final pre-review HEAD. From this point onward, **do not commit** unless review/CI is deliberately invalidated and the workflow is restarted.

---

### Task 3: Independent review of the exact base+head candidate

**Files:** none. This is an external gate.

**Interfaces:**

- Produces: independent review PASS/REQUEST_CHANGES bound to `(BASE_SHA, HEAD_SHA)`.

- [ ] **Step 1: Refresh refs and freeze the pair**

```bash
git fetch origin master dev/h1-stabilization
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse origin/dev/h1-stabilization)"
echo "BASE_SHA=$BASE_SHA"
echo "HEAD_SHA=$HEAD_SHA"
```

- [ ] **Step 2: Rerun local gate on the exact head**

```bash
test "$(git rev-parse HEAD)" = "$HEAD_SHA"
pnpm verify
```

Expected: PASS.

- [ ] **Step 3: Mark the PR Ready and request an independent reviewer**

The reviewer receives:

```text
repository: ArsvineZhu/Heptalogos
base_sha: <the printed BASE_SHA>
head_sha: <the printed HEAD_SHA>
spec: docs/engineering/specs/h1-stabilization-foundation-authority-reset.md
review scope: full H1-S diff and closure invariants
```

The implementing agent's self-review does not satisfy this gate.

- [ ] **Step 4: Handle review outcome**

If `REQUEST_CHANGES` or any defect is found:

```text
make fixes on the same branch
rerun affected tests + pnpm verify
if production behavior changed, rerun Task 1 qualification and Task 2 evidence reconciliation
commit/push
freeze a new BASE_SHA/HEAD_SHA
obtain a new independent review from scratch
```

If PASS, make no repository changes and proceed.

---

### Task 4: Run one final manual cross-platform CI on the reviewed pair

**Files:** none. External gate.

- [ ] **Step 1: Reconfirm candidate has not moved**

```bash
git fetch origin master dev/h1-stabilization
test "$(git rev-parse origin/master)" = "$BASE_SHA"
test "$(git rev-parse origin/dev/h1-stabilization)" = "$HEAD_SHA"
```

If either test fails, review is stale. Do not dispatch final CI.

- [ ] **Step 2: Dispatch manual final CI**

```bash
gh workflow run verify.yml \
  --ref master \
  -f base_sha="$BASE_SHA" \
  -f target_sha="$HEAD_SHA" \
  -f reason=final-pre-merge
```

- [ ] **Step 3: Require all three jobs PASS**

Required platforms:

```text
ubuntu-latest
macos-latest
windows-latest
```

The workflow proves repository verification for the reviewed pair. It does not retroactively claim platform-specific real PostgreSQL integration unless that workflow explicitly ran such a target.

- [ ] **Step 4: If any job fails**

Do not rerun until the failure is classified. If code/docs change, the candidate is invalidated and must return through independent review before a new final CI. A transient infrastructure retry may target the same unchanged pair only when the failure is clearly infrastructure-only and the project review policy permits it.

---

### Task 5: Squash merge and perform non-mutating reconciliation

**Files:** none after final review/CI.

- [ ] **Step 1: Verify the pair one last time immediately before merge**

```bash
git fetch origin master dev/h1-stabilization
test "$(git rev-parse origin/master)" = "$BASE_SHA"
test "$(git rev-parse origin/dev/h1-stabilization)" = "$HEAD_SHA"
```

If master moved, do not merge. Rebase the branch onto new master, rerun local qualification as required, obtain a new independent review and rerun final CI.

- [ ] **Step 2: Squash merge the single stabilization PR**

Use the repository's normal PR merge action; do not direct-push master.

- [ ] **Step 3: Delete the stabilization branch**

After confirmed merge, delete `dev/h1-stabilization` through the PR UI or equivalent GitHub command.

- [ ] **Step 4: Perform read-only post-merge reconciliation**

Verify, without committing:

```text
PR state = MERGED
review PASS refers to exact HEAD_SHA
final CI PASS refers to exact BASE_SHA + HEAD_SHA
squash merge occurred after those gates
no later candidate commit existed
branch deleted
```

- [ ] **Step 5: Derive final stage state**

Only after Step 4 succeeds:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: CLOSED
H1: CLOSED
H2: ELIGIBLE_TO_START
```

This final state is derived from the closure tuple and merge evidence. Do not add a post-merge repository commit solely to restate it.

---

## Execution record (2026-08-23)

```yaml
planState: COMPLETED
behaviorCandidateSha: 1640c232a4629644c3588ebd108f887e7c786f77
task1_clean_state_and_local_qualification: PASS
task1_postgres_bin: /tmp/heptalogos-pg18.6-corrective.PfKw0x/extracted/usr/lib/postgresql/18/bin
task1_postgres_version: 18.6
task1_pnpm_verify: PASS
task1_private_postgres_integration: PASS (20/20)
task1_host_ownership_integration: PASS (8/8)
task1_bootstrap_runtime_integration: PASS (28/28)
task1_recovery_process: PASS (4/4)
task1_recovery_process_postgres: PASS (2/2)
task2_current_qualification_ledger: COMPLETE
task2_plan_and_control_record_promotion: COMPLETE
task3_independent_review_exact_candidate: NOT_RUN
task4_manual_cross_platform_final_ci: NOT_RUN
task5_squash_merge: NOT_RUN
externalClosureGates: PENDING
```

The current machine-readable ledger is the only current property contract;
historical Q-*.md sections remain narrative history. Windows/macOS PostgreSQL,
source-less shipping, service-account ACL, and hardware power-loss evidence are
also `NOT_RUN`. No push, PR, CI dispatch, review request, or merge was
performed by this execution.
