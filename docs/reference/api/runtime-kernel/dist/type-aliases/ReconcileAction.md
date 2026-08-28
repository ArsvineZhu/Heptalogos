[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / ReconcileAction

# Type Alias: ReconcileAction

> **ReconcileAction** = \{ `kind`: `"QUIESCE"`; `microSystemId`: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md); `reason`: `string`; \} \| \{ `kind`: `"STOP"`; `microSystemId`: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md); `reason`: `string`; \} \| \{ `kind`: `"START"`; `microSystemId`: [`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md); `reason`: `string`; \} \| \{ `kind`: `"REBIND_SERVICE"`; `providerId`: [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md); `serviceId`: [`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md); \} \| \{ `capabilityId`: [`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md); `kind`: `"REBIND_CAPABILITY"`; `providerId`: [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md) \| `undefined`; \}

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:11

Describes one deterministic Runtime reconciliation action.
