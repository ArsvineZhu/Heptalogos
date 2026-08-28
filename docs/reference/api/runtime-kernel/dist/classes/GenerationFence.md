[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / GenerationFence

# Class: GenerationFence

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:16

Owns invocation admission and bounded retirement for one Runtime generation.

## Constructors

### Constructor

> **new GenerationFence**(): `GenerationFence`

#### Returns

`GenerationFence`

## Accessors

### activeInvocationCount

#### Get Signature

> **get** **activeInvocationCount**(): `number`

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:24

Returns the number of operations still holding the generation fence.

##### Returns

`number`

---

### state

#### Get Signature

> **get** **state**(): [`GenerationFenceState`](../type-aliases/GenerationFenceState.md)

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:22

Returns the current admission state of the generation.

##### Returns

[`GenerationFenceState`](../type-aliases/GenerationFenceState.md)

## Methods

### assertActive()

> **assertActive**(): `void`

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:26

Throws when this generation no longer admits new work.

#### Returns

`void`

---

### beginRetirement()

> **beginRetirement**(): `void`

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:33

Moves the generation into retiring state and stops new admission.

#### Returns

`void`

---

### invoke()

> **invoke**\<`TResult`>\>(`operationId`, `call`): `TResult` \| `Promise`\<`TResult`>\>

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:30

Runs one operation through a new generation reservation.

#### Type Parameters

##### TResult

`TResult`

#### Parameters

##### operationId

`string`

##### call

() => `TResult` \| `Promise`\<`TResult`\>

#### Returns

`TResult` \| `Promise`\<`TResult`\>

---

### reserve()

> **reserve**(`operationId`): [`GenerationInvocationReservation`](../interfaces/GenerationInvocationReservation.md)

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:28

Reserves one operation while the generation is active.

#### Parameters

##### operationId

`string`

#### Returns

[`GenerationInvocationReservation`](../interfaces/GenerationInvocationReservation.md)

---

### retire()

> **retire**(`settleTimeoutMs`): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/generation-fence.d.ts:35

Retires the generation after in-flight invocations settle or timeout.

#### Parameters

##### settleTimeoutMs

`number`

#### Returns

`Promise`\<`void`\>
