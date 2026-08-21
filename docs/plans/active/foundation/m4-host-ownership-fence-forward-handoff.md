# Foundation M4 Host Ownership Fence & Forward Handoff Implementation Plan

> **For agentic workers:** execute task-by-task with TDD. Do not widen the milestone to M5 Recovery or H2A Persistence. Every behavior-bearing task must add focused tests before implementation, and every completion claim must be tied to actually executed evidence.

**Status:** ACTIVE — M3 PR #5 is squash-merged at `4b12c14693752d9796f8aa287666e6537321006d`; M3 qualification remains PARTIAL.

**Goal:** Starting from a genuine `OwnedBootstrapPrelude + ReadyPrivatePostgres`, establish exactly one normal Host ownership authority using a dedicated PostgreSQL session-level advisory lease plus a database `HostOwnershipFence`, publish a fresh `HostOwnershipToken`, then release bootstrap ownership without a successful-path authority gap.

**Architecture:** Introduce a narrow `@heptalogos/host-ownership` package. It owns PostgreSQL `pg` connection mechanics for bootstrap administration, advisory Host lease, minimal ownership schema, token publication, and local lease lifecycle; it does not own normal Persistence, Kysely repositories/migrations, DBOS, RuntimeReconciler, Subject, or Recovery. `@heptalogos/bootstrap-runtime` remains the Authority/orchestration owner and performs the bootstrap → Host handoff only while authentic M2/M3 capabilities are live.

**Tech Stack / exact M4 materialization:**

- Node.js `24.19.0` repository lane.
- pnpm `11.22.0`, `catalogMode: strict`.
- Nx `23.1.1`.
- TypeScript `7.0.2` canonical compiler; TS6 compatibility lane remains isolated.
- PostgreSQL architecture line `18`; M4 real-DB qualification uses exact PostgreSQL `18.6` until explicitly refreshed.
- `pg` **`8.23.0`** — existing ADOPTED `persistence.pg-driver` route, now first materialized.
- `@types/pg` **`8.23.1`** — compile-time declarations only; must not leak through public contracts.
- XState `5.32.5` pure-transition API — already ADOPTED for local complex FSM mechanics.
- Vitest `4.1.11` and fast-check `4.9.0` for deterministic/property tests.
- No Kysely in M4.
- No DBOS in M4.
- No second PostgreSQL client/ORM.

**Primary authority:**

- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md`
- `Architecture_Corpus/specs/S04-配置-Secret-管理Surface.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/references/dependency-routing.json`
- `Architecture_Corpus/qualification/dependency-status.json`
- `docs/roadmap/development-roadmap.md`
- merged M3 completion record.

---

# 0. Baseline truth and accepted M3 debt

M4 begins only after PR #5 is squash-merged **with the stale `ReadyPrivatePostgres` handle/session-generation P1 fixed**.

The executor must resolve the actual post-merge baseline with:

```bash
git switch master
git pull --ff-only
git rev-parse HEAD
```

Do not substitute the pre-merge PR head for the squash-merge SHA.

Because the project owner explicitly chose to merge the final M3 correction without another independent review/final cross-platform CI, the repository must preserve this truth:

```text
M3 implementation merged                         = true
M3 final stale-handle correction local evidence  = whatever was actually run
M3 post-fix independent re-review                 = NOT_RUN
M3 final exact-SHA Windows/macOS/Linux CI         = NOT_RUN
M3 corrected-final-head Linux real PostgreSQL     = NOT_RUN unless actually rerun
M3 corrected-final-head macOS real PostgreSQL     = NOT_RUN unless actually rerun
M3 source-less shipping closure                   = NOT_RUN
M3 service-account ACL closure                    = NOT_RUN
Q-PRIVATE-POSTGRES-01 qualification               = PARTIAL
H1                                                 = OPEN
```

Moving the M3 plan from `docs/plans/active/` to `docs/plans/completed/` means “implementation milestone merged”, **not** “all product qualification closed”.

Create branch:

```bash
git switch -c dev/m4-host-ownership-fence
```

Canonical active plan path:

```text
docs/plans/active/foundation/m4-host-ownership-fence-forward-handoff.md
```

---

# 1. M4 capability boundary

## 1.1 Input seam

M4 consumes:

```text
PreparedBootstrapPrelude
→ authentic OwnedBootstrapPrelude
→ ReadyPrivatePostgres
```

The M3 seam proves only:

```text
correct private cluster identity
correct PostgreSQL 18.6 toolchain
correct persisted port/profile
PostgreSQL process ready or safely observed ready
bootstrap ownership currently held
```

It does not grant normal Host Authority.

## 1.2 Successful output seam

M4 returns a `HostOwnershipContext` with:

```text
private PostgreSQL                = READY
HostLeaseConnection               = ACTIVE, dedicated pg.Client session
HostOwnershipFence                = initialized and validated in canonical DB
HostOwnershipToken                = fresh and current
bootstrap PostgreSQL handle       = invalidated / handed off
bootstrap filesystem ownership    = RELEASED
normal Host ownership prerequisite= PROVEN
```

But:

```text
PersistenceService                = NOT IMPLEMENTED
normal domain repositories        = NOT IMPLEMENTED
Kysely                            = NOT MATERIALIZED
DBOS                              = NOT IMPLEMENTED
RuntimeReconciler                 = NOT IMPLEMENTED
reverse Host → bootstrap handoff  = NOT IMPLEMENTED
abandoned pre-PG lock recovery    = NOT IMPLEMENTED
H1                                = STILL OPEN
```

M5 remains mandatory before H1 closure.

## 1.3 Fixed successful ownership chain

```text
bootstrap lock HELD
→ private PostgreSQL ready/validated
→ prove no existing Host owns the canonical advisory lease
→ ensure least-privilege Host ownership database artifacts
→ dedicated HostLeaseConnection acquires session advisory lease
→ transaction obtains exclusive HostOwnershipFence row lock
→ publish fresh HostOwnershipToken + BootId
→ invalidate bootstrap-side PostgreSQL lifecycle capability
→ mark bootstrap PG session HANDED_OFF
→ release bootstrap lock
→ assert HostLeaseConnection still ACTIVE
→ return HostOwnershipContext
```

There is deliberately an overlap window:

```text
bootstrap lock HELD
AND
Host lease + current token ACTIVE
```

before bootstrap release. There must never be a successful-path interval where neither Authority is proven.

---

# 2. Design decisions frozen by this plan

## 2.1 Canonical database and ownership object names

These are classified implementation/product constants, not user configuration:

```text
canonical database       = heptalogos
owner role               = heptalogos_owner
Host lease login role    = heptalogos_host_lease
product schema           = heptalogos
fence table              = heptalogos.host_ownership_fence
```

Reason: `HostOwnershipFence` must live in the **same canonical database** that H2A `PersistenceService` will mutate. Putting the fence in the maintenance `postgres` database would not serialize row locks with future canonical transactions.

`heptalogos_owner` is `NOLOGIN`. `heptalogos_host_lease` is a dedicated `LOGIN` role with no superuser/database/role/replication/BYPASSRLS privileges and no product-table privileges.

M4 does **not** create the future runtime/migration/DBOS roles beyond what is required for Host ownership. They enter when their owning milestones need them.

## 2.2 Host lease role is not the M3 bootstrap superuser

The M3 role remains:

```text
heptalogos_bootstrap
```

Normal Host lease connection must never run as it.

Add a distinct bootstrap key purpose for the Host lease credential. Reusing the bootstrap-superuser credential is forbidden.

## 2.3 Session advisory lock

Use PostgreSQL session-level advisory lock through one dedicated `pg.Client`.

Never use:

```text
pg.Pool checkout
pool auto replacement
transaction advisory lock
filesystem bootstrap lock as long-lived Host authority
```

Acquisition is nonblocking:

```sql
SELECT pg_try_advisory_lock($1::integer, $2::integer) AS acquired;
```

If it returns false, another Host is authoritative. The loser must not mutate ownership schema, stop PostgreSQL, or attempt automatic takeover.

## 2.4 Advisory key

Derive the two signed int32 key parts deterministically from:

```text
SHA-256("heptalogos.host-lease/v1\0" + InstanceId)
```

Read bytes `0..3` and `4..7` as signed big-endian int32 values.

This is not a secret. The domain string is a `PRODUCT_INVARIANT`.

## 2.5 Fresh HostOwnershipToken

Add:

```ts
export type HostOwnershipToken = UuidV7Id<"HostOwnershipToken">;
export const createHostOwnershipToken = (): HostOwnershipToken =>
  createUuidV7Id("HostOwnershipToken");
```

A fresh token is generated for every successful ownership acquisition. Never restore/reuse an old token.

## 2.6 Fence row

Minimum table:

```sql
CREATE TABLE heptalogos.host_ownership_fence (
  singleton boolean PRIMARY KEY CHECK (singleton),
  instance_id uuid NOT NULL,
  ownership_revision bigint NOT NULL CHECK (ownership_revision >= 0),
  host_ownership_token uuid NULL,
  boot_id uuid NULL
);
```

Exactly one row:

```text
singleton = true
instance_id = current InstanceId
ownership_revision = monotonic bigint
host_ownership_token = current token or null before first publication
boot_id = current owner BootId or null before first publication
```

M4 publishes using `FOR UPDATE` in one transaction. H2A will later use `FOR SHARE` + token verification for normal mutating transactions.

## 2.7 Local lifecycle FSM

Use XState pure transitions for the Host lease/context lifecycle:

```text
ACQUIRING
→ ACTIVE
→ CLOSING → CLOSED

ACTIVE
→ FENCED

ACQUIRING
→ FENCED / CLOSED
```

Unexpected pg `error`, `end`, query ownership-validation failure, or connection replacement evidence must move to `FENCED` synchronously and abort an `AbortSignal`.

There is no transition:

```text
FENCED → ACTIVE
```

No reconnect/reacquire/resume in the same Host runtime.

## 2.8 Bootstrap PostgreSQL handle provenance after M4

M4 introduces a distinction that M3 did not need before forward handoff existed:

```ts
type PrivatePostgresStartupDisposition =
  | "STARTED_BY_THIS_BOOTSTRAP"
  | "ALREADY_RUNNING";
```

A second bootstrap process may obtain the filesystem bootstrap lock while a normal Host already owns PostgreSQL. Therefore:

> bootstrap filesystem ownership alone no longer authorizes stop/restart of an already-running PostgreSQL process.

If `ALREADY_RUNNING`, lifecycle stop/restart must be denied until the caller also proves the Host-lease side of the authority model. M4 itself never needs to stop an active existing Host.

On a lease-contention result that proves another Host owns the advisory lease, the new bootstrap attempt must be able to invalidate/yield its observation and release the bootstrap lock **without stopping the existing Host's PostgreSQL**.

## 2.9 Secret delivery and Host role password verifier

Extend `BootstrapKeyProvider` with a separate bounded purpose:

```ts
withPrivatePostgresHostLeasePassword<T>(
  context: BootstrapKeyRequestContext,
  use: (passwordUtf8: Uint8Array) => Promise<T>,
): Promise<T>;
```

Use a machine-generated ASCII secret contract for this non-human bootstrap credential. Validate before use:

```text
32..128 bytes
printable ASCII only
no NUL / CR / LF / space
```

Do not place plaintext into `CREATE ROLE` / `ALTER ROLE` SQL, argv, env, BootstrapState, BootstrapJournal, Problem, or logs.

Implement a narrow PostgreSQL SCRAM verifier encoder with Node standard `node:crypto` primitives behind `@heptalogos/host-ownership`:

```text
randomBytes
pbkdf2(SHA-256)
HMAC-SHA-256
SHA-256
base64
```

The adapter implements PostgreSQL's stored `SCRAM-SHA-256$...` verifier format; it does not implement a cryptographic primitive. Freeze `HOST_LEASE_SCRAM_ITERATIONS = 4096` (classified security/implementation constant, matching PostgreSQL 18's default) and a 16-byte random salt for M4. Because the iteration count is embedded in a precomputed SCRAM verifier, M4 does not inherit a potentially hostile runtime `scram_iterations` value. A future policy change is an explicit credential-rotation/version change, not an ambient PostgreSQL-default change. The resulting verifier may be interpolated only after strict format validation; plaintext never enters SQL text.

No additional low-maintenance third-party SCRAM package is added in M4. Real PostgreSQL authentication is the conformance oracle.

---

# 3. Target repository shape

```text
packages/
├─ foundation-contracts/
│  └─ src/
│     ├─ identity.ts                         # HostOwnershipToken
│     └─ identity.test.ts
├─ private-postgres/
│  └─ src/
│     ├─ contracts.ts                       # startup disposition mechanics type if needed
│     ├─ controller.ts                      # safe already-running recognition
│     └─ controller.lifecycle.test.ts
├─ host-ownership/
│  ├─ package.json
│  ├─ project.json
│  ├─ tsconfig.json
│  ├─ tsconfig.build.json
│  └─ src/
│     ├─ contracts.ts
│     ├─ advisory-key.ts
│     ├─ advisory-key.test.ts
│     ├─ scram-verifier.ts
│     ├─ scram-verifier.test.ts
│     ├─ bootstrap-admin.ts
│     ├─ bootstrap-admin.test.ts
│     ├─ ownership-schema.ts
│     ├─ ownership-schema.test.ts
│     ├─ host-lease-machine.ts
│     ├─ host-lease-machine.test.ts
│     ├─ host-lease-connection.ts
│     ├─ host-lease-connection.test.ts
│     ├─ host-ownership.ts
│     ├─ host-ownership.integration.test.ts
│     └─ index.ts
└─ bootstrap-runtime/
   └─ src/
      ├─ bootstrap-key-provider.ts
      ├─ private-postgres-bootstrap.ts
      ├─ private-postgres-bootstrap.test.ts
      ├─ host-ownership-handoff.ts
      ├─ host-ownership-handoff.test.ts
      ├─ host-ownership-handoff.integration.test.ts
      ├─ bootstrap-prelude.ts
      └─ index.ts

docs/
├─ plans/active/foundation/m4-host-ownership-fence-forward-handoff.md
├─ plans/completed/foundation/m3-private-postgresql-bootstrap.md
└─ roadmap/development-roadmap.md
```

Do not create `packages/persistence`, `apps/host`, DBOS packages, runtime kernel packages, Management, CLI, or Subject packages in M4.

---

# 4. Public contracts

## 4.1 `foundation-contracts`

Add only the stable token identity:

```ts
export type HostOwnershipToken = UuidV7Id<"HostOwnershipToken">;

export const createHostOwnershipToken = (): HostOwnershipToken =>
  createUuidV7Id("HostOwnershipToken");
```

No `pg` types.

## 4.2 `@heptalogos/host-ownership`

Public API must remain framework-free:

```ts
export type HostOwnershipState = "ACTIVE" | "FENCED" | "CLOSING" | "CLOSED";

export interface HostOwnershipContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly token: HostOwnershipToken;
  readonly state: HostOwnershipState;
  readonly signal: AbortSignal;
  assertActive(): void;
  close(): Promise<void>;
}

// M4 close semantics: quiesced Host exit while private PostgreSQL remains running.
// It closes the dedicated lease session; it does NOT stop PostgreSQL or perform
// destructive reverse handoff. M5 adds the bootstrap reacquisition/revocation path.

export interface HostOwnershipConnectionTarget {
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: "heptalogos";
}

export interface HostOwnershipTimingOptions {
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly fenceLockTimeoutMs: number;
  readonly keepAliveInitialDelayMs: number;
}
```

Do not export:

```text
pg.Client
pg.Pool
XState Snapshot
raw SQL transaction object
bootstrap superuser password
Host lease role password
```

## 4.3 `OwnedBootstrapPrelude`

Add one Authority-owned handoff operation:

```ts
handoffPrivatePostgresToHost(
  ready: ReadyPrivatePostgres,
  options: HostOwnershipHandoffOptions,
): Promise<HostOwnershipContext>;
```

Do **not** expose a free function that accepts structurally forgeable ownership objects.

---

# 5. Task-by-task implementation

## Task 0 — Reconcile post-M3 repository truth

**Files**

- Move: `docs/plans/active/foundation/m3-private-postgresql-bootstrap.md` → `docs/plans/completed/foundation/m3-private-postgresql-bootstrap.md`
- Modify: `docs/roadmap/development-roadmap.md`
- Modify only if necessary for truthful state: M3 qualification/evidence records.

**Steps**

- [ ] Confirm `master` contains the stale-handle/session-generation fix.
- [ ] Record the actual M3 squash-merge SHA in the M3 completion record.
- [ ] Change M3 status to merged/completed implementation while preserving post-fix review/final-CI/cross-platform gaps as `NOT_RUN`.
- [ ] Update roadmap H1 progress: M2 + M3 merged; M4 now active; H1 still open.
- [ ] Do not claim `Q-PRIVATE-POSTGRES-01 = CLOSED`.
- [ ] Add this M4 plan as the sole active Foundation plan.
- [ ] Run `pnpm check:corpus` and repository documentation gates.

**Commit**

```text
docs: open Foundation M4 host ownership handoff
```

---

## Task 1 — Materialize the adopted `pg` route and package boundary

**Files**

- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Create: `packages/host-ownership/package.json`
- Create: `packages/host-ownership/project.json`
- Create: package tsconfig files.
- Modify repository dependency/import boundary checks.

**Required Catalog pins**

```yaml
pg: 8.23.0
"@types/pg": 8.23.1
```

`packages/host-ownership/package.json`:

```json
{
  "dependencies": {
    "@heptalogos/foundation-contracts": "workspace:*",
    "pg": "catalog:",
    "xstate": "catalog:"
  },
  "devDependencies": {
    "@types/pg": "catalog:",
    "fast-check": "catalog:",
    "vitest": "catalog:"
  }
}
```

**Mechanical boundary**

`pg` may be imported only by the new Host ownership adapter in M4. Do not authorize ordinary package-wide `pg` imports that would let bootstrap/domain code bypass later PersistenceService. Update `Architecture_Corpus/references/dependency-routing.json` for the already-ADOPTED `persistence.pg-driver` role so its boundary truthfully reads `HostLeaseConnection / HostOwnership adapter / later Persistence adapter`; this is a boundary-materialization correction, not a provider reselection. Keep `RoleDecision = ADOPTED` and `implementationQualification = REQUIRED`.

**Tests/gates**

```bash
pnpm install --lockfile-only=false
pnpm check:dependencies
pnpm nx run host-ownership:lint
```

**Commit**

```text
build: materialize pg for host ownership
```

---

## Task 2 — Add HostOwnershipToken and deterministic advisory key

**Files**

- Modify: `packages/foundation-contracts/src/identity.ts`
- Modify: `packages/foundation-contracts/src/identity.test.ts`
- Create: `packages/host-ownership/src/advisory-key.ts`
- Create: `packages/host-ownership/src/advisory-key.test.ts`
- Create: `packages/host-ownership/src/contracts.ts`

**Tests first**

Assert:

```text
HostOwnershipToken is UUIDv7
new acquisition produces distinct token
same InstanceId -> same pair of int32 advisory keys
other InstanceId -> different key pair for fixture set
key derivation stable across repeated calls
```

Implementation:

```ts
export interface HostAdvisoryKey {
  readonly key1: number;
  readonly key2: number;
}

export function deriveHostAdvisoryKey(instanceId: InstanceId): HostAdvisoryKey;
```

Use Node `createHash("sha256")`; do not store the hash as durable product state.

**Commit**

```text
feat: define host ownership identity
```

---

## Task 3 — Extend BootstrapKeyProvider and build SCRAM verifier adapter

**Files**

- Modify: `packages/bootstrap-runtime/src/bootstrap-key-provider.ts`
- Modify affected test providers.
- Create: `packages/host-ownership/src/scram-verifier.ts`
- Create: `packages/host-ownership/src/scram-verifier.test.ts`

**Credential API**

Add a distinct purpose literal:

```text
private-postgres-host-lease-role
```

Do not overload the M3 bootstrap-superuser password callback.

**SCRAM adapter contract**

```ts
export interface PostgresScramVerifierOptions {
  readonly iterations: number;
  readonly salt: Uint8Array;
}

export function encodePostgresScramSha256Verifier(
  passwordAscii: Uint8Array,
  options: PostgresScramVerifierOptions,
): string;
```

Reject invalid password bytes and invalid iteration/salt inputs before deriving any SQL.

Derivation is fixed:

```text
SaltedPassword = PBKDF2-HMAC-SHA256(password, salt, 4096, 32 bytes)
ClientKey      = HMAC-SHA256(SaltedPassword, "Client Key")
StoredKey      = SHA256(ClientKey)
ServerKey      = HMAC-SHA256(SaltedPassword, "Server Key")
verifier       = "SCRAM-SHA-256$4096:" + base64(salt)
                 + "$" + base64(StoredKey) + ":" + base64(ServerKey)
```

Unit tests must prove:

```text
same password + same salt + iterations -> deterministic verifier
changed password -> changed verifier
changed salt -> changed verifier
format strictly matches PostgreSQL SCRAM verifier shape
password plaintext does not occur in verifier
NUL/CR/LF/space/non-ASCII/too-short inputs rejected
```

Do not claim protocol conformance from unit vectors alone; Task 9 real PostgreSQL login is the authority.

**Commit**

```text
feat: add host lease credential boundary
```

---

## Task 4 — Bootstrap-admin connection and least-privilege role/database provisioning

**Files**

- Create: `packages/host-ownership/src/bootstrap-admin.ts`
- Create: `packages/host-ownership/src/bootstrap-admin.test.ts`
- Create/modify internal SQL helpers.

**Responsibilities**

A bootstrap admin client is short-lived and exists only while authentic bootstrap ownership is held. It connects as `heptalogos_bootstrap` to the validated private PostgreSQL loopback port.

Provision idempotently:

```text
heptalogos_owner         NOLOGIN, not superuser/createdb/createrole/replication/bypassrls
heptalogos_host_lease    LOGIN, connection limit 1, same privilege prohibitions
heptalogos database      owner = heptalogos_owner, UTF8
```

Use the verifier from Task 3 when first creating `heptalogos_host_lease`. Never send the plaintext password in SQL text.

If a role/database already exists, inspect and validate it. Do not silently `ALTER` unexpected privilege drift into compliance.

Safe idempotency policy:

```text
missing expected object -> create under bootstrap Authority
existing exact object    -> accept
existing incompatible    -> structured integrity Problem, no silent repair
host-role auth failure   -> credential mismatch Problem, no automatic password reset
```

Database creation is not hidden in a generic migration framework; M4 owns only this minimal H1 bootstrap schema boundary.

**Secret assertions**

Tests inspect mocked query text/Problems and assert the sentinel plaintext never appears.

**Commit**

```text
feat: provision least privilege host ownership roles
```

---

## Task 5 — Create/validate the canonical ownership schema

**Files**

- Create: `packages/host-ownership/src/ownership-schema.ts`
- Create: `packages/host-ownership/src/ownership-schema.test.ts`

After canonical database creation, bootstrap admin connects to `heptalogos` and ensures exactly:

```text
schema heptalogos owner = heptalogos_owner
REVOKE ALL ON DATABASE heptalogos FROM PUBLIC
REVOKE ALL ON SCHEMA heptalogos FROM PUBLIC
REVOKE CREATE ON SCHEMA public FROM PUBLIC
GRANT CONNECT ON DATABASE heptalogos TO heptalogos_host_lease
GRANT USAGE ON SCHEMA heptalogos TO heptalogos_host_lease
GRANT SELECT, UPDATE ON heptalogos.host_ownership_fence TO heptalogos_host_lease
no INSERT / DELETE / TRUNCATE / REFERENCES / TRIGGER / CREATE privilege for host lease role
```

Fence initialization:

```text
no row -> insert singleton row, revision 0, token null, boot null
one exact row for same InstanceId -> accept
wrong InstanceId -> FAIL CLOSED
more than one row/impossible shape -> FAIL CLOSED
wrong owner/columns/constraints/grants -> FAIL CLOSED
```

Do not use `CREATE TABLE IF NOT EXISTS` as a substitute for validation of an existing object.

**Commit**

```text
feat: establish host ownership fence schema
```

---

## Task 6 — Implement HostLeaseConnection with XState local lifecycle

**Files**

- Create: `packages/host-ownership/src/host-lease-machine.ts`
- Create: `packages/host-ownership/src/host-lease-machine.test.ts`
- Create: `packages/host-ownership/src/host-lease-connection.ts`
- Create: `packages/host-ownership/src/host-lease-connection.test.ts`

**Rules**

- Exactly one dedicated `pg.Client`.
- Never a `Pool` client.
- Register `error` and `end` listeners before considering the connection active.
- Acquire `pg_try_advisory_lock(key1,key2)` once.
- A false result is `HOST_OWNERSHIP_BUSY`, not retry/takeover.
- An unexpected `error`/`end` aborts the context signal and transitions to `FENCED`.
- No automatic reconnect.
- No same-runtime reacquire.
- `close()` transitions out of ACTIVE before ending the client.
- Stable/public types contain no `pg` or XState objects.

Property/state tests must generate event sequences and assert:

```text
FENCED never returns ACTIVE
CLOSED never returns ACTIVE
unexpected end from ACTIVE => FENCED
close + concurrent error cannot manufacture ACTIVE
only one successful activation transition exists
```

**Commit**

```text
feat: add dedicated host lease connection
```

---

## Task 7 — Publish and validate HostOwnershipToken under row lock

**Files**

- Create: `packages/host-ownership/src/host-ownership.ts`
- Create/extend unit tests.

Publication transaction:

```sql
BEGIN;
SELECT set_config('lock_timeout', $1, true);
SELECT set_config('statement_timeout', $2, true);
SELECT instance_id, ownership_revision, host_ownership_token, boot_id
FROM heptalogos.host_ownership_fence
WHERE singleton = true
FOR UPDATE;
-- verify InstanceId
UPDATE heptalogos.host_ownership_fence
SET ownership_revision = ownership_revision + 1,
    host_ownership_token = $3,
    boot_id = $4
WHERE singleton = true;
COMMIT;
```

On any error after BEGIN, perform ROLLBACK if the connection is still usable. If connection ownership becomes uncertain, mark lease context FENCED.

After commit, re-read the row on the same lease connection and prove token/BootId match before allowing bootstrap release.

Do not expose a generic mutation transaction API. H2A will own that.

**Commit**

```text
feat: publish host ownership token
```

---

## Task 8 — Evolve M3 private-PG readiness for the post-handoff world

**Files**

- Modify: `packages/private-postgres/src/contracts.ts`
- Modify: `packages/private-postgres/src/controller.ts`
- Modify: lifecycle tests/integration tests.
- Modify: `packages/bootstrap-runtime/src/private-postgres-bootstrap.ts`
- Modify: `packages/bootstrap-runtime/src/private-postgres-bootstrap.test.ts`

**New behavior**

Before issuing `pg_ctl start`, probe the exact validated cluster:

```text
STOPPED
→ issue start
→ readiness
→ STARTED_BY_THIS_BOOTSTRAP

RUNNING
→ do not issue start/restart
→ prove readiness/effective profile/identity
→ ALREADY_RUNNING

ambiguous status
→ UNCERTAIN / fail closed
```

For `ALREADY_RUNNING`:

```text
ReadyPrivatePostgres.stop()    => reject before mechanics
ReadyPrivatePostgres.restart() => reject before mechanics
```

until a stronger Host/reverse-handoff Authority path exists.

Extend the bootstrap session tracker with terminal/yield semantics that build on the stale-handle token fixed at the end of M3:

```text
HANDED_OFF
YIELDED_TO_EXISTING_HOST
```

Both permanently invalidate the `ReadyPrivatePostgres` handle. `OwnedBootstrapPrelude.close()` may release bootstrap ownership from these states without stopping PG.

Only M4 may produce these states, after proving the corresponding Host-lease condition.

Tests:

```text
already-running cluster -> no pg_ctl start
already-running ready handle cannot stop/restart
started-by-this-bootstrap retains existing M3 stop/restart behavior
stale session token cannot mark HANDED_OFF
HANDED_OFF old ready handle rejects
YIELDED old ready handle rejects
release gate accepts only valid handoff/yield terminal states or true QUIESCENT
```

**Commit**

```text
fix: distinguish observed and bootstrap started postgres
```

---

## Task 9 — Implement bootstrap → Host forward handoff

**Files**

- Create: `packages/bootstrap-runtime/src/host-ownership-handoff.ts`
- Create: `packages/bootstrap-runtime/src/host-ownership-handoff.test.ts`
- Modify: `packages/bootstrap-runtime/src/bootstrap-prelude.ts`
- Modify: `packages/bootstrap-runtime/src/index.ts`

**Exact orchestration**

### Case A — canonical DB exists

```text
bootstrap ownership held
→ ReadyPrivatePostgres valid/current
→ connect short-lived bootstrap admin to canonical DB
→ pg_try_advisory_lock same Host key as bootstrap reservation
```

If false:

```text
prove another Host owns lease
→ DO NOT mutate schema
→ DO NOT stop/restart PG
→ ready session -> YIELDED_TO_EXISTING_HOST
→ release bootstrap ownership
→ return structured HOST_ALREADY_ACTIVE outcome/problem
```

If true, current bootstrap temporarily owns the Host lease slot and may continue validation/provisioning.

### Case B — canonical DB absent

Under bootstrap ownership there cannot yet be a valid normal Host using the canonical Host-lease route. Provision the minimal roles/database, then acquire the same bootstrap reservation in the new canonical database before continuing.

### Transfer reservation to dedicated Host lease role

```text
validate/provision schema while reservation held
→ connect dedicated host-role pg.Client
→ release bootstrap-admin reservation
→ immediately pg_try_advisory_lock from dedicated HostLeaseConnection
```

If dedicated acquisition returns false, fail closed. Bootstrap lock is still held, so do not publish token or report success.

### Publish and release

```text
HostLeaseConnection ACTIVE
→ publish fresh HostOwnershipToken under exclusive fence
→ verify current row
→ ReadyPrivatePostgres session -> HANDED_OFF
→ release bootstrap ownership
→ assert HostOwnershipContext still ACTIVE
→ return context
```

**Failure cleanup**

Before token publication:

- if this bootstrap started PostgreSQL and current bootstrap reservation proves there is no Host, bounded stop is allowed/required before releasing bootstrap ownership;
- if PostgreSQL was already running, do not stop unless current bootstrap has successfully acquired the Host reservation proving no other Host owns it;
- if another Host's lease was proven, yield without stop.

After token publication but before bootstrap release:

```text
any failure
→ fence/end new HostLeaseConnection
→ do not report Host ownership success
→ bootstrap ownership remains held unless release can be proven
```

If bootstrap release itself fails:

```text
fence/end new HostLeaseConnection
→ return failure
→ never leave a returned ACTIVE Host context while bootstrap release result is uncertain
```

If bootstrap release succeeds but lease dies before return:

```text
HostOwnershipContext = FENCED
→ return ownership_lost_during_handoff
→ no automatic reacquire
```

**Commit**

```text
feat: hand bootstrap ownership to postgres host fence
```

---

## Task 10 — Real PostgreSQL 18.6 concurrency and fencing qualification

**Files**

- Create: `packages/host-ownership/src/host-ownership.integration.test.ts`
- Create: `packages/bootstrap-runtime/src/host-ownership-handoff.integration.test.ts`
- Update Nx integration targets.

Use explicit `HEPTALOGOS_TEST_PG_BIN` exact toolchain input. Reject/`BLOCKED` if the five M3 tools are not exact 18.6 for this qualification lane.

Required real-DB scenarios:

### Scenario 1 — first handoff

```text
empty M4 DB artifacts
→ M3 private PG ready
→ owner/lease roles created
→ canonical database created
→ fence schema created
→ host lease acquired
→ token published
→ bootstrap lock released
→ HostOwnershipContext ACTIVE
```

Prove login session user is `heptalogos_host_lease`, not `heptalogos_bootstrap`.

### Scenario 2 — privilege confinement

Host lease role must fail to:

```text
CREATE DATABASE
CREATE ROLE
CREATE SCHEMA outside allowed ownership setup
CREATE/ALTER arbitrary product table
INSERT/DELETE fence singleton row
```

It may only perform the lease/fence operations granted by contract.

### Scenario 3 — second bootstrap while Host A active

```text
Host A lease+token ACTIVE
→ Bootstrap B acquires filesystem bootstrap lock
→ observes same PG already running
→ B must not issue pg_ctl start/stop/restart
→ B Host reservation returns false
→ B yields/release bootstrap lock
→ Host A remains ACTIVE
→ token unchanged
```

### Scenario 4 — old transaction serializes before new token

Create a test-only bootstrap-superuser/client transaction that models future H2A mutating fence semantics:

```text
Host A token A active
→ Tx A: SELECT fence FOR SHARE; verify token A; hold transaction
→ lose/end Host A lease connection
→ Host B obtains advisory lease
→ Host B token publication SELECT ... FOR UPDATE blocks
→ commit Tx A
→ Host B publication completes with token B
```

This proves already-entered old transactions linearize before ownership transfer.

### Scenario 5 — stale Host cannot start a new canonical mutation after B

```text
new transaction with stale token A
→ SELECT fence FOR SHARE
→ observed token B
→ test mutation not executed
```

### Scenario 6 — lease loss

Destroy/terminate the dedicated Host lease session from a separate bootstrap-superuser test client or stop PostgreSQL in a controlled fixture:

```text
pg Client error/end
→ HostOwnershipContext FENCED
→ signal aborted
→ no reconnect
→ no same-context reacquire
```

### Scenario 7 — handoff release ordering

Fault inject immediately before bootstrap release and prove both bootstrap lock and Host lease/token are held. Fault inject immediately after release and prove token was already committed.

### Scenario 8 — secret hygiene

Sentinel Host lease password absent from:

```text
argv
env mutation
BootstrapState
BootstrapJournal
Problem detail
captured SQL query text
PostgreSQL ordinary log fixture
```

The stored SCRAM verifier is not plaintext; do not print it as ordinary evidence either.

**Commit**

```text
test: qualify host ownership fencing
```

---

## Task 11 — Crash/retry matrix and deterministic partial-initialization recovery

M4 provisioning must be restartable without destructive repair.

Inject process/test failures at:

```text
after owner role create
before host role create
after host role create
before database create
after database create
before schema create
after schema create
before fence singleton insert
after fence initialized
before bootstrap reservation release
after dedicated lease acquired
before token update
after token commit
before bootstrap lock release
```

Expected policy:

```text
missing object + all prior objects exact      -> continue idempotently
existing incompatible role/database/schema    -> FAIL CLOSED
wrong InstanceId in fence                     -> FAIL CLOSED
host credential mismatch                      -> FAIL CLOSED, no password reset
committed token without live lease             -> not Authority; next lease holder publishes fresh token
published token + bootstrap still held         -> safe overlap, retry/cleanup without false success
```

Do not add destructive auto-repair. M5 owns bounded Recovery.

**Commit**

```text
test: cover host ownership handoff recovery matrix
```

---

## Task 12 — Boundary enforcement, evidence, and plan closure

**Repository boundaries**

Add mechanical checks:

```text
pg imports                    -> host-ownership only in M4
raw pg.Client type leakage    -> forbidden outside adapter
Kysely imports                -> none
DBOS imports                  -> none
HostOwnershipToken creation   -> host-ownership acquisition path/tests only
private PG raw mechanics      -> existing private-postgres/bootstrap-runtime boundaries
```

**BootstrapJournal stage vocabulary**

Add bounded stages without secrets:

```text
bootstrap.host.database_validated
bootstrap.host.reservation_acquired
bootstrap.host.lease_acquired
bootstrap.host.fence_validated
bootstrap.host.token_published
bootstrap.host.forward_handoff_completed
bootstrap.host.existing_owner_detected
bootstrap.host.handoff_failed
```

Do not turn BootstrapJournal into normal canonical lineage storage.

**Roadmap updates after implementation**

M4 completion means:

```text
Host lease + forward handoff = implemented/proven at recorded platforms
M5 reverse handoff/recovery  = still open
H1                           = still open
H2A/H2B                      = not yet authorized by H1 closure
```

Move M4 plan to completed only when the milestone is actually merged.

**Commit**

```text
docs: record Foundation M4 host ownership evidence
```

---

# 6. Verification commands

Focused unit/property suite:

```bash
pnpm nx run foundation-contracts:test
pnpm nx run private-postgres:test
pnpm nx run host-ownership:test
pnpm nx run bootstrap-runtime:test
```

Real PostgreSQL 18.6:

```bash
pnpm nx run private-postgres:test:integration
pnpm nx run host-ownership:test:integration
pnpm nx run bootstrap-runtime:test:integration
```

Permanent repository gates:

```bash
pnpm check:corpus
pnpm check:repository
pnpm check:dependencies
pnpm format:check
pnpm verify
```

The M4 branch/PR should follow the repository's normal review/final-CI process unless the project owner explicitly overrides it again for M4. The one-off M3 merge decision does not rewrite `AGENTS.md` workflow authority.

---

# 7. M4 acceptance matrix

Required before calling M4 implementation complete:

```text
M3 merged baseline reconciled truthfully                    PASS
pg 8.23.0 materialized behind one adapter                  PASS
HostOwnershipToken UUIDv7                                  PASS
least-privilege Host lease role                            PASS
canonical DB = heptalogos                                  PASS
HostOwnershipFence exact schema                            PASS
dedicated pg.Client session advisory lease                 PASS
no pg.Pool for Host lease                                  PASS
fresh token publication under FOR UPDATE                   PASS
bootstrap release only after token commit                  PASS
lease loss => FENCED                                       PASS
no auto reconnect/reacquire                                PASS
already-running PG cannot be stopped by bootstrap alone    PASS
second bootstrap cannot disrupt active Host                PASS
old entered tx serializes before new token                 PASS
stale token cannot authorize new mutation probe            PASS
Host role privilege confinement                            PASS
credential plaintext absent from forbidden surfaces        PASS
partial provisioning resumes idempotently                  PASS
incompatible preexisting ownership objects fail closed     PASS
Kysely/DBOS/PersistenceService absent                      PASS
reverse handoff/Recovery not falsely claimed               PASS
```

Cross-platform/source-less/service claims retain `NOT_RUN` where not actually executed.

---

# 8. STOP conditions

Stop and return to architecture review instead of expanding M4 if any proposed implementation requires:

1. `pg.Pool` to hold the authoritative Host lease.
2. automatic reconnect/reacquire after lease loss.
3. normal Host use of `heptalogos_bootstrap` superuser.
4. plaintext Host-role password in SQL/argv/env/log/Evidence.
5. Kysely/PersistenceService merely to create the M4 ownership fence.
6. DBOS, Cordis, RuntimeReconciler, Management, Subject, Messaging, AI, or MCP.
7. releasing bootstrap ownership before token publication.
8. stopping/restarting an already-running PostgreSQL only because filesystem bootstrap ownership is held.
9. silently changing an incompatible existing role/database/schema/fence row.
10. automatic abandoned-lock takeover or destructive repair.
11. broad generic migration infrastructure.
12. a second PostgreSQL driver/provider.

---

# 9. Explicit non-goals

M4 does not implement:

- H2A `PersistenceService`;
- Kysely;
- general product migrations;
- domain repositories;
- RuntimeSubstrate/Cordis;
- DBOS/WorkQueue/Signal;
- SystemAction/Policy/Approval/Management;
- Subject/Messaging/AI;
- general SecretService;
- source-less product packaging;
- service wrapper/installer;
- reverse Host → bootstrap handoff;
- Host token revocation for destructive maintenance;
- PostgreSQL stop/replace while a normal Host is active;
- abandoned pre-PG bootstrap-lock Recovery;
- `RecoveryPrincipal` ceremony;
- backup/restore/update;
- PostgreSQL major upgrade.

---

# 10. Next milestone after M4

If M4 passes, do **not** jump directly to H2A.

Next:

```text
M5 — Reverse Handoff & Bootstrap Recovery
```

M5 must close:

```text
normal Host holds lease
→ acquire bootstrap ownership first
→ quiesce normal runtime
→ exclusive HostOwnershipFence
→ revoke current token
→ release Host lease only after bootstrap ownership is held
→ stop/replace/recover PostgreSQL when authorized
→ abandoned M2 lock bounded Recovery
→ RecoveryPrincipal/local recovery boundary
→ restart target PG
→ acquire fresh Host lease/token
→ release bootstrap ownership
```

Only after M5 closes the remaining H1 exit scenarios may the roadmap authorize H1 = CLOSED and begin H2A/H2B as parallel-capable horizons.

---

# Execution record

Task 0 baseline reconciliation (2026-08-22):

```text
actual post-M3 baseline SHA: 4b12c14693752d9796f8aa287666e6537321006d
baseline branch: master (squash merge of PR #5)
M3 stale ReadyPrivatePostgres handle/session-generation correction included: PASS
M3 qualification state: PARTIAL
M3 post-fix independent re-review: NOT_RUN
M3 corrected-final-head Windows/macOS/Linux final CI: NOT_RUN
M3 corrected-final-head Linux/macOS real PostgreSQL: NOT_RUN
M3 source-less shipping closure: NOT_RUN
M3 service-account ACL closure: NOT_RUN
H1: OPEN
baseline pnpm verify: PASS
M4 branch: dev/m4-host-ownership-fence
M4 implementation candidate SHA: 6b4d8e9460560c0298d7edf6550562a4750195d4
Task 1–9 implementation: PASS
Task 10 Windows PostgreSQL 18.6 host ownership and forward handoff integration: PASS
Task 11 partial initialization and late handoff recovery matrix: PASS
Task 12 boundary enforcement: PASS
Task 12 focused unit suites: PASS
Task 12 Windows PostgreSQL integration suites: PASS (12/12 bootstrap-runtime handoff suite)
Task 12 permanent repository gates including pnpm verify: PASS
M4 independent review: NOT_RUN
M4 final cross-platform CI: NOT_RUN
M4 merge: NOT_RUN
M5 reverse handoff / bounded Recovery: OPEN
```
