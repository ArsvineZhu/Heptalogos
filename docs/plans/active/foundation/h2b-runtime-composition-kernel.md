# Heptalogos H2B Runtime Composition & Kernel Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the repository Heptalogos architecture/runtime-durability/dependencies/verification skills first, then execute this plan task-by-task with TDD. If the execution harness provides `superpowers:subagent-driven-development` or `superpowers:executing-plans`, use one of those modes. This plan intentionally retains architectural decisions here. The implementing Agent may make local code-organization choices, but **must not reinterpret dependency roles, runtime ownership, package boundaries, identity shapes, graph semantics, generation fencing, lifecycle authority, lineage persistence, or H2 stage closure policy**.

**Plan state:** `ACTIVE / CORRECTIVE_REVIEW_CYCLE`
**Current candidate branch:** `dev/h2b-runtime-composition-kernel-corrected`
**Integration unit:** one branch → one Draft PR → local qualification → external independent review on exact `(base_sha, head_sha)` → manual exact-pair Ubuntu/macOS/Windows final CI → squash merge → separate docs/evidence-only reconciliation.
**Compatibility epoch:** `PRE_PRODUCTION`

**Execution record (2026-08-25):** The operator directed H2B execution after
PR #19 was squash-merged at `7b51468c2c41895bde7091868d688d98dfc6c957` and
directed that the H2A-3 final cross-platform CI remain deferred until the H2
wide run. This is an explicit execution exception to the normal activation
gate's final-CI prerequisite; it does not change the architecture decision or
permit a false `PASS`. The H2B branch baseline is
`master@19ebef1c62a737ad077414a6817ffdf8ac3ad2a4`.

Task status at this checkpoint:

```yaml
task_1_runtime_substrate: PASS (C1-C14 focused unit evidence)
task_2_runtime_identity_graph_registries: PASS (runtime-kernel focused unit evidence)
task_3_supervisor_reconciler: PASS (R1-R16 focused unit evidence)
task_4_runtime_origin_lineage: PASS (9/9 focused unit tests; real PostgreSQL NOT_RUN)
task_5_windows_postgresql_18_6_integration: NOT_RUN (qualification toolchain unavailable on current host)
task_5_current_head_rerun: NOT_RUN (real PostgreSQL integration skipped)
runtime_kernel_unit: PASS (75/75 package tests)
behavior_candidate: NOT_FROZEN (PR #22 Draft; awaiting external independent review)
removed_binding_reconcile_regression: PASS (focused supervisor regression)
transient_call_activity: PASS (S11/K9/R15)
task_6_boundaries_local_qualification: PASS (current full repository verify)
local_pnpm_verify: PASS (current full repository verify)
pull_request: 22 (DRAFT)
candidate_pair:
 base: 19ebef1c62a737ad077414a6817ffdf8ac3ad2a4
 head: NOT_FROZEN (corrective cycle)
pr_20: CLOSED_OBSOLETE_PAIR
previous_independent_review: REQUEST_CHANGES (old pair 7b51468c... → 06cc895b...) current_independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```

First corrective-cycle local evidence (2026-08-25): Runtime Kernel focused tests
`64/64` PASS; RuntimeSubstrate focused tests `16/16` PASS; changed-scope
ESLint, TS7 build, TS6 lane, and the repository dependency/boundary/corpus/
toolchain checks PASS. The managed-Host PostgreSQL integration file had `5`
tests skipped because the current host has no configured qualification
toolchain; this remains `NOT_RUN`, not `PASS`.

## Governance repair and second corrective cycle (2026-08-25)

The operator directed correction of an invalid H2B topology in which the
eleven-commit H2B snapshot had reached `origin/master` without a new H2B PR.
Before repair, `origin/master` was `3ce96cf7fdbe56e5fd5b3f9adfd9274bf945f0d6`.
That snapshot was preserved at the local and remote backup ref
`backup/h2b-master-3ce96cf`, and `origin/master` was restored to the exact
post-H2A-3 baseline
`19ebef1c62a737ad077414a6817ffdf8ac3ad2a4` using an explicit
`--force-with-lease`. No H2B development continues on `master`.

The corrected branch remains based on that baseline. The old PR #20 pair
(`7b51468c...` → `06cc895b...`) is not reused; PR #20 is closed as obsolete,
and the new Draft PR #22 carries the corrected branch.

The new review blockers and important findings are covered by focused tests:

```yaml
B1_exact_service_binding_graph: PASS
B2_timeout_keeps_retiring_and_blocks_replacement_dependents: PASS
B3_real_class_native_receiver_and_mutation_fence: PASS
B4_capability_unbind_before_same_reconcile_start: PASS
I1_failed_blocked_and_SAFE_dependency_recovery: PASS
I2_required_capability_missing_is_dynamic_unavailable: PASS
runtime_kernel_package_unit: PASS (75/75)
runtime_substrate_package_unit: PASS (16/16)
managed_host_postgres_h2b_integration: NOT_RUN (5 skipped; qualification toolchain unavailable)
pnpm_verify_after_second_corrective_cycle: PASS
independent_review: NOT_RUN
final_cross_platform_ci: NOT_RUN
squash_merge: NOT_RUN
```


**Goal:** complete H2 functional runtime composition by establishing a thin qualified Cordis runtime substrate, Heptalogos-owned MicroSystem supervision/reconciliation, hard Service and dynamic Capability registries, generation-fenced invocation, graphlib-backed dependency planning, OperatingMode/readiness semantics, and runtime lifecycle lineage—without pulling H3 durable work/effects or H4 system management into H2B.

**Architecture:** H2A supplies Host ownership, canonical transactions, time, SchemaRuntime, ExecutionContext, retained Activity/Evidence, and causal mutation admission. H2B builds the normal in-process runtime **above** that substrate. `cordis` owns only trusted in-process context/lifecycle/resource mechanics behind `RuntimeSubstrate`; `@dagrejs/graphlib` owns graph algorithms behind a runtime graph adapter. Heptalogos owns MicroSystem identity, Desired/Actual state, Service/Capability semantics, provider selection, Readiness, OperatingMode interpretation, GenerationFence, supervision and ReconcilePlan. No Cordis object or Graphlib object becomes a stable product/Extension contract.

**Exact dependency freeze for this plan (observed 2026-08-25):**

```text
cordis                 4.0.0-rc.8
@dagrejs/graphlib      4.0.5
```

These are exact Catalog pins for this plan. The implementing Agent must not silently upgrade, downgrade, vendor, fork, or substitute them. A reproducible hard blocker triggers the Stop Rule and architecture review.

**Normative sources before editing:**

- `AGENTS.md`
- `Architecture_Corpus/00-项目宪法与工程宪法.md`
- `Architecture_Corpus/02-架构原则与反NIH约束.md`
- `Architecture_Corpus/04-总体系统架构.md`
- `Architecture_Corpus/05-整机执行模型.md`
- `Architecture_Corpus/06-MicroSystem与Extension架构.md`
- `Architecture_Corpus/07-Foundation系统服务目录.md`
- `Architecture_Corpus/16-验证与资格认定体系.md`
- `Architecture_Corpus/19-术语表.md`
- `Architecture_Corpus/20-架构审查清单.md`
- `Architecture_Corpus/24-依赖使用与实现路由.md`
- `Architecture_Corpus/26-开发阶段闭包-稳定化与兼容性治理.md`
- `Architecture_Corpus/specs/S01-启动-恢复-运行时监督.md`
- `Architecture_Corpus/specs/S03-持久化-事务-EffectFence.md`
- `Architecture_Corpus/specs/S13-Foundation-Service-Capability-Readiness-Catalog.md`
- `Architecture_Corpus/specs/S15-Foundation横切合同.md`
- `Architecture_Corpus/specs/S16-Execution-Lineage-Observability.md`
- `Architecture_Corpus/qualification/results/Q-RUNTIME-01.md`
- `docs/roadmap/development-roadmap.md`
- `docs/engineering/playbooks/repository/milestone-pr-closure.md`
- completed H2A-1/H2A-2/H2A-3 implementation plans after H2A-3 reconciliation
- `.agents/skills/heptalogos-architecture/SKILL.md`
- `.agents/skills/heptalogos-runtime-durability/SKILL.md`
- `.agents/skills/heptalogos-dependencies/SKILL.md`
- `.agents/skills/heptalogos-verification/SKILL.md`

---

# 0. Activation Gate — do not create the H2B branch before this is true

H2A has **no separate H2A-S**. The stage model is:

```text
H2A-1 + H2A-2 + H2A-3
        ↓
H2A FUNCTIONALLY_COMPLETE
        ↓
H2B Runtime Composition
        ↓
H2 FUNCTIONALLY_COMPLETE
        ↓
H2-S bounded stabilization across A + B
        ↓
H2 CLOSED
```

The Agent may activate this plan only after all of the following are visible in current repository truth:

```text
1. H2A-3 exact-pair Independent Review = PASS
2. H2A-3 manual final CI = PASS on Ubuntu + macOS + Windows for that exact pair
3. H2A-3 squash merge = PASS
4. H2A-3 separate docs/evidence-only reconciliation PR = merged
5. live roadmap says:
   H2A_1: CLOSED
   H2A_2: CLOSED
   H2A_3: CLOSED
   H2A: FUNCTIONALLY_COMPLETE
   H2B: ELIGIBLE
   H2: OPEN
6. live qualification evidence does not falsely claim deferred Linux/macOS real PostgreSQL,
   source-less, or service/headless qualification
7. no active H2A implementation plan remains
```

At activation:

```bash
git fetch --no-tags origin master
BASELINE_SHA="$(git rev-parse origin/master)"
git status --short
```

Required result:

```text
working tree clean
BASELINE_SHA = the post-H2A-3 reconciliation master
```

Record that exact SHA in the registered copy of this plan before the first behavior commit. This is a deterministic activation binding, not an architecture choice. If `master` has moved for unrelated changes, inspect the delta first; if it touches H2/H2B semantics, STOP for architecture review instead of rebasing blindly.

Create the branch from that exact master and open one Draft PR early. Do not dispatch ordinary CI.

---

# 1. Milestone outcome and hard non-goals

H2B must answer:

> Can the current Host deterministically decide what trusted in-process MicroSystems should run, activate only dependency-eligible generations, expose stable Service/Capability bindings without leaking provider/runtime framework objects, react safely to provider loss/replacement, and compute useful Readiness while all resource lifetime remains owned and fenced?

The functional chain after H2B is:

```text
current Host + H2A execution spine
        ↓
DesiredRuntimeSnapshot + current OperatingMode
        ↓
Heptalogos RuntimeGraph
  graphlib mechanics only
        ↓
deterministic ReconcilePlan
        ↓
MicroSystemSupervisor
        ↓
RuntimeSubstrate
  Cordis plugin/fiber/effect mechanics only
        ↓
active MicroSystem scopes
        ├─ Service providers → generation-fenced Service bindings
        ├─ Capability providers → deterministic dynamic selection
        ├─ owned resources/background tasks
        └─ runtime lifecycle Activity lineage
        ↓
ReadinessEvaluator
        ↓
READY / DEGRADED / BLOCKED projections
```

## Hard non-goals

Do **not** implement in H2B:

- H2A-S or any other sub-horizon stabilization stage;
- H3 DBOS / WorkItem / WorkQueue / Signal / DurableExecution;
- EffectOperation or external-effect retry/uncertainty mechanics;
- H4 ConfigurationService, SecretService, Policy, Approval, SystemAction, Management HTTP/CLI;
- Extension package acquisition/install/staging, `pacote`, package marketplace or dynamic npm installation;
- untrusted Extension execution, WASM, isolated process sandbox;
- StorageWorkspace/DataLifecycle/Backup;
- Subject, Messaging, AI runtime, MCP;
- ResourceGovernor implementation beyond accepting a future pressure/readiness input seam;
- complete ContractVersion range algebra or npm-semver compatibility semantics;
- automatic retry/backoff loops for failed MicroSystem activation;
- hot in-place ProductGeneration swap; ProductGeneration changes still require the existing maintenance/bootstrap restart model;
- Cordis plugin-loader/include/HMR/CLI or any Cordis package except `cordis`;
- `@deepseek-ai/cordis`, a vendored fork, or a project-written parallel DI/lifecycle framework;
- Graphlib objects in public contracts;
- generic arbitrary Activity update APIs;
- new V2/V3/legacy/upcaster/bridge migration paths for development state.

---

# 2. Decision Locks — implementing Agent has no authority to change these

## DL-01 — H2B is one capability milestone

Use one implementation plan, one branch and one PR. Do not pre-split H2B into H2B-1/H2B-2/H2B-3 merely because several modules exist.

Internal implementation is divided into reviewable tasks below, but they remain one H2B candidate.

After H2B merge/reconciliation:

```text
H2A = FUNCTIONALLY_COMPLETE
H2B = CLOSED / FUNCTIONALLY_COMPLETE
H2_FUNCTIONAL = COMPLETE
H2_STABILIZATION = ELIGIBLE
H2 = OPEN
```

Only then create one bounded **H2-S** plan covering A+B jointly.

## DL-02 — exactly two new runtime workspaces

Create exactly:

```text
@heptalogos/runtime-substrate
@heptalogos/runtime-kernel
```

Responsibilities:

```text
runtime-substrate
  Cordis adapter only
  activation scope mechanics
  resource/fiber lifetime
  Cordis-specific conformance tests
  no product Service/Capability/Desired/Actual semantics

runtime-kernel
  MicroSystem contracts
  RuntimeGraph adapter over graphlib
  ServiceRegistry
  CapabilityRegistry
  ContractCompatibilityRegistry current exact mode
  GenerationFence
  MicroSystemSupervisor
  RuntimeReconciler
  ReadinessEvaluator
  OperatingMode interpretation
  H2A ExecutionLineage/Persistence integration
```

Do not create separate workspaces for graph, registry, readiness, supervisor, generation fence or reconciler in this milestone.

Cross-package stable identity primitives belong in `foundation-contracts`, not a new `runtime-contracts` package.

## DL-03 — exact dependency pins

Add to root Catalog:

```yaml
cordis: 4.0.0-rc.8
"@dagrejs/graphlib": 4.0.5
```

Consume through `catalog:` only.

The current Cordis line has recent upstream lifecycle/disposal bug reports. That is why Task 1 is a mandatory conformance gate. It is **not** permission to reject the adopted role from model intuition, and it is not permission to switch to another implementation after a failure.

## DL-04 — Cordis allowed surface

`cordis` may be imported only inside `packages/runtime-substrate/`.

The production adapter may rely on the package-root public surface necessary for:

```text
Context
Context.plugin(...)
returned Fiber lifecycle/await/dispose behavior
Context.effect(...) within the activation Fiber
```

For H2B, do **not** use as product semantics:

```text
Context.isolate()
Context.waterfall()
Cordis Service / ReflectService as Heptalogos ServiceRegistry
Cordis event bus as Runtime Authority
Cordis inject/dependency reaction as the hard Service graph Authority
Registry internals / underscored fields
cordis/src/* imports
plugin-loader/include/HMR
```

Reason: Heptalogos must own deterministic ReconcilePlan, Service/Capability distinction and dependency graph. Cordis owns resource/lifecycle mechanics, not product graph semantics.

Known upstream issues concerning `isolate()` cleanup and waterfall continuation are therefore outside the production path. The conformance suite must still prove that the **actual plugin/fiber/effect pattern used by Heptalogos** is safe.

## DL-05 — graphlib allowed surface

`@dagrejs/graphlib` may be imported only by the private RuntimeGraph adapter in `runtime-kernel`.

Use it for:

```text
directed graph representation
cycle detection
topological ordering
reverse topological dependent shutdown ordering
```

Do not write a parallel DFS/toposort/cycle engine. Do not expose Graph/alg objects through package roots.

Insert nodes and edges in stable lexical `MicroSystemId` order and qualification-test the exact 4.0.5 ordering used by the planner. Registration/load order is never a product tie-break.

## DL-06 — canonical runtime identity primitives

Move the canonical `ProductGenerationId` type into `foundation-contracts` so normal runtime code never imports `bootstrap-state` merely to name current product generation.

`bootstrap-state` then imports/re-exports that canonical type; do not keep a second definition.

Add:

```ts
export type ProductGenerationId = ContentDigest<"ProductGenerationId">;
export type PackageGenerationId = ContentDigest<"PackageGenerationId">;
export type MicroSystemInstanceId = UuidV7Id<"MicroSystemInstanceId">;

export type MicroSystemId = NamespacedId<"MicroSystemId">;
export type ServiceId = NamespacedId<"ServiceId">;
export type CapabilityId = NamespacedId<"CapabilityId">;
export type ProviderId = NamespacedId<"ProviderId">;
```

`NamespacedId` current syntax is fixed:

```text
ASCII lowercase
1..128 bytes
pattern: ^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$
```

Examples valid under this contract:

```text
foundation.persistence
foundation.runtime-kernel
heptalogos.execution-lineage
ai.text-generation
provider.synthetic-a
```

Add `createMicroSystemInstanceId()` and parse functions for every new stable ID/generation/instance primitive.

Do not add `ContributionId`, Subject IDs, package manifest objects or external IDs merely because later horizons will need them.

## DL-07 — RuntimeGenerationRef

A running MicroSystem is owned by:

```ts
export interface RuntimeGenerationRef {
  readonly productGenerationId: ProductGenerationId;
  readonly packageGenerationId?: PackageGenerationId;
}
```

For H2B synthetic/core built-ins:

```text
productGenerationId = required
packageGenerationId = absent
```

Later installed Extension generations may add `packageGenerationId` without changing H2B ownership semantics.

Do not invent a separate `MicroSystemGenerationId`.

## DL-08 — current ContractVersion semantics are exact-only

Do not import npm `semver` and do not make npm/package version a Service contract Authority.

Define:

```ts
export type ContractVersion = Branded<string, "ContractVersion">;

export interface ContractVersionRange {
  readonly kind: "exact";
  readonly version: ContractVersion;
}
```

Current parser:

```text
1..64 ASCII bytes
^[a-z0-9][a-z0-9._-]{0,63}$
```

Current `ContractCompatibilityRegistry` behavior:

```text
range.kind == exact
and
range.version == providerVersion
→ compatible
else incompatible
```

This is intentionally conservative in PRE_PRODUCTION. Rich semantic range algebra is added only when a concrete cross-generation compatibility owner requires it.

## DL-09 — MicroSystem static definition and activation contract

Use:

```ts
export type MicroSystemRole =
  | "kernel"
  | "system-service"
  | "domain-engine"
  | "feature"
  | "driver"
  | "provider";

export type OperatingMode =
  | "NORMAL"
  | "SAFE"
  | "MAINTENANCE"
  | "EMERGENCY_READ_ONLY";

export interface ServiceRequirement {
  readonly serviceId: ServiceId;
  readonly contract: ContractVersionRange;
}

export interface CapabilityRequirement {
  readonly capabilityId: CapabilityId;
  readonly contract: ContractVersionRange;
  readonly required: boolean;
}

export interface ServiceProvisionDescriptor {
  readonly serviceId: ServiceId;
  readonly contractVersion: ContractVersion;
  readonly providerId: ProviderId;
}

export interface CapabilityProvisionDescriptor {
  readonly capabilityId: CapabilityId;
  readonly contractVersion: ContractVersion;
  readonly providerId: ProviderId;
  readonly priority: number;
}

export interface MicroSystemDefinition {
  readonly id: MicroSystemId;
  readonly role: MicroSystemRole;
  readonly generation: RuntimeGenerationRef;
  readonly eligibleModes: readonly OperatingMode[];
  readonly requiredServices: readonly ServiceRequirement[];
  readonly capabilityRequirements: readonly CapabilityRequirement[];
  readonly providesServices: readonly ServiceProvisionDescriptor[];
  readonly providesCapabilities: readonly CapabilityProvisionDescriptor[];
  activate(context: MicroSystemActivationContext): Promise<void>;
}
```

All Service requirements are hard dependencies. If a dependency is truly optional/dynamic, model it as a Capability requirement rather than an optional Service.

Activation-time provided Service/Capability registrations must exactly match declared descriptors. Undeclared publication or missing declared publication fails activation.

## DL-10 — Desired State and OperatingMode are inputs, not H2B persistence

H2B does not create a new canonical Desired-State table.

Use:

```ts
export type MicroSystemDesiredState = "RUNNING" | "STOPPED";

export interface DesiredRuntimeSnapshot {
  readonly revision: number;
  readonly operatingMode: OperatingMode;
  readonly desired: ReadonlyMap<MicroSystemId, MicroSystemDesiredState>;
  readonly serviceBindings: ReadonlyMap<ServiceId, ProviderId>;
  readonly capabilityBindings: ReadonlyMap<CapabilityId, ProviderId>;
}
```

Requirements:

```text
revision = non-negative safe integer
Desired State is not mutated by reconciliation
OperatingMode is orthogonal to Desired State
mode change changes eligibility, not desired values
```

H2B has **no** `OperatingModeController.setMode()` that pretends to be canonical System Authority. H4 will own durable authorized mode transitions.

`RECOVERY` is not a normal H2B OperatingMode; Recovery remains in Bootstrap/Recovery Plane.

## DL-11 — Actual State belongs to MicroSystemSupervisor

Current actual lifecycle states:

```ts
export type MicroSystemActualState =
  | "STOPPED"
  | "BLOCKED"
  | "STARTING"
  | "RUNNING"
  | "QUIESCING"
  | "FAILED";
```

A new `MicroSystemInstanceId` is created for every activation attempt that reaches `STARTING`, including restart of the same code generation.

The supervisor is the sole mutator of Actual State.

Examples:

```text
Desired RUNNING + missing hard Service → BLOCKED
Desired RUNNING + mode-ineligible      → BLOCKED
activation exception                   → FAILED
Desired STOPPED                        → STOPPED
```

Capability absence does not automatically stop a RUNNING MicroSystem; it affects capability selection/readiness.

## DL-12 — Service semantics

Service = hard, stable dependency.

Multiple desired providers for the same Service are **not** silently resolved by load order or priority.

Selection:

```text
explicit desired service binding present and eligible
→ use that provider

no explicit binding + exactly one eligible declared provider
→ use it

no provider
→ consumer BLOCKED

more than one eligible provider without explicit binding
→ runtime.service.ambiguous_provider
```

Changing the selected hard Service provider requires dependent quiesce/restart in reverse-topological/topological order.

## DL-13 — Capability semantics

Capability = dynamic, discoverable, multi-provider and may rebind without hard Service restart.

Current H2B selection order:

```text
explicit binding
→ exact contract eligibility
→ active provider ownership
→ provider priority (higher first)
→ stable ProviderId lexical tie-break
```

If an explicit binding exists but that provider is unavailable/incompatible, return capability unavailable; do **not** silently fall back to another provider.

H2B does not pretend to implement future Policy/trust/Secret/network eligibility. Those are added by CapabilityBroker in later horizons.

Capability provider withdrawal/rebind recomputes readiness and binding but does not restart a consumer solely because the Capability changed.

## DL-14 — Host-owned invocation lease, never raw provider exposure

Provider implementations remain private registry values.

Consumers receive Heptalogos-owned wrappers:

```ts
export interface ServiceLease<TContract extends object> {
  readonly serviceId: ServiceId;
  readonly providerId: ProviderId;
  readonly contractVersion: ContractVersion;

  invoke<TResult>(
    operationId: string,
    call: (service: TContract) => TResult | Promise<TResult>,
  ): Promise<TResult>;
}

export interface CapabilityLease<TContract extends object> {
  readonly capabilityId: CapabilityId;
  readonly providerId: ProviderId;
  readonly contractVersion: ContractVersion;

  invoke<TResult>(
    operationId: string,
    call: (capability: TContract) => TResult | Promise<TResult>,
  ): Promise<TResult>;
}
```

The object passed into `call` must be a Host-owned fenced Proxy, never the original implementation object. Retaining that Proxy is safe: every method access/invocation remains generation-gated.

`operationId` must be non-empty, <=256 UTF-8 bytes.

## DL-15 — GenerationFence is runtime call ownership, not H3 durable commit authority

Every binding has a gate:

```text
ACTIVE
→ RETIRING
→ RETIRED
```

`invoke`:

```text
assert ACTIVE
→ increment in-flight
→ run provider call under provider runtime origin
→ verify gate did not become invalid
→ decrement in-flight
```

Retirement:

```text
mark RETIRING
→ reject new invocation
→ wait existing invocations to settle
→ mark RETIRED
```

Use required runtime option:

```ts
export interface RuntimeKernelOptions {
  readonly settleTimeoutMs: number;
}
```

No default is allowed in product composition. Tests supply explicit values.

A settlement timeout is:

```text
runtime.generation.settlement_timeout
```

H2B GenerationFence prevents stale runtime calls/results. It does **not** yet claim to fence H3 WorkItem/domain canonical commits; H3 must bind generation identity to durable obligations and commit paths.

## DL-16 — RuntimeGraph contains only hard Service lifecycle edges

Graph nodes = desired/eligible MicroSystems.

Hard edge:

```text
Service provider → Service consumer
```

Capabilities are **not** hard RuntimeGraph edges.

Before activation:

```text
resolve service bindings
→ build graph with graphlib
→ detect hard cycles
→ produce deterministic topological order
```

Cycle:

```text
runtime.graph.hard_service_cycle
```

No system in the affected candidate graph activates after cycle detection.

## DL-17 — Readiness is separate from Actual State

Current readiness values:

```ts
export type ReadinessState = "READY" | "DEGRADED" | "BLOCKED";
```

A `ReadinessProfileDefinition` declares required Services, required Capabilities and optional Capabilities.

Evaluation:

```text
missing/incompatible required Service     → BLOCKED
missing/incompatible required Capability  → BLOCKED
all required satisfied + optional missing → DEGRADED
all required + optional satisfied         → READY
```

A MicroSystem may be `RUNNING` while a profile is `BLOCKED` because dynamic capabilities are absent. Do not force a Service-style restart to make readiness look simple.

## DL-18 — RuntimeSubstrate resource ownership

`runtime-substrate` exports only Heptalogos adapter contracts:

```ts
export type RuntimeDisposer = () => void | Promise<void>;

export interface ActivationResourceScope {
  readonly signal: AbortSignal;
  defer(label: string, disposer: RuntimeDisposer): void;
  track(label: string, task: Promise<unknown>): void;
}

export interface RuntimeSubstrateFailure {
  readonly phase: "BACKGROUND" | "DISPOSAL" | "SETTLEMENT_TIMEOUT";
  readonly label: string;
  readonly cause: unknown;
}

export interface SubstrateActivationRequest {
  readonly label: string;
  activate(scope: ActivationResourceScope): Promise<void>;
  onFailure(failure: RuntimeSubstrateFailure): void;
}

export interface SubstrateActivationHandle {
  readonly state: "ACTIVE" | "FAILED" | "DISPOSING" | "DISPOSED";
  dispose(): Promise<void>;
}

export interface RuntimeSubstrate {
  activate(request: SubstrateActivationRequest): Promise<SubstrateActivationHandle>;
  close(): Promise<void>;
}

export function createRuntimeSubstrate(options: {
  readonly settleTimeoutMs: number;
}): RuntimeSubstrate;
```

Mechanics:

```text
one private Cordis root Context
one unique Cordis plugin Fiber per H2B activation
scope.defer → child Fiber ctx.effect-managed disposer
scope.track → adapter-owned observation + effect-owned settlement finalizer
dispose → AbortController.abort() first, then Fiber dispose
adapter records disposer/background failures before Cordis can log/swallow them
dispose is idempotent
close disposes remaining handles in reverse activation order as final fallback
```

Do not expose Cordis Context/Fiber/effect/disposable types.

Detached background Promise without `scope.track()` is forbidden by the activation contract.

## DL-19 — no hidden retry loop

A failed activation is `FAILED`.

A single reconcile execution attempts any one MicroSystem activation at most once.

There is no automatic timer/backoff retry in H2B. A later explicit reconcile trigger caused by desired/dependency/capability/mode/runtime change may attempt again. Do not invent retry counts or backoff constants.

## DL-20 — H2B extends the existing ExecutionContext origin through a restricted bridge

H2A intentionally stopped at Host origin. H2B is the owner point for runtime origin.

Extend `ExecutionContext.origin` with optional Host-assigned runtime provenance:

```ts
export interface RuntimeExecutionOrigin {
  readonly productGenerationId: ProductGenerationId;
  readonly packageGenerationId?: PackageGenerationId;
  readonly microSystemId?: MicroSystemId;
  readonly microSystemInstanceId?: MicroSystemInstanceId;
}
```

Constraint:

```text
microSystemId present ⇔ microSystemInstanceId present
microSystem present → productGenerationId required
packageGenerationId present → productGenerationId required
```

Add restricted subpath:

```text
@heptalogos/execution-lineage/runtime-kernel
```

Only `packages/runtime-kernel/` and execution-lineage tests may import it.

It provides a trusted origin binder over an existing authentic `ExecutionContextRuntime`; it **must share the same H2A ALS store**, not create a second async context stack.

Example contract:

```ts
export interface RuntimeActivityRunner {
  current(): ExecutionContext | undefined;
  runActivity<T>(
    request: ActivityRequest,
    operation: (context: ExecutionContext) => Promise<T>,
  ): Promise<T>;
}

export function bindRuntimeExecutionOrigin(
  runtime: ExecutionContextRuntime,
  origin: RuntimeExecutionOrigin,
): RuntimeActivityRunner;
```

Ordinary package-root callers cannot forge ProductGeneration/MicroSystem origin.

Do not add ProductGeneration/MicroSystem fields to `LineageContextRef V1`; durable H3 work will carry its own explicit generation pin. A causal ref is still not Authority.

## DL-21 — H2B is the first owner allowed to add narrow durable Activity completion

H2A-3 deliberately reserved `ended_at/outcome` and did not grant a generic updater. H2B is the first real lifecycle owner.

Extend `ExecutionLineageService` only with:

```ts
export interface ActivityCompletion {
  readonly endedAt: Instant;
  readonly outcome: "SUCCEEDED" | "FAILED" | "CANCELLED";
  readonly outcomeRef?: string;
}

completeCurrent(
  transaction: PersistenceMutationTransactionContext,
  context: ExecutionContext,
  completion: ActivityCompletion,
): Promise<void>;
```

It may complete **only the current transaction Activity** and must repeat H2A origin/activity matching checks.

No:

```text
complete(activityId, ...)
updateActivity(...)
arbitrary ActivityId caller input
```

Completion retry semantics:

```text
same Activity + exact same completion → idempotent PASS
same Activity + different completion  → lineage.persistence.completion_conflict
not retained/current                  → fail closed
```

Do not require `endedAt >= startedAt`; wall clock can move backward.

## DL-22 — keep runtime table UPDATE authority narrow

Rewrite the current PRE_PRODUCTION `0001_foundation_baseline` in place.

Extend `activity_record` with nullable runtime provenance columns:

```text
product_generation_id
package_generation_id
micro_system_id
micro_system_instance_id
```

Add structural constraints described in DL-20.

Do **not** grant table-wide `UPDATE` to `heptalogos_runtime`.

Provide one owner-owned, security-definer completion function limited to:

```text
ended_at
outcome
outcome_ref
```

for the matching Activity row. Grant runtime role `EXECUTE` on that function only.

Direct:

```sql
UPDATE heptalogos.activity_record ...
```

must remain denied for the runtime role.

The execution-lineage repository uses the restricted Foundation repository seam to call the function inside a normal Host-fenced `PersistenceService.mutate` transaction.

## DL-23 — runtime lifecycle lineage policy

Automatically create Activities at these H2B boundaries:

```text
runtime.reconcile                retained when plan changes state
runtime.lifecycle.activate       retained
runtime.lifecycle.deactivate     retained
runtime.lifecycle.failure        retained
service.call                     transient by default
capability.invoke                transient by default
```

Lifecycle pattern:

```text
run Activity
→ short Tx: retainCurrent(start)
→ perform lifecycle work outside transaction
→ short Tx: completeCurrent(outcome)
```

No transaction spans activation/disposal waits.

For activation:

```text
if retaining start fails
→ do not activate

if activation succeeds but completion persistence fails
→ immediately quiesce/dispose the newly activated scope
→ mark FAILED
→ surface structured Problem
```

For deactivation:

```text
resource disposal safety wins
→ system may become STOPPED even if final completion write fails
→ reconcile returns a structured lineage-persistence failure
→ do not re-activate merely to make telemetry look complete
```

High-frequency Service/Capability calls are Activity boundaries but are not automatically durable retained records in H2B.

## DL-24 — provider failure isolation

Unexpected failure of a tracked background task:

```text
owner MicroSystem → FAILED
withdraw/retire its Service/Capability bindings
hard Service dependents → quiesce/block through next reconcile
independent graph branches continue
Capability-only consumers are not restarted solely because the capability disappeared
Readiness recomputes
```

Do not crash the entire Host merely because one optional provider failed.

A failure in a Kernel/management-critical future MicroSystem may later trigger stronger policy; H2B does not pre-invent those H4 decisions.

## DL-25 — mechanical import containment

Extend boundary verification:

```text
cordis
→ packages/runtime-substrate only

@dagrejs/graphlib
→ runtime-kernel private runtime-graph adapter/tests only

@heptalogos/execution-lineage/runtime-kernel
→ runtime-kernel + execution-lineage tests only

@heptalogos/persistence/foundation-repository
→ existing H2A allowlist + execution-lineage/evidence only;
  runtime-kernel must not gain raw Kysely access merely because it manages lifecycle

raw pg/Kysely
→ unchanged infrastructure zones only

runtime-substrate package root
→ no Cordis Context/Fiber/Service/Registry type export

runtime-kernel package root
→ no Cordis/Graphlib/Kysely/pg object
```

Runtime lifecycle persistence must go through `ExecutionLineageService`, not direct SQL from `runtime-kernel`.

---

# 3. Required file/module layout

## `foundation-contracts`

Modify:

```text
packages/foundation-contracts/src/identity.ts
packages/foundation-contracts/src/index.ts
```

Create if keeping identity.ts focused:

```text
packages/foundation-contracts/src/runtime-identity.ts
packages/foundation-contracts/src/runtime-identity.test.ts
```

Responsibilities:

```text
ProductGenerationId canonical ownership
PackageGenerationId
MicroSystemInstanceId
NamespacedId
MicroSystemId / ServiceId / CapabilityId / ProviderId
parsers/creators
```

Update `bootstrap-state/model.ts` to import the canonical `ProductGenerationId`.

## `runtime-substrate`

Create:

```text
packages/runtime-substrate/package.json
packages/runtime-substrate/project.json
packages/runtime-substrate/tsconfig.json
packages/runtime-substrate/tsconfig.build.json
packages/runtime-substrate/src/contracts.ts
packages/runtime-substrate/src/problems.ts
packages/runtime-substrate/src/cordis-adapter.ts
packages/runtime-substrate/src/index.ts
packages/runtime-substrate/src/cordis-conformance.test.ts
packages/runtime-substrate/src/runtime-substrate.test.ts
```

## `runtime-kernel`

Create:

```text
packages/runtime-kernel/package.json
packages/runtime-kernel/project.json
packages/runtime-kernel/tsconfig.json
packages/runtime-kernel/tsconfig.build.json

packages/runtime-kernel/src/contracts.ts
packages/runtime-kernel/src/contract-compatibility.ts
packages/runtime-kernel/src/generation-fence.ts
packages/runtime-kernel/src/runtime-graph.ts
packages/runtime-kernel/src/service-registry.ts
packages/runtime-kernel/src/capability-registry.ts
packages/runtime-kernel/src/readiness.ts
packages/runtime-kernel/src/supervisor.ts
packages/runtime-kernel/src/reconciler.ts
packages/runtime-kernel/src/lifecycle-lineage.ts
packages/runtime-kernel/src/runtime-kernel.ts
packages/runtime-kernel/src/problems.ts
packages/runtime-kernel/src/index.ts
```

Tests stay beside their modules. Do not create “utils.ts” as a dumping ground.

## Existing H2A packages modified

Expected bounded changes:

```text
packages/execution-lineage/
  contracts.ts
  execution-context-runtime internals
  runtime-kernel restricted bridge
  activity repository completion path
  tests

packages/canonical-schema/
  rewrite current 0001 baseline
  completion function/grants
  tests

packages/bootstrap-runtime/
  existing real PostgreSQL integration harness gains H2B integration test only

scripts/verify/boundaries.mjs
pnpm-workspace.yaml
pnpm-lock.yaml
tsconfig.json
Architecture_Corpus qualification evidence/current route materialization
docs/roadmap/development-roadmap.md
active H2B plan registration
```

Do not modify stable Bootstrap production orchestration merely to “wire H2B into boot” unless a pre-existing post-Host composition seam cleanly owns that call. H2B qualification may compose against the current managed Host in integration tests without making Bootstrap depend on Runtime Kernel.

---

# 4. Task 1 — Freeze dependencies and qualify the exact Cordis substrate pattern

**Purpose:** retire the highest H2B dependency risk before product semantics are built on it.

### Files

- modify root Catalog/lockfile
- create `packages/runtime-substrate/*`
- modify dependency/boundary verification
- update `Q-RUNTIME-01` only with actually observed exact-package evidence

### TDD sequence

- [x] Add exact Catalog pins `cordis@4.0.0-rc.8` and `@dagrejs/graphlib@4.0.5`; install with the existing pnpm procedure.
- [x] Verify lockfile resolves the exact direct versions and no unauthorized Cordis plugin package is introduced as a direct dependency.
- [x] Write the Cordis conformance tests below **before** implementing the adapter.
- [x] Run the focused test target and confirm the adapter-facing tests fail for missing code while direct package probes execute.
- [x] Implement only the DL-18 adapter pattern.
- [x] Run conformance to PASS.
- [x] Run `pnpm check:dependencies`, `pnpm check:boundaries`, `pnpm typecheck`, `pnpm tsc6`.
- [x] Commit one meaningful dependency/substrate commit.

### Mandatory Cordis conformance cases

```text
C1 one plugin activation reaches ACTIVE and disposal runs registered effect disposer exactly once
C2 partial activation failure disposes already-registered child effects
C3 disposing one activation does not remove parent/sibling resources
C4 concurrent/repeated dispose is idempotent and does not double-dispose
C5 deactivate while async activation is settling terminates without resurrecting the Fiber
C6 tracked background rejection is surfaced through adapter onFailure
C7 disposer rejection is observable by the adapter; it is not silently converted to success
C8 AbortSignal is aborted before owned disposal completes
C9 a never-settling tracked task hits the required settleTimeoutMs and returns the stable timeout Problem
C10 RuntimeSubstrate.close disposes remaining activation handles and leaves no adapter-owned active handle
```

Add a mechanical source assertion that production adapter code contains no:

```text
.isolate(
.waterfall(
from "cordis/src/
@cordisjs/plugin-
@deepseek-ai/cordis
```

### Hard gate

If any required C1-C10 property cannot be made correct using the public `cordis@4.0.0-rc.8` package-root APIs **without patching/forking or accessing private fields**, stop.

Report:

```text
exact failing case
Node version
Cordis version
minimal reproduction
observed vs required behavior
whether upstream current main appears to address it
```

Do not continue to Task 2 and do not write a custom lifecycle fallback.

---

# 5. Task 2 — Establish runtime identities, contract model, graph and registries

**Purpose:** make Heptalogos runtime semantics independent of Cordis mechanics.

### Interfaces produced

Implement DL-06 through DL-17.

### TDD sequence

- [x] Move `ProductGenerationId` to `foundation-contracts` and update BootstrapState imports without behavior changes.
- [x] Add namespaced runtime IDs and `MicroSystemInstanceId` tests.
- [x] Add exact-only `ContractCompatibilityRegistry`.
- [x] Add Graphlib-backed RuntimeGraph tests for acyclic order, cycle detection and reverse dependent ordering.
- [x] Add ServiceRegistry tests.
- [x] Add CapabilityRegistry tests.
- [x] Add GenerationFence tests.
- [x] Add ReadinessEvaluator tests.
- [x] Implement the minimal modules until all tests pass.
- [x] Run foundation-contracts/bootstrap-state regressions plus runtime-kernel unit tests.
- [x] Run dependency/boundary/typecheck gates.
- [x] Commit.

### Required Service tests

```text
S1 one eligible provider binds
S2 zero provider blocks hard consumer
S3 >1 eligible provider without explicit binding is ambiguous, never registration-order selected
S4 explicit eligible provider binding wins
S5 explicit unavailable provider fails closed rather than silently choosing another
S6 provider retirement rejects new lease invocation
S7 in-flight call is allowed to settle before retirement completes
S8 settlement timeout returns runtime.generation.settlement_timeout
S9 retained fenced Proxy cannot call after binding retirement
```

### Required Capability tests

```text
K1 no explicit binding → highest priority eligible provider
K2 same priority → lexical ProviderId tie-break
K3 explicit eligible binding wins
K4 explicit unavailable binding does not fall back
K5 provider withdrawal selects the next eligible provider
K6 capability rebind does not itself create a hard RuntimeGraph restart edge
```

### Required graph tests

Use synthetic systems:

```text
A provides Service X
B requires X
C independent
D provides alternate X
```

Prove:

```text
A before B startup
B before A shutdown
hard cycle A↔B rejected before activation
C unaffected by A/B failure path
D selection only through explicit Service binding when A and D are both eligible
```

### Required readiness tests

Profiles:

```text
ManagementSynthetic:
  required Service X

OptionalFeatureSynthetic:
  required Service X
  optional Capability Y
```

Prove:

```text
X absent                 → BLOCKED
X present, Y absent      → DEGRADED for optional-feature profile
X + Y present            → READY
Capability Y rebind      → readiness recompute without B restart
```

---

# 6. Task 3 — Build MicroSystemSupervisor and deterministic RuntimeReconciler

**Purpose:** turn static graph semantics into safe process-memory lifecycle transitions.

### Required architecture

The reconciler is split logically into:

```text
plan(current desired + actual + bindings + mode)
→ immutable ReconcilePlan

execute(plan)
→ Supervisor/Registry/Substrate actions
→ updated Actual State
→ readiness recompute
```

Planning must be side-effect-free.

Execution may continue independent graph branches after one branch fails, but must not activate an action whose hard precondition failed.

### Required ReconcileAction family

Use a bounded family:

```ts
type ReconcileAction =
  | { readonly kind: "QUIESCE"; readonly microSystemId: MicroSystemId; readonly reason: string }
  | { readonly kind: "STOP"; readonly microSystemId: MicroSystemId; readonly reason: string }
  | { readonly kind: "START"; readonly microSystemId: MicroSystemId; readonly reason: string }
  | { readonly kind: "REBIND_SERVICE"; readonly serviceId: ServiceId; readonly providerId: ProviderId }
  | { readonly kind: "REBIND_CAPABILITY"; readonly capabilityId: CapabilityId; readonly providerId?: ProviderId };
```

Do not put callbacks/framework objects inside a ReconcilePlan.

### Activation context rules

`MicroSystemActivationContext` exposes only:

```text
runtime identity
ActivationResourceScope
declared Service access
declared Capability access
declared Service publication
declared Capability publication
scoped RuntimeActivityRunner
AbortSignal via resource scope
```

No root Host object, PersistenceService, Cordis Context, Kysely, pg, Bootstrap object or unrestricted registry mutation.

### Required scenarios

```text
R1 cold start A→B plus independent C reaches deterministic RUNNING states
R2 missing Service X leaves B Desired=RUNNING / Actual=BLOCKED
R3 adding X later starts B without rewriting Desired State
R4 replacing hard Service provider quiesces B, retires old binding, binds new provider, then restarts B
R5 provider activation failure leaves its dependent branch failed/blocked but C remains RUNNING
R6 tracked background failure transitions provider FAILED, withdraws bindings and blocks hard dependents on reconcile
R7 Capability withdrawal/rebind changes readiness but does not restart B
R8 SAFE mode stops mode-ineligible systems while Desired State remains unchanged
R9 returning to NORMAL reactivates according to original Desired State
R10 shutdown follows reverse hard-dependency order and owns every activation scope
R11 one reconcile execution never retries the same failed activation repeatedly
R12 two concurrent reconcile requests serialize; there is no overlapping plan executor
```

`RuntimeKernelOptions.settleTimeoutMs` must be required at composition. No magic default.

Commit after unit scenarios and static gates pass.

---

# 7. Task 4 — Bind H2B runtime origin and lifecycle to H2A Execution Lineage

**Purpose:** avoid retrofitting ProductGeneration/MicroSystem lineage after runtime code already exists.

### 4.1 Runtime origin bridge

Implement DL-20 with a restricted execution-lineage subpath.

Tests:

```text
L1 root Host Activity remains valid without runtime origin
L2 bound Product runtime Activity adds ProductGenerationId
L3 MicroSystem Activity adds ProductGenerationId + MicroSystemId + MicroSystemInstanceId
L4 PackageGenerationId is optional but cannot exist without ProductGenerationId
L5 microSystemId/instance pair cannot be half-present
L6 bound runner shares the existing ALS parent/causation chain
L7 ordinary package-root caller has no origin-binding API
L8 persistence execution metadata still projects only Host authority fields; runtime provenance cannot create DB Authority
```

### 4.2 Rewrite current canonical baseline

Because `CompatibilityEpoch = PRE_PRODUCTION`:

```text
rewrite current 0001_foundation_baseline
reset/rebuild dev/test DB
NO 0002 development compatibility migration
```

Add runtime provenance columns and structural checks.

Add one owner-owned Activity completion function. Keep runtime table UPDATE denied.

### 4.3 ExecutionLineage completion

Implement DL-21/DL-22.

Required tests:

```text
L9 retain start leaves ended_at/outcome null
L10 completeCurrent succeeds only for transaction current Activity
L11 exact same completion retry is idempotent
L12 different second completion is conflict
L13 arbitrary ActivityId completion is impossible through public API
L14 direct runtime table UPDATE remains denied in real PostgreSQL
L15 completion function cannot complete a different-origin/current-Activity row
L16 wall-clock-backward endedAt is preserved; no fake duration inference
```

### 4.4 Runtime lifecycle recorder

Wrap state-changing reconcile operations with H2A Activities:

```text
runtime.reconcile
runtime.lifecycle.activate
runtime.lifecycle.deactivate
runtime.lifecycle.failure
```

`service.call` / `capability.invoke` use transient Activities with semantic:

```text
serviceId/capabilityId
providerId
contractVersion
operationId
```

They execute under the provider MicroSystem runtime origin, with parent/causation inherited from the caller Activity.

Do not automatically retain every call.

Commit only after execution-lineage/canonical-schema/runtime-kernel focused tests and boundary gates pass.

---

# 8. Task 5 — H2A + H2B integration qualification on the current managed Host

**Purpose:** prove runtime composition works on the real H2A Host/Persistence/Lineage substrate without making Bootstrap depend on Runtime Kernel.

Reuse the existing `bootstrap-runtime` real PostgreSQL fixture. Do not create a second PostgreSQL process harness in `runtime-kernel`.

Create:

```text
packages/bootstrap-runtime/src/h2b-runtime-kernel.integration.test.ts
```

Add runtime-kernel as a **dev/test dependency** of bootstrap-runtime only.

### Real PostgreSQL scenarios

```text
I1 boot current managed Host → create current ExecutionContext → create RuntimeKernel
I2 synthetic A(Service X) → B(requires X) + C independent reaches expected Actual state
I3 retained runtime.reconcile and lifecycle Activities persist ProductGeneration/MicroSystem origin
I4 lifecycle completion uses the narrow function while direct activity_record UPDATE stays denied
I5 hard Service provider replacement quiesces/restarts only the dependent subgraph
I6 old ServiceLease/Proxy rejects after generation/binding retirement
I7 capability withdrawal/rebind changes selected provider/readiness without consumer restart
I8 provider tracked-background failure withdraws bindings; independent C remains active
I9 SAFE → NORMAL changes eligibility without mutating DesiredRuntimeSnapshot
I10 shutdown disposes all scopes and no new invocation enters retired generations
```

Use the exact local PostgreSQL version actually executed and record it. A skipped suite is `NOT_RUN`.

### No false claims

This H2B local integration may establish Windows/local real PostgreSQL evidence if that is the platform actually run.

It does **not** upgrade:

```text
Linux real PostgreSQL
macOS real PostgreSQL
source-less product runtime
installed service/headless runtime
hardware power-loss
```

unless those exact scenarios are actually executed.

---

# 9. Task 6 — Mechanical closure of the H2B implementation candidate

### Mandatory package boundaries

`pnpm check:boundaries` / governance verification must mechanically prove DL-25.

Also check:

```text
runtime-kernel does not import bootstrap-state
runtime-kernel does not import host-ownership directly
runtime-kernel does not import pg/Kysely
runtime-kernel does not import cordis
runtime-substrate does not import persistence/execution-lineage
no Cordis or graphlib type appears in emitted package-root declarations
```

### Qualification evidence

Update `Q-RUNTIME-01` with an H2B implementation addendum. Preserve historical pilot evidence.

Record, using observed values only:

```text
exact_cordis_version
exact_graphlib_version
cordis_plugin_fiber_conformance
partial_activation_cleanup
sibling_parent_isolation
reentrant_dispose
background_failure_observation
settlement_timeout
runtime_graph_cycle_detection
service_provider_replacement
capability_rebind
generation_fence
operating_mode_reconcile
readiness_recompute
runtime_lifecycle_lineage
runtime_lifecycle_real_postgres
repository_verification
```

Keep implementation/product qualification `PARTIAL` wherever source-less/platform/product claims remain unexecuted.

If canonical Activity completion changes persistence qualification properties, update the existing `Q-PERSISTENCE-01` addendum narrowly; do not invent a second persistence qualification ID.

### Local candidate matrix

At minimum record:

```text
foundation-contracts unit
bootstrap-state regression
runtime-substrate unit + Cordis conformance
runtime-kernel unit
execution-lineage unit
canonical-schema unit
persistence regression
bootstrap-runtime existing integration
H2B real-PG integration
check:agents
check:corpus
check:repository
check:dependencies
check:boundaries
toolchain:check
typecheck
tsc6
pnpm verify
```

### Roadmap before external review

Set current truth only to what has happened:

```yaml
H1: CLOSED
H2A_1: CLOSED
H2A_2: CLOSED
H2A_3: CLOSED
H2A: FUNCTIONALLY_COMPLETE
H2B: IMPLEMENTATION_COMPLETE_AWAITING_REVIEW
H2_FUNCTIONAL: COMPLETE_PENDING_H2B_CLOSURE
H2_STABILIZATION: NOT_STARTED
H2: OPEN
```

Do not pre-write H2-S PASS or H2 CLOSED.

Freeze exact `(base_sha, head_sha)` only after all local code/docs/evidence changes are complete.

---

# 10. External review, final CI, merge and post-merge truth

Use the existing milestone closure playbook exactly.

Sequence:

```text
local candidate frozen
→ external out-of-band Independent Review exact pair
→ PASS only
→ manual final CI exact pair
→ Ubuntu + macOS + Windows PASS
→ recheck live base/head
→ squash merge
→ separate docs/evidence-only reconciliation PR
```

Any code/test/doc commit after review invalidates the review. Any base move invalidates review and final CI.

After H2B behavior squash merge, reconciliation records:

```yaml
H2A: FUNCTIONALLY_COMPLETE
H2B: CLOSED
H2_FUNCTIONAL: COMPLETE
H2_STABILIZATION: ELIGIBLE
H2: OPEN
```

Then—and only then—create one bounded **H2-S stabilization/closure plan** reviewing H2A + H2B jointly.

H2-S must not become H3.

---

# 11. H2-S handoff contract fixed now

The implementing Agent does not design H2-S, but H2B must leave enough evidence for it.

H2-S will later review jointly:

```text
Host ownership + Persistence Authority
canonical schema and PRE_PRODUCTION migration truth
ExecutionContext / runtime-origin integrity
Activity/Evidence atomicity and lifecycle completion
Cordis resource ownership/disposal
RuntimeGraph deterministic Service dependency behavior
Service replacement quiesce ordering
Capability dynamic rebind semantics
GenerationFence stale-call behavior
Desired vs Actual separation
OperatingMode eligibility without Desired mutation
Readiness correctness
shutdown/quiesce interaction
current evidence / qualification truth
framework leakage boundaries
```

If H2B implementation discovers an A+B invariant that cannot be made coherent without changing H2A, fix it inside H2B only when the edit is bounded and directly required by H2B. Do not defer a known functional contradiction to H2-S.

---

# 12. Stop / escalation conditions — Agent reports, architect decides

STOP and return evidence instead of improvising if any occurs:

1. `cordis@4.0.0-rc.8` fails a required C1-C10 production-pattern conformance case.
2. Correct Cordis use appears to require private/underscored API or `cordis/src/*`.
3. The only apparent workaround is a fork/vendor patch, `@deepseek-ai/cordis`, another DI framework, or custom parallel lifecycle engine.
4. Graphlib 4.0.5 cannot represent/prove the required hard Service DAG behavior without a parallel handwritten graph algorithm.
5. Product Service semantics appear to require delegating Desired/Actual/Reconcile Authority to Cordis.
6. RuntimeKernel needs direct Bootstrap internals, root Host object, pg/Kysely, or raw Persistence transaction handles.
7. Service replacement cannot quiesce existing consumers without violating the GenerationFence model.
8. Capability provider change appears to require treating Capability as a hard Service DAG edge.
9. A lifecycle transaction appears to span activation/disposal/network/human/LLM waits.
10. Runtime lifecycle completion appears to require table-wide `UPDATE` authority or arbitrary Activity update API.
11. A runtime origin bridge would create a second ALS/context stack.
12. A durable LineageContextRef appears to need HostOwnershipToken/BootId/ProductGeneration as reconstructed Authority.
13. H2B requires Configuration/Policy/Secret/Network/Effect semantics to make the synthetic runtime graph work.
14. A failed activation requires inventing automatic retry/backoff to make tests pass.
15. More than the two authorized new workspaces appear necessary for architectural—not merely file-organization—reasons.
16. The implementation requires StorageWorkspace or Package Manager despite no concrete H2B filesystem/package owner.
17. H2A-3 post-merge master differs from the expected reconciled semantics when this plan is activated.
18. Any change would require production backward compatibility for a development schema/history.
19. External review/final CI is requested against a pair different from the live frozen pair.
20. H2B scope begins implementing H3 durable work/effect behavior.

Ordinary private helper naming, file splitting within the two packages, test fixture factoring and Kysely expression style inside already-authorized adapters are not escalation conditions if every Decision Lock is preserved.

---

# 13. Acceptance checklist

H2B is ready for external review only when all are true:

```text
[ ] Standard Activation Gate final-CI prerequisite was satisfied (operator-directed exception is recorded below)
- [x] Operator-directed activation exception recorded with exact post-H2A3 master baseline `19ebef1c62a737ad077414a6817ffdf8ac3ad2a4`; H2A-3 final CI remains `NOT_RUN`.
- [x] invalid H2B-on-master snapshot preserved at `backup/h2b-master-3ce96cf` and `origin/master` restored to the post-H2A-3 baseline.
[x] no H2A-S was created
[x] cordis is exactly 4.0.0-rc.8 in Catalog/lockfile
[x] @dagrejs/graphlib is exactly 4.0.5 in Catalog/lockfile
[x] Cordis C1-C14 conformance PASS using the same production adapter path
[x] no Cordis private API/isolate/waterfall/product Service Authority use
[x] only runtime-substrate imports cordis
[x] only runtime graph adapter imports graphlib
[x] ProductGenerationId has one canonical definition in foundation-contracts
[x] MicroSystem/Service/Capability/Provider IDs follow the locked namespace syntax
[x] each activation attempt gets a new MicroSystemInstanceId
[x] ContractCompatibilityRegistry current mode is exact-only
[x] Desired State and OperatingMode remain distinct
[x] Actual State is owned only by MicroSystemSupervisor
[x] hard Service missing → BLOCKED
[x] hard Service ambiguity does not resolve by load order
[x] hard Service replacement quiesces dependents safely
[x] RuntimeGraph resolves exact Service bindings and counts bindings rather than MicroSystems
[x] Capability rebind is deterministic and does not force Service-style restart
[x] removed explicit Capability binding takes effect before dependent START
[x] Service/Capability consumers never receive raw provider implementation
[x] retained fenced Proxy preserves real class/native receiver identity and fences mutation
[x] generation retirement blocks new calls and settles in-flight calls
[x] settlement timeout leaves a generation RETIRING and blocks replacement dependents
[x] failed/BLOCKED and SAFE dependency chains recover in one later reconcile
[x] missing required Capability remains dynamic unavailable and is represented by Readiness
[x] no hidden automatic retry loop exists
[x] RuntimeGraph uses graphlib and rejects hard cycles before activation
[x] Readiness READY/DEGRADED/BLOCKED semantics pass
[x] SAFE/NORMAL reconciliation does not mutate Desired State
[x] tracked background failure affects only dependent graph branches
[x] runtime origin binds ProductGeneration/MicroSystem through the existing H2A ALS
[x] ordinary callers cannot forge runtime origin
[ ] Activity runtime provenance is persisted in current canonical baseline (`NOT_RUN`: real PostgreSQL)
[ ] direct runtime UPDATE of activity_record remains denied (`NOT_RUN`: real PostgreSQL)
[x] completeCurrent can only complete current Activity
[x] exact completion retry is idempotent; conflicting completion fails
[x] lifecycle transactions do not span lifecycle waits
[x] runtime.reconcile/lifecycle Activities are retained as specified
[x] service.call/capability.invoke are Activity boundaries but not default durable spam
[ ] H2A-1/H2A-2/H2A-3 regressions PASS (`NOT_RUN` in this corrective cycle)
[ ] real PostgreSQL H2B integration PASS on the actually recorded platform (`NOT_RUN`: qualification toolchain unavailable)
[x] deferred L3 claims remain NOT_RUN
[x] boundary/dependency/repository/corpus/toolchain gates PASS
[x] pnpm verify PASS after B1-B4/I1/I2 corrective changes (managed-Host H2B integration remains `NOT_RUN`)
[x] roadmap says H2 remains OPEN and H2-S has not been pre-claimed
[ ] exact review pair is frozen only after all candidate mutations (`NOT_RUN`: working tree not frozen)
```

---

# 14. Recommended commit envelope

This is guidance, not a numeric acceptance gate:

```text
1. chore/feat: freeze H2B dependency pins and qualify RuntimeSubstrate
2. feat: add runtime identities, graph, registries and generation fence
3. feat: add MicroSystem supervisor and deterministic reconciler
4. feat: bind runtime origin and lifecycle completion to Execution Lineage
5. test: prove H2A/H2B runtime composition on real PostgreSQL Host fixture
6. docs: record H2B candidate evidence and freeze review pair
```

If the branch trends toward roughly fifteen or more unrelated behavior commits, stop and reclassify why. H2B is intentionally one substantial capability milestone, but it must not quietly become H3/H4.

---

# 15. Evidence record template

Fill only with observed results:

```yaml
h2b:
  activationBaseline: <record exact post-H2A3 reconciliation master at activation>
  branch: dev/h2b-runtime-composition-kernel
  dependencyPins:
    cordis: 4.0.0-rc.8
    graphlib: 4.0.5
  local:
    cordis_conformance: NOT_RUN
    runtime_substrate_unit: NOT_RUN
    runtime_kernel_unit: NOT_RUN
    runtime_graph: NOT_RUN
    service_registry: NOT_RUN
    capability_registry: NOT_RUN
    generation_fence: NOT_RUN
    readiness: NOT_RUN
    lineage_runtime_origin: NOT_RUN
    lineage_completion: NOT_RUN
    real_postgres_runtime_composition: NOT_RUN
    h2a_regressions: NOT_RUN
    check_dependencies: NOT_RUN
    check_boundaries: NOT_RUN
    pnpm_verify: NOT_RUN
  review:
    base: NOT_RUN
    head: NOT_RUN
    independentReview: NOT_RUN
  finalCrossPlatformCI: NOT_RUN
  squashMerge: NOT_RUN
```

`activationBaseline` is filled mechanically when the Activation Gate occurs; it is not left to the Agent as a design decision.

Executable gate vocabulary remains:

```text
PASS | FAIL | NOT_RUN | BLOCKED
```

---

# 16. Architectural rationale retained for reviewers

1. **H2A does not get its own stabilization stage.** A and B are complementary halves of H2 runtime foundation; stabilization is more valuable after both can be audited as one machine.
2. **Cordis is an adapter dependency, not the Kernel.** Its lifecycle mechanics are reused, while Heptalogos retains Desired/Actual/Reconcile/Service/Capability/Generation/Readiness Authority.
3. **The adapter deliberately avoids current Cordis surfaces with known lifecycle ambiguity when those surfaces are not needed.** The exact production plugin/fiber/effect path is qualified instead of trusting package labels.
4. **Two runtime workspaces are enough.** More package granularity would add dependency edges and review overhead without increasing semantic isolation.
5. **Hard Service and dynamic Capability remain different.** This is necessary for graceful degradation and provider rebind without restarting the entire runtime graph.
6. **Service ambiguity fails closed.** Registration order is not Authority.
7. **Capability fallback is forbidden when an explicit binding exists but is unavailable.** Silent provider substitution can change externally visible behavior.
8. **GenerationFence starts as runtime call ownership.** H3 later extends generation identity into durable work/commit fences; H2B does not pretend process-memory fencing solves crash persistence.
9. **OperatingMode affects eligibility, not Desired State.** This preserves Safe/Maintenance semantics and allows the original desired configuration to resume.
10. **H2B adds the first narrow Activity completion path because it is the first real long-lived lifecycle owner.** The API remains current-Activity-only and database UPDATE authority remains tightly constrained.
11. **Runtime lifecycle is instrumented now, not retrofitted later.** H2A created the execution spine precisely so Runtime composition can become causally observable from its first real implementation.
12. **H2B does not implement package management or H3 durable work.** A synthetic built-in graph is sufficient to prove Kernel semantics before external Extension/package complexity is introduced.
