[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [foundation-contracts/dist](../README.md) / Problem

# Interface: Problem

Defined in: packages/foundation-contracts/dist/problem.d.ts:16

Carries the canonical, serializable failure semantics across package seams.

## Properties

### activityId?

> `readonly` `optional` **activityId?**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:23

---

### category

> `readonly` **category**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:19

---

### causeProblemRefs?

> `readonly` `optional` **causeProblemRefs?**: readonly `string`[]

Defined in: packages/foundation-contracts/dist/problem.d.ts:26

---

### detail?

> `readonly` `optional` **detail?**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:22

---

### fieldErrors?

> `readonly` `optional` **fieldErrors?**: readonly [`FieldError`](FieldError.md)[]

Defined in: packages/foundation-contracts/dist/problem.d.ts:25

---

### metadata?

> `readonly` `optional` **metadata?**: `Readonly`\<`Record`\<`string`, [`CanonicalJsonValue`](../type-aliases/CanonicalJsonValue.md)>>\>\>

Defined in: packages/foundation-contracts/dist/problem.d.ts:27

---

### problemCode

> `readonly` **problemCode**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:18

---

### resourceRef?

> `readonly` `optional` **resourceRef?**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:24

---

### retryClass

> `readonly` **retryClass**: [`RetryClass`](../type-aliases/RetryClass.md)

Defined in: packages/foundation-contracts/dist/problem.d.ts:20

---

### schemaVersion

> `readonly` **schemaVersion**: `1`

Defined in: packages/foundation-contracts/dist/problem.d.ts:17

---

### title

> `readonly` **title**: `string`

Defined in: packages/foundation-contracts/dist/problem.d.ts:21
