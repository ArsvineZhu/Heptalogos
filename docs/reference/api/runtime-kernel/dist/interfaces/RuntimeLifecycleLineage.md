[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeLifecycleLineage

# Interface: RuntimeLifecycleLineage

Defined in: packages/runtime-kernel/dist/lifecycle-lineage.d.ts:18

Runs Runtime lifecycle operations with retained causal Activity records.

## Methods

### runner()

> **runner**(`origin`): `RuntimeActivityRunner`

Defined in: packages/runtime-kernel/dist/lifecycle-lineage.d.ts:20

Binds a Runtime origin to the shared Activity runner.

#### Parameters

##### origin

`RuntimeExecutionOrigin`

#### Returns

`RuntimeActivityRunner`

---

### runRetained()

> **runRetained**\<`T`>\>(`origin`, `request`, `operation`): `Promise`\<`T`>\>

Defined in: packages/runtime-kernel/dist/lifecycle-lineage.d.ts:22

Retains, executes, and completes one lifecycle Activity.

#### Type Parameters

##### T

`T`

#### Parameters

##### origin

`RuntimeExecutionOrigin`

##### request

[`ActivityRequest`](../../../execution-lineage/dist/interfaces/ActivityRequest.md)

##### operation

(`context`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
