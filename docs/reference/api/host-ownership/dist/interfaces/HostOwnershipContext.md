[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / HostOwnershipContext

# Interface: HostOwnershipContext

Defined in: packages/host-ownership/dist/contracts.d.ts:35

Represents the Host ownership capability and its fence signal.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:38

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:36

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:37

---

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: packages/host-ownership/dist/contracts.d.ts:41

---

### state

> `readonly` **state**: [`HostOwnershipState`](../type-aliases/HostOwnershipState.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:40

---

### token

> `readonly` **token**: [`HostOwnershipToken`](../../../foundation-contracts/dist/type-aliases/HostOwnershipToken.md)

Defined in: packages/host-ownership/dist/contracts.d.ts:39

## Methods

### assertActive()

> **assertActive**(): `void`

Defined in: packages/host-ownership/dist/contracts.d.ts:43

Throws when the Host fence is no longer active.

#### Returns

`void`

---

### close()

> **close**(): `Promise`\<`void`>\>

Defined in: packages/host-ownership/dist/contracts.d.ts:45

Closes the Host lease and publishes the terminal fence state.

#### Returns

`Promise`\<`void`\>
