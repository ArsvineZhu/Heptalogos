[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeWorkHandlerInvocationReservation

# Interface: RuntimeWorkHandlerInvocationReservation

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:47

Reserves one handler invocation and releases its generation fence.

## Methods

### execute()

> **execute**(`input`): `Promise`\<[`RuntimeWorkHandlerResult`](RuntimeWorkHandlerResult.md)>\>

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:49

Executes the reserved handler invocation.

#### Parameters

##### input

[`RuntimeWorkHandlerInvocation`](RuntimeWorkHandlerInvocation.md)

#### Returns

`Promise`\<[`RuntimeWorkHandlerResult`](RuntimeWorkHandlerResult.md)\>

---

### release()

> **release**(): `void`

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:51

Releases the reservation without executing it.

#### Returns

`void`
