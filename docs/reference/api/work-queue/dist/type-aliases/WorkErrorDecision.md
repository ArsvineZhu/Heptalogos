[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkErrorDecision

# Type Alias: WorkErrorDecision

> **WorkErrorDecision** = \{ `kind`: `"TERMINAL"`; `reasonCode`: `string`; `retryClass`: [`WorkRetryClass`](WorkRetryClass.md); \} \| \{ `kind`: `"RETRY"`; `notBefore`: [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md); `reasonCode`: `string`; `retryClass`: [`WorkRetryClass`](WorkRetryClass.md); \}

Defined in: packages/work-queue/dist/contracts.d.ts:136

Classifier result selecting terminal completion or a retry time.
