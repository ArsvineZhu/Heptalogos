[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / WorkHandlerProvisionDescriptor

# Interface: WorkHandlerProvisionDescriptor

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:24

Declares queue, resource, payload, and outcome policy for a WorkHandler.

## Properties

### configurationBindingPolicy

> `readonly` **configurationBindingPolicy**: [`WorkHandlerConfigurationBindingPolicy`](../type-aliases/WorkHandlerConfigurationBindingPolicy.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:31

---

### contractVersion

> `readonly` **contractVersion**: [`ContractVersion`](../type-aliases/ContractVersion.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:26

---

### contributionId

> `readonly` **contributionId**: [`ContributionId`](../../../foundation-contracts/dist/type-aliases/ContributionId.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:25

---

### outcomeSchema

> `readonly` **outcomeSchema**: `Readonly`\<`Record`\<`string`, `unknown`>>\>\>

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:28

---

### payloadContracts

> `readonly` **payloadContracts**: readonly [`WorkHandlerPayloadContract`](WorkHandlerPayloadContract.md)[]

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:27

---

### queueProfileId

> `readonly` **queueProfileId**: [`WorkQueueProfileId`](../type-aliases/WorkQueueProfileId.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:29

---

### resourceAdmissionClass

> `readonly` **resourceAdmissionClass**: [`ResourceAdmissionClassId`](../type-aliases/ResourceAdmissionClassId.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:30

---

### restoreReplayClass

> `readonly` **restoreReplayClass**: [`WorkHandlerRestoreReplayClass`](../type-aliases/WorkHandlerRestoreReplayClass.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:32
