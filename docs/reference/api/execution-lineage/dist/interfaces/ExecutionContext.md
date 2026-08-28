[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / ExecutionContext

# Interface: ExecutionContext

Defined in: packages/execution-lineage/dist/contracts.d.ts:39

Canonical causal context carried by Foundation operations and retained evidence.

## Properties

### activityId

> `readonly` **activityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:40

---

### causationActivityId?

> `readonly` `optional` **causationActivityId?**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:44

---

### importance

> `readonly` **importance**: [`ActivityImportance`](../type-aliases/ActivityImportance.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:55

---

### kind

> `readonly` **kind**: `string`

Defined in: packages/execution-lineage/dist/contracts.d.ts:41

---

### links

> `readonly` **links**: readonly [`ActivityLink`](ActivityLink.md)[]

Defined in: packages/execution-lineage/dist/contracts.d.ts:45

---

### origin

> `readonly` **origin**: [`HostExecutionOrigin`](HostExecutionOrigin.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:46

---

### parentActivityId?

> `readonly` `optional` **parentActivityId?**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:43

---

### retentionClass

> `readonly` **retentionClass**: [`RetentionClass`](../../../foundation-contracts/dist/type-aliases/RetentionClass.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:56

---

### semantic

> `readonly` **semantic**: `Readonly`\<\{ `capabilityId?`: `string`; `contractVersion?`: `string`; `featureId?`: `string`; `operationId?`: `string`; `providerId?`: `string`; `serviceId?`: `string`; \}\>

Defined in: packages/execution-lineage/dist/contracts.d.ts:47

---

### sensitivity

> `readonly` **sensitivity**: [`Sensitivity`](../../../foundation-contracts/dist/type-aliases/Sensitivity.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:57

---

### startedAt

> `readonly` **startedAt**: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:42

---

### telemetry?

> `readonly` `optional` **telemetry?**: [`ActivityTelemetryCorrelation`](ActivityTelemetryCorrelation.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:58
