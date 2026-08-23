# H1 Stabilization — Foundation Authority & Canonical-State Reset

**Status:** APPROVED IMPLEMENTATION SPEC  
**Baseline:** `master@257ad6fe73924bcd1c9a00cad6a15938d6e6a2da`  
**Target branch:** `dev/h1-stabilization`  
**Integration unit:** one short-lived branch, one Draft PR, multiple focused commits, one final independent review, one final exact-candidate cross-platform CI, one squash merge  
**Compatibility epoch:** `PRE_PRODUCTION`

## 1. Purpose

H1 functional milestones are complete, but H1 is not a trustworthy dependency for H2 until the Foundation implementation is stabilized. This pass is not a second H1 development cycle. It removes development-history compatibility baggage, closes concrete Authority/recovery defects found by audit, reduces duplicated semantics, and requalifies the resulting clean-state H1 implementation.

The governing question for every change is:

> Would we deliberately choose to let H2 depend on the current H1 behavior or interface?

If the answer is no, and the defect can be corrected without creating a new subsystem or H2 capability, it belongs in H1-S.

## 2. Stage state and closure rule

Before H1-S final closure:

```yaml
M5B: CLOSED
H1_FUNCTIONAL: COMPLETE
H1_STABILIZATION: ACTIVE
H1: OPEN
H2: NOT_ELIGIBLE
```

H1 closes only when the final H1-S candidate satisfies the full external closure tuple:

```text
implementation plans complete
+ local qualification complete
+ independent review PASS on exact (base_sha, head_sha)
+ manual Ubuntu/macOS/Windows final CI PASS on the same candidate pair
+ base_sha and head_sha still current immediately before merge
+ squash merge succeeds
= H1 CLOSED / H2 ELIGIBLE
```

The squash-merge event is the semantic closure event. The merged behavior
candidate is immutable after review and final CI. Repository truth may be
reconciled only through a separate docs/evidence-only PR that changes no
production code, tests, or behavior contract; cites externally observed
review/CI/merge evidence; runs repository/corpus/document gates; changes Hn
from OPEN to CLOSED only when the closure tuple actually occurred; and does
not rerun or rewrite the merged behavior candidate. For H1, squash merge
success is followed by a reconciliation PR recording `H1: CLOSED / H2:
ELIGIBLE`; H2 waits for that PR to merge.

## 3. Scope budget

### A — closure blockers: MUST fix

1. Development milestone history encoded as product compatibility/version generations.
2. `RECOVERED_PREVIOUS` treated as mutation Authority.
3. Bootstrap/recovery requiring every lifecycle root to be online.
4. No-lock orphan OWNER/ATTEMPT evidence causing permanent recovery block.
5. Normal bootstrap not being gated by a committed incomplete `MaintenanceJournal`.
6. PID start-time mismatch being promoted to positive `PID_REUSED` reclaim evidence despite wall-clock ambiguity.
7. Current qualification truth continuing to assert obsolete compatibility behavior.

### B — bounded structural debt: fix only with local, non-expanding edits

1. Duplicate Host maintenance in-process state (`lifecycleState` plus XState tracker).
2. Recovery manufacturing an over-wide fake `OwnedBootstrapPreludeHandoffContext`.
3. `bootstrap-runtime` exporting raw Authority/recovery primitives alongside the bounded recovery command facade.
4. Permanent boundary verifier names/messages containing milestone-history identifiers such as `M4`.
5. Bootstrap heartbeat semantics silently differing from `proper-lockfile2`'s effective recovery update interval.
6. Windows path comparison lowercasing already-`realpath`-resolved filesystem identities.

### C — explicitly out of scope

Do not:

- implement H2 capabilities;
- redesign Foundation package topology;
- replace PostgreSQL, XState, `pg`, Execa, `@bybrave/proper-lockfile2`, `write-file-atomic`, TypeBox or AJV;
- create a new Storage/Configuration/Platform subsystem;
- add speculative compatibility/migration infrastructure;
- require source-less product packaging, service-account ACL, hardware power-loss, or Windows/macOS live PostgreSQL qualification to become PASS merely to close H1;
- refactor unrelated code because it is aesthetically imperfect.

**Stop Rule:** if a discovered item requires a new subsystem, major architecture expansion, or substantial new capability work, classify and record it; defer it unless H1 cannot truthfully close without it.

## 4. Compatibility policy

`CompatibilityEpoch = PRE_PRODUCTION` means repository history is not a compatibility contract.

Before preserving an old format, reader, migration, alias or shim, the implementation must answer:

> What real retained state or external consumer requires compatibility?

If there is no concrete retained state/external consumer, the current best format becomes canonical V1 and old development formats are rejected.

`DURABLE PAYLOADS ARE VERSIONED` remains true. It means durable contracts carry explicit version identity; it does **not** mean every historical development shape remains readable forever.

## 5. Canonical H1 durable contracts

### 5.1 BootstrapState

Replace the current outer V1/V2 progression with one canonical V1:

```ts
export interface PrivatePostgresBootstrapStateV1 {
  readonly schemaVersion: 1;
  readonly postgresMajor: 18;
  readonly initializedByPostgresVersion: string;
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootstrapRoleName: string;
  readonly dataPlacement: {
    readonly rootId: "DATA";
    readonly relativePath: "private-postgres";
    readonly dataLayoutVersion: 1;
  };
  readonly persistedPort: number;
  readonly clusterSystemIdentifier: string;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
}

export interface BootstrapStateBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
  readonly privatePostgres?: PrivatePostgresBootstrapStateV1;
}
```

`privatePostgres?:` expresses lifecycle state (not initialized vs initialized), not a schema generation.

Delete:

- `BootstrapStateBodyV2`;
- `BootstrapStateEnvelopeV2`;
- `PrivatePostgresBootstrapStateV2`;
- `BOOTSTRAP_STATE_V2_DIGEST_DOMAIN`;
- V1→V2/downgrade compatibility logic and tests.

### 5.2 BootstrapJournal

The current V2 checkpoint shape becomes canonical V1. Canonical V1 includes `installationId` and `instanceId`; generation fields remain optional where the current writer does not know them.

Delete the old pre-identity V1 checkpoint reader/union. The writer and reader accept only canonical V1.

### 5.3 MaintenanceJournal

Remain canonical V1. Remove merged-M5A fallback semantics.

For a restart target, target Host ownership is only valid as a complete tuple appropriate to the durable stage:

```text
hostOwnershipToken
hostBootId
hostOwnershipRevision (when publication is committed)
```

Delete `resolveMaintenanceTargetHostBootId()` and all fallback-to-operation-`bootId` behavior. Legacy late-stage targets lacking `hostBootId` are rejected.

Durable maintenance completion is represented without adding a new stage:

```text
BOOTSTRAP_RELEASE_ARMED + SUCCEEDED
= target state has been durably established while bootstrap ownership is still held
= the historical operation no longer blocks future normal bootstrap

bootstrap lock/provider reality still independently gates concurrent ownership acquisition
```

No new `COMPLETED` `MaintenanceStage` is introduced. Earlier progress stages
remain incomplete even if an invalid terminal outcome claims success.

### 5.4 Locator and owner witness

`BootstrapLocator` and `BootstrapOwnerWitness` remain canonical V1. No compatibility generation is added.

### 5.5 Private PostgreSQL initialization-profile revision

The current best initialization profile is also the first compatibility generation. Change its digest domain from the development-history `heptalogos.private-postgres.initialization-profile/v2` to canonical `heptalogos.private-postgres.initialization-profile/v1`. Keep `PRIVATE_POSTGRES_DATA_LAYOUT_VERSION = 1`; do not add migration/dual-domain verification for disposable PRE_PRODUCTION state.

A literal digest produced with the obsolete `/v2` domain is not accepted as current authoritative BootstrapState identity after the reset.

## 6. Previous revision semantics

A valid previous revision is recovery/diagnostic evidence, not current mutation Authority.

```text
RECOVERED_PREVIOUS
= current missing/corrupt + previous valid
= uncertainty is explicit
= read-only inspection may report it
= mutation and normal lifecycle continuation MUST fail closed
```

Rules:

- `BootstrapStateStore.commit()` accepts only `EMPTY` genesis or `CURRENT` successor.
- `MaintenanceJournalStore.advance()` accepts only `CURRENT` successor.
- no code path automatically republishes previous as current during H1-S;
- private PostgreSQL bootstrap, Host maintenance, normal bootstrap and maintenance recovery reject `RECOVERED_PREVIOUS` when an authoritative current state is required.

Use stable problem codes:

```text
bootstrap.state.current_authority_required
maintenance.journal.current_authority_required
```

## 7. Lifecycle-root dependency closure

Change the path resolver to require an explicit root set:

```ts
export async function resolveBootstrapPathProfile(
  locator: BootstrapLocatorV1,
  requiredRoots: readonly LifecycleRootId[],
): Promise<BootstrapPathProfile>;
```

There is no default root set.

Expected H1 call-site dependency sets:

```text
read-only recovery inspection:              INSTANCE
LOCAL_INSTALLATION_OWNER proof:             INSTANCE
recovery lease acquisition/recheck:         INSTANCE
normal/recovered bootstrap prelude:          INSTANCE, DATA, LOG, TEMP
recovery descriptor reconstruction fixture: INSTANCE, DATA, LOG
```

An unavailable unrequested root (for example BACKUP/CACHE/PACKAGE_STAGING) must not block INSTANCE-only recovery inspection or local-owner proof.

`BootstrapPathProfile.list()` returns only roots resolved for that profile. `resolve()` on an unrequested root fails explicitly.

## 8. Recovery and normal-boot routing

Extract a shared read-only maintenance-obligation inspector used by both normal bootstrap and recovery inspection. It owns parsing `lastCommittedOperationRef`, loading the referenced `MaintenanceJournal`, and classifying whether the operation is incomplete.

Normal bootstrap performs the check twice:

1. after preliminary BootstrapState read, before lock acquisition;
2. after ownership acquisition and authoritative state reload.

If a committed operation is incomplete, normal bootstrap fails with a recovery-required problem and does not continue into normal private PostgreSQL/Host handoff.

### 8.1 No-provider-lock classification

When the provider lock is absent:

```text
SAME_PROCESS or UNKNOWN evidence for OWNER/ATTEMPT -> BLOCKED
all relevant OWNER/ATTEMPT evidence proven PROCESS_DEAD + incomplete maintenance -> INCOMPLETE_MAINTENANCE
all relevant OWNER/ATTEMPT evidence proven PROCESS_DEAD + no incomplete maintenance -> NO_RECOVERY_REQUIRED
no OWNER/ATTEMPT evidence + incomplete maintenance -> INCOMPLETE_MAINTENANCE
no OWNER/ATTEMPT evidence + no incomplete maintenance -> NO_RECOVERY_REQUIRED
```

A `RELEASING` witness without a provider lock does not itself block because release has already fenced the process-local lease before the provider lock is removed.

When a provider lock is present, reclaim remains strict: stale threshold plus process-death proof is required; live or ambiguous process evidence blocks.

## 9. Process-generation evidence

H1-S deliberately stops treating start-time mismatch as positive PID-reuse proof.

Canonical status:

```ts
type BootstrapProcessIdentityStatus = "SAME_PROCESS" | "PROCESS_DEAD" | "UNKNOWN";
```

Rules:

- PID definitely absent (`ESRCH`/`ENOENT`) → `PROCESS_DEAD`;
- PID exists and `pidusage` start-time estimate matches witness within tolerance → `SAME_PROCESS`;
- PID exists but start-time estimate differs → `UNKNOWN`, not `PID_REUSED`;
- `pidusage` failure/invalid result/permission ambiguity → `UNKNOWN`.

`PID_REUSED` may be reintroduced only by a separately qualified OS-backed process-generation mechanism. H1 chooses safety over rare automatic recovery availability under ambiguous PID reuse.

## 10. Host-maintenance in-process state

`MaintenanceJournal` remains durable recovery progress. XState becomes the only in-process capability state.

- remove mutable `lifecycleState`;
- `PreparedPrivatePostgresMaintenance.state` returns `tracker.state`;
- map durable `MaintenanceStage` commits to XState events in one place, after journal advance succeeds;
- keep `complete()` as the explicit process-local terminal transition after release/completion work because there is no durable `COMPLETED` MaintenanceStage.

`PreparedMaintenanceState` aliases the machine's `HostMaintenanceState`; do not maintain a duplicate union.

## 11. Narrow Host-maintenance provenance

`HostMaintenanceOperationProvenance` does not need the full `OwnedBootstrapPreludeHandoffContext`. Define a narrow structural context containing only:

```ts
interface HostMaintenanceBootstrapContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
}
```

Normal handoff context is structurally compatible. Recovery constructs this narrow context directly; it no longer manufactures a fake `privatePostgresSession` or an `assertReady()` function that always throws.

## 12. Public Authority surface

`@heptalogos/bootstrap-runtime` public index keeps bounded orchestration/read-only contracts and removes raw mutation seams that future packages should not call directly.

Remove from package-root export unless a current cross-package consumer proves necessity:

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

Keep internal modules/tests available through relative imports. Keep `executeBootstrapRecoveryCommand`, read-only inspection types, `prepareBootstrapPrelude`, key-provider contracts and managed Host/public orchestration contracts.

Add/adjust a boundary verifier assertion so the removed raw Authority names cannot silently return to the package root.

## 13. Lock timing

`proper-lockfile2` clamps update interval to at most `stale / 2`. H1-S must not publish a witness heartbeat that differs from the actual recovery provider update interval.

For recovery stale policy (`30_000 ms`), require:

```text
1000 <= heartbeatMs <= 15000
```

Normal non-reclaiming ownership keeps the existing minimum heartbeat rule. Reject an invalid recovery heartbeat before writing ownership evidence.

Do not introduce a configuration subsystem in H1-S.

## 14. Canonical filesystem path identity

After both paths have been successfully `realpath()`-resolved, compare the resulting canonical strings directly. Remove the unconditional Windows `.toLowerCase()` equality rule. Filesystem/Node canonicalization determines identity; application code must not collapse two paths that a case-sensitive Windows directory may distinguish.

No new platform abstraction is introduced in H1-S.

## 15. Review/CI candidate identity

Final authorization is bound to a pair:

```text
ReviewCandidate = (base_sha, head_sha)
```

A change to either member invalidates independent review and final CI.

Manual final CI accepts both `base_sha` and `target_sha`, and its `--ref`
workflow-definition revision is the reviewed head branch/tag rather than the
base branch. It fetches the live `origin/master`, checks out the target with
full history, verifies `GITHUB_SHA == target_sha` and checked-out `HEAD ==
target_sha`, requires live `origin/master == base_sha`, verifies `base_sha` is
an ancestor of target, then runs `pnpm verify` on Ubuntu/macOS/Windows. After
dispatch, the recorded workflow run's `headSha` (GitHub API `head_sha`) must
equal the reviewed head SHA, and its run ID is part of the external closure
evidence.

The exact workflow proof is therefore:

```text
workflow definition SHA == reviewed head SHA
checked-out target SHA == reviewed head SHA
live origin/master == reviewed base SHA
merge-base(reviewed base, reviewed head) == reviewed base SHA
```

Immediately before squash merge:

- `origin/master` must still equal reviewed `base_sha`;
- PR head must still equal reviewed `head_sha`.

The exact pre-merge checks are:

```bash
git fetch --no-tags origin master
test "$(git rev-parse origin/master)" = "$REVIEWED_BASE_SHA"
test "$(git rev-parse HEAD)" = "$REVIEWED_HEAD_SHA"
test "$(gh pr view "$PR_NUMBER" --json baseRefOid --jq .baseRefOid)" = "$REVIEWED_BASE_SHA"
test "$(gh pr view "$PR_NUMBER" --json headRefOid --jq .headRefOid)" = "$REVIEWED_HEAD_SHA"
```

If master moves, rebase the stabilization branch on the new master, rerun local qualification, obtain a new independent review and rerun final CI.

## 16. Evidence truth

Current machine evidence must describe current canonical behavior. Historical M5A/M5B evidence may remain in narrative history but must not remain as current properties after the behavior is removed.

Replace current claims such as:

```text
process_identity_pid_reused
m5b_pid_reuse_fail_closed
m5bLegacyM5aLivePg6a
m5bLegacyM5aJournalV1Compatibility
v1_to_v2_under_bootstrap_ownership
```

with current H1-S properties proving:

```text
canonical_bootstrap_state_v1
canonical_bootstrap_journal_v1
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

Product-level residuals stay honest `NOT_RUN` where not executed.

`pnpm verify` is repository verification; it does not imply live PostgreSQL integration because package `test` targets exclude `*.integration.test.ts`. H1-S qualification must explicitly run H1 integration/real-PG targets on the host where available.

## 17. Acceptance

H1-S implementation is ready for final review only when:

- canonical durable contracts contain no milestone-history migration path;
- legacy pre-production shapes are rejected by tests;
- previous revisions cannot authorize mutation;
- normal boot cannot bypass an incomplete maintenance obligation;
- INSTANCE-only recovery works while unrelated roots are unavailable;
- no-lock dead witness states do not permanently block recovery;
- ambiguous process identity never authorizes stale-lock reclaim;
- Host maintenance has one in-process state source;
- bounded recovery is the package-root recovery mutation surface;
- no permanent verifier/runtime user-facing rule depends on M3/M4/M5A/M5B naming where a semantic name exists;
- all targeted unit/integration tests pass;
- current-host real PostgreSQL regression passes when the qualified PostgreSQL 18.6 bin root is available;
- `pnpm verify` passes;
- qualification evidence is candidate-bound and contains no obsolete current claims.
