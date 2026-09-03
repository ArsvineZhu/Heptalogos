# AI Runtime Contract

## Scope

This Spec owns the Product AI runtime semantic boundary:

```
ProviderProfile
ModelProfile
ModelBinding
InvocationSpec
provider/model runtime materialization
structured generation result
usage and provider provenance
abort/timeout boundary
```

AI SDK 7 supplies adopted provider/model and generation mechanics. Heptalogos
owns Product Authority, Subject identity, invocation meaning, schema
validation, readiness, lineage, and behavior commit. SDK/client objects are
runtime materializations and never canonical Product state.

## Ownership and current roles

AIRuntime owns ProviderProfile, ModelProfile, ModelBinding, InvocationSpec, and
their runtime provenance. ConfigurationService owns referenced configuration
revisions; SecretService owns SecretRef resolution; NetworkAccess owns
controllable Host-originated provider transport; Subject and Reaction owners
decide whether a result can be consumed.

The current Heptalogos ModelBinding role set is exactly:

```
subject.primary
subject.expression
```

Both roles may resolve to the same ModelProfile. No current binding exists for
System Assistant, Operator, reviewer, embedding, Memory, Relationship,
Attention, or another future cognition subsystem. OpenClaw model configuration
is OpenClaw-owned and is not a Host AIRuntime binding.

## Normative types

```ts
interface ProviderProfile {
  readonly schemaVersion: 1;
  readonly providerProfileId: ProviderProfileId;
  readonly providerKind: string;
  readonly configurationRevisionRef: ConfigurationRevisionRef;
  readonly secretRefs: readonly SecretRef[];
  readonly networkAccessProfileRef: NetworkAccessProfileRef;
  readonly enabled: boolean;
  readonly providerSettings: CanonicalJsonValue;
}

interface ModelProfile {
  readonly schemaVersion: 1;
  readonly modelProfileId: ModelProfileId;
  readonly providerProfileId: ProviderProfileId;
  readonly providerModelIdentifier: string;
  readonly consumedCapabilities: readonly ModelCapability[];
  readonly generation: number;
  readonly configurationRevisionRef: ConfigurationRevisionRef;
}

interface ModelBinding {
  readonly schemaVersion: 1;
  readonly modelBindingId: ModelBindingId;
  readonly role: "subject.primary" | "subject.expression";
  readonly modelProfileId: ModelProfileId;
  readonly revision: number;
  readonly enabled: boolean;
}

interface InvocationSpec {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly ownerActivityRef: ActivityRef;
  readonly modelBindingId: ModelBindingId;
  readonly expectedBindingRevision: number;
  readonly contextProjection: ContextProjectionRef | CanonicalJsonValue;
  readonly objective: string;
  readonly outputSchema: JsonSchemaRef;
  readonly budget: InvocationBudget;
  readonly deadline?: Instant;
  readonly lineageContextRef: LineageContextRef;
}

interface GenerationResult {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly bindingRevision: number;
  readonly providerProfileId: ProviderProfileId;
  readonly modelProfileId: ModelProfileId;
  readonly providerModelIdentifier: string;
  readonly candidate: CanonicalJsonValue;
  readonly usage?: UsageMetadata;
  readonly lineageContextRef: LineageContextRef;
  readonly evidenceRefs: readonly EvidenceRef[];
}
```

ModelCapability for the current Subject slice is limited to text generation, structured
output, usage metadata when supplied, and abort/timeout. GenerationResult is a
proposal/evidence record until the consuming semantic owner accepts it.

## Invocation and structured output

The invocation boundary is:

```
ContextProjection
→ InvocationSpec bound to exact ModelBinding revision
→ authorized Secret resolution
→ controllable NetworkAccess transport
→ AI SDK structured generation mechanics
→ JSON Schema validation through SchemaRuntime/Ajv
→ consuming owner proposal/review/commit
```

AIRuntime does not become Context Authority. ContextProjection is invocation
input, not long-lived Subject state. Provider and model SDK instances may be
created or closed as runtime resources; their existence is not readiness or
Product identity.

An invocation may be observed as ADMITTED, RUNNING, SUCCEEDED, FAILED,
ABORTED, or TIMED_OUT in Activity/diagnostic projections. These are not a
second canonical Subject behavior state machine. A stale binding or generation
result is inadmissible even if the provider call succeeded.

## Readiness and failure semantics

Provider readiness requires an enabled ProviderProfile, valid active
configuration, authorized SecretRef resolution, usable NetworkAccess policy,
and a provider route that has demonstrated the required transport control.
ModelBinding readiness additionally requires a current ModelProfile and exact
binding revision. A missing or stale binding is a structured dependency
failure, not a fabricated model or fallback provider.

The canonical Problem projection distinguishes at least:

```
ai.provider_unavailable
ai.provider_configuration_invalid
ai.secret_unavailable
ai.network_unavailable
ai.model_binding_unavailable
ai.model_binding_stale
ai.output_schema_invalid
ai.invocation_aborted
ai.invocation_timed_out
ai.generation_mismatch
```

Provider failure before a consuming DecisionCommit cannot fabricate a
decision or response. Timeout/abort is not a successful structured result.
Usage and actual provider/model/binding revision remain attributable through
Lineage and Evidence whenever the Product consumes them.

## Invariants

- AIR-001 Subject identity and Authority never belong to an SDK, provider, model, or prompt object.
- AIR-002 ProviderProfile, ModelProfile, and ModelBinding are Product state; SDK instances are runtime materialization only.
- AIR-003 InvocationSpec binds an exact ModelBinding revision and carries its own lineage context.
- AIR-004 A stale binding, generation, or configuration result cannot commit as current.
- AIR-005 Every model result is proposal/evidence until its consuming owner accepts it.
- AIR-006 Structured output passes canonical schema and domain validation before Behavior commit.
- AIR-007 Secret material is resolved only for an authorized invocation and is not copied into durable InvocationSpec plaintext.
- AIR-008 Controllable provider HTTP traffic uses NetworkAccess.
- AIR-009 Provider failure before DecisionCommit cannot fabricate canonical behavior.
- AIR-010 Consumed provider, model, binding revision, generation, and usage metadata remain attributable through Lineage/Evidence.
- AIR-011 The current Subject slice has no tool authority or tool-loop mechanics.
- AIR-012 AIRuntime defines no internal System Assistant/OpenClaw model binding.

## Management projection and lifecycle

Normal Management may inspect and govern ProviderProfile, ModelProfile,
ModelBinding, active configuration references, and readiness diagnostics. It
must not expose Secret plaintext or SDK instances. A binding change is a
canonical Product mutation with a new binding revision; it does not create a
new Subject. Runtime reconciliation materializes or retires provider/model
resources after canonical state is committed.

## Current-slice exclusions

This Spec does not define:

```
AI SDK Agent or WorkflowAgent
tool calls or autonomous multi-step loops
MCP invocation
provider fleet/failover
reviewer agent
embedding
vision/files without a hard current consumer
System Assistant/OpenClaw runtime
Subject identity or DecisionCommit ownership
```

## References

- [AI Runtime architecture](../../docs/architecture/ai-runtime.md)
- [Subject Base Spec](../subject/subject-base.md)
- [Reaction and Behavior Authority](../subject/reaction-behavior.md)
- [Configuration Spec](./configuration.md)
- [Secret Spec](./secret.md)
- [NetworkAccess Spec](./network-access.md)
- [Service, Capability, and Readiness](../core/service-capability-readiness.md)
- [Execution Lineage](../execution/execution-lineage.md)
- [Evidence](../execution/evidence.md)
- [Contract Versioning](../core/contract-versioning.md)
