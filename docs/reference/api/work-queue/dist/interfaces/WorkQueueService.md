[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkQueueService

# Interface: WorkQueueService

Defined in: packages/work-queue/dist/service.d.ts:54

Admits and persists WorkItems through the owning persistence and lineage seams.

## Methods

### create()

> **create**(`request`): `Promise`\<[`WorkCreationResult`](WorkCreationResult.md)>\>

Defined in: packages/work-queue/dist/service.d.ts:56

Validate, admit, deduplicate, persist, and signal one WorkItem request.

#### Parameters

##### request

[`WorkCreationRequest`](WorkCreationRequest.md)

#### Returns

`Promise`\<[`WorkCreationResult`](WorkCreationResult.md)\>
