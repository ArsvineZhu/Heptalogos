[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeContractData

# Type Alias: RuntimeContractData

> **RuntimeContractData** = `null` \| `undefined` \| `string` \| `number` \| `boolean` \| `bigint` \| readonly `RuntimeContractData`[] \| \{\[`key`: `string`\]: `RuntimeContractData`; \}

Defined in: packages/runtime-kernel/dist/contracts.d.ts:58

Runtime Service/Capability contracts are trusted semantic contracts, not a
general JavaScript object-capability membrane. Provider operations are
methods; their boundary values are plain data or nested contract objects.
Runtime publication/invocation validation is authoritative because
TypeScript interfaces are erased.
