[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ContractCompatibilityRegistry

# Class: ContractCompatibilityRegistry

Defined in: packages/runtime-kernel/dist/contract-compatibility.d.ts:16

Compares Service and Capability provider versions against requirements.

## Constructors

### Constructor

> **new ContractCompatibilityRegistry**(): `ContractCompatibilityRegistry`

#### Returns

`ContractCompatibilityRegistry`

## Methods

### assertCompatible()

> **assertCompatible**(`requirement`, `providerVersion`, `kind`): `void`

Defined in: packages/runtime-kernel/dist/contract-compatibility.d.ts:20

Throws a typed Problem when a provider version cannot satisfy the request.

#### Parameters

##### requirement

[`ContractVersionRange`](../type-aliases/ContractVersionRange.md)

##### providerVersion

[`ContractVersion`](../type-aliases/ContractVersion.md)

##### kind

`"service"` \| `"capability"`

#### Returns

`void`

---

### isCompatible()

> **isCompatible**(`requirement`, `providerVersion`): `boolean`

Defined in: packages/runtime-kernel/dist/contract-compatibility.d.ts:18

Reports whether a provider satisfies the exact requested version.

#### Parameters

##### requirement

[`ContractVersionRange`](../type-aliases/ContractVersionRange.md)

##### providerVersion

[`ContractVersion`](../type-aliases/ContractVersion.md)

#### Returns

`boolean`
