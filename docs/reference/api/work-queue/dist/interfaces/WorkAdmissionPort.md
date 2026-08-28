[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkAdmissionPort

# Interface: WorkAdmissionPort

Defined in: packages/work-queue/dist/admission.d.ts:27

Policy boundary that may allow, delay, throttle, or reject queue work.

## Methods

### beforeCreate()

> **beforeCreate**(`input`): [`WorkCreationAdmissionDecision`](../type-aliases/WorkCreationAdmissionDecision.md) \| `Promise`\<[`WorkCreationAdmissionDecision`](../type-aliases/WorkCreationAdmissionDecision.md)>\>

Defined in: packages/work-queue/dist/admission.d.ts:29

Decide whether creation may proceed and at what earliest time.

#### Parameters

##### input

[`WorkAdmissionRequest`](WorkAdmissionRequest.md)

#### Returns

[`WorkCreationAdmissionDecision`](../type-aliases/WorkCreationAdmissionDecision.md) \| `Promise`\<[`WorkCreationAdmissionDecision`](../type-aliases/WorkCreationAdmissionDecision.md)\>

---

### beforeDispatch()

> **beforeDispatch**(`input`): [`WorkDispatchAdmissionDecision`](../type-aliases/WorkDispatchAdmissionDecision.md) \| `Promise`\<[`WorkDispatchAdmissionDecision`](../type-aliases/WorkDispatchAdmissionDecision.md)>\>

Defined in: packages/work-queue/dist/admission.d.ts:31

Decide whether a ready WorkItem may be dispatched now.

#### Parameters

##### input

[`WorkDispatchAdmissionRequest`](WorkDispatchAdmissionRequest.md)

#### Returns

[`WorkDispatchAdmissionDecision`](../type-aliases/WorkDispatchAdmissionDecision.md) \| `Promise`\<[`WorkDispatchAdmissionDecision`](../type-aliases/WorkDispatchAdmissionDecision.md)\>
