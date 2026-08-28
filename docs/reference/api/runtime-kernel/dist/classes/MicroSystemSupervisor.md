[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / MicroSystemSupervisor

# Class: MicroSystemSupervisor

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:27

Supervises Runtime graph activation, readiness, quiescence, and retirement.

## Constructors

### Constructor

> **new MicroSystemSupervisor**(`options`): `MicroSystemSupervisor`

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:50

Creates a supervisor and registers its initial MicroSystem definitions.

#### Parameters

##### options

[`MicroSystemSupervisorOptions`](../interfaces/MicroSystemSupervisorOptions.md)

#### Returns

`MicroSystemSupervisor`

## Properties

### capabilities

> `readonly` **capabilities**: [`CapabilityRegistry`](CapabilityRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:30

---

### services

> `readonly` **services**: [`ServiceRegistry`](ServiceRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:29

---

### workHandlers

> `readonly` **workHandlers**: [`WorkHandlerRegistry`](WorkHandlerRegistry.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:31

## Methods

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:71

Closes the supervisor after draining active and unsettled generations.

#### Returns

`Promise`\<`void`\>

---

### evaluateReadiness()

> **evaluateReadiness**(`profile`): [`ReadinessResult`](../interfaces/ReadinessResult.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:58

Evaluates a readiness profile against current Runtime bindings.

#### Parameters

##### profile

[`ReadinessProfileDefinition`](../interfaces/ReadinessProfileDefinition.md)

#### Returns

[`ReadinessResult`](../interfaces/ReadinessResult.md)

---

### getActualSnapshot()

> **getActualSnapshot**(): `ReadonlyMap`\<[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md), [`MicroSystemActualState`](../type-aliases/MicroSystemActualState.md)>\>

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:56

Returns a snapshot of all observed MicroSystem states.

#### Returns

`ReadonlyMap`\<[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md), [`MicroSystemActualState`](../type-aliases/MicroSystemActualState.md)\>

---

### getActualState()

> **getActualState**(`microSystemId`): [`MicroSystemActualState`](../type-aliases/MicroSystemActualState.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:54

Returns the current observed state for one MicroSystem.

#### Parameters

##### microSystemId

[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md)

#### Returns

[`MicroSystemActualState`](../type-aliases/MicroSystemActualState.md)

---

### getDefinition()

> **getDefinition**(`microSystemId`): [`MicroSystemDefinition`](../interfaces/MicroSystemDefinition.md)

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:60

Returns a registered MicroSystem definition or raises a typed Problem.

#### Parameters

##### microSystemId

[`MicroSystemId`](../../../foundation-contracts/dist/type-aliases/MicroSystemId.md)

#### Returns

[`MicroSystemDefinition`](../interfaces/MicroSystemDefinition.md)

---

### quiesce()

> **quiesce**(): `Promise`\<[`RuntimeQuiescenceLease`](../interfaces/RuntimeQuiescenceLease.md)>\>

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:69

Quiesces active MicroSystems and returns a reversible Runtime lease.

#### Returns

`Promise`\<[`RuntimeQuiescenceLease`](../interfaces/RuntimeQuiescenceLease.md)\>

---

### reconcile()

> **reconcile**(`input`): `Promise`\<[`ReconcilePlan`](../interfaces/ReconcilePlan.md)>\>

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:62

Serializes and applies one desired Runtime reconciliation.

#### Parameters

##### input

[`DesiredRuntimeSnapshot`](../interfaces/DesiredRuntimeSnapshot.md)

#### Returns

`Promise`\<[`ReconcilePlan`](../interfaces/ReconcilePlan.md)\>

---

### register()

> **register**(`definition`): `void`

Defined in: packages/runtime-kernel/dist/supervisor.d.ts:52

Registers one MicroSystem definition before reconciliation.

#### Parameters

##### definition

[`MicroSystemDefinition`](../interfaces/MicroSystemDefinition.md)

#### Returns

`void`
