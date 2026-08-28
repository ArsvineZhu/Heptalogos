[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / BootstrapAdminPasswordProvider

# Interface: BootstrapAdminPasswordProvider

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:31

Supplies each PostgreSQL role password only within a callback scope.

## Methods

### withBootstrapPassword()

> **withBootstrapPassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:33

Uses the Bootstrap-admin password without returning it.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withDurableExecutionPassword()

> **withDurableExecutionPassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:41

Uses the durable-engine password without returning it.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withHostLeasePassword()

> **withHostLeasePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:35

Uses the Host-lease password without returning it.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withMigrationPassword()

> **withMigrationPassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:39

Uses the migration password without returning it.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withRuntimePassword()

> **withRuntimePassword**\<`T`>\>(`use`): `Promise`\<`T`>\>

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:37

Uses the runtime password without returning it.

#### Type Parameters

##### T

`T`

#### Parameters

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
