[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / evaluateReadiness

# Function: evaluateReadiness()

> **evaluateReadiness**(`profile`, `services`, `capabilities`, `serviceBindings`, `capabilityBindings`): [`ReadinessResult`](../interfaces/ReadinessResult.md)

Defined in: packages/runtime-kernel/dist/readiness.d.ts:11

Evaluates required and optional provider bindings into an aggregate readiness result.

## Parameters

### profile

[`ReadinessProfileDefinition`](../interfaces/ReadinessProfileDefinition.md)

### services

[`ServiceRegistry`](../classes/ServiceRegistry.md)

### capabilities

[`CapabilityRegistry`](../classes/CapabilityRegistry.md)

### serviceBindings

`ReadonlyMap`\<[`ServiceId`](../../../foundation-contracts/dist/type-aliases/ServiceId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)\>

### capabilityBindings

`ReadonlyMap`\<[`CapabilityId`](../../../foundation-contracts/dist/type-aliases/CapabilityId.md), [`ProviderId`](../../../foundation-contracts/dist/type-aliases/ProviderId.md)\>

## Returns

[`ReadinessResult`](../interfaces/ReadinessResult.md)
