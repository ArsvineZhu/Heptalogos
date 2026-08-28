[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [runtime-kernel/dist](../README.md) / RuntimeQuiescenceLease

# Interface: RuntimeQuiescenceLease

Defined in: packages/runtime-kernel/dist/contracts.d.ts:133

Allows an owner to resume after quiescence is aborted before shutdown.

## Methods

### resumeAfterAbort()

> **resumeAfterAbort**(): `Promise`\<`void`>\>

Defined in: packages/runtime-kernel/dist/contracts.d.ts:135

Resumes owner work after a reversible quiescence attempt.

#### Returns

`Promise`\<`void`\>
