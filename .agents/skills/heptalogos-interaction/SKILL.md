---
name: heptalogos-interaction
description: Use when changing the Heptalogos Subject, Subject Chat, messaging drivers/protocols, canonical message flow, ConversationMailbox, Reactor, context/prompt assembly, AI runtime, model/provider/tool capabilities, MCP integration, or advanced-cognition extension hooks.
---

# Heptalogos Interaction

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Read the core interaction chain:

- [Subject and cognition](../../../Architecture_Corpus/08-Subject与认知系统.md)
- [Messaging and Subject Chat](../../../Architecture_Corpus/09-Messaging与Subject-Chat.md)
- [AI Runtime / Capability / MCP](../../../Architecture_Corpus/10-AI-Runtime-Capability-MCP.md)
- [Advanced research integration map](../../../Architecture_Corpus/17-高级研究子系统接入地图.md)
- [S07 Messaging / Subject Chat / drivers](../../../Architecture_Corpus/specs/S07-Messaging-SubjectChat-Drivers.md)
- [S08 AI / Capability / MCP](../../../Architecture_Corpus/specs/S08-AI-Capability-MCP.md)
- [S09 Reactor / context / prompt / advanced cognition](../../../Architecture_Corpus/specs/S09-Reactor-Context-Prompt与高级认知接入.md)
- [S14 Canonical end-to-end flows](../../../Architecture_Corpus/specs/S14-Canonical-End-to-End-Flows.md)

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
