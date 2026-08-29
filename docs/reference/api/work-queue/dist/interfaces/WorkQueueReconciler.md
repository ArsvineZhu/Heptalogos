[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkQueueReconciler

# Interface: WorkQueueReconciler

Defined in: packages/work-queue/dist/reconciler.d.ts:36

Starts, stops, and explicitly scans the signal-backed queue projection.

## Methods

### scan()

> **scan**(): `Promise`\<[`ReconciliationScanResult`](ReconciliationScanResult.md)>\>

Defined in: packages/work-queue/dist/reconciler.d.ts:42

Reconcile due, waiting, and pending work against durable repository truth.

#### Returns

`Promise`\<[`ReconciliationScanResult`](ReconciliationScanResult.md)\>

---

### start()

> **start**(): `Promise`\<`void`>\>

Defined in: packages/work-queue/dist/reconciler.d.ts:38

Subscribe to wakeups and begin the initial canonical scan.

#### Returns

`Promise`\<`void`\>

---

### stop()

> **stop**(): `Promise`\<`void`>\>

Defined in: packages/work-queue/dist/reconciler.d.ts:40

Cancel timers, close the signal subscription, and drain the current scan.

#### Returns

`Promise`\<`void`\>
