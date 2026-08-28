[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapKeyProvider

# Interface: BootstrapKeyProvider

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:15

Supplies one Bootstrap secret only for the duration of an async callback.

## Methods

### withPrivatePostgresBootstrapPassword()

> **withPrivatePostgresBootstrapPassword**\<`T`>\>(`context`, `use`): `Promise`\<`T`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:17

Uses the bootstrap-superuser password without returning or retaining it.

#### Type Parameters

##### T

`T`

#### Parameters

##### context

[`BootstrapKeyRequestContext`](BootstrapKeyRequestContext.md)

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withPrivatePostgresHostLeasePassword()

> **withPrivatePostgresHostLeasePassword**\<`T`>\>(`context`, `use`): `Promise`\<`T`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:19

Uses the Host-lease password within a bounded callback scope.

#### Type Parameters

##### T

`T`

#### Parameters

##### context

[`BootstrapKeyRequestContext`](BootstrapKeyRequestContext.md)

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withPrivatePostgresMigrationPassword()

> **withPrivatePostgresMigrationPassword**\<`T`>\>(`context`, `use`): `Promise`\<`T`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:23

Uses the migration-role password within a bounded callback scope.

#### Type Parameters

##### T

`T`

#### Parameters

##### context

[`BootstrapKeyRequestContext`](BootstrapKeyRequestContext.md)

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### withPrivatePostgresRuntimePassword()

> **withPrivatePostgresRuntimePassword**\<`T`>\>(`context`, `use`): `Promise`\<`T`>\>

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:21

Uses the runtime-role password within a bounded callback scope.

#### Type Parameters

##### T

`T`

#### Parameters

##### context

[`BootstrapKeyRequestContext`](BootstrapKeyRequestContext.md)

##### use

(`passwordUtf8`) => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
