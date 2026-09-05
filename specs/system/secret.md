# Secret Contract

## Scope

This Spec owns the normal Product secret boundary:

```
SecretRef
SecretMetadata
SecretService
SecretBackend semantic contract
normal Product secret lifecycle
```

It does not own BootstrapKeyProvider, OpenClaw credentials, Machine
Operations credentials, or an unselected universal secret-manager framework.

## Ownership

SecretService owns secret identity, metadata, authorization to resolve,
replacement/revocation semantics, and the normal Product Management projection.
An adopted platform backend supplies storage and cryptographic mechanics behind
the semantic boundary. Configuration, AIRuntime, and other consumers own their
references and readiness consequences; they do not read a backend directly.

Resolved material is an ephemeral process-memory value. It is deliberately not
a serializable Product DTO and is never a general-purpose repository value.

For the model gateway boundary, SecretService owns only the Heptalogos caller
token:

```text
purpose = ai.gateway.bearer-token
consumer = system.ai-runtime OR product.subject.openclaw
scope = gateway-profile / GatewayProfileId
```

SecretService does not own NewAPI administrator credentials, NewAPI upstream
provider/channel keys, upstream DeepSeek/OpenAI/etc. keys when NewAPI is the
gateway, or Machine Operations credentials. The Product-supervised Subject
OpenClaw adapter may resolve the same scoped Heptalogos gateway token under its
explicit `product.subject.openclaw` consumer and inject it only into the owned
runtime process; OpenClaw provider-private credentials remain outside this
normal Secret boundary. No vendor-specific Secret type is defined.

## Normative types

```ts
interface SecretRef {
  readonly schemaVersion: 1;
  readonly secretId: SecretId;
}

interface SecretMetadata {
  readonly schemaVersion: 1;
  readonly secretId: SecretId;
  readonly state: "ACTIVE" | "REVOKED" | "UNAVAILABLE";
  readonly purpose: string;
  readonly scopeRef?: ProductResourceRef;
  readonly backendKind: string;
  readonly createdAt: Instant;
  readonly replacedAt?: Instant;
  readonly revokedAt?: Instant;
}

interface SecretResolutionContext {
  readonly consumer: ProductSemanticId;
  readonly purpose: string;
  readonly resourceRef?: ProductResourceRef;
}

interface ResolvedSecretMaterial {
  readonly __ephemeral: true;
  readonly bytes: Uint8Array;
}

interface SecretService {
  createOrSet(
    input: SecretWriteInput,
    context: SecretResolutionContext,
  ): Promise<SecretRef>;
  replace(
    ref: SecretRef,
    input: SecretWriteInput,
    context: SecretResolutionContext,
  ): Promise<SecretRef>;
  revoke(ref: SecretRef, context: SecretResolutionContext): Promise<void>;
  getMetadata(
    ref: SecretRef,
    context: SecretResolutionContext,
  ): Promise<SecretMetadata>;
  resolve(
    ref: SecretRef,
    context: SecretResolutionContext,
  ): Promise<ResolvedSecretMaterial>;
}
```

SecretWriteInput is accepted only at a protected input boundary and is not a
normal exported Product DTO. resolve is semantically equivalent to the
context-bound operation above; an implementation may use a narrower internal
type as long as consumer, purpose, and resource scope remain enforced.

## Lifecycle and transaction boundary

```
create/set
→ ACTIVE material + metadata

replace
→ new current material/version
→ prior material is no longer current

revoke
→ REVOKED

backend/read failure
→ UNAVAILABLE observation
```

Secret metadata mutation and required Lineage/Evidence use the normal
Host-fenced canonical boundary. Secret materialization and backend I/O occur
outside a general Product mutation transaction. A replacement changes current
material state; it does not claim that every already-running consumer has
reloaded it. Consumers must re-resolve according to their own lifecycle and
readiness contract.

Revocation is not a plaintext deletion promise and unavailability is not a
successful empty value. A consumer that requires a revoked or unavailable
secret becomes dependent BLOCKED through its owning readiness contract.

## Invariants

- SEC-001 Configuration and database Product state contain SecretRef, never secret plaintext.
- SEC-002 Plaintext never enters logs, Problem, Evidence, Activity attributes, Lineage, durable WorkItem payload, Management structured output, argv, ordinary environment projection, or error text.
- SEC-003 Possessing a SecretRef is insufficient; resolution is bound to authorized consumer, purpose, and resource scope.
- SEC-004 Resolution creates no durable plaintext cache, replay payload, or generic serialized material.
- SEC-005 Replace changes current material state without pretending that all runtime consumers automatically reloaded it.
- SEC-006 Revoked or unavailable material yields a structured dependent readiness failure; there is no plaintext fallback.
- SEC-007 BootstrapKeyProvider remains separate from normal SecretService state and ceremony.
- SEC-008 OpenClaw provider-private and Machine Operations credentials are not
  normal Host SecretService state; the bounded Subject adapter may consume only
  the explicitly scoped Heptalogos gateway token under its named consumer.
- SEC-009 Backend mechanics are platform-composed behind this contract; the current slice does not select one universal secret library.
- SEC-010 Exact native/source-less backend behavior is an implementation qualification claim, not a current-slice claim.

## Failure semantics and Management projection

The canonical Problem projection distinguishes at least:

```
secret.invalid_ref
secret.unauthenticated
secret.unauthorized
secret.unavailable
secret.revoked
secret.scope_mismatch
```

Normal Management can set, replace, revoke, and inspect metadata when policy
allows. It has no ordinary plaintext reveal, export, or plaintext list
operation. Metadata projections redact backend details and purpose/scope values
when their sensitivity requires it. Secret resolution is available only to an
authorized runtime consumer and returns ephemeral material to that consumer's
controlled invocation boundary.

## Current-slice exclusions

This Spec does not define:

```
BootstrapKeyProvider implementation
OpenClaw provider-private/Machine Operations credential ownership
Machine Operations credential storage
generic secret-manager federation
ordinary plaintext reveal/export/list
plaintext configuration fallback
physical SQL schema or migrations
```

## References

- [Configuration Spec](./configuration.md)
- [AI Runtime Spec](./ai-runtime.md)
- [Configuration architecture](../../docs/architecture/configuration.md)
- [System Authority Spec](../management/system-authority.md)
- [Bootstrap Closure](../runtime/bootstrap-closure.md)
- [Persistence Transactions](../data/persistence-transactions.md)
- [Evidence](../execution/evidence.md)
- [Contract Versioning](../core/contract-versioning.md)
