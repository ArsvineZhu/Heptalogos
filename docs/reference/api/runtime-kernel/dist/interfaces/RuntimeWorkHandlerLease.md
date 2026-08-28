[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeWorkHandlerLease

# Interface: RuntimeWorkHandlerLease

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:73

Exposes validation and invocation reservation for one handler target.

## Properties

### descriptor

> `readonly` **descriptor**: [`WorkHandlerProvisionDescriptor`](WorkHandlerProvisionDescriptor.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:75

---

### runtimeActivity?

> `readonly` `optional` **runtimeActivity?**: `RuntimeActivityRunner`

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:76

---

### target

> `readonly` **target**: [`WorkHandlerTarget`](WorkHandlerTarget.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:74

## Methods

### reserveInvocation()

> **reserveInvocation**(): [`RuntimeWorkHandlerInvocationReservation`](RuntimeWorkHandlerInvocationReservation.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:80

Reserves a generation-fenced handler invocation.

#### Returns

[`RuntimeWorkHandlerInvocationReservation`](RuntimeWorkHandlerInvocationReservation.md)

---

### validatePayload()

> **validatePayload**(`version`, `value`): [`RuntimeContractData`](../type-aliases/RuntimeContractData.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:78

Validates and returns a payload within the declared handler contract.

#### Parameters

##### version

`number`

##### value

`unknown`

#### Returns

[`RuntimeContractData`](../type-aliases/RuntimeContractData.md)
