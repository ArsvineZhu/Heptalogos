[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / PreparedPrivatePostgresMaintenance

# Interface: PreparedPrivatePostgresMaintenance

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:38

Represents a prepared maintenance window bound to one operation journal.

## Properties

### operationId

> `readonly` **operationId**: [`MaintenanceOperationId`](../../../bootstrap-state/dist/type-aliases/MaintenanceOperationId.md)

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:39

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:41

---

### state

> `readonly` **state**: `HostMaintenanceState`

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:40

## Methods

### abortBeforeEntry()

> **abortBeforeEntry**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:45

Cancels preparation before the durable point of no return.

#### Returns

`Promise`\<`void`\>

---

### execute()

> **execute**(`quiescence`): `Promise`\<[`PrivatePostgresMaintenanceResult`](../type-aliases/PrivatePostgresMaintenanceResult.md)>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:43

Executes the entered window after quiescence has been proved.

#### Parameters

##### quiescence

[`HostMaintenanceQuiescence`](HostMaintenanceQuiescence.md)

#### Returns

`Promise`\<[`PrivatePostgresMaintenanceResult`](../type-aliases/PrivatePostgresMaintenanceResult.md)\>
