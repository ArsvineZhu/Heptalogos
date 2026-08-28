[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / ExecutionContextRuntime

# Interface: ExecutionContextRuntime

Defined in: packages/execution-lineage/dist/contracts.d.ts:108

Carries process-local Activity context and lineage resume operations.

## Methods

### capture()

> **capture**\<`TArgs`, `TResult`>\>(`callback`): (...`args`) => `TResult`

Defined in: packages/execution-lineage/dist/contracts.d.ts:114

Captures the current context for later callback invocation.

#### Type Parameters

##### TArgs

`TArgs` _extends_ readonly `unknown`[]

##### TResult

`TResult`

#### Parameters

##### callback

(...`args`) => `TResult`

#### Returns

(...`args`) => `TResult`

---

### createLineageContextRef()

> **createLineageContextRef**(): [`LineageContextRefV1`](LineageContextRefV1.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:116

Creates a durable lineage reference for the current Activity.

#### Returns

[`LineageContextRefV1`](LineageContextRefV1.md)

---

### current()

> **current**(): [`ExecutionContext`](ExecutionContext.md) \| `undefined`

Defined in: packages/execution-lineage/dist/contracts.d.ts:110

Returns the current context, if the caller is inside an Activity.

#### Returns

[`ExecutionContext`](ExecutionContext.md) \| `undefined`

---

### runActivity()

> **runActivity**\<`T`>\>(`request`, `operation`): `Promise`\<`T`>\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:112

Runs an operation under a newly created Activity context.

#### Type Parameters

##### T

`T`

#### Parameters

##### request

[`ActivityRequest`](ActivityRequest.md)

##### operation

(`context`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### runFromLineageContextRef()

> **runFromLineageContextRef**\<`T`>\>(`ref`, `request`, `operation`): `Promise`\<`T`>\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:118

Resumes an Activity from a validated durable lineage reference.

#### Type Parameters

##### T

`T`

#### Parameters

##### ref

[`LineageContextRefV1`](LineageContextRefV1.md)

##### request

`Omit`\<[`ActivityRequest`](ActivityRequest.md), `"causationActivityId"`\>

##### operation

(`context`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
