[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / HostPersistenceAuthority

# Interface: HostPersistenceAuthority

Defined in: packages/host-ownership/dist/contracts.d.ts:91

Authorizes normal persistence under the current Host fence.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:94

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:95

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:92

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:93

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/host-ownership/dist/contracts.d.ts:98

---

### target

> `readonly` **target**: [`HostRuntimeDatabaseTarget`](HostRuntimeDatabaseTarget.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:97

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:96

## Methods

### assertActive()

> **assertActive**(): `void`

Defined in: packages/host-ownership/dist/contracts.d.ts:100

Throws when the persistence authority is no longer active.

#### Returns

`void`

---

### withRuntimeDatabasePassword()

> **withRuntimeDatabasePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/contracts.d.ts:102

Uses the runtime credential only within the supplied callback.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
