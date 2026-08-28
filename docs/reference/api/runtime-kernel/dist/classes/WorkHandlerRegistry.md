[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / WorkHandlerRegistry

# Class: WorkHandlerRegistry

Defined in: packages/runtime-kernel/dist/work-handler-registry.d.ts:14

Owns generation-pinned WorkHandler registration and lookup.

## Constructors

### Constructor

> **new WorkHandlerRegistry**(): `WorkHandlerRegistry`

#### Returns

`WorkHandlerRegistry`

## Methods

### register()

> **register**(`owner`, `descriptor`, `implementation`, `fence?`, `runtimeActivity?`): [`GenerationFence`](GenerationFence.md)

Defined in: packages/runtime-kernel/dist/work-handler-registry.d.ts:17

Registers and validates one handler for an exact Runtime generation.

#### Parameters

##### owner

`WorkHandlerRegistrationOwner`

##### descriptor

[`WorkHandlerProvisionDescriptor`](../interfaces/WorkHandlerProvisionDescriptor.md)

##### implementation

[`RuntimeWorkHandler`](../interfaces/RuntimeWorkHandler.md)

##### fence?

[`GenerationFence`](GenerationFence.md)

##### runtimeActivity?

`RuntimeActivityRunner`

#### Returns

[`GenerationFence`](GenerationFence.md)

---

### resolve()

> **resolve**(`target`): [`RuntimeWorkHandlerLease`](../interfaces/RuntimeWorkHandlerLease.md) \| `undefined`

Defined in: packages/runtime-kernel/dist/work-handler-registry.d.ts:19

Resolves a live handler lease for an exact target and payload version.

#### Parameters

##### target

[`WorkHandlerTarget`](../interfaces/WorkHandlerTarget.md)

#### Returns

[`RuntimeWorkHandlerLease`](../interfaces/RuntimeWorkHandlerLease.md) \| `undefined`

---

### retireGeneration()

> **retireGeneration**(`fence`, `settleTimeoutMs`): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/work-handler-registry.d.ts:21

Retires all handler registrations owned by one generation fence.

#### Parameters

##### fence

[`GenerationFence`](GenerationFence.md)

##### settleTimeoutMs

`number`

#### Returns

`Promise`\<`void`\>

---

### size()

> **size**(): `number`

Defined in: packages/runtime-kernel/dist/work-handler-registry.d.ts:23

Reports the number of registered handler targets.

#### Returns

`number`
