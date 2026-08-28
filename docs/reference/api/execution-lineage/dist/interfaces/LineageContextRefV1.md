[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / LineageContextRefV1

# Interface: LineageContextRefV1

Defined in: packages/execution-lineage/dist/contracts.d.ts:77

Versioned durable reference used to resume lineage across process boundaries.

## Properties

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/execution-lineage/dist/contracts.d.ts:78

---

### sourceActivityId

> `readonly` **sourceActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:79

---

### sourceContinuityEpochId

> `readonly` **sourceContinuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:81

---

### sourceInstanceId

> `readonly` **sourceInstanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:80

---

### telemetry?

> `readonly` `optional` **telemetry?**: [`ActivityTelemetryCorrelation`](ActivityTelemetryCorrelation.md)

Defined in: packages/execution-lineage/dist/contracts.d.ts:82
