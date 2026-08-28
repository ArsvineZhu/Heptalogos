[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / HostCanonicalMigrationAuthority

# Interface: HostCanonicalMigrationAuthority

Defined in: packages/host-ownership/dist/contracts.d.ts:68

Authorizes canonical schema migration under the current Host fence.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:71

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:73

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:69

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:70

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/host-ownership/dist/contracts.d.ts:75

---

### target

> `readonly` **target**: [`HostMigrationDatabaseTarget`](HostMigrationDatabaseTarget.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:74

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:72

## Methods

### assertCurrent()

> **assertCurrent**(): `void`

Defined in: packages/host-ownership/dist/contracts.d.ts:77

Throws when the migration authority is no longer current.

#### Returns

`void`

---

### withMigrationDatabasePassword()

> **withMigrationDatabasePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/contracts.d.ts:79

Uses the migration credential only within the supplied callback.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
