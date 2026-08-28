[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / applyWorkAdmissionDecision

# Function: applyWorkAdmissionDecision()

> **applyWorkAdmissionDecision**(`requestedNotBefore`, `decision`): [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md) \| `undefined`

Defined in: packages/work-queue/dist/admission.d.ts:41

Apply creation policy while preserving the later of requested and policy times.

## Parameters

### requestedNotBefore

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md) \| `undefined`

### decision

[`WorkCreationAdmissionDecision`](../type-aliases/WorkCreationAdmissionDecision.md)

## Returns

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md) \| `undefined`
