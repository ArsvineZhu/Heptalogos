[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-state/dist](../README.md) / BootstrapOwnerWitnessStore

# Class: BootstrapOwnerWitnessStore

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:8

Stores owner, attempt, and releasing witnesses under one instance root.

## Constructors

### Constructor

> **new BootstrapOwnerWitnessStore**(`instanceRoot`): `BootstrapOwnerWitnessStore`

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:14

Binds this store to the canonical instance lifecycle root.

#### Parameters

##### instanceRoot

`string`

#### Returns

`BootstrapOwnerWitnessStore`

## Methods

### createAttempt()

> **createAttempt**(`witness`): `Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:20

Publishes an ATTEMPT witness before provider lock acquisition.

#### Parameters

##### witness

[`BootstrapOwnerWitnessBodyV1`](../interfaces/BootstrapOwnerWitnessBodyV1.md)

#### Returns

`Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)\>

---

### listAttempts()

> **listAttempts**(): `Promise`\<readonly [`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:22

Lists and validates all outstanding ATTEMPT witnesses.

#### Returns

`Promise`\<readonly [`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]\>

---

### listReleasing()

> **listReleasing**(): `Promise`\<readonly [`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:29

Lists and validates witnesses left by interrupted release.

#### Returns

`Promise`\<readonly [`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)[]\>

---

### publishOwner()

> **publishOwner**(`witness`): `Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:18

Publishes an OWNER witness and verifies the exact durable reload.

#### Parameters

##### witness

[`BootstrapOwnerWitnessBodyV1`](../interfaces/BootstrapOwnerWitnessBodyV1.md)

#### Returns

`Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)\>

---

### publishReleasing()

> **publishReleasing**(`witness`): `Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:24

Publishes a RELEASING witness before removing the current owner.

#### Parameters

##### witness

[`BootstrapOwnerWitnessBodyV1`](../interfaces/BootstrapOwnerWitnessBodyV1.md) & `object`

#### Returns

`Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md)\>

---

### readOwner()

> **readOwner**(): `Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md) \| `undefined`>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:16

Reads the currently published owner witness, if one exists.

#### Returns

`Promise`\<[`BootstrapOwnerWitnessEnvelopeV1`](../interfaces/BootstrapOwnerWitnessEnvelopeV1.md) \| `undefined`\>

---

### removeAttempt()

> **removeAttempt**(`lockGenerationId`): `Promise`\<`void`>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:35

Removes one failed or completed ownership attempt witness.

#### Parameters

##### lockGenerationId

[`BootstrapLockGenerationId`](../type-aliases/BootstrapLockGenerationId.md)

#### Returns

`Promise`\<`void`\>

---

### removeCurrentOwnerWhileHeld()

> **removeCurrentOwnerWhileHeld**(`lockGenerationId`): `Promise`\<`void`>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:33

Removes the current owner only when its generation still matches.

#### Parameters

##### lockGenerationId

[`BootstrapLockGenerationId`](../type-aliases/BootstrapLockGenerationId.md)

#### Returns

`Promise`\<`void`\>

---

### removeReleasing()

> **removeReleasing**(`lockGenerationId`): `Promise`\<`void`>\>

Defined in: packages/bootstrap-state/dist/bootstrap-owner-witness-store.d.ts:31

Removes a releasing witness after its owner transition is complete.

#### Parameters

##### lockGenerationId

[`BootstrapLockGenerationId`](../type-aliases/BootstrapLockGenerationId.md)

#### Returns

`Promise`\<`void`\>
