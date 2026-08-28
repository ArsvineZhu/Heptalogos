[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [schema-runtime/dist](../README.md) / SchemaValidationResult

# Type Alias: SchemaValidationResult\<T\>

> **SchemaValidationResult**\<`T`> \> = \{ `ok`: `true`; `value`: `T`; \} \| \{ `issues`: readonly [`SchemaValidationIssue`](../interfaces/SchemaValidationIssue.md)[]; `ok`: `false`; \}

Defined in: packages/schema-runtime/dist/contracts.d.ts:13

Reports either a validated value or all validation issues.

## Type Parameters

### T

`T`
