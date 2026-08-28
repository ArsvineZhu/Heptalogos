[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [host-ownership/dist](../README.md) / BootstrapAdminProvisioningOptions

# Interface: BootstrapAdminProvisioningOptions

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:42

Supplies authority and optional client seams for role/database provisioning.

## Properties

### clientFactory?

> `readonly` `optional` **clientFactory?**: `unknown`

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:47

Test-only structural seam; production uses the private pg adapter.

---

### mutationAuthority

> `readonly` **mutationAuthority**: [`BootstrapMutationAuthority`](BootstrapMutationAuthority.md)

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:45

---

### passwordProvider

> `readonly` **passwordProvider**: [`BootstrapAdminPasswordProvider`](BootstrapAdminPasswordProvider.md)

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:44

---

### port

> `readonly` **port**: `number`

Defined in: packages/host-ownership/dist/bootstrap-admin.d.ts:43
