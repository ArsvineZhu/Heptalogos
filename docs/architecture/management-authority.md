# System Authority 与 Management Authority

## 1. Normal Heptalogos System Authority

System Authority owns canonical Heptalogos Product Management semantics. It
does not claim authority over the whole operating system or deployment.

All normal product mutations are expressed through typed Management
contracts and their owning System/Domain services. A transport, client,
model, tool, extension, or external machine operator cannot become the
canonical owner merely by reaching the installation.

## 2. SystemAction 与 SystemChangePlan

正式 Product Management action uses a typed SystemAction with:

```
id/version
input/output schema
target resource
effect/risk class
reversibility
apply mode
plan()
execute()
verify()
```

One action contract is projected to the complete reference CLI, Management
HTTP/API clients, automation, external Presentation, and authorized
Machine Operations integrations. Business rules are not copied into client
adapters.

Mutating actions first create a side-effect-free SystemChangePlan. Planning
may read only snapshots, Read Models, capability/configuration projections,
package metadata, pure impact calculators, and the current ExecutionContext.
It does not receive mutation transactions, network-write ports, Secret
plaintext, runtime mutation, filesystem mutation, raw DBOS, or a root
database handle.

A plan records normalized input, target and revision assumptions, affected
owners, capability/readiness impact, Subject impact, resource impact,
data/secret/network impact, restart or maintenance requirements, preconditions,
risk, and approval requirements. If the world changes, the plan is stale and
must be recomputed; an old approval cannot authorize a changed plan.

## 3. Authentication、Authorization、Risk、Approval 与 Execution

These are distinct concerns:

- Authentication establishes administrator identity and freshness.
- Authorization evaluates principal, action, resource, and context.
- Risk classifies product impact.
- Approval records explicit confirmation when the action and current product
  policy require it.
- The owning System Service executes and verifies the action.

Normal management security remains mandatory. Exact authentication,
authorization, session, exposure, redaction, audit, rate/admission, and
approval mechanisms belong to the current Management Specs and implementation
Plans.

The existence of a System Assistant or another automated client does not by
itself justify a universal AI-specific approval framework. T2 must choose
normal management authentication, authorization, risk, and approval semantics
from actual product consumers and invariants.

## 4. Administrator authentication

Foundation has one administrator identity model with a one-time first claim
and server-side normal sessions.

During FIRST_RUN_SETUP, Bootstrap/Host creates a one-time high-entropy claim
secret in an installation-owner-readable local bootstrap/run location. A
local CLI reads it, receives the password through protected TTY/stdin input,
and calls a loopback-only claim endpoint. The endpoint validates the canonical
claim digest, expiry, and state, then atomically creates the administrator,
Argon2id verifier, authEpoch, and CONSUMED claim state. The audit/lineage
record contains no secret or password; deleting local plaintext after the
canonical commit cannot reopen or replay the claim.

Normal sessions use an opaque bearer token whose digest and principal,
authEpoch, issue/expiry, recent-auth, and revocation state are canonical
server-side data. Passwords, claim secrets, and session plaintext never enter
logs, Evidence, Activity attributes, or external client context. Authentication
does not depend on Subject, System Assistant, or a visual Presentation.

## 5. Policy model

PolicyService owns the Heptalogos authorization contract:

```
principal
action
resource
context
→ permit / forbid
```

Cedar supplies policy-evaluation mechanics behind that boundary. Heptalogos
retains principal/action/resource/context mapping, fail-closed behavior,
diagnostics, and product policy semantics.

Policy must protect current product invariants, including:

```
Subject cannot perform normal System Authority mutations
untrusted Extension cannot change a trust root
normal Product Management cannot become arbitrary machine shell
```

The Machine Operations Plane is outside this Product Authority boundary. Its
OS/deployment permissions are governed by the machine operator and its
independent runtime policy; those actions are not silently converted into
normal SystemAction records.

## 6. Approval

Approval is a product risk/control decision, not an automatic consequence of
the word assistant:

```
read-only authorized action
→ may execute when policy permits

mutating or high-impact action
→ approval and/or recent authentication when the current policy requires
```

An ApprovalRequest, when needed, binds the initiating principal/channel,
SystemAction and target, normalized input digest, SystemChangePlan digest,
policy generation, risk, authentication freshness, expiry, and state. It
authorizes that exact plan; a material input or plan change invalidates it.

## 7. ManagementOperation

Long-running normal product actions are owned by System Authority and are
independent of any browser, CLI process, or assistant session:

```
planned
awaiting-approval
approved
running
succeeded
failed
cancelled
uncertain
recovery-required
```

Durable operation state, owning-service execution, verification, Lineage, and
Evidence remain separate from the client that requested the operation.

## 8. Clients and projections

The canonical relationship is:

```
Domain / System Service
        ↓
canonical Management Contract
        ├─ ManagementClient
        ├─ complete reference CLI
        ├─ HTTP/API projection
        ├─ automation
        ├─ external Presentation
        └─ Machine Operations tools when authorized
```

Clients query canonical Read Models and request actions through the contract.
They do not directly mutate a repository, DBOS, filesystem, package
directory, Secret backend, or runtime graph. The Management API is a living
product interface: a real Presentation or operational consumer may require a
new Host-owned projection, but it cannot acquire domain Authority.

## 9. Authority handoff

The product keeps these domains distinct:

```
Subject Chat
→ Subject Authority

Direct Management
→ Heptalogos System Authority

System Assistant
→ Machine Operations Plane

Bootstrap / Recovery
→ bounded Recovery Authority
```

AuthorityHandoff transfers intent, bounded context, reason, and initiating
principal. It does not transfer permission. A request crossing from Subject
interaction to Product Management, or from normal management to machine
maintenance, must be evaluated again by the target authority.

## 10. Product boundary versus machine authority

Normal Product Management is a governed Heptalogos behavior, but the
Management API is not the operating-system security boundary and does not
represent machine administrator authority.

The independent Machine Operations Plane may perform break-glass service,
repository, dependency, database, filesystem, deployment, and Host-recovery
actions under its own OS/deployment policy. This does not weaken normal
Product Management ownership and does not require Heptalogos to pretend it can
control every mutation below the product boundary.

## 11. Recovery Authority

When normal Management or Policy paths fail, the Recovery Plane remains:

```
small
fixed
local
strongly authenticated
AI-independent
```

Recovery actions are a bounded subset, not the full normal SystemAction
universe and not a disguised root shell. Severe installation or deployment
failures may instead be handled by the independent Machine Operations Plane;
normal Recovery does not depend on that external runtime.

See [Machine Operations Plane](machine-operations.md) for the separate
process, credential, failure, distribution, and OpenClaw boundary.
