[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapStateLoadResult

# Type Alias: BootstrapStateLoadResult

> **BootstrapStateLoadResult** = \{ `status`: `"EMPTY"`; \} \| \{ `status`: `"CURRENT"`; `value`: [`BootstrapStateEnvelope`](BootstrapStateEnvelope.md); \} \| \{ `problem`: [`Problem`](../../../foundation-contracts/dist/interfaces/Problem.md); `status`: `"RECOVERED_PREVIOUS"`; `value`: [`BootstrapStateEnvelope`](BootstrapStateEnvelope.md); \} \| \{ `problem`: [`Problem`](../../../foundation-contracts/dist/interfaces/Problem.md); `status`: `"CORRUPT"`; \}

Defined in: packages/bootstrap-state/dist/store.d.ts:9

Reports the current/previous durable BootstrapState revision status.
