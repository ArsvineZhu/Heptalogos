# 00 — Architectural Decision Ledger

This file freezes decisions for the active refactoring horizon. The Coding Agent
does not re-decide them from local implementation convenience.

## D01 — Refactoring criterion

File length is an audit signal, not an acceptance threshold.

A refactor is authorized where current evidence shows at least one of:

- change amplification;
- context amplification;
- duplicate generic mechanics;
- ambiguous ownership;
- provider bypass;
- test amplification;
- failure amplification;
- configuration duplication;
- production seams created only for tests.

No `max-lines`, complexity-score, JDD, or architecture-health gate is added.

## D02 — Allowed structural outcomes

For pre-JDD code, all of these are legitimate:

```text
KEEP
REFACTOR
ABSTRACT
REWRITE
REPLACE
DELETE
```

Existing code has no preservation privilege in PRE_PRODUCTION.

## D03 — Owner verdicts

| Area                                    | Verdict                         | Decision                                                                                                                        |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Portable assembler                      | **REWRITE**                     | Replace legacy deploy/repair pipeline with pnpm-native modern deployment.                                                       |
| Subject OpenClaw runtime                | **REFACTOR + REPLACE + DELETE** | Split responsibilities, use Execa, remove autonomous retry loop, use bounded SecretRef/env projection.                          |
| Management SystemAction runtime         | **ABSTRACT + REFACTOR**         | Introduce a current finite internal handler catalog to eliminate synchronized switches.                                         |
| Management legacy test seams            | **DELETE**                      | Production owners/execution dependencies are required.                                                                          |
| Subject service                         | **REFACTOR**                    | Separate persistence, authority/admission, reaction/cognition, and communication/expression responsibilities.                   |
| Messaging service                       | **REFACTOR**                    | Extract internal SQL/repository and cursor mechanics before external Driver growth.                                             |
| AIRuntime service                       | **REFACTOR**                    | Separate persistence/routing authority from AI SDK invocation mechanics.                                                        |
| ProductHost composition                 | **KEEP + LIMITED EXTRACTION**   | Keep linear composition root; extract only independent Product-private policy/helpers.                                          |
| ProductHost integration tests           | **REFACTOR**                    | Split by executable scenario using existing fixtures.                                                                           |
| RuntimeKernel                           | **KEEP**                        | Large but already separated into registry/reconciliation/generation mechanics; Supervisor remains cohesive orchestration owner. |
| WorkQueue                               | **KEEP**                        | Existing multi-file responsibility structure is the internal positive reference.                                                |
| PrivatePostgres                         | **KEEP**                        | Controller already delegates process/layout/inspection/lifecycle/profile mechanics.                                             |
| Persistence                             | **KEEP**                        | Existing structure is bounded and cohesive.                                                                                     |
| Configuration                           | **KEEP**                        | P2 generalized the current real multi-definition service without extra framework.                                               |
| DurableExecution process adapter        | **KEEP**                        | Already uses adopted Execa behind owner-specific policy.                                                                        |
| Global shared ProcessSupervisor package | **DO NOT ADD**                  | Execa already owns generic process mechanics; current owner policies differ materially.                                         |

## D04 — Process mechanics

`process.execa` is already an ADOPTED dependency route.

ProductHost must add `execa` as a direct dependency and Subject OpenClaw must no
longer use `node:child_process` directly.

Do not build:

```text
ProcessSupervisorService
GenericExternalRuntime<T>
ProcessRegistry
```

Each current process owner retains a thin domain adapter over Execa. Re-open a
shared Heptalogos process primitive only if, after this refactor, concrete
Heptalogos-specific behavior remains duplicated across at least the current
real process owners and a shared owner would reduce total maintenance cost.

## D05 — Portable dependency closure

Use the repository-pinned `pnpm@11.24.0`.

Primary route:

```text
pnpm --filter @heptalogos/product-host
     --prod
     --config.inject-workspace-packages=true
     deploy <target>
```

Use equivalent argument ordering accepted by the pinned CLI. Preserve the
current `--ignore-scripts` supply-chain stance where supported.

Forbidden in the final implementation:

```text
--legacy
node-linker=hoisted workaround
source workspace package.json backup/restore
post-deploy pnpm install to repair the source workspace
manual workspace: protocol rewriting
deleting pnpm metadata merely to simulate an npm layout
```

Do not commit `injectWorkspacePackages: true` globally merely to make deploy
work; command-scoped deployment must be tried first because global injection
changes normal workspace linking/synchronization mechanics.

### Authorized fallback

If exact pnpm 11.24.0 modern deploy cannot produce the required closure directly
from the live workspace, use a **disposable OS-TEMP staging workspace**:

1. copy the current repository workspace into TEMP while excluding `.git`,
   `node_modules`, `.nx`, `tmp`, package output roots, and other generated caches;
2. install with pinned pnpm/frozen lockfile/ignored scripts in the staging copy;
3. build in staging;
4. run modern deploy there;
5. discard staging.

The fallback may cost time but must never mutate and later repair the real source
workspace. It may not implement a custom dependency resolver.

If both direct modern deploy and the pre-authorized isolated-staging route fail
because of a concrete pnpm capability defect, report PLAN_GAP with the exact
failure; do not recreate a package manager.

## D06 — OpenClaw lifecycle

OpenClaw remains:

```text
Product-supervised
low-privilege
replaceable
public Gateway/Plugin API only
not canonical Subject state
```

Delete:

```text
SUBJECT_OPENCLAW_RESTART_LIMIT
recoveryAttempts
recoveryTimer
backoff-based autonomous retry loop
```

Unexpected child exit must invalidate the live runtime and produce truthful
readiness/failure state. No hidden three-attempt recovery.

A later **explicit Product runtime reconciliation or Subject lifecycle action**
may create a replacement child. A current cognition operation may only create a
replacement if the owning runtime API already explicitly admits that first-order
start/reconcile operation; do not add an unbounded retry loop.

## D07 — OpenClaw process/config preset

Provision normal local config and therefore omit `--allow-unconfigured`.

Child environment includes:

```text
OPENCLAW_DISABLE_BONJOUR=1
OPENCLAW_EXEC_SHELL_SNAPSHOT=0
OPENCLAW_NO_RESPAWN=1
OPENCLAW_SKIP_CHANNELS=1
```

Do not assume an `openclaw` executable is on PATH; resolve the installed package
entry from the Product closure and launch it with the Product-managed Node
runtime.

## D08 — OpenClaw secrets

The generated OpenClaw configuration must not contain resolved gateway/model
credential plaintext.

- Gateway control auth: use the dedicated child environment
  `OPENCLAW_GATEWAY_TOKEN`; do not put the token in argv.
- Model/provider credential: project a supported OpenClaw env SecretRef from
  generated config to a dedicated child environment variable.
- Heptalogos `SecretService` remains the Authority for credential material.
- Child environment values are process-private transport, not a second
  configuration Authority.
- Never log, descriptor-project, Evidence-record, or serialize resolved secret
  material.

Do not build a new secret broker or IPC protocol.

## D09 — Subject cognition configuration

`profile: "subject"` is a Product invariant, not a user-editable setting.

Rewrite `subject.cognition.runtime.v1` to contain only real managed values:

```ts
{
  schemaVersion: 1;
  enabled: boolean;
  maxOutputTokens: number;
  runTimeoutMs: number;
  maxContextBytes: number;
}
```

Keep the fixed Subject OpenClaw profile in provider/runtime code.

PRE_PRODUCTION means no compatibility reader/upcaster is added for old local
configuration rows.

## D10 — Subject provider provenance

Keep provider-specific OpenClaw provenance; do **not** add a generic provider
registry.

However, a provider patch version is runtime evidence, not Subject semantic type
identity:

```ts
openclawVersion: string;
```

Validate it as bounded non-empty provider evidence. Do not encode
`"2026.9.1"` as a TypeScript literal contract.

## D11 — Management SystemAction architecture

The current fixed SystemAction catalog is real Product structure. Repeated
switches are current change amplification.

Create an internal handler catalog grouped by semantic owner:

```text
system-actions/
  types.ts
  configuration.ts
  secret.ts
  ai-runtime.ts
  subject.ts
  catalog.ts
```

One action family owns its:

- normalization;
- target preconditions;
- affected semantic owners;
- readiness/restart/reconcile impact;
- execution;
- postcondition verification.

Static public action definitions/schemas remain contract data and may remain in
a contract/catalog module. The runtime handler catalog must have exactly one
handler for every current Product SystemAction ID.

Do not build plugin-extensible action registration in this Plan.

## D12 — Management production dependencies

Remove optionals that exist only for “legacy auth-only unit fixtures”.

The production Management service requires the current Product owners and
execution context needed by its current contract. Unit tests supply explicit
minimal fakes or target the extracted internal component they actually test.

No legacy constructor path, optional fallback, or compatibility alias.

## D13 — Subject internal ownership

Do not merely split a 60+KB file into arbitrary helper files.

Target responsibilities:

```text
SubjectService facade / composition
Subject repository
Subject authority + admission
Reaction/cognition execution
CommunicationCommit + Expression/outbound execution
```

SQL row codecs and queries do not remain embedded throughout the semantic
facade. Repository code does not decide Subject behavior.

Do not create a generic Repository base class.

## D14 — Messaging internal ownership

Before external IM Drivers expand Messaging, extract:

```text
repository.ts
cursor.ts
service.ts
```

Repository owns SQL/row codecs. Cursor owns opaque cursor encode/decode and
bounds. Service owns Messaging semantics and atomic interaction with the
Subject inbound consumer.

No behavior/API change.

## D15 — AIRuntime internal ownership

Target:

```text
repository.ts          profile/binding persistence
routing.ts             route resolution/readiness/admissibility
invocation.ts          AI SDK protocol/provider/generation mechanics
service.ts             thin AIRuntime facade
```

Do not expose AI SDK objects through Heptalogos public contracts.
Do not introduce a ProviderRegistry.

## D16 — ProductHost composition

`host.ts` is allowed to remain a substantial composition root.

Extract only responsibilities with their own reason to change, such as bounded
Product configuration bootstrap/projection helpers, if this materially reduces
co-change. Do not create a DI container, generic service builder, or
`createEverything()` factory hierarchy.

## D17 — Verification structure

The 63KB ProductHost integration file is split by executable scenario using the
existing fixture/support code. Tests must not add production DI/hooks merely for
testability.

Portable/source-less acceptance becomes a dedicated **manual Nx qualification
target**, not part of ordinary `pnpm verify`.

TEMP product roots remain required proof; ad-hoc TEMP orchestration scripts do
not.

## D18 — Current-truth governance

At execution start, install this bundle as the single active Plan and reconcile
`project/plans/INDEX.md` so the completed Product Reality Convergence pack is no
longer described as current authorization.

Do not create a separate closure/correction Plan.
