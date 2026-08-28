[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeGraph

# Class: RuntimeGraph

Defined in: packages/runtime-kernel/dist/runtime-graph.d.ts:20

Builds the hard Service dependency graph for one desired Runtime set.

## Constructors

### Constructor

> **new RuntimeGraph**(`definitions`, `explicitServiceBindings?`): `RuntimeGraph`

Defined in: packages/runtime-kernel/dist/runtime-graph.d.ts:26

Validates definitions and constructs deterministic dependency edges.

#### Parameters

##### definitions

readonly [`MicroSystemDefinition`](../interfaces/MicroSystemDefinition.md)[]

##### explicitServiceBindings?

`ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)\>

#### Returns

`RuntimeGraph`

## Methods

### plan()

> **plan**(): [`RuntimeGraphPlan`](../interfaces/RuntimeGraphPlan.md)

Defined in: packages/runtime-kernel/dist/runtime-graph.d.ts:28

Returns topological start order and its reverse shutdown order.

#### Returns

[`RuntimeGraphPlan`](../interfaces/RuntimeGraphPlan.md)
