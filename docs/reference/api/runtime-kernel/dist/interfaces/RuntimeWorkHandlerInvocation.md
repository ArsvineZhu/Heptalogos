[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeWorkHandlerInvocation

# Interface: RuntimeWorkHandlerInvocation

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:35

Carries one generation-pinned WorkItem invocation into a handler.

## Properties

### dispatchRevision

> `readonly` **dispatchRevision**: `number`

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:37

---

### payload

> `readonly` **payload**: [`RuntimeContractData`](../type-aliases/RuntimeContractData.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:39

---

### payloadVersion

> `readonly` **payloadVersion**: `number`

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:38

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:40

---

### workItemId

> `readonly` **workItemId**: [`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

Defined in: packages/runtime-kernel/dist/work-handler-contracts.d.ts:36
