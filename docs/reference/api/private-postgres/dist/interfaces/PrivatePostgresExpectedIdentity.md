[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / PrivatePostgresExpectedIdentity

# Interface: PrivatePostgresExpectedIdentity

Defined in: packages/private-postgres/dist/contracts.d.ts:44

Expected cluster identity used to reject wrong or relocated data.

## Properties

### bootstrapRoleName

> `readonly` **bootstrapRoleName**: `string`

Defined in: packages/private-postgres/dist/contracts.d.ts:48

---

### clusterSystemIdentifier

> `readonly` **clusterSystemIdentifier**: `string`

Defined in: packages/private-postgres/dist/contracts.d.ts:51

---

### initializationProfileRevision

> `readonly` **initializationProfileRevision**: [`PrivatePostgresInitializationProfileRevision`](../type-aliases/PrivatePostgresInitializationProfileRevision.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:52

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:45

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/private-postgres/dist/contracts.d.ts:46

---

### persistedPort

> `readonly` **persistedPort**: `number`

Defined in: packages/private-postgres/dist/contracts.d.ts:50

---

### placement

> `readonly` **placement**: `Omit`\<[`PrivatePostgresPlacement`](PrivatePostgresPlacement.md), `"canonicalDataDirectory"`>\>

Defined in: packages/private-postgres/dist/contracts.d.ts:49

---

### postgresMajor

> `readonly` **postgresMajor**: `18`

Defined in: packages/private-postgres/dist/contracts.d.ts:47
