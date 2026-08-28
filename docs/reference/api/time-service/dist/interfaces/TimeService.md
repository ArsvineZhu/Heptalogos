[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [time-service/dist](../README.md) / TimeService

# Interface: TimeService

Defined in: packages/time-service/dist/contracts.d.ts:14

Supplies wall-clock, monotonic, and elapsed-time operations to domain code.

## Extended by

- [`FakeTimeService`](FakeTimeService.md)

## Methods

### elapsedSince()

> **elapsedSince**(`start`): [`ElapsedNanoseconds`](../type-aliases/ElapsedNanoseconds.md)

Defined in: packages/time-service/dist/contracts.d.ts:20

Measure elapsed monotonic time from a prior reading.

#### Parameters

##### start

[`MonotonicTick`](../type-aliases/MonotonicTick.md)

#### Returns

[`ElapsedNanoseconds`](../type-aliases/ElapsedNanoseconds.md)

---

### monotonicNow()

> **monotonicNow**(): [`MonotonicTick`](../type-aliases/MonotonicTick.md)

Defined in: packages/time-service/dist/contracts.d.ts:18

Return a monotonic reading suitable for ordering durations.

#### Returns

[`MonotonicTick`](../type-aliases/MonotonicTick.md)

---

### now()

> **now**(): [`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)

Defined in: packages/time-service/dist/contracts.d.ts:16

Return the current canonical wall-clock instant.

#### Returns

[`Instant`](../../../foundation-contracts/dist/type-aliases/Instant.md)
