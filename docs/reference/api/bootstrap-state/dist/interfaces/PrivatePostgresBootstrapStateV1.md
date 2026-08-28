[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / PrivatePostgresBootstrapStateV1

# Interface: PrivatePostgresBootstrapStateV1

Defined in: packages/bootstrap-state/dist/model.d.ts:31

Versioned private PostgreSQL identity and placement recorded in BootstrapState.

## Properties

### bootstrapRoleName

> `readonly` **bootstrapRoleName**: `string`

Defined in: packages/bootstrap-state/dist/model.d.ts:37

---

### clusterSystemIdentifier

> `readonly` **clusterSystemIdentifier**: `string`

Defined in: packages/bootstrap-state/dist/model.d.ts:44

---

### dataPlacement

> `readonly` **dataPlacement**: `object`

Defined in: packages/bootstrap-state/dist/model.d.ts:38

#### dataLayoutVersion

> `readonly` **dataLayoutVersion**: `1`

#### relativePath

> `readonly` **relativePath**: `"private-postgres"`

#### rootId

> `readonly` **rootId**: `"DATA"`

---

### initializationProfileRevision

> `readonly` **initializationProfileRevision**: [`PrivatePostgresInitializationProfileRevision`](../type-aliases/PrivatePostgresInitializationProfileRevision.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:45

---

### initializedByPostgresVersion

> `readonly` **initializedByPostgresVersion**: `string`

Defined in: packages/bootstrap-state/dist/model.d.ts:34

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:35

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-state/dist/model.d.ts:36

---

### persistedPort

> `readonly` **persistedPort**: `number`

Defined in: packages/bootstrap-state/dist/model.d.ts:43

---

### postgresMajor

> `readonly` **postgresMajor**: `18`

Defined in: packages/bootstrap-state/dist/model.d.ts:33

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/bootstrap-state/dist/model.d.ts:32
