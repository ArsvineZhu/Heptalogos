# System Authority and Management Contract

## Scope

This Spec owns normal Heptalogos Product Management semantics:

```text
ManagementContractVersion
CompatibilityDescriptor
ResourceRef and ReadModel envelopes
canonical Problem projection
Administrator authentication/session
SystemActionDefinition
SystemChangePlan
plan-bound execution and verification
```

It distinguishes the semantic contract from HTTP/OpenAPI, the generated
ManagementClient, the complete reference CLI, external Presentations, and the
independent Machine Operations Plane. It does not make Management an operating
system security boundary.

## Ownership

System Authority owns normal Product Management authentication, authorization,
risk and confirmation semantics, action planning, and canonical resource
projections. Each owning System or Domain Service owns its state mutation and
postcondition verification. Persistence and Host Ownership own transaction and
fencing mechanics. PolicyService, Problem, Lineage, and Evidence retain their
Foundation ownership.

A transport, client, model, tool, Extension, Subject, Presentation, or Machine
Operations process does not become Administrator or canonical Product Authority
merely by reaching an endpoint. A deliberately configured Machine Operations
client may use this contract as an authenticated Administrator client.
Break-glass OS/deployment authority remains outside this Spec.

## Current principal and bootstrap

The current slice has exactly one canonical Administrator principal. The
first-run flow is:

```text
FIRST_RUN_SETUP
→ bounded local one-time high-entropy claim
→ local reference CLI
→ protected password input
→ loopback claim endpoint
→ atomic Administrator + password verifier + authEpoch + consumed claim
```

The claim is local, expiring, and single-use. The atomic mutation binds the
claim digest, expiry/state check, Administrator identity, Argon2id password
verifier, authEpoch, and consumed state. Password and claim plaintext never
enter logs, Evidence, Activity attributes, Lineage attributes, or response
bodies. Node crypto Argon2id is the adopted implementation mechanics at
implementation time; T2 does not select a different hashing provider.

Normal sessions use an opaque bearer token:

```ts
interface ServerSession {
  readonly schemaVersion: 1;
  readonly sessionId: SessionId;
  readonly tokenDigest: Digest;
  readonly principalId: AdministratorId;
  readonly authEpoch: number;
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
  readonly lastAuthenticatedAt?: Instant;
  readonly revokedAt?: Instant;
}
```

Only the client boundary holds token plaintext. The server stores its digest
and canonical session state. Authentication/session state is independent of
Subject Desired/Actual state, Host health, and Presentation process state.

## Normative Management types

```ts
interface ResourceRef {
  readonly schemaVersion: 1;
  readonly resourceKind: string;
  readonly resourceId: string;
  readonly resourceRevision?: number;
}

interface ReadModelEnvelope<T> {
  readonly schemaVersion: 1;
  readonly contractVersion: string;
  readonly resource: ResourceRef;
  readonly observedAt: Instant;
  readonly productGeneration: ProductGenerationId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly data: T;
  readonly lineageContextRef: LineageContextRef;
}

interface CompatibilityDescriptor {
  readonly schemaVersion: 1;
  readonly instanceId: InstanceId;
  readonly continuityEpochId: ContinuityEpochId;
  readonly productGeneration: ProductGenerationId;
  readonly coreContractVersion: string;
  readonly supportedClientContractRange: ContractRange;
  readonly problemSchemaVersion: number;
  readonly systemActionCatalogRevision?: number;
}

interface SystemActionDefinition {
  readonly schemaVersion: 1;
  readonly actionId: SystemActionId;
  readonly actionVersion: number;
  readonly inputSchema: JsonSchemaRef;
  readonly outputSchema: JsonSchemaRef;
  readonly targetKind: string;
  readonly riskClass: "READ_ONLY" | "LOW" | "MATERIAL";
  readonly applyMode: "IMMEDIATE" | "RECONCILE";
}

interface SystemChangePlan {
  readonly schemaVersion: 1;
  readonly planId: SystemChangePlanId;
  readonly actionId: SystemActionId;
  readonly actionVersion: number;
  readonly normalizedInputDigest: Digest;
  readonly targetPreconditions: readonly TargetPrecondition[];
  readonly affectedSemanticOwners: readonly ProductSemanticId[];
  readonly configurationReadinessSubjectImpact: CanonicalJsonValue;
  readonly restartReconcileImpact: CanonicalJsonValue;
  readonly riskClass: SystemActionDefinition["riskClass"];
  readonly planDigest: Digest;
  readonly createdAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

interface SystemActionExecuteResult<T> {
  readonly schemaVersion: 1;
  readonly actionId: SystemActionId;
  readonly planDigest: Digest;
  readonly result: T;
  readonly postconditionsVerified: boolean;
  readonly evidenceRefs: readonly EvidenceRef[];
}
```

Problem is the existing Foundation contract. These types use existing typed
identities and canonical encoding; they do not define a second error, digest,
or identity system.

## Authorization and confirmation

H4-Min authorization is intentionally small:

```text
authenticated current Administrator
→ current exposed core reads/actions subject to preconditions/redaction

unauthenticated caller
→ only explicitly public bootstrap/compatibility endpoints

Subject/model/Extension
→ cannot invoke Administrator mutations
```

Cedar remains the adopted future/full-H4 policy mechanics route but is not
instantiated solely for the one-Administrator H4-Min slice. Do not build a
custom policy language.

A mutating action follows:

```text
Administrator requests plan
→ side-effect-free SystemChangePlan returned
→ Administrator submits exact plan digest
→ server revalidates input, target, revision, policy, and risk
→ owning Service performs canonical mutation
→ postconditions and required Evidence are verified
```

plan may read snapshots, Read Models, capability/configuration projections,
pure impact calculations, and the current ExecutionContext. It may not receive
a mutation transaction, network-write port, Secret plaintext, runtime
mutation, filesystem mutation, raw DBOS handle, or root database handle.

A stale plan fails with a structured stale-plan Problem and must be replanned.
Exact confirmation is not a generic durable ApprovalService. If a future
current policy requires cross-session or multi-approver durable approval, that
is separately authorized. A SystemAction does not by itself require a generic
ManagementOperation; a target Desired/Actual reconciliation or bounded
synchronous result owns current progress.

Current semantic action identifiers include:

```text
configuration.revision.create
configuration.activate
secret.set
secret.replace
secret.revoke
provider-profile.set
model-profile.set
model-binding.set
subject.start
subject.stop
```

The action catalog is stable/versioned. HTTP paths and ergonomic CLI command
names are projections, not semantic identities.

## Staged Read Models and projections

```text
P1
→ system status
→ Host identity/ownership status
→ RuntimeGraph
→ CapabilityGraph
→ Readiness
→ CompatibilityDescriptor

P2
→ ConfigurationDefinition/Revision/Activation
→ SecretMetadata
→ ProviderProfile/ModelProfile/ModelBinding
→ AIRuntime readiness
→ owned NetworkAccess diagnostics

P3
→ Subject Desired/Actual/readiness
→ Subject Chat conversation/message query
```

The permanent target is complete normal Management coverage relative to every
administratively meaningful capability that has entered Product. A new
Presentation may require a new Host-owned ReadModel or aggregate query; it
cannot become domain Authority.

## HTTP, client, and CLI projections

HTTP/OpenAPI is the canonical network projection. Fastify supplies HTTP
mechanics and Hey API supplies generated ManagementClient mechanics behind the
semantic contract. P1 is loopback by default. Remote Internet exposure, TLS
termination architecture, browser transport, SSE, WebSocket, and cookie-only
authentication are not required for the first slice.

The reference CLI is a complete normal Management client using oclif. Machine
mode requires:

```text
stable structured JSON
stable exit semantics
stdout = requested result
stderr = diagnostics/progress
non-interactive operation
protected stdin/TTY secret input
no ANSI requirement
no plaintext secret in argv
```

All clients project the same action, ReadModel, and Problem semantics. They do
not duplicate business rules or access repository, DBOS, filesystem, package
directory, or Secret backend directly.

## Lifecycle and persistence boundary

Management HTTP request handling is not the owner of a Subject or other target
lifecycle. A plan/execute request may commit only the owning target's
Host-fenced canonical mutation and required Lineage/Evidence. Long-running
progress uses the target's Desired/Actual reconciliation when that target owns
it. No generic durable ManagementOperation state is created without a real
administrative lifecycle not represented by its target.

## Failure semantics

The canonical Problem projection distinguishes at least:

```text
management.unauthenticated
management.unauthorized
management.invalid_input
management.stale_plan
management.stale_revision
management.idempotency_conflict
management.precondition_failed
management.target_unavailable
management.policy_denied
management.confirmation_required
management.host_fence_lost
management.contract_unsupported
```

Clients must not infer contract versions from HTTP 404 or deserialization
exceptions. A CompatibilityDescriptor supports negotiation and fail-fast
behavior; it is not a promise to support historical development clients.
PRE_PRODUCTION coordinated breaking changes remain allowed.

## Invariants

- MGMT-001 Normal Product Management has one canonical owning service path; clients do not own business rules.
- MGMT-002 The Management API is not machine administrator authority.
- MGMT-003 The current slice has one canonical Administrator.
- MGMT-004 The first claim is local, expiring, one-shot, and atomically consumed.
- MGMT-005 Password, claim, and session plaintext is not retained in logs, Evidence, Lineage, Activity attributes, or client diagnostics.
- MGMT-006 Normal sessions use opaque client tokens with canonical server-side state.
- MGMT-007 A mutating SystemAction first produces a side-effect-free SystemChangePlan.
- MGMT-008 Execute binds the exact plan digest and revalidates preconditions.
- MGMT-009 A stale plan cannot execute under old confirmation.
- MGMT-010 H4-Min does not instantiate Cedar solely for one Administrator rule; Cedar is not rejected as a future route.
- MGMT-011 H4-Min has no generic durable ApprovalService without a current durable approval consumer.
- MGMT-012 H4-Min has no generic ManagementOperation when target lifecycle already owns the truth.
- MGMT-013 CLI, HTTP, ManagementClient, automation, and Presentation project the same Problem/action/read semantics.
- MGMT-014 External Presentation may drive new Host-owned reads/projections but never domain Authority.
- MGMT-015 Normal Product Management never becomes arbitrary shell, filesystem, DBOS, package, or root-database authority.
- MGMT-016 OpenClaw may prefer Management/CLI as an authenticated client without becoming a Host-internal assistant runtime.
- MGMT-017 PRE_PRODUCTION contract versioning does not create old-client compatibility.
- MGMT-018 Every administratively meaningful capability entering Product receives normal-Management coverage.

## Current-slice exclusions

This Spec does not define:

```text
Cedar implementation in H4-Min
generic policy language
generic durable ApprovalService
generic ManagementOperation framework
remote Management exposure
SSE/WebSocket requirement
browser/Desktop/GUI implementation
arbitrary shell in normal Product Management
OpenClaw internal runtime or privileged Host token
Subject cognition or Messaging state
physical database schema or migrations
```

## References

- [Management Authority architecture](../../docs/architecture/management-authority.md)
- [Management Presentation architecture](../../docs/architecture/management-presentation.md)
- [Machine Operations architecture](../../docs/architecture/machine-operations.md)
- [Subject Base Spec](../subject/subject-base.md)
- [Configuration Spec](../system/configuration.md)
- [Secret Spec](../system/secret.md)
- [Host Ownership](../runtime/host-ownership.md)
- [Persistence Transactions](../data/persistence-transactions.md)
- [Contract Versioning](../core/contract-versioning.md)
- [Execution Lineage](../execution/execution-lineage.md)
- [Evidence](../execution/evidence.md)
