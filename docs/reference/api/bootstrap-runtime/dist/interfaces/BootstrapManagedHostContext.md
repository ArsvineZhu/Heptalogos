[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapManagedHostContext

# Interface: BootstrapManagedHostContext

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:48

Managed Host context that fences all persistence and maintenance operations.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:51

---

### continuityEpochId

> `readonly` **continuityEpochId**: [`ContinuityEpochId`](../../../foundation-contracts/dist/type-aliases/ContinuityEpochId.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:52

---

### durableExecution

> `readonly` **durableExecution**: [`HostDurableExecutionAuthority`](../../../host-ownership/dist/interfaces/HostDurableExecutionAuthority.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:57

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:49

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:50

---

### persistence

> `readonly` **persistence**: [`HostPersistenceAuthority`](../../../host-ownership/dist/interfaces/HostPersistenceAuthority.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:56

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:55

---

### state

> `readonly` **state**: [`HostOwnershipState`](../../../host-ownership/dist/type-aliases/HostOwnershipState.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:54

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:53

## Methods

### assertActive()

> **assertActive**(): `void`

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:59

Throws when the managed Host has been closed or its fence is inactive.

#### Returns

`void`

---

### preparePrivatePostgresMaintenance()

> **preparePrivatePostgresMaintenance**(`request`): `Promise`\<[`PreparedPrivatePostgresMaintenance`](PreparedPrivatePostgresMaintenance.md)>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:61

Prepares a bounded private PostgreSQL maintenance operation.

#### Parameters

##### request

[`PrivatePostgresMaintenanceRequest`](../type-aliases/PrivatePostgresMaintenanceRequest.md)

#### Returns

`Promise`\<[`PreparedPrivatePostgresMaintenance`](PreparedPrivatePostgresMaintenance.md)\>

---

### shutdownKeepingPrivatePostgres()

> **shutdownKeepingPrivatePostgres**(`quiescence`): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:63

Quiesces and closes Host while preserving the maintenance handoff order.

#### Parameters

##### quiescence

[`HostMaintenanceQuiescence`](HostMaintenanceQuiescence.md)

#### Returns

`Promise`\<`void`\>
