[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / ReadyPrivatePostgres

# Interface: ReadyPrivatePostgres

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:21

Represents a private PostgreSQL session ready for Host handoff or control.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:24

---

### clusterSystemIdentifier

> `readonly` **clusterSystemIdentifier**: `string`

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:26

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:22

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:23

---

### port

> `readonly` **port**: `number`

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:25

---

### startupDisposition

> `readonly` **startupDisposition**: [`PrivatePostgresStartupDisposition`](../../../private-postgres/dist/type-aliases/PrivatePostgresStartupDisposition.md)

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:28

---

### toolchainVersion

> `readonly` **toolchainVersion**: `"18.6"`

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:27

## Methods

### restart()

> **restart**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:32

Restarts the session only while the owning Bootstrap lease remains valid.

#### Returns

`Promise`\<`void`\>

---

### stop()

> **stop**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/private-postgres-bootstrap.d.ts:30

Stops the session only while the owning Bootstrap lease remains valid.

#### Returns

`Promise`\<`void`\>
