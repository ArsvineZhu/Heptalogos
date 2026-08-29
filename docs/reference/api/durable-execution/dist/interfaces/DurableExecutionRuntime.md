[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / DurableExecutionRuntime

# Interface: DurableExecutionRuntime

Defined in: packages/durable-execution/dist/contracts.d.ts:82

Exposes lifecycle operations without leaking DBOS or pool implementation types.

## Properties

### state

> `readonly` **state**: [`DurableExecutionLifecycleState`](../type-aliases/DurableExecutionLifecycleState.md)

Defined in: packages/durable-execution/dist/contracts.d.ts:83

## Methods

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:91

Close the runtime and release all owned DBOS resources.

#### Returns

`Promise`\<`void`\>

---

### quiesce()

> **quiesce**(): `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:87

Drain DBOS work and release runtime resources while retaining the Host.

#### Returns

`Promise`\<`void`\>

---

### resume()

> **resume**(): `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:89

Resume a previously quiesced DBOS runtime under the same Host authority.

#### Returns

`Promise`\<`void`\>

---

### start()

> **start**(): `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:85

Start the Host-bound DBOS runtime and verify its queue projections.

#### Returns

`Promise`\<`void`\>
