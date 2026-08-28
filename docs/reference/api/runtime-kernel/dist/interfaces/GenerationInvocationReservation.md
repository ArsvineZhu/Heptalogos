[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / GenerationInvocationReservation

# Interface: GenerationInvocationReservation

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:9

Represents one invocation reservation held against generation retirement.

## Methods

### release()

> **release**(): `void`

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:13

Releases an unused reservation.

#### Returns

`void`

---

### run()

> **run**\<`TResult`>\>(`call`): `TResult` \| `Promise`\<`TResult`>\>

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:11

Runs the reserved operation exactly once and settles the reservation.

#### Type Parameters

##### TResult

`TResult`

#### Parameters

##### call

() => `TResult` \| `Promise`\<`TResult`\>

#### Returns

`TResult` \| `Promise`\<`TResult`\>
