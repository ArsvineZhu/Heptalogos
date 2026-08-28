[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkHandlerResolver

# Interface: WorkHandlerResolver

Defined in: packages/work-queue/dist/service.d.ts:35

Resolves an exact generation-bound handler lease for admission and execution.

## Methods

### resolve()

> **resolve**(`target`): [`RuntimeWorkHandlerLease`](../../../runtime-kernel/dist/interfaces/RuntimeWorkHandlerLease.md) \| `undefined`

Defined in: packages/work-queue/dist/service.d.ts:37

Return the handler lease only when the target matches an active generation.

#### Parameters

##### target

[`WorkHandlerTarget`](../../../runtime-kernel/dist/interfaces/WorkHandlerTarget.md)

#### Returns

[`RuntimeWorkHandlerLease`](../../../runtime-kernel/dist/interfaces/RuntimeWorkHandlerLease.md) \| `undefined`
