# External integrations

This page defines the current product boundary for software that Heptalogos
calls or depends on but does not own as Product Host state.

## Model gateway

Heptalogos uses a gateway-first AIRuntime boundary. A GatewayProfile stores
one canonical gateway base URL, an enabled flag, and an optional SecretRef
for the bearer token used by Heptalogos. A ModelProfile selects the gateway,
model identifier, and one protocol: openai-chat or openai-responses.
NetworkAccess derives and checks the exact POST endpoint from that selection.

NewAPI is the recommended external gateway for the current integration path.
It is independently deployed and administered. Configure upstream accounts,
provider channels, model mappings, routing, quotas, and provider credentials
in NewAPI. Create a token for Heptalogos there, then store only that gateway
token through Heptalogos SecretService. Heptalogos does not mirror upstream
provider keys, NewAPI channels, or NewAPI administrator credentials.

The boundary is intentionally small:

- Heptalogos owns GatewayProfile, ModelProfile, ModelBinding, readiness,
  invocation metadata, and its own transport/secret controls.
- The gateway owns upstream provider adaptation, channel selection, provider
  credentials, gateway administration, and its own availability and data.
- A gateway is not a Heptalogos Host MicroSystem and does not determine Host
  process health.
- Product Host does not install, spawn, configure, update, or supervise NewAPI.

Use the [external integration reference](../reference/external-integrations.md)
for upstream links and the short setup sequence.

## Machine Operations runtime

OpenClaw is the adopted external implementation route for the independent
Machine Operations Plane. It remains a separate process/service and trust
domain. Its privileged credentials, workspace, model configuration, process
lifecycle, and upgrade/distribution lifecycle are not Product Host state.
Heptalogos may expose Management/CLI/tool integration contracts. A Product
distribution may carry this runtime alongside a separately configured Subject
OpenClaw Runtime, but colocation does not imply shared Gateway, state,
credentials, privilege, or lifecycle. Machine Operations remains operator-owned
and is not a Product Host child.

## FFmpeg

FFmpeg is an external executable dependency for future bounded audio/video
capabilities. The operator or deployment environment installs and configures
it according to the selected platform profile. Heptalogos does not download,
vendor, or update FFmpeg in this current product slice. When an AV capability
is implemented, its adapter must apply the existing process, path, budget,
and evidence boundaries.

## Lifecycle and credential rules

Operator-owned external service/runtime follows this ownership sequence:

operator deploys and administers external software
→ operator grants only the credential needed by the Heptalogos boundary
→ Heptalogos stores a scoped reference/material through its own Secret owner
→ Heptalogos calls the selected endpoint through the owning transport
→ external software remains independently upgraded, stopped, and recovered

This class includes the model gateway, Machine Operations OpenClaw, and an
FFmpeg prerequisite when a capability requires it. No member of this class is
downloaded or started as a side effect of Product Host startup.

Subject OpenClaw Runtime, when used by the Subject cognition path, is a
Product-managed runtime dependency. Product composition owns its exact payload,
dedicated profile/state/configuration roots, start/readiness/stop/replacement
lifecycle, and bounded Product Configuration/SecretRef projection. It remains
provider/runtime mechanics: it does not own Subject identity, canonical Subject
state, CommunicationCommit, or Messaging Authority. The current bounded
AIRuntime Subject Chat path does not require this runtime.

No upstream or machine-operator secret is accepted on an argv, ordinary log,
generated artifact, or durable AIRuntime profile.
