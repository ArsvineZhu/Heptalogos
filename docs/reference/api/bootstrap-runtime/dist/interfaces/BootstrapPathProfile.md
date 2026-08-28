[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapPathProfile

# Interface: BootstrapPathProfile

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:15

Provides the identity-scoped lifecycle root lookup used by Bootstrap stores.

## Properties

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:16

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:17

## Methods

### list()

> **list**(): readonly [`ResolvedLifecycleRoot`](ResolvedLifecycleRoot.md)[]

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:21

Returns all roots resolved for the current Bootstrap operation.

#### Returns

readonly [`ResolvedLifecycleRoot`](ResolvedLifecycleRoot.md)[]

---

### resolve()

> **resolve**(`root`): [`ResolvedLifecycleRoot`](ResolvedLifecycleRoot.md)

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:19

Returns the canonical path for a required lifecycle root.

#### Parameters

##### root

`"PROGRAM"` \| `"INSTANCE"` \| `"CONFIGURATION"` \| `"DATA"` \| `"SECRET"` \| `"BLOB"` \| `"BACKUP"` \| `"LOG"` \| `"CACHE"` \| `"TEMP"` \| `"RUN"` \| `"PACKAGE_STAGING"`

#### Returns

[`ResolvedLifecycleRoot`](ResolvedLifecycleRoot.md)
