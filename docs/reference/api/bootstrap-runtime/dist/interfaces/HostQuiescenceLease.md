[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / HostQuiescenceLease

# Interface: HostQuiescenceLease

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:24

Represents a reversible quiescence lease before the point of no return.

## Methods

### resumeAfterAbort()

> **resumeAfterAbort**(): `Promise`\<`void`>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:26

Resumes the old Host after a maintenance operation aborts before entry.

#### Returns

`Promise`\<`void`\>
