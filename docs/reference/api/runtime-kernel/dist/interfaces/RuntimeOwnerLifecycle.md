[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeOwnerLifecycle

# Interface: RuntimeOwnerLifecycle

Defined in: packages/runtime-kernel/dist/contracts.d.ts:127

Receives terminal owner failure and exposes its cancellation signal.

## Properties

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:128

## Methods

### onTerminalFailure()

> **onTerminalFailure**(`error`): `void`

Defined in: packages/runtime-kernel/dist/contracts.d.ts:130

Reports a terminal activation or lifecycle failure to the owner.

#### Parameters

##### error

`unknown`

#### Returns

`void`
