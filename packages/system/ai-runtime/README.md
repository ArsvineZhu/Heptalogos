# @heptalogos/ai-runtime

## Purpose

ai-runtime owns the current GatewayProfile, ModelProfile, ModelBinding, and
structured InvocationSpec semantics. It materializes AI SDK 7 Chat-compatible
and Open Responses-compatible protocol mechanics only inside the runtime boundary.

## Owns

- The current gateway/profile/model/binding identities and generations.
- Exact binding/configuration/Secret/NetworkAccess readiness.
- Provider-neutral ephemeral messages and structured generation results.
- SchemaRuntime validation and Lineage/Evidence attribution.

## Does not own

- Subject identity, prompt/context Authority, behavior commit, or tools/MCP.
- Provider-hosted state, streaming, embeddings, files, failover, or agents.
- Configuration activation, Secret storage, Network policy, or Management auth.

## Verification

Run AIRuntime unit tests through the custom-fetch seam, the local real-SDK
Chat/Responses fixture, and the protected live NewAPI Chat qualification.

## Knowledge references

- [AI Runtime Spec](../../../specs/system/ai-runtime.md)
- [NetworkAccess Spec](../../../specs/system/network-access.md)
- [Configuration Spec](../../../specs/system/configuration.md)
