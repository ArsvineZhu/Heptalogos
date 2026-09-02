# Canonical System Flows

This page gives human-readable runtime views across the current and future
architecture. Exact current contracts live in [Specs](../../specs/INDEX.md);
future steps shown here are design boundaries, not implementation authority.
All meaningful flows carry ExecutionContext/Activity lineage and preserve the
owning Authority of each domain.

## Bootstrap and restart

First installation follows the stable Bootstrap Closure through independent
lifecycle roots, private PostgreSQL, Host ownership, continuity materialization,
canonical initialization, and local first-administrator setup before normal
Management is exposed. There is no default password or remote unauthenticated
onboarding path.

```text
InstallationAnchor
→ Bootstrap Closure / BootstrapJournal
→ private PostgreSQL
→ Host lease and fence
→ BootstrapState / ContinuityEpoch
→ canonical schema and Host handoff
→ normal Runtime / Management
```

An ordinary restart preserves the logical InstanceId and ContinuityEpochId,
creates a new BootId and HostOwnershipToken, and reconciles Runtime from
canonical Desired State.

## Subject and external messaging

The conceptual interaction path is:

```text
protocol Driver
→ raw Evidence
→ canonical MessageFact
→ WorkItem
→ ConversationMailbox / Reaction
→ DecisionCommit / CommunicationCommit
→ Effect boundary
→ Driver delivery outcome
```

Subject Chat and external IM use separate transport/projection boundaries while
remaining on Subject Authority. A model, tool, or Driver proposal does not
become canonical state by itself.

## Management

Static and dynamic management clients converge on one System Authority:

```text
CLI / HTTP / Operator / Web or Desktop client
→ Management Contract
→ authentication and policy
→ SystemChangePlan / approval when required
→ owning Service or ManagementOperation
→ postcondition verification / Evidence
```

Dynamic Extension actions contribute descriptors and schemas; they do not inject
executable command authority into a CLI process.

## Extension composition

An Extension is discovered, acquired, integrity-checked, and staged as an
immutable PackageGeneration before activation. Runtime reconciliation then
assigns its MicroSystems, Contributions, Services, Capabilities, scoped storage,
and lineage boundaries. Package, MicroSystem, Contribution, and Provider remain
separate concepts.

Generation replacement preserves pinned durable work and owner data according to
their contracts. New work binds to the new generation; old work either retains
a compatible handler or is explicitly migrated, cancelled, superseded, or
blocked. Code retirement does not implicitly delete configuration, data, or
secrets.

## Configuration and owner-native state

Configuration source changes flow through validation, immutable revision
materialization, impact planning, policy/approval, activation, and Runtime
reconciliation. An invalid declarative source leaves the last-known-good active
revision in place.

Owner-native configuration and data remain owned by their package/domain while
using governed lifecycle roots, DataOwner metadata, backup participation, purge
fences, and lineage. Storage governance does not impose one universal data
model.

## External effects

The external world is not rolled back by local recovery. A consequential effect
crosses an explicit uncertainty boundary:

```text
prepared
→ dispatching
→ succeeded | failed | uncertain
```

If recovery cannot prove the result, reconciliation keeps the effect uncertain
and does not blindly resend it.

## Backup, restore, and update

Backup enumerates logical DataOwners and BackupParticipants, captures the
required configuration/blob/secret/package closure, and seals a manifest with
digests and portability metadata. A Subject Bundle is a separate semantic
export.

Destructive restore acquires Bootstrap ownership while the Host lease is still
held, enters a fixed RecoveryOperation, creates a new ContinuityEpochId, and
reconciles sessions, approvals, management operations, WorkItems, effects,
purge records, and package trust before normal Runtime/DBOS exposure. It
preserves logical InstanceId but does not copy the source installation's
bootstrap root.

Product update separately evaluates ProductGeneration, durable-code version,
and Extension PackageGeneration. The declared migration class and recovery
strategy determine whether the candidate can be activated, restored, or must
fail closed.

## Safe mode and shutdown

Safe Mode disables ineligible optional generations while preserving Desired
State, diagnostics, and bounded management/recovery access. Graceful shutdown
stops new consequential admission, retires dependent work and owned resources,
records terminal lineage, performs the reverse Host/Bootstrap handoff when
private PostgreSQL stops, and finalizes the bootstrap journal. The retired
product runtime is not reopened in place.

## References

- [Execution model](./execution-model.md)
- [Management presentation](./management-presentation.md)
- [Storage lifecycle](./storage-lifecycle.md)
- [Backup, portability, update, and recovery](./backup-portability-update-recovery.md)
- [Bootstrap closure Spec](../../specs/runtime/bootstrap-closure.md)
- [Work Item Spec](../../specs/execution/work-item.md)
- [Evidence Spec](../../specs/execution/evidence.md)
