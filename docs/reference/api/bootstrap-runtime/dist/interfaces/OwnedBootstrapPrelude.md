[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / OwnedBootstrapPrelude

# Interface: OwnedBootstrapPrelude

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:27

Holds Bootstrap state and private-PostgreSQL operations under a live lease.

## Properties

### authoritativeState

> `readonly` **authoritativeState**: [`BootstrapStateLoadResult`](../../../bootstrap-state/dist/type-aliases/BootstrapStateLoadResult.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:36

---

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:30

---

### bootstrapActivityId

> `readonly` **bootstrapActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:31

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:28

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:29

---

### ownershipSignal

> `readonly` **ownershipSignal**: `AbortSignal`

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:34

---

### ownershipState

> `readonly` **ownershipState**: [`BootstrapOwnershipState`](../type-aliases/BootstrapOwnershipState.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:33

---

### paths

> `readonly` **paths**: [`BootstrapPathProfile`](BootstrapPathProfile.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:32

---

### state

> `readonly` **state**: [`OwnedBootstrapStateStore`](OwnedBootstrapStateStore.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:35

## Methods

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:44

Releases the prelude and its ownership-bound resources.

#### Returns

`Promise`\<`void`\>

---

### ensureBootstrapStateInitialized()

> **ensureBootstrapStateInitialized**(`selection`): `Promise`\<[`BootstrapStateEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapStateEnvelopeV1.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:38

Initializes the current BootstrapState genesis under the owned store.

#### Parameters

##### selection

[`BootstrapStateGenesisSelection`](BootstrapStateGenesisSelection.md)

#### Returns

`Promise`\<[`BootstrapStateEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapStateEnvelopeV1.md)\>

---

### handoffPrivatePostgresToHost()

> **handoffPrivatePostgresToHost**(`ready`, `options`): `Promise`\<[`BootstrapManagedHostContext`](BootstrapManagedHostContext.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:42

Transfers the prepared PostgreSQL session into Host ownership.

#### Parameters

##### ready

[`ReadyPrivatePostgres`](ReadyPrivatePostgres.md)

##### options

[`HostOwnershipHandoffOptions`](HostOwnershipHandoffOptions.md)

#### Returns

`Promise`\<[`BootstrapManagedHostContext`](BootstrapManagedHostContext.md)\>

---

### preparePrivatePostgres()

> **preparePrivatePostgres**(`options`): `Promise`\<[`ReadyPrivatePostgres`](ReadyPrivatePostgres.md)>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-prelude.d.ts:40

Prepares the private PostgreSQL session while Bootstrap authority is held.

#### Parameters

##### options

[`PreparePrivatePostgresOptions`](PreparePrivatePostgresOptions.md)

#### Returns

`Promise`\<[`ReadyPrivatePostgres`](ReadyPrivatePostgres.md)\>
