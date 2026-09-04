# Configuration Contract

## Scope

This Spec owns normal Product configuration for the first Product slice:

```
ConfigurationDefinition
ConfigurationRevision
ConfigurationActivation
effective configuration resolution
Management-facing configuration metadata
```

It does not own the minimum configuration required before normal PostgreSQL
and Host Authority exist. That bootstrap input remains Bootstrap-owned and is
described only as BOOTSTRAP_FILE at this boundary. A normal Product
configuration value is PostgreSQL-backed canonical state whose current write
source is MANAGED_REVISION.

## Ownership

ConfigurationService owns definition registration, revision validation and
immutability, activation Authority, effective-value resolution, and the
configuration Management projection. The owning Product Service remains
responsible for the meaning and runtime consumption of its configuration
namespace. Persistence owns transaction mechanics; Host Ownership owns the
write fence; SchemaRuntime owns JSON Schema validation; Lineage and Evidence
own their respective causal records.

Configuration is not SecretService, derived runtime state, a provider SDK
object, or a generic file/codec framework. A configuration projection never
becomes Authority merely because a client can display it.

## Current source boundary

The current slice recognizes these source meanings only at the semantic
boundary:

```
BOOTSTRAP_FILE
→ bounded pre-PostgreSQL/bootstrap input; not normal Product state

MANAGED_REVISION
→ PostgreSQL-backed managed revision; the only normal current-slice write source
```

DECLARATIVE_FILE, OWNER_NATIVE, and generic derived-source frameworks are
deferred. The current slice does not define a source registry, configuration codec system,
file watcher, reload daemon, or Extension-native configuration projection.
The adopted js-toml route is not used merely because it exists in dependency
Authority.

## Normative types

The following shapes are semantic contracts; existing repository identity,
time, canonical JSON, lineage, evidence, and schema types remain authoritative
where they already own the concept.

```ts
interface ConfigurationDefinition {
  readonly schemaVersion: 1;
  readonly definitionId: ConfigurationDefinitionId;
  readonly owner: ProductSemanticId;
  readonly version: number;
  readonly scopeKind: "INSTALLATION" | "SUBJECT" | "RESOURCE";
  readonly valueSchema: JsonSchemaRef;
  readonly classification:
    "PRODUCT_INVARIANT" | "INSTALLATION_CONFIG" | "SUBJECT_CONFIG" | "RESOURCE_CONFIG";
  readonly visibility: "NORMAL" | "ADVANCED" | "EXPERT" | "INTERNAL" | "HIDDEN";
  readonly manageability:
    "EDITABLE" | "READ_ONLY" | "SYSTEM_MANAGED" | "PRODUCT_LOCKED";
  readonly activation:
    | "LIVE"
    | "RELOAD_COMPONENT"
    | "RESTART_COMPONENT"
    | "RESTART_SUBJECT"
    | "RESTART_HOST"
    | "MAINTENANCE"
    | "NEXT_BOOT"
    | "IMMUTABLE_AFTER_INIT";
  readonly sensitivity: "PUBLIC" | "INTERNAL" | "SENSITIVE";
  readonly defaultAuthority:
    | "PRODUCT_DEFAULT"
    | "PLATFORM_DEFAULT"
    | "PROVIDER_DEFAULT"
    | "AUTO_DETECTED"
    | "NO_DEFAULT_REQUIRED";
  readonly consumerRefs: readonly ProductSemanticId[];
}

interface ConfigurationRevision {
  readonly schemaVersion: 1;
  readonly revisionId: ConfigurationRevisionId;
  readonly definitionId: ConfigurationDefinitionId;
  readonly definitionVersion: number;
  readonly scopeRef: ProductResourceRef;
  readonly value: CanonicalJsonValue;
  readonly source: "MANAGED_REVISION";
  readonly status: "PROPOSED" | "COMMITTED";
  readonly valueDigest: Digest;
  readonly createdAt: Instant;
  readonly lineageContextRef: LineageContextRef;
}

interface ConfigurationActivation {
  readonly schemaVersion: 1;
  readonly activationId: ConfigurationActivationId;
  readonly scopeRef: ProductResourceRef;
  readonly activeRevisionId: ConfigurationRevisionId;
  readonly previousRevisionId?: ConfigurationRevisionId;
  readonly impact: ConfigurationDefinition["activation"];
  readonly effectiveAt: Instant;
  readonly lineageContextRef: LineageContextRef;
  readonly evidenceRefs: readonly EvidenceRef[];
}
```

scopeRef identifies the installation, Subject, or resource selected by the
definition. A committed revision is immutable. The active value is resolved
from the committed activation for that scope; a proposed or merely committed
inactive revision is not effective configuration.

Defaults are Authority-labelled inputs. A materialized behavior default is
stored in the resulting revision or activation context so a dependency or
ProductGeneration change cannot silently change current behavior.

The current gateway transport definition is:

```text
ai.gateway.transport.v1
scope = INSTALLATION
owner = system.network-access
consumers = system.network-access, system.ai-runtime
activation = LIVE
defaultAuthority = NO_DEFAULT_REQUIRED
```

## Lifecycle and transactions

The semantic flow is:

```
definition registered
→ proposal normalized without coercion
→ schema and owner validation
→ SystemChangePlan / policy / approval when required
→ committed immutable MANAGED_REVISION
→ activation fenced and committed
→ post-commit runtime reconciliation
→ effective-value verification
```

Creating a revision is a Host-fenced canonical transaction. It may persist the
revision and required Lineage/Evidence, but it does not mutate a runtime
consumer inside the transaction. Activating a revision is a separate
Host-fenced canonical mutation that records active and previous revision,
impact, effective time, Lineage, and Evidence. Runtime reconciliation starts
only after activation commits.

An activation compare-and-set must include the expected active revision when a
caller planned from an existing activation. A stale plan or stale activation
must fail without replacing current Authority. Runtime consumers must resolve
the active revision and report readiness/activation failure when they cannot
apply it; accepting a revision that no consumer uses is a conformance failure.

## Invariants

- CFG-001 Existence, visibility, and editability are independent. INTERNAL or HIDDEN is not the same as hard-coded.
- CFG-002 A behavior-affecting value receives explicit configuration classification before mutable exposure.
- CFG-003 Secret plaintext is never a configuration value; configuration stores a SecretRef where a secret is needed.
- CFG-004 A committed ConfigurationRevision is immutable, including its definition/version, scope, value, source, and digest.
- CFG-005 A proposed or inactive revision is not active until a canonical activation commits.
- CFG-006 Validation, policy, fence, or activation failure preserves the previous active Authority.
- CFG-007 Activation is a Host-fenced canonical mutation with required Lineage and Evidence.
- CFG-008 Every mutable configuration definition names real runtime consumers; accepted-but-unused configuration is invalid.
- CFG-009 Materialized behavior defaults are pinned and do not drift silently after dependency or ProductGeneration changes.
- CFG-010 An unsupported current schema or unknown required field fails explicitly; no legacy reader or fallback parser exists.
- CFG-011 Current-slice normal write Authority is MANAGED_REVISION; there is no second editable source.
- CFG-012 Activation impact is explicit. Clients do not infer restart/reload behavior from a key name.

## Failure semantics and Management projection

Configuration uses the existing canonical Problem contract. The owning
projection should distinguish at least:

```
configuration.invalid_input
configuration.unsupported_shape
configuration.stale_revision
configuration.activation_conflict
configuration.consumer_unavailable
configuration.activation_failed
```

An invalid proposed value is rejected before it can become active. A failed
activation does not roll the active value forward by implication and does not
rewrite a user's desired value as a successful runtime state. A client can
describe definitions, inspect active/proposed revisions, validate a proposal,
show impact, and request activation through normal Management/CLI projections,
subject to visibility, manageability, policy, and redaction. The projection
must show source and activation impact without exposing Secret material.

## Current-slice exclusions

This Spec does not define:

```
DECLARATIVE_FILE or OWNER_NATIVE normal sources
generic DERIVED_READ_ONLY source framework
generic configuration codecs
file watch/reload infrastructure
Persona, Memory, Relationship, or Attention configuration
physical SQL tables or migrations
package topology
```

## References

- [Configuration architecture](../../docs/architecture/configuration.md)
- [System Authority Spec](../management/system-authority.md)
- [Secret Spec](./secret.md)
- [Persistence Transactions](../data/persistence-transactions.md)
- [Host Ownership](../runtime/host-ownership.md)
- [Canonical Schema](../data/canonical-schema.md)
- [Contract Versioning](../core/contract-versioning.md)
- [Execution Lineage](../execution/execution-lineage.md)
- [Evidence](../execution/evidence.md)
