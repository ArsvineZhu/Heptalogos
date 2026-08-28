[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeWorkHandler

# Interface: RuntimeWorkHandler

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:54

Minimal handler implementation contract used by the queue executor.

## Methods

### execute()

> **execute**(`input`): `Promise`\<[`RuntimeWorkHandlerResult`](RuntimeWorkHandlerResult.md)>\>

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:56

Executes one validated, generation-pinned WorkItem attempt.

#### Parameters

##### input

[`RuntimeWorkHandlerInvocation`](RuntimeWorkHandlerInvocation.md)

#### Returns

`Promise`\<[`RuntimeWorkHandlerResult`](RuntimeWorkHandlerResult.md)\>
