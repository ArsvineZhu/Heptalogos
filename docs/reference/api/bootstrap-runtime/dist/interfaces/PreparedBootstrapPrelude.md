[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / PreparedBootstrapPrelude

# Interface: PreparedBootstrapPrelude

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:15

Holds Bootstrap preparation evidence before the ownership lease is acquired.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:18

---

### bootstrapActivityId

> `readonly` **bootstrapActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:19

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:16

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:17

---

### journal

> `readonly` **journal**: [`BootstrapJournal`](../../../bootstrap-state/dist/classes/BootstrapJournal.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:21

---

### paths

> `readonly` **paths**: [`BootstrapPathProfile`](BootstrapPathProfile.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:20

---

### preliminaryState

> `readonly` **preliminaryState**: [`BootstrapStateLoadResult`](../../../bootstrap-state/dist/type-aliases/BootstrapStateLoadResult.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:22

## Methods

### acquireOwnership()

> **acquireOwnership**(`options`): `Promise`\<[`OwnedBootstrapPrelude`](OwnedBootstrapPrelude.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:24

Acquires ownership and upgrades the prepared evidence into an owned prelude.

#### Parameters

##### options

`Omit`\<[`BootstrapOwnershipOptions`](BootstrapOwnershipOptions.md), `"bootId"`\>

#### Returns

`Promise`\<[`OwnedBootstrapPrelude`](OwnedBootstrapPrelude.md)\>
