[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkQueueRepository

# Interface: WorkQueueRepository

Defined in: packages/work-queue/dist/repository.d.ts:91

Foundation-backed owner of all canonical WorkItem reads and state mutations.

## Methods

### commitTerminal()

> **commitTerminal**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:134

Commit one bounded terminal outcome with revision and attempt fencing.

#### Parameters

##### input

`CommitTerminalInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### findNonTerminalDedup()

> **findNonTerminalDedup**(`lookup`): `Promise`\<[`WorkItem`](WorkItem.md) \| `undefined`>\>

Defined in: packages/work-queue/dist/repository.d.ts:97

Find a non-terminal item matching the handler-scoped deduplication key.

#### Parameters

##### lookup

`WorkItemDedupLookup`

#### Returns

`Promise`\<[`WorkItem`](WorkItem.md) \| `undefined`\>

---

### getWorkItem()

> **getWorkItem**(`workItemId`): `Promise`\<[`WorkItem`](WorkItem.md) \| `undefined`>\>

Defined in: packages/work-queue/dist/repository.d.ts:95

Read one item by its stable identity.

#### Parameters

##### workItemId

[`WorkItemId`](../../../foundation-contracts/dist/type-aliases/WorkItemId.md)

#### Returns

`Promise`\<[`WorkItem`](WorkItem.md) \| `undefined`\>

---

### insertWorkItem()

> **insertWorkItem**(`item`, `options?`): `Promise`\<`WorkItemInsertResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:93

Insert a new item or return the existing non-terminal deduplication match.

#### Parameters

##### item

[`WorkItem`](WorkItem.md)

##### options?

`WorkItemInsertOptions`

#### Returns

`Promise`\<`WorkItemInsertResult`\>

---

### listDueRetry()

> **listDueRetry**(`input`): `Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

Defined in: packages/work-queue/dist/repository.d.ts:107

Read retry-wait items whose not-before instant has arrived.

#### Parameters

##### input

###### limit

`number`

###### now

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

#### Returns

`Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

---

### listProjectionCandidates()

> **listProjectionCandidates**(`input`): `Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

Defined in: packages/work-queue/dist/repository.d.ts:101

Read one fair page of pending projection candidates through the bound.

#### Parameters

##### input

###### after?

`WorkItemScanCursor`

###### limit

`number`

###### through

`WorkItemScanCursor`

#### Returns

`Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

---

### listWaitingDependency()

> **listWaitingDependency**(`input`): `Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

Defined in: packages/work-queue/dist/repository.d.ts:114

Read one fair page of dependency-waiting items through the bound.

#### Parameters

##### input

###### after?

`WorkItemScanCursor`

###### limit

`number`

###### through

`WorkItemScanCursor`

#### Returns

`Promise`\<readonly [`WorkItem`](WorkItem.md)[]\>

---

### markRetryWait()

> **markRetryWait**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:126

Persist retry classification and the next eligible dispatch time.

#### Parameters

##### input

`MarkRetryWaitInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### markRunning()

> **markRunning**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:120

Claim a pending item for the exact dispatch attempt and revision.

#### Parameters

##### input

`MarkRunningInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### markWaitingDependency()

> **markWaitingDependency**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:122

Move a dispatch back to dependency waiting under optimistic fencing.

#### Parameters

##### input

`MarkWaitingDependencyInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### requestCancel()

> **requestCancel**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:130

Record a cancellation request for a still-live item.

#### Parameters

##### input

`RequestCancelInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### requestSupersede()

> **requestSupersede**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:132

Record that a still-live item has been replaced by another item.

#### Parameters

##### input

`RequestSupersedeInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### snapshotProjectionCeiling()

> **snapshotProjectionCeiling**(): `Promise`\<`WorkItemScanCursor` \| `undefined`>\>

Defined in: packages/work-queue/dist/repository.d.ts:99

Capture the upper cursor bound for a projection scan.

#### Returns

`Promise`\<`WorkItemScanCursor` \| `undefined`\>

---

### snapshotWaitingDependencyCeiling()

> **snapshotWaitingDependencyCeiling**(): `Promise`\<`WorkItemScanCursor` \| `undefined`>\>

Defined in: packages/work-queue/dist/repository.d.ts:112

Capture the upper cursor bound for dependency-waiting scans.

#### Returns

`Promise`\<`WorkItemScanCursor` \| `undefined`\>

---

### wakeDependency()

> **wakeDependency**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:124

Wake a dependency-waiting item when its exact revision is still current.

#### Parameters

##### input

`WakeDependencyInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>

---

### wakeDueRetry()

> **wakeDueRetry**(`input`): `Promise`\<`WorkItemMutationResult`>\>

Defined in: packages/work-queue/dist/repository.d.ts:128

Wake an eligible retry item without accepting stale revisions.

#### Parameters

##### input

`WakeDueRetryInput`

#### Returns

`Promise`\<`WorkItemMutationResult`\>
