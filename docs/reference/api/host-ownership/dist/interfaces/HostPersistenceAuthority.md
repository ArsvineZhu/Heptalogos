[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / HostPersistenceAuthority

# Interface: HostPersistenceAuthority

Defined in: packages/host-ownership/dist/contracts.d.ts:82

Authorizes normal persistence under the current Host fence.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:85

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:86

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:83

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:84

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/host-ownership/dist/contracts.d.ts:89

---

### target

> `readonly` **target**: [`HostRuntimeDatabaseTarget`](HostRuntimeDatabaseTarget.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:88

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:87

## Methods

### assertActive()

> **assertActive**(): `void`

Defined in: packages/host-ownership/dist/contracts.d.ts:91

Throws when the persistence authority is no longer active.

#### Returns

`void`

---

### withRuntimeDatabasePassword()

> **withRuntimeDatabasePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/contracts.d.ts:93

Uses the runtime credential only within the supplied callback.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
