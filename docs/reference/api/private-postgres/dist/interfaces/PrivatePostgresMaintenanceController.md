[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / PrivatePostgresMaintenanceController

# Interface: PrivatePostgresMaintenanceController

Defined in: packages/private-postgres/dist/maintenance-controller.d.ts:8

Controls private PostgreSQL only during an authorized maintenance window.

## Properties

### state

> `readonly` **state**: `"UNCERTAIN"` \| `"STOPPED"` \| `"READY"` \| `"STARTING"` \| `"STOPPING"`

Defined in: packages/private-postgres/dist/maintenance-controller.d.ts:9

## Methods

### start()

> **start**(): `Promise`\<`void`>\>

Defined in: packages/private-postgres/dist/maintenance-controller.d.ts:13

Starts the managed cluster and proves readiness.

#### Returns

`Promise`\<`void`\>

---

### stop()

> **stop**(): `Promise`\<`void`>\>

Defined in: packages/private-postgres/dist/maintenance-controller.d.ts:11

Stops the managed cluster and proves its terminal status.

#### Returns

`Promise`\<`void`\>
