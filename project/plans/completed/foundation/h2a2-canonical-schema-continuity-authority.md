# Heptalogos H2A-2 Canonical Schema & Continuity Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the repository’s Heptalogos architecture/runtime/verification skills first, then execute this plan task-by-task with TDD. Do not reinterpret milestone boundaries during implementation. Do not query GitHub review objects to discover Independent Review; the user/operator supplies that external out-of-band result for the exact candidate pair.

**State:** `COMPLETED`; local implementation/evidence, external review, final CI, and squash merge are all recorded
**Baseline:** `master@b306975bba3592a0d8c2e2e6d1649f2523af27bc`  
**Target branch:** `dev/h2a2-canonical-schema-continuity-authority`  
**Integration unit:** one branch → one Draft PR → local qualification → external independent review on exact pair → manual exact-pair final CI → squash merge  
**Compatibility epoch:** `PRE_PRODUCTION`

**Goal:** close the next bounded part of H2A by establishing one current canonical BootstrapState V1 carrying `ContinuityEpochId`, a distinct least-privilege PostgreSQL migration authority, Kysely-backed canonical schema mechanics, and a fail-closed bootstrap → Host initialization sequence that materializes and verifies the same continuity epoch before normal managed Host exposure.

**Architecture:** H2A-1 already owns normal runtime transaction fencing. H2A-2 does not widen `PersistenceService` into a migration/admin API. Bootstrap Runtime owns orchestration and proves the joint bootstrap + Host authority window; Host Ownership owns PostgreSQL role/credential contracts; a separate `@heptalogos/canonical-schema` adapter owns Kysely/pg migration mechanics and current Foundation schema semantics. Bootstrap Runtime receives the canonical initializer as an injected callback so the stable Bootstrap Closure does not directly depend on replaceable ProductGeneration schema code.

**Tech Stack:** Node 24.19.0, pnpm 11.22.0, Nx 23.1.1, TypeScript 7.0.2 canonical / TS6.0.2 compatibility-tooling lane only, PostgreSQL 18.x, `pg` 8.23.0, Kysely 0.29.5, Vitest 4.1.11.

**Normative sources to read before editing:**

- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/03-核心概念与Authority.md`
- `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md`
- `Architecture_Corpus/specs/S11-备份-更新-分发-平台.md`
- `Architecture_Corpus/specs/S14-Canonical-End-to-End-Flows.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/20-架构审查清单.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `docs/roadmap/development-roadmap.md`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- `docs/plans/completed/foundation/h2a1-host-fenced-persistence-authority.md`
- `.agents/skills/heptalogos-architecture/SKILL.md`
- `.agents/skills/heptalogos-runtime-durability/SKILL.md`
- `.agents/skills/heptalogos-verification/SKILL.md`

---

## Global constraints

### G1 — PRE_PRODUCTION means no backward-compatibility implementation

This is a hard project rule for this milestone and must be made consistent across current authoritative documentation before behavior code begins.

While `CompatibilityEpoch = PRE_PRODUCTION`:

```text
project-owned development history
!= compatibility obligation
```

Therefore:

- the current best durable contract remains the single canonical **V1**;
- changing a development-stage shape edits that V1 in place;
- do **not** add `BootstrapStateBodyV2`, `BootstrapStateEnvelopeV2`, a V1→V2 reader, upcaster, migration, alias, shim, dual digest domain, or bridge format;
- do **not** preserve old development bytes merely because they existed in merged commits;
- old development BootstrapState/database bytes are unsupported and require a clean-state reset;
- `schemaVersion` remains mandatory durable contract identity, but it does not count historical development iterations;
- before the first production compatibility epoch, Kysely migration history is also development history: keep one current baseline chain and rewrite/squash it when the current canonical schema changes; reset developer/test databases instead of adding upgrade migrations from prior development milestones;
- production backward compatibility begins only after an explicit project/architecture decision changes the compatibility epoch. It must not appear ad hoc inside a feature implementation.

Historical completed plans/specs may document what happened historically. Do not rewrite them to falsify history. They are non-authoritative for current behavior.

#### G2 — one continuity identity, several projections

`ContinuityEpochId` is:

```text
logical Instance timeline identity
!= BootId
!= HostOwnershipToken
!= authentication secret
```

Normal restart/crash recovery preserves it. Destructive restore/rollback rotates it later under Recovery authority. H2A-2 implements the **normal** initialization/materialization path only; full destructive restore reconciliation remains out of scope.

#### G3 — no migration path through normal PersistenceService

`PersistenceService` remains the normal runtime transaction boundary. It must not gain:

- DDL methods;
- bootstrap credentials;
- migration-role credentials;
- raw Kysely/pg migration objects;
- schema-owner authority.

#### G4 — distinct PostgreSQL authority

Use these fixed role semantics:

```text
heptalogos_owner
  NOLOGIN
  canonical owner

heptalogos_host_lease
  LOGIN
  dedicated advisory-lease authority

heptalogos_runtime
  LOGIN
  normal least-privilege DML/read authority

heptalogos_migration
  LOGIN
  migration-only credential
  NOINHERIT
  CONNECTION LIMIT 1
  may SET ROLE heptalogos_owner through one explicit membership
```

`heptalogos_runtime` must not receive membership in `heptalogos_owner` or `heptalogos_migration`.

#### G5 — stable Bootstrap Closure does not own ProductGeneration schema definitions

`bootstrap-runtime` orchestrates the authority window and calls an injected canonical initializer. Production source in `bootstrap-runtime` must not import `@heptalogos/canonical-schema`. An integration test may import it through a devDependency to prove the real composition.

#### G6 — migration mechanics are library-first

Use Kysely 0.29.5 `Migrator`/`MigrationProvider` from `kysely/migration`. Do not add:

- `kysely-ctl`;
- Knex/Prisma/Drizzle;
- a custom migration framework;
- `FileMigrationProvider` as the product migration source.

Use a static in-code `MigrationProvider` so compiled/source-less ProductGeneration artifacts do not depend on TypeScript source-file discovery.

#### G7 — no H2A-3/H2B/H3 scope creep

Do not implement:

- TimeService;
- ExecutionContext/AsyncLocalStorage/OTel context;
- Activity/Evidence repositories;
- SchemaRuntime;
- RuntimeSubstrate/Cordis;
- RuntimeReconciler;
- DBOS/WorkQueue/Signal;
- Management/Subject;
- full Restore.

H2A-2 only prepares the identity/schema authority required by those later milestones.

#### G8 — verification truth

Only:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

A repository CI matrix does not prove live PostgreSQL on all platforms. Real PostgreSQL claims remain platform-specific.

---

## Current-state facts that this plan must correct/preserve

1. `master` is `b306975bba3592a0d8c2e2e6d1649f2523af27bc`.
2. H2A-1 is merged and closed as an implementation milestone; `Q-PERSISTENCE-01` remains `PARTIAL`.
3. `BootstrapStateBodyV1` is currently the only code type and `BOOTSTRAP_STATE_DIGEST_DOMAIN` is still `heptalogos.bootstrap-state/v1`.
4. Current tests explicitly reject the obsolete outer `schemaVersion: 2` development shape.
5. PR #14 accidentally inserted a **V1→V2 compatibility obligation** into current Corpus text even though the project is still PRE_PRODUCTION. That is now a current-document inconsistency and must be removed before behavior implementation.
6. The current Host handoff publishes a Host token and then proceeds toward releasing bootstrap ownership; there is no canonical migration/continuity materialization step yet.
7. Current Host PostgreSQL roles are owner/lease/runtime only; there is no migration principal.
8. `bootstrap-runtime` has no production dependency on `persistence`; preserve that separation.
9. Kysely/pg imports are currently mechanically restricted by `scripts/verify/boundaries.mjs`.

---

## Target dependency graph

```text
foundation-contracts
  ├─ bootstrap-state
  ├─ host-ownership
  │    └─ pg
  ├─ persistence
  │    ├─ host-ownership
  │    ├─ pg
  │    └─ kysely
  └─ canonical-schema
       ├─ host-ownership
       ├─ foundation-contracts
       ├─ pg
       └─ kysely

bootstrap-runtime
  ├─ bootstrap-state
  ├─ foundation-contracts
  ├─ host-ownership
  └─ private-postgres

bootstrap-runtime TESTS ONLY
  └─ canonical-schema
```

Forbidden production edge:

```text
bootstrap-runtime -> canonical-schema
```

The future selected ProductGeneration/application wiring supplies the initializer callback.

---

## Canonical contracts to produce

### Continuity identity

```ts
export type ContinuityEpochId = UuidV7Id<"ContinuityEpochId">;

export const createContinuityEpochId = (): ContinuityEpochId =>
  createUuidV7Id("ContinuityEpochId");

export const parseContinuityEpochId = (value: unknown): ContinuityEpochId | undefined =>
  parseUuidV7Id("ContinuityEpochId", value);
```

### Current BootstrapState V1

```ts
export interface BootstrapStateBodyV1 {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly previousBootstrapRuntimeGeneration?: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
  readonly lastCommittedOperationRef?: string;
  readonly lastCompletedStageRef?: string;
  readonly continuityEpochId: ContinuityEpochId;
  readonly privatePostgres?: PrivatePostgresBootstrapStateV1;
}
```

There is no V2 type and no development upgrade reader.

### Migration target/authority

Add to `@heptalogos/host-ownership`:

```ts
export const HOST_MIGRATION_ROLE = "heptalogos_migration" as const;

export interface HostMigrationDatabaseTarget {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: typeof HOST_OWNERSHIP_CANONICAL_DATABASE;
  readonly user: typeof HOST_MIGRATION_ROLE;
}

export interface HostCanonicalMigrationAuthority {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly target: HostMigrationDatabaseTarget;
  readonly signal: AbortSignal;
  assertCurrent(): void;
  withMigrationDatabasePassword<T>(
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
```

The object is issued only by bootstrap-runtime while both bootstrap ownership and the provisional Host lease/token remain current.

### Bootstrap Runtime canonical initializer seam

In `host-ownership-handoff.ts`:

```ts
export interface CanonicalHostInitializationContext {
  readonly authority: HostCanonicalMigrationAuthority;
  readonly expectedContinuityEpochId: ContinuityEpochId;
}

export type CanonicalHostInitializer = (
  context: CanonicalHostInitializationContext,
) => Promise<void>;
```

`HostOwnershipHandoffOptions` receives:

```ts
readonly initializeCanonicalHost: CanonicalHostInitializer;
```

It is required, not optional.

### Managed Host identity

After successful canonical initialization:

```ts
export interface BootstrapManagedHostContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly token: HostOwnershipToken;
  // existing fields...
}
```

`HostPersistenceAuthority` also carries the same `continuityEpochId`, ready for H2A-3 transaction context/lineage work.

---

## Canonical PostgreSQL schema for this milestone

The first current baseline migration creates only the H2A-2 state actually required:

```text
schema: heptalogos

table: instance_continuity
  singleton             boolean NOT NULL PRIMARY KEY
  instance_id           uuid    NOT NULL
  continuity_epoch_id   uuid    NOT NULL

constraints:
  CHECK (singleton)
```

Semantics:

```text
0 rows
  = first canonical materialization may insert expected identity

1 exact row
  = retry/restart succeeds without mutation

1 mismatched InstanceId
  = fail closed

1 mismatched ContinuityEpochId
  = fail closed outside future explicit restore materialization window

>1 rows
  = impossible under PK; treat observed structural corruption as failure
```

Normal `heptalogos_runtime` gets `SELECT` only. It gets no INSERT/UPDATE/DELETE/DDL on this table.

Kysely’s own migration metadata stays in the trusted `heptalogos` schema, owned by `heptalogos_owner`, with no runtime grants:

```text
foundation_schema_migration
foundation_schema_migration_lock
```

---

## Task 0 — Preflight, branch, and active-plan registration

**Files:**

- Create: `docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md`
- Modify: `docs/plans/README.md`

### Interfaces

- Consumes: current `master@b306975...`
- Produces: one explicit active plan and one H2A-2 branch.

- [ ] **Step 0.1 — verify exact baseline**

Run:

```bash
git fetch --no-tags origin master
git status --short
git rev-parse origin/master
```

Expected:

```text
working tree clean
origin/master = b306975bba3592a0d8c2e2e6d1649f2523af27bc
```

If `origin/master` is different, **STOP** and rebase this plan to the new master truth before editing code.

- [ ] **Step 0.2 — establish clean baseline verification**

Run:

```bash
git switch master
git reset --hard origin/master
pnpm install --frozen-lockfile
pnpm verify
```

Expected: `PASS`.

If baseline `pnpm verify` fails, classify the failure before H2A-2; do not bury an unrelated pre-existing failure in this milestone.

- [ ] **Step 0.3 — create branch**

```bash
git switch -c dev/h2a2-canonical-schema-continuity-authority
```

- [ ] **Step 0.4 — register this exact plan**

Copy this document verbatim to:

```text
docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md
```

Update `docs/plans/README.md`:

```markdown
## Active

- [H2A-2 Canonical Schema & Continuity Authority](active/foundation/h2a2-canonical-schema-continuity-authority.md) — `ACTIVE`
```

Do not mark it completed.

- [ ] **Step 0.5 — commit planning record**

```bash
git add docs/plans/README.md \
  docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md
git commit -m "docs: activate H2A2 canonical schema plan"
```

Open a Draft PR for the branch. Ordinary pushes must not dispatch CI.

---

## Task 1 — Make PRE_PRODUCTION no-compatibility policy consistent everywhere current

This task is mandatory before code changes because current Corpus text contradicts the current V1 implementation and project stage.

**Files:**

- Modify: `AGENTS.md`
- Modify: `Architecture_Corpus/00-项目宪法与工程宪法.md`
- Modify: `Architecture_Corpus/INDEX.md`
- Modify: `Architecture_Corpus/19-术语表.md`
- Modify: `Architecture_Corpus/20-架构审查清单.md`
- Modify: `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- Modify: `Architecture_Corpus/16-验证与资格认定体系.md`
- Modify: `Architecture_Corpus/references/constitution.json`
- Modify: `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- Modify: `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- Modify: `.agents/skills/heptalogos-architecture/SKILL.md`
- Modify: `.agents/skills/heptalogos-runtime-durability/SKILL.md`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`

Do **not** rewrite completed historical plans/specs solely because they mention prior development versions.

### Required normative wording

All current authority projections must converge on:

```text
CompatibilityEpoch = PRE_PRODUCTION

Internal project development state has NO backward-compatibility obligation.
Current durable contracts remain versioned, but development shape changes rewrite
the current canonical V1 in place. Obsolete development bytes are rejected/reset,
not migrated/upcast/shimmed. New V2/V3 contract generations are forbidden solely
to preserve repository/development history.

Before first production compatibility, migration history itself is mutable
development material: squash/rewrite the current baseline and recreate dev/test
state. A production compatibility obligation begins only after an explicit
architecture decision changes the compatibility epoch.
```

#### Required concrete corrections

- [ ] **Step 1.1 — fix S01 ContinuityEpoch Authority**

Replace the PR #14 language that says:

```text
BootstrapStateBodyV1 is a one-step upgrade input to V2
```

with:

```text
The current canonical BootstrapState V1 requires ContinuityEpochId.
A new Instance commits that V1 with one epoch before normal runtime.
Obsolete PRE_PRODUCTION BootstrapState bytes that lack the required field are
not upgrade inputs; they are unsupported and require clean-state reset.
```

Replace the handoff sequence:

```text
ensure expected ContinuityEpochId exists in committed BootstrapState
(upgrade the declared V1 input to V2 while bootstrap ownership is held)
```

with:

```text
load and validate the required ContinuityEpochId from current canonical BootstrapState V1
→ run current canonical schema baseline/migrations under migration authority
→ materialize and verify the same ContinuityEpochId in canonical PostgreSQL
```

Do not add any compatibility branch.

- [ ] **Step 1.2 — fix S15 §3 and §13.2**

S15 must explicitly separate:

```text
durable version identity
```

from:

```text
development backward compatibility
```

During PRE_PRODUCTION there is no project-internal backward compatibility. Remove the paragraph that grants the H2A-1 V1 a V1→V2 upgrade obligation.

Keep future production compatibility requirements conceptually documented, but gate them behind an explicit future compatibility-epoch transition.

- [ ] **Step 1.3 — strengthen Engineering Constitution E20**

E20 must say that while PRE_PRODUCTION:

```text
merged commit / internal retained developer DB / local fixture / previous dev build
```

does not create a compatibility obligation.

If a non-disposable external consumer is introduced, that is a stage/architecture transition requiring explicit approval; an individual implementation task may not quietly create compatibility.

- [ ] **Step 1.4 — align INDEX, glossary, and machine-readable constitution**

`Architecture_Corpus/INDEX.md` must describe document 26 as the PRE_PRODUCTION
**canonical-only / no historical development compatibility** boundary rather
than wording that can be read as a development compatibility program.

In `Architecture_Corpus/19-术语表.md`, replace the current
`CompatibilityEpoch` definition with:

```text
CompatibilityEpoch:
project-level declaration of whether historical/external compatibility is
currently an obligation. Current value PRE_PRODUCTION means Heptalogos-owned
development formats have no backward-compatibility obligation: the current
best durable shape remains canonical V1 and obsolete development shapes are
reset/rejected rather than migrated. Entering a production compatibility
epoch requires an explicit architecture decision.
```

Do not redefine `ContractVersion / SchemaVersion`: those remain durable
contract identity, not a development-history counter.

Add an explicit machine-readable scope guard in
`Architecture_Corpus/references/constitution.json`, for example:

```json
"preProductionCompatibility": "CompatibilityEpoch=PRE_PRODUCTION: project-owned development formats have no backward-compatibility obligation; keep one current canonical V1 and reject/reset obsolete development shapes. A production compatibility obligation requires an explicit architecture transition."
```

Do not increment `constitution.json.schemaVersion` merely because this
current-stage policy text was clarified; the JSON contract shape itself is
unchanged.

- [ ] **Step 1.5 — update architecture checklist**

Replace questions such as:

```text
What retained state creates a compatibility obligation?
durable payload has compatible reader?
reader compatibility/upcast/reject behavior?
```

for the current PRE_PRODUCTION path with checks that fail any new:

```text
V2/V3 solely for dev history
legacy reader
upcaster
bridge migration
alias
shim
dual digest
```

Also require an explicit clean-state/reset declaration after current-shape changes.

- [ ] **Step 1.6 — update verification guidance**

`Architecture_Corpus/16-验证与资格认定体系.md` must state:

```text
PRE_PRODUCTION schema evolution tests prove the current canonical clean state.
They do not require an upgrade test from prior development milestones.
```

Real migration mechanics may be tested using a clean database and the current baseline migration.

- [ ] **Step 1.7 — persist the rule in always-on Agent guidance**

In `AGENTS.md`, add a compact hard rule under implementation discipline:

```text
While CompatibilityEpoch=PRE_PRODUCTION, project-owned development formats have
no backward-compatibility obligation. Keep one current canonical V1; rewrite it
in place and reset obsolete dev state. Do not add V2/V3, legacy readers,
upcasters, bridge migrations, aliases, shims or dual formats for repository
history.
```

In `heptalogos-architecture` and `heptalogos-runtime-durability`, add a stop/never-infer rule with the same semantics so conditional skill loading reinforces the root rule.

- [ ] **Step 1.8 — update roadmap current truth**

Set:

```text
Repository baseline: master@b306975bba3592a0d8c2e2e6d1649f2523af27bc
H2A_2: ACTIVE
```

Describe H2A-2 as:

```text
canonical BootstrapState V1 + ContinuityEpoch
distinct migration authority
current canonical schema baseline
normal materialization/verification
```

Do not describe a V1→V2 path.

- [ ] **Step 1.9 — refresh Corpus manifest/digests**

Use the repository’s existing Corpus manifest procedure. Do not manually leave stale hashes.

Then run:

```bash
pnpm check:agents
pnpm check:corpus
```

Expected: `PASS`.

- [ ] **Step 1.10 — negative policy scan**

Run:

```bash
rg -n \
  'BootstrapStateBodyV2|BootstrapStateEnvelopeV2|V1.?→.?V2|V1.?->.?V2|one-step upgrade|upgrade input to.*V2' \
  AGENTS.md Architecture_Corpus .agents docs/roadmap
```

Expected: no current-authority occurrence that prescribes development compatibility.

Historical completed plans under `docs/plans/completed/` are not part of this scan.

- [ ] **Step 1.11 — commit**

```bash
git add AGENTS.md \
  Architecture_Corpus \
  .agents/skills/heptalogos-architecture/SKILL.md \
  .agents/skills/heptalogos-runtime-durability/SKILL.md \
  docs/roadmap/development-roadmap.md
git commit -m "docs: enforce pre-production canonical-only contracts"
```

**Gate:** no behavior implementation starts until Task 1 passes.

---

## Task 2 — Add `ContinuityEpochId` to Foundation identity primitives

**Files:**

- Modify: `packages/foundation-contracts/src/identity.ts`
- Modify: `packages/foundation-contracts/src/index.ts`
- Modify: `packages/foundation-contracts/src/identity.test.ts`

### Produces

```ts
ContinuityEpochId;
createContinuityEpochId();
parseContinuityEpochId();
```

- [ ] **Step 2.1 — write failing identity test**

Add tests parallel to `BootId`/`HostOwnershipToken`:

```ts
it("creates and parses ContinuityEpochId as UUIDv7", () => {
  const value = createContinuityEpochId();

  expect(isUuidV7(value)).toBe(true);
  expect(parseContinuityEpochId(value)).toBe(value);
  expect(parseContinuityEpochId("not-a-uuid")).toBeUndefined();
});
```

Run:

```bash
pnpm nx run foundation-contracts:test
```

Expected: FAIL because the new API does not exist.

- [ ] **Step 2.2 — implement exact primitive**

Add exactly:

```ts
export type ContinuityEpochId = UuidV7Id<"ContinuityEpochId">;

export const createContinuityEpochId = (): ContinuityEpochId =>
  createUuidV7Id("ContinuityEpochId");

export const parseContinuityEpochId = (value: unknown): ContinuityEpochId | undefined =>
  parseUuidV7Id("ContinuityEpochId", value);
```

Export through `index.ts`.

- [ ] **Step 2.3 — verify**

```bash
pnpm nx run foundation-contracts:test
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 2.4 — commit**

```bash
git add packages/foundation-contracts/src/identity.ts \
  packages/foundation-contracts/src/index.ts \
  packages/foundation-contracts/src/identity.test.ts
git commit -m "feat: add continuity epoch identity"
```

---

## Task 3 — Rewrite the current canonical BootstrapState V1 in place

**Files:**

- Modify: `packages/bootstrap-state/src/model.ts`
- Modify: `packages/bootstrap-state/src/codec.ts`
- Modify: `packages/bootstrap-state/src/codec.test.ts`
- Modify: `packages/bootstrap-state/src/store.test.ts`
- Modify: `packages/bootstrap-state/src/platform-behavior.test.ts`
- Modify every non-historical code/test fixture returned by:
  - `rg -l 'BootstrapStateBodyV1|activeProductGeneration' packages`

Do not create any V2 symbol.

### Produces

Current V1 requires:

```ts
readonly continuityEpochId: ContinuityEpochId;
```

#### TDD

- [ ] **Step 3.1 — add failing codec cases**

Update the canonical fixture to include:

```ts
continuityEpochId: createContinuityEpochId(),
```

Add an explicit rejection test for obsolete PRE_PRODUCTION bytes:

```ts
it("rejects obsolete development V1 that lacks continuityEpochId", () => {
  const sealed = sealBootstrapState(makeState());
  const { continuityEpochId: _drop, ...obsoleteState } = sealed.state;

  const result = parseBootstrapState(
    JSON.stringify({
      state: obsoleteState,
      digest: digestCanonicalJson(
        BOOTSTRAP_STATE_DIGEST_DOMAIN,
        obsoleteState as unknown as CanonicalJsonValue,
      ),
    }),
  );

  expect(result).toMatchObject({
    ok: false,
    problem: { problemCode: "bootstrap.state.invalid_schema" },
  });
});
```

Keep the existing test that rejects outer `schemaVersion: 2`.

- [ ] **Step 3.2 — run and observe failure**

```bash
pnpm nx run bootstrap-state:test
```

Expected: FAIL until model/schema are updated.

- [ ] **Step 3.3 — update model**

In `BootstrapStateBodyV1`, add required:

```ts
readonly continuityEpochId: ContinuityEpochId;
```

Import the type from `foundation-contracts`.

- [ ] **Step 3.4 — update codec**

In current `stateSchemaV1`, add:

```ts
continuityEpochId: Type.String({ pattern: UUID_V7_PATTERN }),
```

Do **not** change:

```ts
schemaVersion: 1;
BOOTSTRAP_STATE_DIGEST_DOMAIN = "heptalogos.bootstrap-state/v1";
```

Do not add alternate validators.

- [ ] **Step 3.5 — update every current code/test fixture**

Run:

```bash
rg -n 'BootstrapStateBodyV1|activeProductGeneration' packages
```

Every current BootstrapState constructor must supply a valid `continuityEpochId`.

Prefer one stable fixture-local epoch when a test verifies restart/retry identity. Do not create a fresh epoch every time a helper is called if the test is modeling the same logical Instance across boots.

- [ ] **Step 3.6 — negative implementation scan**

```bash
rg -n \
  'BootstrapStateBodyV2|BootstrapStateEnvelopeV2|parse.*V1.*V2|upcast|legacyBootstrapState' \
  packages
```

Expected: no development compatibility implementation.

- [ ] **Step 3.7 — verify**

```bash
pnpm nx run bootstrap-state:test
pnpm nx run bootstrap-runtime:test
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [ ] **Step 3.8 — commit**

```bash
git add packages/foundation-contracts \
  packages/bootstrap-state \
  packages/bootstrap-runtime
git commit -m "refactor: make continuity epoch canonical V1 state"
```

This is a PRE_PRODUCTION canonical reset, not an upgrade migration.

---

## Task 3A — Implement bootstrap-owned initial ContinuityEpoch genesis

Adding a required field is not enough. H2A-2 must actually prove the S01/S15
authority rule that a new logical Instance creates exactly one initial epoch
under bootstrap ownership and that retries reuse the committed value.

**Files:**

- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.test.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts` only if the new input/result
  types must be part of the existing `OwnedBootstrapPrelude` public contract
- Modify current test helpers that construct `OwnedBootstrapPrelude`

### Consumes

From `@heptalogos/bootstrap-state`:

```ts
BootstrapRuntimeGenerationId;
ProductGenerationId;
BootstrapStateEnvelope;
```

From `@heptalogos/foundation-contracts`:

```ts
createContinuityEpochId;
```

#### Produces

Extend `OwnedBootstrapPrelude` with exactly:

```ts
export interface BootstrapStateGenesisSelection {
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
}

export interface OwnedBootstrapPrelude {
  // existing fields...
  ensureBootstrapStateInitialized(
    selection: BootstrapStateGenesisSelection,
  ): Promise<BootstrapStateEnvelope>;
}
```

The method is an **ensure**, not an upgrade API.

#### Exact semantics

```text
load() = EMPTY
  → assert bootstrap ownership
  → create one ContinuityEpochId
  → commit canonical BootstrapState V1 revision 1 using supplied generation refs
  → update the in-memory authoritativeState projection
  → return committed envelope

load() = CURRENT
  → do not generate any ID
  → do not rewrite generation refs
  → update/return that current envelope

load() = RECOVERED_PREVIOUS
  → bootstrap.state.current_authority_required

load() = CORRUPT
  → propagate the authoritative corruption Problem
```

Why `CURRENT` returns the current value instead of validating/replacing the
selection: once BootstrapState exists, its generation refs are already durable
bootstrap Authority. H2A-2 must not silently turn a caller-supplied selection
into a second generation-selection authority path. Future ProductGeneration
switching remains an explicit maintenance/update concern.

Concurrency/exactly-once proof comes from:

```text
bootstrap ownership
+ BootstrapStateStore revision-1 commit
```

No process-local mutex is the Authority.

#### TDD

- [ ] **Step 3A.1 — write failing genesis test**

Create an owned prelude against an `EMPTY` state, call:

```ts
const initialized = await owned.ensureBootstrapStateInitialized({
  activeBootstrapRuntimeGeneration,
  activeProductGeneration,
});
```

Assert:

```text
initialized.state.schemaVersion == 1
initialized.state.revision == 1
initialized.state.continuityEpochId is valid UUIDv7
state.load() returns CURRENT with the exact same epoch
```

Run:

```bash
pnpm nx run bootstrap-runtime:test
```

Expected: FAIL because the method does not exist.

- [ ] **Step 3A.2 — write retry/idempotency test**

Call `ensureBootstrapStateInitialized()` twice while retaining the same owned
bootstrap lease.

Assert:

```text
first.epoch == second.epoch
revision remains 1
second call performs no state commit
```

Use a store spy/test seam if needed to prove no second commit; do not infer it
only from the final revision.

- [ ] **Step 3A.3 — write crash-after-commit retry test**

Model:

```text
Boot A obtains bootstrap ownership
→ ensure commits E1
→ caller fails before private PostgreSQL/canonical materialization
→ release/terminate Boot A
→ Boot B obtains bootstrap ownership
→ ensure called again
```

Assert:

```text
BootId A != BootId B
ContinuityEpochId == E1 on both observed CURRENT state
no E2 is generated
```

This is a bootstrap-state retry test and does not require PostgreSQL.

- [ ] **Step 3A.4 — write fail-closed recovery-state tests**

For `RECOVERED_PREVIOUS` and `CORRUPT`, assert no new epoch is generated and no
new current state is committed.

- [ ] **Step 3A.5 — implement with a mutable authoritative-state projection**

Inside `materializeOwnedBootstrapPrelude`, change the captured initial state to:

```ts
let authoritativeState = await access.state.load();
```

Expose it as a getter:

```ts
get authoritativeState() {
  return authoritativeState;
}
```

Implement `ensureBootstrapStateInitialized()` by reloading `access.state`
inside the method, not by trusting the acquisition-time snapshot.

For `EMPTY`:

```ts
const committed = await access.state.commit({
  schemaVersion: 1,
  revision: 1,
  activeBootstrapRuntimeGeneration: selection.activeBootstrapRuntimeGeneration,
  activeProductGeneration: selection.activeProductGeneration,
  ...(selection.lastKnownGoodProductGeneration === undefined
    ? {}
    : {
        lastKnownGoodProductGeneration: selection.lastKnownGoodProductGeneration,
      }),
  continuityEpochId: createContinuityEpochId(),
});

authoritativeState = {
  status: "CURRENT",
  value: committed,
};
return committed;
```

`access.state.commit()` already reasserts bootstrap ownership. Still call the
prelude's bootstrap ownership assertion before generation so ID creation is
inside the proven Authority window.

For `CURRENT`, return the current envelope and assign it to
`authoritativeState`; do not commit.

- [ ] **Step 3A.6 — use the seam in H2A-2 integration setup**

Any H2A-2 “new Instance” integration scenario must call
`ensureBootstrapStateInitialized()` before `preparePrivatePostgres()`.
Do not manually seed a BootstrapState file containing an epoch and then call
that proof “initial epoch creation”.

Existing older unit fixtures that are not testing the bootstrap genesis may
construct canonical V1 directly as test data.

- [ ] **Step 3A.7 — verify**

```bash
pnpm nx run bootstrap-runtime:test
pnpm nx run bootstrap-state:test
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [ ] **Step 3A.8 — commit**

```bash
git add packages/bootstrap-runtime
git commit -m "feat: establish bootstrap continuity genesis"
```

## Task 4 — Add the migration PostgreSQL principal and credential route

**Files:**

- Modify: `packages/host-ownership/src/contracts.ts`
- Modify: `packages/host-ownership/src/bootstrap-admin.ts`
- Modify: `packages/host-ownership/src/bootstrap-admin.test.ts`
- Modify: `packages/host-ownership/src/index.ts`
- Modify: `packages/host-ownership/src/host-ownership.integration.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-key-provider.test.ts`
- Modify every bootstrap-runtime fake `BootstrapKeyProvider`
- Modify: `packages/bootstrap-runtime/src/host-ownership-handoff.ts` password-provider adapter

### Role contract

Create:

```text
heptalogos_migration
LOGIN
NOSUPERUSER
NOCREATEDB
NOCREATEROLE
NOREPLICATION
NOBYPASSRLS
NOINHERIT
CONNECTION LIMIT 1
SCRAM credential
```

Membership:

```text
GRANT heptalogos_owner
TO heptalogos_migration
WITH INHERIT FALSE, SET TRUE;
```

No `ADMIN OPTION`.

#### TDD

- [ ] **Step 4.1 — extend bootstrap-admin tests first**

Tests must assert:

- fourth role exists;
- exact login/privilege attributes;
- exactly one allowed membership edge: migration → owner;
- membership is non-admin, non-inherited, SET-enabled;
- lease/runtime roles have zero memberships;
- existing migration role with wrong attributes fails;
- wrong membership or extra membership fails;
- wrong migration credential fails;
- bootstrap provisioning result exposes `migrationRoleCreated`.

Run:

```bash
pnpm nx run host-ownership:test
```

Expected: FAIL.

- [ ] **Step 4.2 — add constants/contracts**

Add:

```ts
export const HOST_MIGRATION_ROLE = "heptalogos_migration" as const;
```

Add `HostMigrationDatabaseTarget` and `HostCanonicalMigrationAuthority` contracts from the plan header.

- [ ] **Step 4.3 — extend password provider**

`BootstrapAdminPasswordProvider` gains:

```ts
withMigrationPassword<T>(
  use: (passwordUtf8: Uint8Array) => Promise<T>,
): Promise<T>;
```

`BootstrapKeyRequestContext["purpose"]` gains:

```text
private-postgres-migration-role
```

`BootstrapKeyProvider` gains:

```ts
withPrivatePostgresMigrationPassword<T>(...): Promise<T>;
```

Update all fakes explicitly; do not provide a permissive default that hides a missing credential route.

- [ ] **Step 4.4 — provision exact role**

Refactor role validation so role attributes and membership closure are separate checks.

`MEMBERSHIP_QUERY` for PostgreSQL 18 must inspect at least:

```text
member_role
granted_role
admin_option
inherit_option
set_option
```

Expected exact non-owner edge set after provisioning:

```text
heptalogos_migration -> heptalogos_owner
admin_option = false
inherit_option = false
set_option = true
```

All other memberships involving owner/lease/runtime/migration are rejected.

- [ ] **Step 4.5 — database CONNECT ACL**

Grant canonical DB `CONNECT` to:

```text
heptalogos_host_lease
heptalogos_runtime
heptalogos_migration
```

Keep PUBLIC revoked.

Migration obtains object-owner privilege only after `SET ROLE heptalogos_owner`; CONNECT must not imply schema mutation permission by itself.

- [ ] **Step 4.6 — bootstrap-runtime adapter**

In `passwordProvider(...)`, route migration password to:

```ts
options.keyProvider.withPrivatePostgresMigrationPassword(...)
```

using purpose `private-postgres-migration-role`.

- [ ] **Step 4.7 — real PostgreSQL proof**

With `HEPTALOGOS_TEST_PG_BIN` pointing to PostgreSQL 18.6:

```bash
pnpm nx run host-ownership:test:integration
```

Add/extend an integration case proving:

```sql
session_user = 'heptalogos_migration'
SET ROLE heptalogos_owner succeeds
SET ROLE by heptalogos_runtime to owner/migration fails
```

Do not claim Linux/macOS if not executed there.

- [ ] **Step 4.8 — commit**

```bash
git add packages/host-ownership packages/bootstrap-runtime
git commit -m "feat: add bounded canonical migration principal"
```

---

## Task 5 — Add the joint bootstrap + Host migration capability and reorder handoff

**Files:**

- Modify: `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- Modify: `packages/bootstrap-runtime/src/host-ownership-handoff.test.ts`
- Modify: `packages/bootstrap-runtime/src/managed-host.ts`
- Modify: `packages/bootstrap-runtime/src/managed-host.test.ts`
- Modify: `packages/bootstrap-runtime/src/host-maintenance.ts`
- Modify related host-maintenance unit tests
- Modify: `packages/host-ownership/src/contracts.ts` if final authority type needs tightening

### Required order

The successful path must become:

```text
bootstrap ownership held
→ private PG ready
→ bootstrap reservation / canonical DB validation
→ Host lease acquired
→ HostOwnershipFence validated
→ fresh HostOwnershipToken published
→ load CURRENT BootstrapState V1
→ obtain expected ContinuityEpochId
→ construct HostCanonicalMigrationAuthority
→ initializeCanonicalHost({ authority, expectedContinuityEpochId })
→ canonical initializer returns success
→ mark PG session handed off
→ release bootstrap ownership
→ prove Host lease still active
→ return BootstrapManagedHostContext carrying the same epoch
```

No normal managed Host exists before canonical initialization succeeds.

#### TDD

- [ ] **Step 5.1 — add ordering unit test**

Inject a fake `initializeCanonicalHost` that records events.

Expected exact relative order:

```text
token_published
canonical_initializer_enter
canonical_initializer_exit
bootstrap_release
managed_host_return
```

- [ ] **Step 5.2 — add failure test**

Fake initializer throws a `ProblemError`.

Assert:

- no managed Host returned;
- provisional Host lease is closed/fenced;
- `markHandedOff` is not called;
- bootstrap ownership is not treated as successfully released by handoff;
- failure checkpoint uses stable H2A-2 stage/problem identity;
- caller still owns the bounded bootstrap failure path.

- [ ] **Step 5.3 — add BootstrapState Authority test**

Handoff must call `context.state.load()` and accept only:

```text
CURRENT
```

`EMPTY`, `CORRUPT`, and `RECOVERED_PREVIOUS` fail closed. It never generates an epoch during handoff.

This is important: epoch creation belongs to new canonical BootstrapState genesis, not an error-recovery side effect.

- [ ] **Step 5.4 — construct migration capability**

The capability’s `assertCurrent()` must verify both:

```text
bootstrap ownership still current
Host lease/context still active
```

`withMigrationDatabasePassword()` must:

1. assert both before credential resolution;
2. resolve the scoped migration credential;
3. run the callback;
4. assert both again before reporting success.

If either authority is lost, no canonical initialization success may be returned.

- [ ] **Step 5.5 — add epoch to managed Host**

`BootstrapManagedHostContext` and `HostPersistenceAuthority` both expose the same `continuityEpochId`.

`createManagedHostContext(...)` must receive the epoch explicitly; it must not generate/load it independently.

- [ ] **Step 5.6 — preserve epoch through maintenance restart**

Current reverse/forward Host maintenance may generate a new `BootId`/Host token. It must carry the same epoch when it returns a restarted managed Host.

Add regression test:

```text
old boot != new boot
old token != new token
old continuityEpochId == new continuityEpochId
```

- [ ] **Step 5.7 — verify**

```bash
pnpm nx run bootstrap-runtime:test
pnpm nx run persistence:test
pnpm typecheck
pnpm tsc6
```

Expected: PASS.

- [ ] **Step 5.8 — commit**

```bash
git add packages/bootstrap-runtime \
  packages/host-ownership \
  packages/persistence
git commit -m "feat: gate managed host on canonical initialization"
```

---

## Task 6 — Create `@heptalogos/canonical-schema` as a narrow migration adapter

**Files:**

Create:

```text
packages/canonical-schema/
├─ package.json
├─ project.json
├─ tsconfig.json
├─ tsconfig.build.json
└─ src/
   ├─ contracts.ts
   ├─ problems.ts
   ├─ migration-pool.ts
   ├─ migration-provider.ts
   ├─ migrations/
   │  └─ 0001-foundation-continuity.ts
   ├─ continuity.ts
   ├─ initializer.ts
   ├─ initializer.test.ts
   └─ index.ts
```

Use existing package scaffolding conventions from `packages/persistence`; do not introduce a generator/tooling dependency merely to create the workspace.

### package dependencies

```json
{
  "dependencies": {
    "@heptalogos/foundation-contracts": "workspace:*",
    "@heptalogos/host-ownership": "workspace:*",
    "kysely": "catalog:",
    "pg": "catalog:"
  },
  "devDependencies": {
    "@types/pg": "catalog:",
    "vitest": "catalog:"
  }
}
```

#### Public surface

Only export Heptalogos-owned contracts/factory:

```ts
export type {
  CanonicalSchemaRuntimeOptions,
  CanonicalSchemaInitializer,
} from "./contracts.js";

export { createCanonicalSchemaInitializer } from "./initializer.js";
```

Do not export:

```text
Kysely
Pool
Client
PostgresDialect
Migrator
Migration
MigrationProvider
```

#### Runtime options

```ts
export interface CanonicalSchemaRuntimeOptions {
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly lockTimeoutMs: number;
  readonly idleInTransactionSessionTimeoutMs: number;
  readonly onBackgroundError: (error: unknown) => void;
}
```

No hidden behavioral timeout defaults.

#### Initializer signature

```ts
export interface CanonicalSchemaInitializer {
  (context: {
    readonly authority: HostCanonicalMigrationAuthority;
    readonly expectedContinuityEpochId: ContinuityEpochId;
  }): Promise<void>;
}
```

`createCanonicalSchemaInitializer(options)` returns that function.

- [ ] **Step 6.1 — scaffold package and make empty test target run**

Run:

```bash
pnpm nx run canonical-schema:test
```

Expected initially: target exists; tests may fail until implementation.

- [ ] **Step 6.2 — add stable Problems**

At minimum:

```text
canonical-schema.authority_lost
canonical-schema.schema_precondition_failed
canonical-schema.migration_failed
canonical-schema.continuity_instance_mismatch
canonical-schema.continuity_epoch_mismatch
canonical-schema.close_failed
```

Map raw pg/Kysely errors to bounded Problems. Do not expose SQL/password/server raw responses in client-visible detail.

- [ ] **Step 6.3 — commit scaffold**

```bash
git add packages/canonical-schema
git commit -m "feat: add canonical schema adapter workspace"
```

---

## Task 7 — Implement the current canonical migration baseline with Kysely

**Files:**

- Modify: `packages/canonical-schema/src/migration-pool.ts`
- Modify: `packages/canonical-schema/src/migration-provider.ts`
- Modify: `packages/canonical-schema/src/migrations/0001-foundation-continuity.ts`
- Modify: `packages/canonical-schema/src/initializer.ts`
- Modify: `packages/canonical-schema/src/initializer.test.ts`

### PRE_PRODUCTION migration policy

There is exactly one current baseline migration for this milestone:

```text
0001_foundation_continuity
```

Do not add:

```text
0002_upgrade_h2a1
0002_add_continuity_epoch
legacy schema detection
bridge SQL
```

If the H2A-2 schema changes before production, edit/squash the baseline and recreate the dev DB.

#### Migration pool

Create `pg.Pool` with:

```text
user              = heptalogos_migration
max               = 1
application_name  = heptalogos-canonical-migration
timeouts          = explicit options
password          = HostCanonicalMigrationAuthority callback
```

Set connection startup options so the authenticated role remains migration but effective privileges are canonical owner:

```text
session_user = heptalogos_migration
current_user = heptalogos_owner
```

Use fixed PostgreSQL session options equivalent to:

```text
-c role=heptalogos_owner
-c search_path=heptalogos,pg_catalog
```

This relies on the explicit migration→owner `SET` membership from Task 4.

#### Static MigrationProvider

Implement:

```ts
const migrations: Readonly<Record<string, Migration>> = Object.freeze({
  "0001_foundation_continuity": foundationContinuityMigration,
});

export const canonicalMigrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
```

Import `Migration`/`MigrationProvider` from `kysely/migration`.

No filesystem discovery.

#### Migration table settings

Construct Kysely `Migrator` with fixed:

```text
migrationTableName      = foundation_schema_migration
migrationLockTableName  = foundation_schema_migration_lock
migrationTableSchema    = heptalogos
allowUnorderedMigrations = false
```

Before invoking `Migrator`, explicitly verify that `heptalogos` schema already exists and is owned by `heptalogos_owner`. If this H1 precondition is false, fail; do not let the migrator silently create a replacement schema and hide an H1 defect.

#### Baseline migration

Use Kysely schema mechanics to create `heptalogos.instance_continuity`:

```ts
await db.schema
  .withSchema("heptalogos")
  .createTable("instance_continuity")
  .addColumn("singleton", "boolean", (col) => col.notNull().primaryKey())
  .addColumn("instance_id", "uuid", (col) => col.notNull())
  .addColumn("continuity_epoch_id", "uuid", (col) => col.notNull())
  .addCheckConstraint("instance_continuity_singleton_check", sql`singleton`)
  .execute();
```

Then issue the fixed privilege projection:

```sql
REVOKE ALL ON TABLE "heptalogos"."instance_continuity" FROM PUBLIC;
GRANT SELECT ON TABLE "heptalogos"."instance_continuity" TO "heptalogos_runtime";
```

Do not grant runtime DML.

#### Migrator result handling

Kysely 0.29.x `migrateToLatest()` returns an error result rather than requiring a thrown exception. Implementation must check both `error` and per-result statuses before declaring migration success.

- [ ] **Step 7.1 — write tests for static provider and no FS route**

Unit test verifies exactly one migration name and no `FileMigrationProvider` behavior.

- [ ] **Step 7.2 — implement pool/provider/migration**

Keep all Kysely/pg objects package-private.

- [ ] **Step 7.3 — implement migrator**

Success requires:

```text
no result.error
no Error/NotExecuted migration result
authority still current
```

- [ ] **Step 7.4 — unit verify**

```bash
pnpm nx run canonical-schema:test
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7.5 — commit**

```bash
git add packages/canonical-schema
git commit -m "feat: add canonical schema baseline migration"
```

---

## Task 8 — Materialize/verify ContinuityEpoch atomically

**Files:**

- Modify: `packages/canonical-schema/src/continuity.ts`
- Modify: `packages/canonical-schema/src/initializer.ts`
- Modify: `packages/canonical-schema/src/initializer.test.ts`

### Normal materialization algorithm

After migrations succeed:

```text
authority.assertCurrent()
BEGIN
  INSERT expected singleton/instance/epoch
  ON CONFLICT (singleton) DO NOTHING

  SELECT singleton, instance_id, continuity_epoch_id
  FROM heptalogos.instance_continuity
  WHERE singleton = true
  FOR UPDATE

  assert exactly one row
  assert instance_id == expected InstanceId
  assert continuity_epoch_id == expected ContinuityEpochId
COMMIT
authority.assertCurrent()
```

A mismatch is never repaired by `UPDATE` in normal mode.

#### Required Problems

```text
existing different instance
  -> canonical-schema.continuity_instance_mismatch

existing different epoch
  -> canonical-schema.continuity_epoch_mismatch
```

Both are fail-closed and manual/recovery class.

#### TDD

- [ ] **Step 8.1 — unit-test decision logic**

Extract a pure verifier for observed row → expected identities.

Cases:

```text
exact => PASS
different instance => instance_mismatch
different epoch => epoch_mismatch
malformed/missing => schema/integrity failure
```

- [ ] **Step 8.2 — implement transaction**

Use Kysely transaction mechanics. Do not expose the transaction object outside `canonical-schema`.

- [ ] **Step 8.3 — wire initializer**

`createCanonicalSchemaInitializer()` sequence:

```text
assert authority
open pool/db
verify effective role/schema precondition
migrateToLatest
materializeContinuity
assert authority
destroy Kysely/pool
```

Close in `finally`.

If close fails after initialization body failed, preserve the original authoritative failure and record/sink close failure through bounded diagnostics rather than replacing it blindly.

- [ ] **Step 8.4 — verify**

```bash
pnpm nx run canonical-schema:test
pnpm typecheck
pnpm tsc6
```

- [ ] **Step 8.5 — commit**

```bash
git add packages/canonical-schema
git commit -m "feat: materialize canonical continuity epoch"
```

---

## Task 9 — Mechanically enforce the new dependency/public boundaries

**Files:**

- Modify: `scripts/verify/boundaries.mjs`
- Modify: `packages/bootstrap-runtime/package.json`
- Modify lockfile if pnpm changes it
- Modify root/package TS configuration only if required by existing workspace conventions

### Rules

Allow raw `pg` and `kysely` only in:

```text
packages/persistence/
packages/canonical-schema/
existing Host ownership adapter paths/tests
existing explicitly allowed integration tests
```

Add canonical-schema root leakage check:

```text
packages/canonical-schema/src/index.ts
```

must not expose concrete:

```text
Pool
Client
Kysely
PostgresDialect
Migrator
MigrationProvider
```

Enforce:

```text
@heptalogos/canonical-schema
```

may not be imported by bootstrap-runtime production files. Allow only the exact H2A-2 integration test path(s) that compose the real initializer.

Add `@heptalogos/canonical-schema` to `bootstrap-runtime` **devDependencies only** for those integration tests.

- [ ] **Step 9.1 — write failing boundary fixture/test if the verifier has test coverage**

If boundary verifier does not have a dedicated unit test harness, first make the rule change and prove by intentionally running the check against the new valid tree plus one temporary local violation; remove the temporary violation before commit.

- [ ] **Step 9.2 — run**

```bash
pnpm check:dependencies
pnpm check:boundaries
```

Expected: PASS.

- [ ] **Step 9.3 — explicit graph scan**

Run:

```bash
rg -n '@heptalogos/canonical-schema' packages/bootstrap-runtime/src
```

Expected: matches only H2A-2 integration test files, never production `.ts`.

Run:

```bash
rg -n 'from ["'\''](?:pg|kysely(?:/migration)?)["'\'']' packages
```

Manually confirm every match is within the allowed adapter paths.

- [ ] **Step 9.4 — commit**

```bash
git add scripts/verify/boundaries.mjs \
  packages/bootstrap-runtime/package.json \
  pnpm-lock.yaml \
  packages/canonical-schema
git commit -m "chore: enforce canonical migration boundaries"
```

---

## Task 10 — Real PostgreSQL H2A-2 end-to-end qualification

**Files:**

- Create: `packages/bootstrap-runtime/src/canonical-initialization.integration.test.ts`
- Modify: `packages/bootstrap-runtime/project.json`
- Modify existing test helpers only as needed for current canonical V1 fixtures
- Optionally add package-private test helpers; do not create production abstractions solely for tests

The integration test imports `createCanonicalSchemaInitializer` from the devDependency and passes it into the bootstrap handoff. This is the permitted test-only composition edge.

### Required scenario matrix

#### C1 — clean first materialization

Create a new logical Instance through `OwnedBootstrapPrelude.ensureBootstrapStateInitialized()`, producing epoch `E1`, then continue through private PostgreSQL preparation and Host handoff:

```text
bootstrap-owned state genesis commits E1
→ Host token published
→ baseline migration runs
→ instance_continuity row = (InstanceId, E1)
→ managed Host returned
→ managedHost.continuityEpochId == E1
→ managedHost.persistence.continuityEpochId == E1
```

PASS only on real PostgreSQL.

#### C2 — ordinary restart preserves epoch

Second boot against same logical instance/database/state:

```text
BootId changes
HostOwnershipToken changes
ContinuityEpochId remains E1
initializer is idempotent
```

#### C3 — committed epoch, interrupted DB materialization, retry

Inject failure after migration but before continuity materialization.

Expected:

```text
BootstrapState still contains E1
no new epoch generated
retry on a later BootId uses E1
materialization succeeds with E1
```

This is the crash/retry proof H2A-2 needs. It is not a legacy upgrade test.

#### C4 — canonical DB epoch mismatch fails closed

After clean initialization, mutate the test DB under explicit bootstrap/test admin authority to `E2 != E1`, then attempt normal handoff with BootstrapState `E1`.

Expected:

```text
canonical-schema.continuity_epoch_mismatch
no normal managed Host
no implicit DB overwrite
```

#### C5 — canonical DB Instance mismatch fails closed

Set DB row `instance_id` to another valid InstanceId.

Expected:

```text
canonical-schema.continuity_instance_mismatch
```

#### C6 — migration role is correctly separated

During migration connection:

```text
session_user = heptalogos_migration
current_user = heptalogos_owner
```

Normal runtime:

```text
SET ROLE heptalogos_owner => denied
SET ROLE heptalogos_migration => denied
```

#### C7 — runtime continuity ACL is read-only

As `heptalogos_runtime`:

```text
SELECT instance_continuity => PASS
INSERT => denied
UPDATE => denied
DELETE => denied
CREATE TABLE in heptalogos => denied
```

#### C8 — migration history corruption fails closed

After current baseline succeeds, corrupt the Kysely migration metadata in the test-only admin window so the executed migration set is inconsistent with the static provider.

Expected:

```text
initializer fails with canonical-schema.migration_failed
normal managed Host not returned
```

Do not add code to “accept” the corrupted development history.

#### C9 — obsolete development BootstrapState is rejected before normal handoff

Construct bytes with current `schemaVersion: 1` but without `continuityEpochId` and a matching digest.

Expected:

```text
bootstrap.state.invalid_schema
```

No upgrade/migration path runs.

### Commands

On a host with PostgreSQL 18.6 binaries:

PowerShell example:

```powershell
$env:HEPTALOGOS_TEST_PG_BIN = "<absolute PostgreSQL 18.6 bin directory>"
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
```

POSIX:

```bash
HEPTALOGOS_TEST_PG_BIN="<absolute PostgreSQL 18.6 bin directory>" \
  pnpm nx run host-ownership:test:integration

HEPTALOGOS_TEST_PG_BIN="<absolute PostgreSQL 18.6 bin directory>" \
  pnpm nx run bootstrap-runtime:test:integration
```

If no real PG18.6 runtime is supplied:

```text
H2A-2 real-PG qualification = BLOCKED
```

not PASS.

- [ ] **Step 10.1 — add target**

Include `canonical-initialization.integration.test.ts` in `bootstrap-runtime:test:integration`.

- [ ] **Step 10.2 — implement C1–C9**

No mocks count for C1–C8.

- [ ] **Step 10.3 — rerun H2A-1 regressions**

Also run:

```bash
pnpm nx run persistence:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
```

Expected on the executed platform: all PASS.

- [ ] **Step 10.4 — commit**

```bash
git add packages/bootstrap-runtime \
  packages/canonical-schema \
  packages/host-ownership \
  packages/persistence
git commit -m "test: qualify canonical continuity initialization"
```

---

## Task 11 — Full repository verification and H2A-2 evidence record

**Files:**

- Modify: `Architecture_Corpus/qualification/results/Q-PERSISTENCE-01.md`
- Modify: `Architecture_Corpus/qualification/results/qualification-status.json`
- Modify: `Architecture_Corpus/manifest.json`
- Modify: `Architecture_Corpus/SHA256SUMS.txt`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify: active plan file as execution checkboxes/results become factual

Do not erase or rewrite the H2A-1 exact review/CI/merge evidence. Add a distinct H2A-2 evidence section.

### Evidence fields

Record, at minimum:

```text
H2A-2 behavior candidate SHA
platform
PostgreSQL exact version/provenance
canonical-schema unit counts
C1-C9 counts
host-ownership regression counts
bootstrap-runtime regression counts
persistence regression counts
pnpm verify result
```

Keep unrelated product qualification truthful:

```text
Linux real PG        PASS only if actually run there
macOS real PG        PASS only if actually run there
source-less          NOT_RUN unless actually built/executed
service/headless     NOT_RUN unless actually executed
```

`Q-PERSISTENCE-01` may remain `PARTIAL`.

#### Full gates

Run:

```bash
pnpm check:agents
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm check:boundaries
pnpm toolchain:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm tsc6
pnpm test
pnpm build
pnpm verify
```

All repository gates must PASS before candidate freeze.

#### PRE_PRODUCTION no-compat scan

Run:

```bash
rg -n \
  'BootstrapStateBodyV2|BootstrapStateEnvelopeV2|V1.?→.?V2|V1.?->.?V2|legacy.*BootstrapState|upcast.*BootstrapState|bridge.*BootstrapState' \
  AGENTS.md Architecture_Corpus .agents packages docs/roadmap docs/plans/active
```

Any current implementation/authority match that preserves development history is a blocker.

The only acceptable `schemaVersion: 2` references are historical/negative-test contexts that explicitly reject obsolete development shapes; do not create a current V2 contract.

#### Commit evidence

```bash
git add Architecture_Corpus docs/roadmap \
  docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md
git commit -m "docs: record H2A2 local qualification"
```

Rerun `pnpm verify` after this commit.

#### Task 11 execution record (2026-08-24)

The local behavior candidate is
`de6c00516ae5fd604ee614a743f3cd6f95dd8e6f`. The exact Windows qualification
runtime is PostgreSQL 18.6 from the extracted EDB toolchain at
`C:\Users\Arsvine\AppData\Local\Temp\heptalogos-pg18.6-correction-20260823\extracted\pgsql\bin`.

```text
canonical-schema unit: 3 passed
BootstrapState unit: 113 passed, 3 skipped
bootstrap-runtime unit: 208 passed, 2 skipped
host-ownership unit: 80 passed
persistence unit: 13 passed
C1-C9: 9/9 scenarios PASS (8 Vitest cases; C4/C5 parameterized)
persistence integration: 8/8 PASS
host-ownership integration: 10/10 PASS
bootstrap-runtime integration: 38/38 PASS
pnpm verify: PASS
Linux/macOS PostgreSQL: NOT_RUN
source-less/service/headless qualification: NOT_RUN
independent review: NOT_RUN
final cross-platform CI: NOT_RUN
squash merge: NOT_RUN
```

The evidence record is maintained in `Q-PERSISTENCE-01` and the machine-readable
`qualification-status.json`. H2A-1 historical review/CI/merge fields remain
unchanged.

---

## Task 12 — Candidate freeze, plan completion, and external review handoff

Do not change code after candidate freeze.

**Files:**

- Move:
  - from `docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md`
  - to `docs/plans/completed/foundation/h2a2-canonical-schema-continuity-authority.md`
- Modify: `docs/plans/README.md`
- Modify roadmap only for **local implementation state**, not future review/CI/merge outcomes

### Completion wording before external gates

The completed plan may say:

```text
local implementation closure = PASS
local repository verification = PASS
platform-specific real-PG qualification = <actual truth>
independent review = NOT_RUN
final cross-platform CI = NOT_RUN
squash merge = NOT_RUN
```

Do not pre-record future PASS.

- [x] **Step 12.1 — move plan**

```bash
mkdir -p docs/plans/completed/foundation
git mv \
  docs/plans/active/foundation/h2a2-canonical-schema-continuity-authority.md \
  docs/plans/completed/foundation/h2a2-canonical-schema-continuity-authority.md
```

Update README Active/Completed sections.

- [x] **Step 12.2 — final local verify**

```bash
pnpm verify
```

Expected: PASS.

- [x] **Step 12.3 — commit**

```bash
git add docs/plans docs/roadmap Architecture_Corpus
git commit -m "docs: close H2A2 implementation candidate"
```

- [ ] **Step 12.4 — freeze exact pair**

```bash
git fetch --no-tags origin master
BASE_SHA="$(git rev-parse origin/master)"
HEAD_SHA="$(git rev-parse HEAD)"
printf 'base=%s\nhead=%s\n' "$BASE_SHA" "$HEAD_SHA"
```

Expected base remains:

```text
b306975bba3592a0d8c2e2e6d1649f2523af27bc
```

If master moved, rebase/update, rerun all local gates, and freeze a new pair.

- [ ] **Step 12.5 — mark PR Ready and hand off externally**

The implementing Agent reports the exact pair to the user/operator and stops.

Independent Review is:

```text
external out-of-band user/operator feedback
```

It is **not** discovered from GitHub reviews, approvals, comments, or checks.

Until the user/operator returns PASS for the exact pair:

```text
final CI = forbidden
merge = forbidden
```

---

### Review correction cycle (2026-08-24)

The external review of the first frozen candidate returned
`REQUEST_CHANGES` for the exact pair
`b306975bba3592a0d8c2e2e6d1649f2523af27bc` →
`adc22feaf91a9307838ebbfa5a89840b04bc86f1`. The correction stayed within the
bounded H2A-2 authority scope:

- [x] Extract one package-private canonical Host admission step and use it for
      normal bootstrap handoff, `RESTART_PRIVATE_POSTGRES`, and interrupted
      maintenance recovery.
- [x] Close fresh Host lease/token admission until CURRENT BootstrapState epoch
      loading, canonical initialization, and joint authority revalidation succeed.
- [x] Bind maintenance runtime credential requests to the returned Host's
      current `BootId` and add a real-PG regression assertion.
- [x] Remove the stale current milestone table from Corpus 26 and refresh its
      manifest/SHA records.
- [x] Include `heptalogos_migration` in `HostOwnershipCanonicalSnapshot` and
      project both bootstrap and Host lease signals through the migration authority.
- [x] Run the local repository gates and Windows PostgreSQL 18.6 qualification
      again.

The corrected behavior candidate is
`5a5c221af967a224b4585e644dfa18b2f476ed62`; the later evidence-only commit
updates the current qualification and roadmap records without changing
production behavior. The new exact candidate still requires an external
independent review. Final CI and squash merge remain forbidden until that
review returns `PASS` for the new `(base_sha, head_sha)` pair.

---

### Review correction cycle 2 (2026-08-24)

The next external review covered exact pair
`b306975bba3592a0d8c2e2e6d1649f2523af27bc` →
`20082b28f31408beb7ed7aa573417bffb4bd2912` and returned
`REQUEST_CHANGES` with one P1 post-bootstrap-release Host liveness blocker and
one P2 recovery epoch projection issue:

- [x] Assert the reacquired Host lease after bootstrap ownership release and
      before completion/checkpoint/managed Host exposure in both maintenance
      restart and interrupted recovery.
- [x] Keep the durable recovery position at `BOOTSTRAP_RELEASE_ARMED` when the
      post-release Host proof fails; do not report `RESTARTED` or successful
      completion, and terminalize/close the provisional Host.
- [x] Pass `admission.continuityEpochId` into the recovered managed Host so the
      just-verified CURRENT epoch is the returned Host projection.
- [x] Add release-close fault-injection regressions for both reacquisition
      paths and a reload-epoch projection regression.
- [x] Rerun the full local gates and Windows PostgreSQL 18.6 bootstrap-runtime
      integration.

The corrected behavior candidate is
`00c03f7e635724636dc9fca56c6fc856e6b04603`; the next evidence-only commit
updates current qualification and roadmap records without changing production
behavior. A new independent review for the resulting exact pair is required;
final CI and squash merge remain forbidden until it returns `PASS`.

---

## Task 13 — Final CI and squash merge only after external review PASS

Execute only after the user/operator explicitly reports:

```text
Independent Review = PASS
for exact (base_sha, head_sha)
```

Any commit/base change invalidates the review.

Follow `docs/engineering/playbooks/repository/milestone-pr-closure.md` exactly.

### Final CI

```bash
BASE_SHA="<reviewed base>"
HEAD_SHA="<reviewed head>"
REVIEWED_HEAD_REF="dev/h2a2-canonical-schema-continuity-authority"

gh workflow run verify.yml \
  --ref "$REVIEWED_HEAD_REF" \
  -f base_sha="$BASE_SHA" \
  -f target_sha="$HEAD_SHA" \
  -f reason=final-pre-merge
```

Require Ubuntu/macOS/Windows repository CI all PASS for the exact reviewed head.

This does **not** convert platform-specific real PostgreSQL `NOT_RUN` claims into PASS.

#### Immediately before merge

Re-read:

```text
origin/master
local HEAD
PR baseRefOid
PR headRefOid
CI headSha
```

All must still bind the reviewed pair.

Then squash merge.

After merge, if review/CI/merge truth must be written into the repository, use a separate docs/evidence-only reconciliation PR. Do not modify the merged H2A-2 behavior candidate.

### Post-merge truth reconciliation (2026-08-24)

This separate docs/evidence-only reconciliation records the closure tuple for
the immutable H2A-2 behavior candidate:

```yaml
reviewed_base: b306975bba3592a0d8c2e2e6d1649f2523af27bc
reviewed_head: 2b492ef69131cc9792babb094ec2be33b13a9c69
independent_review: PASS
final_ci_run: 32731811379
final_ci_ubuntu: PASS
final_ci_macos: PASS
final_ci_windows: PASS
squash_merge: PASS
squash_merge_sha: 2c8a68c7e76884d75fb3314ff18b1806a0625b3d
```

No production code, tests, workflow, or behavior contract is changed by this
reconciliation. Linux/macOS real PostgreSQL, source-less, and service/headless
qualification remain `NOT_RUN`.

---

## Acceptance criteria

H2A-2 is locally implementation-complete only when all of the following are true:

1. Current authoritative docs consistently say PRE_PRODUCTION has no project-internal backward compatibility.
2. Current BootstrapState is still exactly canonical V1 and requires `continuityEpochId`.
3. No current V2 BootstrapState type/reader/migration exists.
4. Obsolete development V1 bytes lacking epoch are rejected/reset-required.
5. `ContinuityEpochId` is a typed UUIDv7 Foundation identity.
6. A new logical Instance creates exactly one initial epoch under bootstrap ownership; a later retry/restart reuses the committed value rather than generating another epoch.
7. Dedicated `heptalogos_migration` role exists with exact least-privilege attributes.
8. Migration role can explicitly assume owner; runtime cannot.
9. Bootstrap Runtime retains bootstrap ownership through canonical initialization.
10. Canonical initialization cannot run without active Host token/lease and bootstrap authority.
11. Kysely 0.29.5 is the migration mechanics behind a Heptalogos adapter.
12. Product migration source is static/compiled; no filesystem source discovery is required.
13. Only the current PRE_PRODUCTION baseline migration exists; there is no H2A-1 upgrade migration.
14. `heptalogos.instance_continuity` materializes the same expected epoch.
15. Normal mismatch is fail-closed and never auto-overwritten.
16. Managed Host and HostPersistenceAuthority carry the same epoch.
17. Host maintenance restart changes Boot/token but preserves epoch.
18. Normal runtime can read continuity state but cannot mutate/DDL it.
19. Bootstrap Runtime production code does not import canonical-schema implementation.
20. Existing H2A-1 persistence/Host ownership/bootstrap-runtime regressions remain PASS.
21. `pnpm verify` PASS at the final candidate.
22. Real-PG evidence is reported only for the platform actually run.
23. The external closure tuple occurred for the exact reviewed candidate:
    independent review `PASS`, final CI `PASS` on Ubuntu/macOS/Windows, and
    squash merge `PASS`; deferred Linux/macOS real PostgreSQL, source-less,
    and service/headless qualification remain `NOT_RUN`.

---

## Explicit non-goals / stop conditions

Stop and surface a new architecture decision instead of expanding this plan if implementation appears to require:

- compatibility/upcast support for old developer state;
- a BootstrapState V2;
- a second migration framework;
- normal runtime DDL authority;
- `bootstrap-runtime` production dependency on ProductGeneration schema implementation;
- full ProductGeneration loader redesign;
- DBOS schema/migration integration;
- destructive restore implementation;
- Time/ExecutionContext/Lineage implementation;
- a generic Repository framework;
- source-less/service product qualification merely to claim local H2A-2 semantic closure.

---

## Recommended commit sequence

Keep commits reviewable:

```text
1. docs: activate H2A2 canonical schema plan
2. docs: enforce pre-production canonical-only contracts
3. feat: add continuity epoch identity
4. refactor: make continuity epoch canonical V1 state
5. feat: establish bootstrap continuity genesis
6. feat: add bounded canonical migration principal
7. feat: gate managed host on canonical initialization
8. feat: add canonical schema adapter workspace
9. feat: add canonical schema baseline migration
10. feat: materialize canonical continuity epoch
11. chore: enforce canonical migration boundaries
12. test: qualify canonical continuity initialization
13. docs: record H2A2 local qualification
14. docs: close H2A2 implementation candidate
```

Do not squash locally. The repository workflow performs one squash merge only after exact-pair external review and final CI.

---

## Executor self-review before declaring candidate ready

Run all of these checks explicitly:

### Spec coverage

- [ ] S01 startup order satisfied
- [ ] S03 migration authority / normal transaction separation satisfied
- [ ] S11 future restore discontinuity not contradicted
- [ ] S14 Flow A/B order satisfied
- [ ] S15 PRE_PRODUCTION and identifier contracts consistent
- [ ] S16 epoch available for later lineage origin
- [ ] roadmap H2A scope preserved

#### Compatibility hygiene

- [ ] no V2 current type
- [ ] no development legacy reader
- [ ] no development upcaster
- [ ] no bridge migration from H2A-1
- [ ] no dual schema/digest path
- [ ] clean-state reset semantics documented

#### Authority

- [ ] bootstrap authority remains held during initializer
- [ ] Host lease/token is current during initializer
- [ ] runtime never receives migration password
- [ ] runtime never gets owner membership
- [ ] mismatch cannot self-heal outside Recovery

#### Library boundary

- [ ] Kysely/pg stay internal
- [ ] static MigrationProvider
- [ ] no `kysely-ctl`
- [ ] no bootstrap-runtime production import of canonical-schema
- [ ] no hidden timeout defaults

#### Verification

- [ ] all unit gates PASS
- [ ] C1–C9 real-PG matrix recorded
- [ ] H2A-1 regressions PASS
- [ ] `pnpm verify` PASS
- [ ] platform claims remain truthful
- [ ] candidate exact pair recorded
- [ ] external review not fabricated
