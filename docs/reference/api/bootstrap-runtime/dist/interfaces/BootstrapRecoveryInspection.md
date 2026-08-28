[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapRecoveryInspection

# Interface: BootstrapRecoveryInspection

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:17

Collects read-only lock, witness, state, and maintenance recovery evidence.

## Properties

### anchorRoot

> `readonly` **anchorRoot**: `string`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:18

---

### attemptProcessStatuses

> `readonly` **attemptProcessStatuses**: readonly `BootstrapProcessIdentityStatus`[]

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:30

---

### attempts

> `readonly` **attempts**: readonly [`BootstrapOwnerWitnessEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:29

---

### bootstrapState

> `readonly` **bootstrapState**: [`BootstrapStateLoadResult`](../../../bootstrap-state/dist/type-aliases/BootstrapStateLoadResult.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:33

---

### disposition

> `readonly` **disposition**: [`BootstrapRecoveryDisposition`](../type-aliases/BootstrapRecoveryDisposition.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:24

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:19

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:20

---

### instanceRoot

> `readonly` **instanceRoot**: `string`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:21

---

### lockAgeMs?

> `readonly` `optional` **lockAgeMs?**: `number`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:26

---

### lockPresent

> `readonly` **lockPresent**: `boolean`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:25

---

### maintenance?

> `readonly` `optional` **maintenance?**: [`MaintenanceJournalLoadResult`](../../../bootstrap-state/dist/type-aliases/MaintenanceJournalLoadResult.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:35

---

### maintenanceIncomplete

> `readonly` **maintenanceIncomplete**: `boolean`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:36

---

### operationId?

> `readonly` `optional` **operationId?**: [`MaintenanceOperationId`](../../../bootstrap-state/dist/type-aliases/MaintenanceOperationId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:34

---

### owner?

> `readonly` `optional` **owner?**: [`BootstrapOwnerWitnessEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapOwnerWitnessEnvelopeV1.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:27

---

### ownerProcessStatus?

> `readonly` `optional` **ownerProcessStatus?**: `BootstrapProcessIdentityStatus`

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:28

---

### problem?

> `readonly` `optional` **problem?**: [`Problem`](../../../foundation-contracts/dist/interfaces/Problem.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:37

---

### recoveryActivityId

> `readonly` **recoveryActivityId**: [`ActivityId`](../../../foundation-contracts/dist/type-aliases/ActivityId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:23

---

### recoveryBootId

> `readonly` **recoveryBootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:22

---

### releasing

> `readonly` **releasing**: readonly [`BootstrapOwnerWitnessEnvelopeV1`](../../../bootstrap-state/dist/interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:31

---

### releasingProcessStatuses

> `readonly` **releasingProcessStatuses**: readonly `BootstrapProcessIdentityStatus`[]

Defined in: packages/bootstrap-runtime/dist/bootstrap-recovery.d.ts:32
