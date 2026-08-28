[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkItemStateMachine

# Interface: WorkItemStateMachine

Defined in: packages/work-queue/dist/state-machine.d.ts:28

In-memory transition tracker used to validate one repository state change.

## Properties

### state

> `readonly` **state**: [`WorkItemState`](../type-aliases/WorkItemState.md)

Defined in: packages/work-queue/dist/state-machine.d.ts:30

Current lifecycle state represented by the tracker.

## Methods

### can()

> **can**(`event`): `boolean`

Defined in: packages/work-queue/dist/state-machine.d.ts:32

Return whether the event is legal from the current state.

#### Parameters

##### event

[`WorkItemTransitionEvent`](../type-aliases/WorkItemTransitionEvent.md)

#### Returns

`boolean`

---

### send()

> **send**(`event`): [`WorkItemState`](../type-aliases/WorkItemState.md)

Defined in: packages/work-queue/dist/state-machine.d.ts:34

Apply a legal event and return the resulting lifecycle state.

#### Parameters

##### event

[`WorkItemTransitionEvent`](../type-aliases/WorkItemTransitionEvent.md)

#### Returns

[`WorkItemState`](../type-aliases/WorkItemState.md)
