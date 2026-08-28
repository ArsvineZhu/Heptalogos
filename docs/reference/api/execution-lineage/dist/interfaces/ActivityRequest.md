[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / ActivityRequest

# Interface: ActivityRequest

Defined in: packages/execution-lineage/dist/contracts.d.ts:61

Supplies semantic and governance inputs for creating an Activity context.

## Properties

### causationActivityId?

> `readonly` `optional` **causationActivityId?**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:63

---

### importance

> `readonly` **importance**: [`ActivityImportance`](../type-aliases/ActivityImportance.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:66

---

### kind

> `readonly` **kind**: `string`

Defined in: packages/execution-lineage/dist/contracts.d.ts:62

---

### links?

> `readonly` `optional` **links?**: readonly [`ActivityLink`](ActivityLink.md)[]

Defined in: packages/execution-lineage/dist/contracts.d.ts:64

---

### retentionClass

> `readonly` **retentionClass**: [`RetentionClass`](../../../foundation-contracts/dist/type-aliases/RetentionClass.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:67

---

### semantic?

> `readonly` `optional` **semantic?**: `Readonly`\<\{ `capabilityId?`: `string`; `contractVersion?`: `string`; `featureId?`: `string`; `operationId?`: `string`; `providerId?`: `string`; `serviceId?`: `string`; \}\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:65

---

### sensitivity

> `readonly` **sensitivity**: [`Sensitivity`](../../../foundation-contracts/dist/type-aliases/Sensitivity.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:68
