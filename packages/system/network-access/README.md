# @heptalogos/network-access

## Purpose

network-access owns the current Host-originated outbound transport policy and
the narrow custom fetch route required by the OpenAI provider.

## Owns

- The stable network-access.openai-api.v1 profile.
- Requester, HTTPS origin/path/method, redirect, header, deadline, and byte
  budget enforcement.
- Abort/timeout and redacted transport diagnostics.
- Conversion of the admitted response back to the standard Fetch Response.

## Does not own

- Provider/model semantics, external-effect truth, retry policy, or proxy/VPN
  infrastructure.
- Networking inside OpenClaw, MCP stdio, or other opaque external processes.
- Configuration activation or Secret material resolution.

## Verification

Run NetworkAccess unit tests with a controlled transport seam and the live
OpenAI qualification for the real AI SDK fetch boundary.

## Knowledge references

- [NetworkAccess Spec](../../../specs/system/network-access.md)
- [AI Runtime Spec](../../../specs/system/ai-runtime.md)
- [Dependency route](../../../project/dependencies/dependency-routing.json)
