# AI Runtime Contract

## Scope

This Spec owns the Product AI runtime semantic boundary:

```
GatewayProfile
ModelProfile
ModelBinding
InvocationSpec
gateway/protocol runtime materialization
structured generation result
usage and gateway/model provenance
abort/timeout boundary
```

AI SDK 7 supplies adopted provider/model and generation mechanics. Heptalogos
owns Product Authority, Subject identity, invocation meaning, schema
validation, readiness, lineage, and behavior commit. SDK/client objects are
runtime materializations and never canonical Product state.

## Ownership and current roles

AIRuntime owns GatewayProfile, ModelProfile, ModelBinding, InvocationSpec, and
their runtime provenance. ConfigurationService owns the active gateway
transport revision; SecretService owns SecretRef resolution; NetworkAccess
owns controllable Host-originated gateway transport; Subject and Reaction
owners decide whether a result can be consumed.

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
interface GatewayProfile {
  readonly schemaVersion: 1;
  readonly gatewayProfileId: GatewayProfileId;
  readonly baseUrl: string;
  readonly apiTokenSecretRef?: SecretRef;
  readonly enabled: boolean;
}

interface ModelProfile {
  readonly schemaVersion: 1;
  readonly modelProfileId: ModelProfileId;
  readonly gatewayProfileId: GatewayProfileId;
  readonly modelIdentifier: string;
  readonly protocol: "openai-chat" | "openai-responses";
  readonly consumedCapabilities: readonly ModelCapability[];
  readonly generation: number;
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
  readonly ownerActivityRef: ActivityId;
  readonly modelBindingId: ModelBindingId;
  readonly expectedBindingRevision: number;
  readonly contextProjection: CanonicalJsonValue;
  readonly messages: readonly AIRuntimeMessage[];
  readonly objective: string;
  readonly outputSchema: CanonicalJsonValue;
  readonly budget: InvocationBudget;
  readonly deadline?: Instant;
  readonly lineageContextRef: LineageContextRef;
}

interface GenerationResult {
  readonly schemaVersion: 1;
  readonly invocationId: InvocationId;
  readonly bindingRevision: number;
  readonly gatewayProfileId: GatewayProfileId;
  readonly modelProfileId: ModelProfileId;
  readonly modelProfileGeneration: number;
  readonly modelIdentifier: string;
  readonly protocol: "openai-chat" | "openai-responses";
  readonly configurationRevisionId: ConfigurationRevisionId;
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
→ selected ModelProfile and GatewayProfile
→ exact active ConfigurationRevision selected for this invocation
→ authorized Secret resolution
→ exact NetworkAccess target
→ AI SDK openai-chat or openai-responses mechanics
→ JSON Schema validation through SchemaRuntime/Ajv
→ consuming owner proposal/review/commit
```

AIRuntime does not become Context Authority. ContextProjection is invocation
input, not long-lived Subject state. Protocol SDK instances may be created or
closed as runtime resources; their existence is not readiness or Product
identity.

For `openai-chat`, AIRuntime uses the broad-compatible JSON-object response
format and adds the InvocationSpec schema requirement to the system text using
the adopted AI SDK JSON-instruction helper. It does not claim universal native
`json_schema` support. For `openai-responses`, AIRuntime uses the adopted
Responses mechanics. Both routes use SchemaRuntime/Ajv as the final canonical
validator. AIRuntime and NetworkAccess preserve the one exact
ConfigurationRevision selected for the invocation, and GenerationResult records
that revision. GenerationResult remains proposal/evidence until the consuming
owner commits it.

An invocation may be observed as ADMITTED, RUNNING, SUCCEEDED, FAILED,
ABORTED, or TIMED_OUT in Activity/diagnostic projections. These are not a
second canonical Subject behavior state machine. A stale binding or generation
result is inadmissible even if the provider call succeeded.

## Readiness and failure semantics

Readiness is binding-driven. For each enabled current binding, AIRuntime
requires a current configuration revision, an enabled selected GatewayProfile,
an implemented selected protocol, an optional active/resolvable scoped token,
and an exact NetworkAccess target. An unused gateway or model does not block
the Product route. A missing or stale binding is a structured dependency
failure, not a fabricated model or fallback.

The canonical Problem projection distinguishes at least:

```
ai.gateway_unavailable
ai.gateway_configuration_invalid
ai.secret_unavailable
ai.network_unavailable
ai.model_binding_unavailable
ai.model_binding_stale
ai.output_schema_invalid
ai.invocation_aborted
ai.invocation_timed_out
ai.generation_mismatch
```

Gateway failure before a consuming DecisionCommit cannot fabricate a
decision or response. Timeout/abort is not a successful structured result.
Usage and the actual gateway, model, protocol, binding revision, model
generation, and configuration revision remain attributable through Lineage and
Evidence whenever the Product consumes them.

## Invariants

- AIR-001 Subject identity and Authority never belong to an SDK, gateway, model, or prompt object.
- AIR-002 GatewayProfile, ModelProfile, and ModelBinding are Product state; SDK instances are runtime materialization only.
- AIR-003 InvocationSpec binds an exact ModelBinding revision and carries its own lineage context.
- AIR-004 A stale binding, model generation, or configuration result cannot commit as current.
- AIR-005 Every model result is proposal/evidence until its consuming owner accepts it.
- AIR-006 Structured output passes canonical schema and domain validation before Behavior commit.
- AIR-007 Secret material is resolved only for an authorized invocation and is not copied into durable InvocationSpec plaintext.
- AIR-008 Controllable gateway HTTP traffic uses NetworkAccess and the selected exact destination.
- AIR-009 Gateway failure before DecisionCommit cannot fabricate canonical behavior.
- AIR-010 Consumed gateway, model, protocol, binding revision, model generation, configuration revision, and usage metadata remain attributable through Lineage/Evidence.
- AIR-011 The current Subject slice has no tool authority or tool-loop mechanics.
- AIR-012 AIRuntime defines no internal System Assistant/OpenClaw model binding.

## Management projection and lifecycle

Normal Management may inspect and govern GatewayProfile, ModelProfile,
ModelBinding, active gateway transport configuration, and readiness diagnostics. It
must not expose Secret plaintext or SDK instances. A binding change is a
canonical Product mutation with a new binding revision; it does not create a
new Subject. Runtime protocol objects are request-scoped materializations and
have no independent durable lifecycle.

## Current-slice exclusions

This Spec does not define:

```
AI SDK Agent or WorkflowAgent
tool calls or autonomous multi-step loops
MCP invocation
provider fleet/failover/registry/health
direct vendor adapters
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
