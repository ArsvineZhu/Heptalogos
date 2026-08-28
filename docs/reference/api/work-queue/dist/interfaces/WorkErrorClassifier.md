[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkErrorClassifier

# Interface: WorkErrorClassifier

Defined in: packages/work-queue/dist/contracts.d.ts:212

Converts handler failures into the queue's durable retry decision.

## Methods

### classify()

> **classify**(`input`): [`WorkErrorDecision`](../type-aliases/WorkErrorDecision.md)

Defined in: packages/work-queue/dist/contracts.d.ts:214

Classify one failed attempt without mutating queue state.

#### Parameters

##### input

[`WorkErrorClassificationInput`](WorkErrorClassificationInput.md)

#### Returns

[`WorkErrorDecision`](../type-aliases/WorkErrorDecision.md)
