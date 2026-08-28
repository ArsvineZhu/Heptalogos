[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapOwnershipLease

# Interface: BootstrapOwnershipLease

Defined in: packages/bootstrap-runtime/dist/bootstrap-ownership.d.ts:15

Represents the capability required to act under Bootstrap ownership.

## Properties

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/bootstrap-runtime/dist/bootstrap-ownership.d.ts:17

---

### state

> `readonly` **state**: [`BootstrapOwnershipState`](../type-aliases/BootstrapOwnershipState.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-ownership.d.ts:16

## Methods

### assertHeld()

> **assertHeld**(): `void`

Defined in: packages/bootstrap-runtime/dist/bootstrap-ownership.d.ts:19

Throws when ownership has been released or its fence was compromised.

#### Returns

`void`

---

### release()

> **release**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-ownership.d.ts:21

Releases the lease once and shares the same completion promise on repeats.

#### Returns

`Promise`\<`void`\>
