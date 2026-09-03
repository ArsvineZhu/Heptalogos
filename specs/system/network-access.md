# NetworkAccess Contract

## Scope

This Spec owns managed outbound network access originating in the Heptalogos
Product Host. It is needed by Product services such as AIRuntime gateway
calls. It does not claim control over networking performed inside OpenClaw,
opaque spawned processes, MCP stdio servers, or another external execution
domain unless a real enforcement boundary controls that traffic.

## Ownership and mechanics

NetworkAccessService owns requester identity, destination policy, request
budgets, redirect authorization, transport cancellation, and transport-level
diagnostics. Gateway/model semantics remain AIRuntime-owned; consequential
external-effect truth remains EffectOperation-owned. Node/Undici supplies
transport mechanics behind this semantic boundary. NetworkAccess does not
become a general proxy fleet, VPN manager, service mesh, retry engine, or
message broker.

## Normative request shape

```ts
interface NetworkRequestSpec {
  readonly schemaVersion: 1;
  readonly requester: ProductSemanticId;
  readonly destination: URL;
  readonly method: string;
  readonly headers: readonly RequestHeader[];
  readonly credentialHeaderClass:
    "NONE" | "PRODUCT_SECRET" | "COOKIE" | "OTHER_SENSITIVE";
  readonly timeout: Duration;
  readonly deadline?: Instant;
  readonly requestBodyBudget: ByteBudget;
  readonly responseBodyBudget: ByteBudget;
  readonly expandedResponseBodyBudget: ByteBudget;
  readonly redirectPolicy: RedirectPolicy;
  readonly signal: AbortSignal;
  readonly executionContext: ExecutionContext;
  readonly lineageContextRef: LineageContextRef;
}

interface NetworkResponseKnowledge {
  readonly statusCode: number;
  readonly finalDestination: URL;
  readonly headers: readonly ResponseHeader[];
  readonly body: Uint8Array;
  readonly bytesRead: number;
  readonly expandedBytesRead: number;
  readonly lineageContextRef: LineageContextRef;
}
```

RequestHeader and ResponseHeader carry sensitivity classification. A request body
is streamed under its budget. A response is streamed under both
compressed/transferred and expanded/decompressed budgets; buffering an
unbounded body before checking a limit is not conformant.

## Redirect and credential semantics

Every redirect is a new destination authorization decision. The implementation
must re-evaluate scheme, host, port, path policy, and resource scope before
following it. Sensitive authorization and cookie headers are not forwarded
across an unauthorized origin or destination transition. A redirect that is
not explicitly permitted is a structured failure, not an automatic follow.

## Lifecycle and failure semantics

NetworkAccess requests are ephemeral transport activities by default; the
current slice does not create a durable NetworkOperation state machine. Required Activity,
Lineage, Evidence, and telemetry projections are recorded according to their
own contracts.

```
validate requester/policy/budget
→ admit transport
→ stream request/response under budgets
→ return response knowledge or structured Problem
```

Timeout, abort, connection reset, or transport exception is knowledge about
transport. It is not proof that a consequential external effect failed; an
EffectOperation caller must preserve UNCERTAIN when the effect outcome is
ambiguous. A definitive HTTP response may still be a gateway or domain
failure and is not automatically a Product success.

The canonical Problem projection distinguishes at least:

```
network.unauthorized_destination
network.redirect_denied
network.request_budget_exceeded
network.response_budget_exceeded
network.expanded_response_budget_exceeded
network.timeout
network.aborted
network.connection_reset
network.transport_unavailable
```

There is no hidden unsafe automatic retry. Retry classification belongs to the
consuming owner and existing Foundation WorkItem/EffectOperation contracts.

## Invariants

- NET-001 Gateway HTTP traffic claiming NetworkAccess control must actually use this boundary.
- NET-002 Every redirect re-evaluates destination policy before follow.
- NET-003 Sensitive authorization and cookie headers are not forwarded across unauthorized destination/origin transitions.
- NET-004 Timeout or abort is transport knowledge, not proof that a consequential external effect failed.
- NET-005 Request and response budgets are enforced while streaming.
- NET-006 Compressed responses are bounded by expanded-body limits as well as transfer limits.
- NET-007 Connection reset and transport exceptions become structured Problem/knowledge, not hidden unsafe retry.
- NET-008 NetworkAccess owns transport policy, not gateway, model, Subject, or external-effect semantics.
- NET-009 A spawned external process is OPAQUE_EXTERNAL for internal networking unless separately controlled.
- NET-010 Gateway SDK transport injection/control must be demonstrated before a gateway route is implementation-READY.

## Management and consumer projection

Normal Management may expose owned policy metadata and bounded diagnostics:
requester, policy decision, destination classification, budget outcome, and
Lineage reference. It must redact credential-bearing headers, body content, and
sensitive response data. AIRuntime consumes this contract for controllable
gateway traffic; Subject readiness may consume its availability result.
OpenClaw/Machine Operations network activity is not represented as controlled
Host NetworkAccess merely because the Host initiated or observed a tool call.

## Current-slice exclusions

This Spec does not define:

```
general proxy fleet
VPN/service-mesh manager
generic retry engine
network broker or effect broker
control over opaque external process networking
gateway/model capability semantics
consequential external-effect outcome state
physical network policy deployment
```

## References

- [AI Runtime Spec](./ai-runtime.md)
- [Effect Operation](../execution/effect-operation.md)
- [Work Item](../execution/work-item.md)
- [Execution Lineage](../execution/execution-lineage.md)
- [Evidence](../execution/evidence.md)
- [Configuration architecture](../../docs/architecture/configuration.md)
- [AI Runtime architecture](../../docs/architecture/ai-runtime.md)
- [Contract Versioning](../core/contract-versioning.md)
