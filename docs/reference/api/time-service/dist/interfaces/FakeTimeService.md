[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [time-service/dist](../README.md) / FakeTimeService

# Interface: FakeTimeService

Defined in: packages/time-service/dist/contracts.d.ts:23

Deterministic clock controls exposed by the test implementation.

## Extends

- [`TimeService`](TimeService.md)

## Methods

### advanceMonotonic()

> **advanceMonotonic**(`nanoseconds`): `void`

Defined in: packages/time-service/dist/contracts.d.ts:29

Advance monotonic time by a non-negative nanosecond delta.

#### Parameters

##### nanoseconds

`bigint`

#### Returns

`void`

---

### advanceWallClock()

> **advanceWallClock**(`milliseconds`): `void`

Defined in: packages/time-service/dist/contracts.d.ts:27

Advance wall-clock time by an integral millisecond delta.

#### Parameters

##### milliseconds

`number`

#### Returns

`void`

---

### elapsedSince()

> **elapsedSince**(`start`): [`ElapsedNanoseconds`](../type-aliases/ElapsedNanoseconds.md)

Defined in: packages/time-service/dist/contracts.d.ts:20

Measure elapsed monotonic time from a prior reading.

#### Parameters

##### start

[`MonotonicTick`](../type-aliases/MonotonicTick.md)

#### Returns

[`ElapsedNanoseconds`](../type-aliases/ElapsedNanoseconds.md)

#### Inherited from

[`TimeService`](TimeService.md).[`elapsedSince`](TimeService.md#elapsedsince)

---

### monotonicNow()

> **monotonicNow**(): [`MonotonicTick`](../type-aliases/MonotonicTick.md)

Defined in: packages/time-service/dist/contracts.d.ts:18

Return a monotonic reading suitable for ordering durations.

#### Returns

[`MonotonicTick`](../type-aliases/MonotonicTick.md)

#### Inherited from

[`TimeService`](TimeService.md).[`monotonicNow`](TimeService.md#monotonicnow)

---

### now()

> **now**(): [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/time-service/dist/contracts.d.ts:16

Return the current canonical wall-clock instant.

#### Returns

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

#### Inherited from

[`TimeService`](TimeService.md).[`now`](TimeService.md#now)

---

### setWallClock()

> **setWallClock**(`value`): `void`

Defined in: packages/time-service/dist/contracts.d.ts:25

Replace the fake wall clock without changing monotonic time.

#### Parameters

##### value

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

#### Returns

`void`
