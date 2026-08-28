---
name: heptalogos-interaction
description: Use when changing the Heptalogos Subject, Subject Chat, messaging drivers/protocols, canonical message flow, ConversationMailbox, Reactor, context/prompt assembly, AI runtime, model/provider/tool capabilities, MCP integration, or advanced-cognition extension hooks.
---

# Heptalogos Interaction

## Authority route

Documentation root: `../../../docs/`
Route index: `../../heptalogos/corpus-routes.json`

Read the core interaction chain:

- [Subject and cognition](../../../docs/architecture/subject.md)
- [Messaging and Subject Chat](../../../docs/architecture/messaging.md)
- [AI Runtime / Capability / MCP](../../../docs/architecture/ai-runtime.md)
- [Advanced research integration map](../../../docs/architecture/research-subsystem-integration.md)
- [S07 Messaging / Subject Chat / drivers](../../../docs/architecture/contracts/messaging-subject-chat-drivers.md)
- [S08 AI / Capability / MCP](../../../docs/architecture/contracts/ai-capability-mcp.md)
- [S09 Reactor / context / prompt / advanced cognition](../../../docs/architecture/contracts/reactor-context-prompt-research-integration.md)
- [S14 Canonical end-to-end flows](../../../docs/architecture/contracts/canonical-end-to-end-flows.md)

## Procedure

1. Preserve `Subject != model/agent loop/conversation/Host/Operator Assistant` and `State > Prompt`.
2. Trace inbound interaction from transport evidence to canonical fact before async handoff. A queue does not own whether a message exists.
3. Keep product-native Subject Chat on the same Subject Authority path as other Subject messaging; Web is a presentation client, not a direct Reactor authority.
4. Keep transport drivers thin anti-corruption boundaries. Protocol revision/external identity metadata are data, not assumptions hidden in adapter code.
5. Separate ConversationMailbox/domain observation semantics from generic WorkQueue mechanics.
6. Treat model/provider/tool calls as capabilities/mechanics. Model output is a proposal; deterministic authority boundaries decide state/effect commits.
7. Build context from governed state/contracts, not a monolithic prompt as hidden product state.
8. Advanced cognition enters through declared Service/Capability/Context/Activity hooks. Do not implement Persona/Memory/Attention/etc. merely because a hook is present.
9. Preserve silence/no-action as a valid behavior and external-effect uncertainty as a valid outcome.

Use `heptalogos-runtime-durability` for durable/effect boundaries and `heptalogos-verification` for live IM/model claims.
