[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [schema-runtime/dist](../README.md) / SchemaValidator

# Interface: SchemaValidator\<T\>

Defined in: packages/schema-runtime/dist/contracts.d.ts:21

Provides the package-owned runtime validation operation.

## Type Parameters

### T

`T`

## Methods

### validate()

> **validate**(`value`): [`SchemaValidationResult`](../type-aliases/SchemaValidationResult.md)\<`T`>\>

Defined in: packages/schema-runtime/dist/contracts.d.ts:23

Validates unknown input without coercion or default mutation.

#### Parameters

##### value

`unknown`

#### Returns

[`SchemaValidationResult`](../type-aliases/SchemaValidationResult.md)\<`T`\>
