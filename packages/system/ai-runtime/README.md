# @heptalogos/ai-runtime

## Purpose

ai-runtime owns the current ProviderProfile, ModelProfile, ModelBinding, and
structured InvocationSpec semantics. It materializes AI SDK 7 and the official
OpenAI Responses provider only inside the runtime boundary.

## Owns

- The current OpenAI provider/profile/model/binding identities and generations.
- Exact binding/configuration/Secret/NetworkAccess readiness.
- Provider-neutral ephemeral messages and structured generation results.
- SchemaRuntime validation and Lineage/Evidence attribution.

## Does not own

- Subject identity, prompt/context Authority, behavior commit, or tools/MCP.
- Provider-hosted state, streaming, embeddings, files, failover, or agents.
- Configuration activation, Secret storage, Network policy, or Management auth.

## Verification

Run AIRuntime unit tests through the custom-fetch seam and the protected live
OpenAI qualification for the real Responses route.

## Knowledge references

- [AI Runtime Spec](../../../specs/system/ai-runtime.md)
- [NetworkAccess Spec](../../../specs/system/network-access.md)
- [Configuration Spec](../../../specs/system/configuration.md)
