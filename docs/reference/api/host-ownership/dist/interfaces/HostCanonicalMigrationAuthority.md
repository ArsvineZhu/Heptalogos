[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / HostCanonicalMigrationAuthority

# Interface: HostCanonicalMigrationAuthority

Defined in: packages/host-ownership/dist/contracts.d.ts:77

Authorizes canonical schema migration under the current Host fence.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:80

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:82

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:78

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:79

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/host-ownership/dist/contracts.d.ts:84

---

### target

> `readonly` **target**: [`HostMigrationDatabaseTarget`](HostMigrationDatabaseTarget.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:83

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:81

## Methods

### assertCurrent()

> **assertCurrent**(): `void`

Defined in: packages/host-ownership/dist/contracts.d.ts:86

Throws when the migration authority is no longer current.

#### Returns

`void`

---

### withMigrationDatabasePassword()

> **withMigrationDatabasePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/contracts.d.ts:88

Uses the migration credential only within the supplied callback.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
