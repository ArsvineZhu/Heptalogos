[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeReconciler

# Class: RuntimeReconciler

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:52

Plans Runtime activation, rebinding, quiescence, and retirement actions.

## Constructors

### Constructor

> **new RuntimeReconciler**(): `RuntimeReconciler`

#### Returns

`RuntimeReconciler`

## Methods

### plan()

> **plan**(`input`): [`ReconcilePlan`](../interfaces/ReconcilePlan.md)

Defined in: packages/runtime-kernel/dist/reconciler.d.ts:54

Computes a deterministic plan without mutating Runtime state.

#### Parameters

##### input

[`ReconcileInput`](../interfaces/ReconcileInput.md)

#### Returns

[`ReconcilePlan`](../interfaces/ReconcilePlan.md)
