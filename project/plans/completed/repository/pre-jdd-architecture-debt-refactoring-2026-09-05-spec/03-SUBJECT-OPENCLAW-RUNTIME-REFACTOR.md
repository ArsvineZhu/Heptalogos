# 03 — Subject OpenClaw Runtime Refactor

## 1. Preserve the authority model

```text
Heptalogos Subject
  owns SubjectId, Reaction, Review, CommunicationCommit

Subject OpenClaw Runtime
  owns provider-private cognition mechanics only

Messaging
  owns MessageFact

AIRuntime
  continues to own Expression invocation
```

Do not move Expression into OpenClaw for symmetry.

## 2. Target private modules

Inside `packages/application/product-host/src/`:

```text
subject-openclaw.ts
  narrow SubjectCognitionRuntime lifecycle/facade

subject-openclaw-projection.ts
  Heptalogos config/model/secret intent → OpenClaw config/env/fingerprint

subject-openclaw-gateway.ts
  Execa child + GatewayClient + handshake + agent run/wait/abort/events

subject-openclaw-plugin.ts
  existing proposal-only typed tools
```

Exact helper names may vary only if responsibilities remain equivalent.

Do not create a new public package or generic agent-runtime framework.

## 3. Process mechanics

Add `execa: catalog:` as a direct ProductHost dependency.

Remove direct ProductHost imports from:

```text
node:child_process
```

for Subject OpenClaw.

Use Execa for:

- shell-free launch;
- explicit Product-managed Node executable;
- process result/error semantics;
- bounded termination;
- parent-exit cleanup where appropriate;
- descendant cleanup where supported by pinned Execa;
- timeout/cancellation.

Keep owner-specific error mapping inside the OpenClaw adapter.

Do not route ProductHost through repo-kit; repo-kit is repository tooling, not a
shipping Product dependency.

## 4. Child launch

Resolve the installed OpenClaw package entry from the ProductHost dependency
closure. Do not search PATH.

Launch conceptually:

```text
<private-node> <installed-openclaw-entry> gateway
```

Normal generated config must include `gateway.mode=local`; therefore remove
`--allow-unconfigured`.

Child env includes:

```text
OPENCLAW_DISABLE_BONJOUR=1
OPENCLAW_EXEC_SHELL_SNAPSHOT=0
OPENCLAW_NO_RESPAWN=1
OPENCLAW_SKIP_CHANNELS=1
```

Retain any additional currently required non-secret Heptalogos/OpenClaw paths.

## 5. Secret projection

### 5.1 Gateway auth

- generate an ephemeral Gateway control token;
- pass it only through the dedicated child environment as
  `OPENCLAW_GATEWAY_TOKEN`;
- use the same in-memory token for the Gateway client;
- never put it in argv;
- never serialize it into the runtime descriptor/evidence/log.

Generated config sets the normal token auth mode as required but does not embed
resolved token plaintext.

### 5.2 Upstream model credential

Resolve the current Heptalogos GatewayProfile SecretRef through `SecretService`
for this dedicated child.

Project provider credential as an OpenClaw supported env SecretRef:

```json
{
  "source": "env",
  "provider": "default",
  "id": "HEPTALOGOS_OPENCLAW_MODEL_API_KEY"
}
```

The exact private environment variable name may be changed if needed, but:

- it is not a user-facing ConfigurationDefinition;
- it belongs only to the Subject OpenClaw child;
- generated config contains the reference, not resolved material.

Do not place provider credentials in generated `openclaw.json`,
`agents/*/agent/models.json`, argv, runtime descriptor, logs, or Evidence.

## 6. Configuration projection

Rewrite `SubjectCognitionConfigV1` to remove `profile`.

Product code fixes profile identity to `subject`.

Projection fingerprint/digest includes only values that can actually change the
runtime:

- enabled;
- maxOutputTokens;
- runTimeoutMs;
- maxContextBytes;
- effective AI route/model/binding revisions;
- relevant transport ConfigurationRevision;
- secret identity/revision metadata where available without secret bytes;
- Product/OpenClaw mechanics generation identity.

Do not include resolved secret material in a digest input.

## 7. Runtime lifecycle

Delete the retry timer/backoff state.

Required lifecycle:

```text
no live child
  └─ explicit reconcile/start → STARTING → READY | BLOCKED/FAILED

READY
  └─ config/route fingerprint changed
       → serialized replacement
       → old child stopped
       → new child started

READY
  └─ unexpected child exit
       → live handle cleared
       → readiness truthful BLOCKED/FAILED
       → no autonomous retry loop

BLOCKED/FAILED
  └─ explicit Product reconciliation / Subject lifecycle action
       → one new start attempt
```

Do not perform repeated restart attempts behind the user's/system's back.

A committed CommunicationCommit must remain executable through AIRuntime
Expression even if the OpenClaw primary child dies.

## 8. Gateway protocol mechanics

Keep public Gateway client/protocol only.

Preserve current proven behavior:

- WebSocket connect and `hello-ok` readiness;
- typed proposal tools present in `tools.catalog`;
- only the first valid terminal proposal for the current run is accepted;
- late/stale tool events are ignored/rejected by current run identity;
- `agent.wait` terminal status is captured;
- `chat.abort`/supported cancellation is used to converge the remaining loop;
- private OpenClaw SQLite/session/cache files are never read as Product truth.

The event correlation/buffering code may remain non-trivial if the public
protocol requires it. Do not “simplify” by scraping logs or private state.

## 9. Proposal tools

Keep exactly the bounded proposal-only semantics:

```text
heptalogos_propose_communication({ semanticContent })
heptalogos_complete_without_communication({})
```

Tools:

- do not mutate canonical Product state;
- do not send external messages;
- do not grant Machine Operations/System Authority;
- return only acknowledgement/terminal proposal transport data.

## 10. Tool policy

Subject OpenClaw remains denied from:

- arbitrary shell/exec;
- unbounded filesystem;
- package/Git/service management;
- PostgreSQL administration;
- OpenClaw administration;
- Machine Operations;
- normal System Management mutation;
- direct external IM channel plugins.

Keep current low-privilege policy unless a current required capability proves a
specific addition.

## 11. Provenance correction

Change:

```ts
openclawVersion: "2026.9.1";
```

to bounded runtime evidence:

```ts
openclawVersion: string;
```

Keep:

```ts
provider: "openclaw";
profile: "subject";
```

as current provider-specific provenance. Do not generalize the whole cognition
provider model.

## 12. Tests

Update focused tests to prove:

- launch uses Execa-owned process path;
- no `--allow-unconfigured`;
- all four embedding env controls are present;
- gateway token is absent from argv/generated config/descriptor;
- model secret is a SecretRef in config and absent as plaintext;
- unexpected child exit does not schedule retry/backoff;
- explicit reconcile/start can produce a new runtime generation;
- config change performs one serialized replacement;
- post-CommunicationCommit child death does not cause primary re-decision;
- stop cleans owned child/descendants;
- public Gateway proposal behavior remains unchanged.

Do not retain a test whose only purpose is to assert the deleted autonomous
three-retry mechanism.
