[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / ReadyPrivatePostgresMechanics

# Interface: ReadyPrivatePostgresMechanics

Defined in: packages/private-postgres/dist/contracts.d.ts:86

Exposes the ready session mechanics used by Bootstrap handoff.

## Properties

### identity

> `readonly` **identity**: [`PrivatePostgresClusterIdentity`](PrivatePostgresClusterIdentity.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:89

---

### placement

> `readonly` **placement**: [`PrivatePostgresPlacement`](PrivatePostgresPlacement.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:88

---

### port

> `readonly` **port**: `number`

Defined in: packages/private-postgres/dist/contracts.d.ts:90

---

### startupDisposition

> `readonly` **startupDisposition**: [`PrivatePostgresStartupDisposition`](../type-aliases/PrivatePostgresStartupDisposition.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:91

---

### toolchain

> `readonly` **toolchain**: [`PrivatePostgresToolchain`](PrivatePostgresToolchain.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:87

## Methods

### restart()

> **restart**(): `Promise`\<`void`>\>

Defined in: packages/private-postgres/dist/contracts.d.ts:95

Restarts PostgreSQL through the owning lifecycle controller.

#### Returns

`Promise`\<`void`\>

---

### stop()

> **stop**(): `Promise`\<`void`>\>

Defined in: packages/private-postgres/dist/contracts.d.ts:93

Stops PostgreSQL through the owning lifecycle controller.

#### Returns

`Promise`\<`void`\>
