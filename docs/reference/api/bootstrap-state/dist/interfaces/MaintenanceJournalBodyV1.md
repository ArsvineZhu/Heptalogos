[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / MaintenanceJournalBodyV1

# Interface: MaintenanceJournalBodyV1

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:20

Versioned durable journal body for one Host/private-PostgreSQL window.

## Properties

### activityId

> `readonly` **activityId**: [`MaintenanceActivityId`](../type-aliases/MaintenanceActivityId.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:24

---

### bootId

> `readonly` **bootId**: [`BootId`](../type-aliases/BootId.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:27

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:25

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:26

---

### lastCompletedStage

> `readonly` **lastCompletedStage**: [`MaintenanceStage`](../type-aliases/MaintenanceStage.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:45

---

### operationId

> `readonly` **operationId**: [`MaintenanceOperationId`](../type-aliases/MaintenanceOperationId.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:23

---

### operationType

> `readonly` **operationType**: [`MaintenanceOperationType`](../type-aliases/MaintenanceOperationType.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:28

---

### problemCode?

> `readonly` `optional` **problemCode?**: `string`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:48

---

### revision

> `readonly` **revision**: `number`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:22

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:21

---

### source

> `readonly` **source**: `object`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:29

#### hostOwnershipRevision

> `readonly` **hostOwnershipRevision**: `string`

#### hostOwnershipToken

> `readonly` **hostOwnershipToken**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

#### persistedPort

> `readonly` **persistedPort**: `number`

#### postgresClusterSystemIdentifier

> `readonly` **postgresClusterSystemIdentifier**: `string`

---

### target

> `readonly` **target**: `object`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:35

#### hostBootId?

> `readonly` `optional` **hostBootId?**: [`BootId`](../type-aliases/BootId.md)

#### hostOwnershipRevision?

> `readonly` `optional` **hostOwnershipRevision?**: `string`

#### hostOwnershipToken?

> `readonly` `optional` **hostOwnershipToken?**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

#### privatePostgres

> `readonly` **privatePostgres**: `"RUNNING_SAME_IDENTITY"` \| `"STOPPED"`

---

### terminalOutcome?

> `readonly` `optional` **terminalOutcome?**: [`MaintenanceTerminalOutcome`](../type-aliases/MaintenanceTerminalOutcome.md)

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:47

---

### updatedAt

> `readonly` **updatedAt**: `string`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:46

---

### verifiedPrerequisites

> `readonly` **verifiedPrerequisites**: `object`

Defined in: packages/bootstrap-state/dist/maintenance-model.d.ts:41

#### bootstrapStateDigest

> `readonly` **bootstrapStateDigest**: [`Sha256Digest`](../../../foundation-contracts/dist/interfaces/Sha256Digest.md)

#### privatePostgresInitializationProfileRevision

> `readonly` **privatePostgresInitializationProfileRevision**: [`MaintenancePrivatePostgresInitializationProfileRevision`](../type-aliases/MaintenancePrivatePostgresInitializationProfileRevision.md)
