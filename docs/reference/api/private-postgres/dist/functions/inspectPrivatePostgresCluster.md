[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / inspectPrivatePostgresCluster

# Function: inspectPrivatePostgresCluster()

> **inspectPrivatePostgresCluster**(`toolchain`, `dataDirectory`, `options`): `Promise`\<[`PrivatePostgresClusterInspection`](../interfaces/PrivatePostgresClusterInspection.md)>\>

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:23

Inspects a private cluster with pg_controldata after major validation.

## Parameters

### toolchain

[`PrivatePostgresToolchain`](../interfaces/PrivatePostgresToolchain.md)

### dataDirectory

`string`

### options

#### timeoutMs

`number`

## Returns

`Promise`\<[`PrivatePostgresClusterInspection`](../interfaces/PrivatePostgresClusterInspection.md)\>
