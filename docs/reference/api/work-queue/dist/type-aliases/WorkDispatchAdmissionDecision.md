[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkDispatchAdmissionDecision

# Type Alias: WorkDispatchAdmissionDecision

> **WorkDispatchAdmissionDecision** = \{ `decision`: `"ALLOW"`; \} \| \{ `decision`: `"DELAY"`; `reasonCode`: `string`; \} \| \{ `decision`: `"THROTTLE"`; `reasonCode`: `string`; \}

Defined in: packages/work-queue/dist/contracts.d.ts:101

Policy result applied immediately before dispatch.
