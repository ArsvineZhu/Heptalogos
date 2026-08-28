[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkCreationAdmissionDecision

# Type Alias: WorkCreationAdmissionDecision

> **WorkCreationAdmissionDecision** = \{ `decision`: `"ALLOW"`; \} \| \{ `decision`: `"DELAY"`; `notBefore`: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md); `reasonCode`: `string`; \} \| \{ `decision`: `"THROTTLE"`; `notBefore?`: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md); `reasonCode`: `string`; \} \| \{ `decision`: `"REJECT_OPTIONAL"`; `reasonCode`: `string`; \} \| \{ `decision`: `"REJECT_NEW_WORK"`; `reasonCode`: `string`; \}

Defined in: packages/work-queue/dist/contracts.d.ts:83

Policy result applied while creating a WorkItem.
