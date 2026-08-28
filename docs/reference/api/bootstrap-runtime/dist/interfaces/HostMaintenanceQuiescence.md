[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / HostMaintenanceQuiescence

# Interface: HostMaintenanceQuiescence

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:19

Provides the quiescence proof required before Host maintenance begins.

## Methods

### quiesce()

> **quiesce**(): `Promise`\<[`HostQuiescenceLease`](HostQuiescenceLease.md)>\>

Defined in: packages/bootstrap-runtime/dist/managed-host.d.ts:21

Drains owned work and returns a lease that can resume on pre-entry abort.

#### Returns

`Promise`\<[`HostQuiescenceLease`](HostQuiescenceLease.md)\>
