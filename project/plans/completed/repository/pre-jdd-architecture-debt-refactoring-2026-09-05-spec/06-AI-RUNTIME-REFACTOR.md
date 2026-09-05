# 06 — AIRuntime Refactor

## 1. Preserve ownership

AIRuntime continues to own:

- GatewayProfile;
- ModelProfile;
- ModelBinding;
- route readiness;
- generation route/provenance;
- AI SDK invocation adapter;
- generation commit admissibility.

NetworkAccess owns network authorization.
SecretService owns secret material.
Configuration owns transport configuration.
AI SDK/provider libraries own generic model protocol mechanics.

## 2. Target modules

```text
src/
  contracts.ts
  repository.ts
  routing.ts
  invocation.ts
  service.ts
  problems.ts
  index.ts
```

Optional small `validation.ts` is allowed only if shared between repository and
routing; do not create a validation framework.

## 3. Repository

Own:

- GatewayRow / ModelRow / BindingRow;
- row decoding/encoding;
- list/read profile/binding;
- set GatewayProfile;
- set ModelProfile;
- set ModelBinding;
- optimistic/current digest checks that are persistence-atomic.

Repository does not instantiate AI SDK models.

## 4. Routing

Own:

- canonical gateway URL/protocol/capability validation if not purely repository
  codec;
- resolve role → binding → model → gateway;
- NetworkAccess authorization for the route;
- Secret metadata/resolve policy for invocation;
- current transport ConfigurationRevision;
- readiness;
- generation commit-admissibility fence.

Expose one internal resolved invocation context with only Heptalogos-owned data
needed by `invocation.ts`.

Do not expose raw SecretService material beyond the narrow invocation lifetime.

## 5. Invocation adapter

Own AI SDK mechanics:

```text
openai-chat
openai-responses
structured output mode
AbortSignal / timeout
maxOutputTokens
usage metadata
provider response normalization
```

Use current adopted packages:

- `ai`;
- `@ai-sdk/openai-compatible`;
- `@ai-sdk/open-responses`;
- `@ai-sdk/provider-utils`.

Do not implement a home-grown HTTP OpenAI client.

Do not leak AI SDK model/provider types into AIRuntime public contracts.

## 6. Service facade

`createAIRuntimeService` composes repository/routing/invocation and returns the
current public service surface.

The facade may coordinate Evidence after a generation result, but it should not
contain provider-construction code and SQL CRUD side by side.

## 7. Error/failure semantics

Preserve current distinctions:

- invalid configuration;
- missing/disabled binding/model/gateway;
- network policy denial;
- unavailable secret;
- timeout/abort;
- provider failure;
- malformed structured result;
- stale route/config generation at commit.

Do not add retry policy. Callers own retry/re-entry semantics.

## 8. Tests

Focused tests should be separated enough to run independently:

```text
profile-routing
readiness/admissibility
chat invocation
responses invocation
structured output / failure mapping
```

Use current mock/local provider mechanics; no new provider-test framework.

## 9. Acceptance

A future AI SDK protocol change should primarily touch `invocation.ts`; a
GatewayProfile/ModelBinding persistence change should primarily touch
`repository.ts`/`routing.ts`.

That reduced co-change is the objective, not an arbitrary line count.
