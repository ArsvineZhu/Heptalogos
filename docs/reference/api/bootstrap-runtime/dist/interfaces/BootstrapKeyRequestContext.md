[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / BootstrapKeyRequestContext

# Interface: BootstrapKeyRequestContext

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:8

Identifies the installation, boot, and secret purpose for one key request.

## Properties

### bootId

> `readonly` **bootId**: [`BootId`](../../../bootstrap-state/dist/type-aliases/BootId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:11

---

### installationId

> `readonly` **installationId**: [`InstallationId`](../../../foundation-contracts/dist/type-aliases/InstallationId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:9

---

### instanceId

> `readonly` **instanceId**: [`InstanceId`](../../../foundation-contracts/dist/type-aliases/InstanceId.md)

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:10

---

### purpose

> `readonly` **purpose**: `"private-postgres-bootstrap-superuser"` \| `"private-postgres-host-lease-role"` \| `"private-postgres-runtime-role"` \| `"private-postgres-migration-role"` \| `"private-postgres-durable-execution-role"`

Defined in: packages/bootstrap-runtime/dist/bootstrap-key-provider.d.ts:12
