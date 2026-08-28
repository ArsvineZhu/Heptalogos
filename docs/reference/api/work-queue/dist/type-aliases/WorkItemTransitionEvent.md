[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItemTransitionEvent

# Type Alias: WorkItemTransitionEvent

> **WorkItemTransitionEvent** = \{ `type`: `"CLAIM"`; \} \| \{ `type`: `"WAIT_DEPENDENCY"`; \} \| \{ `type`: `"RETRY_WAIT"`; \} \| \{ `type`: `"SUCCEED"`; \} \| \{ `type`: `"FAIL"`; \} \| \{ `type`: `"CANCEL"`; \} \| \{ `type`: `"SUPERSEDE"`; \} \| \{ `type`: `"WAKE_DEPENDENCY"`; \} \| \{ `type`: `"WAKE_RETRY"`; \}

Defined in: packages/work-queue/dist/state-machine.d.ts:8

Events accepted by the durable WorkItem lifecycle state machine.
