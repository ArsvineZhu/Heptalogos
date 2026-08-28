[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / PrivatePostgresClusterInspection

# Interface: PrivatePostgresClusterInspection

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:15

Combines PostgreSQL major identity with parsed control metadata.

## Extends

- [`ParsedPgControldata`](ParsedPgControldata.md)

## Properties

### catalogVersionNumber

> `readonly` **catalogVersionNumber**: `string`

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:11

#### Inherited from

[`ParsedPgControldata`](ParsedPgControldata.md).[`catalogVersionNumber`](ParsedPgControldata.md#catalogversionnumber)

---

### clusterSystemIdentifier

> `readonly` **clusterSystemIdentifier**: `string`

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:9

#### Inherited from

[`ParsedPgControldata`](ParsedPgControldata.md).[`clusterSystemIdentifier`](ParsedPgControldata.md#clustersystemidentifier)

---

### databaseClusterState

> `readonly` **databaseClusterState**: `string`

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:10

#### Inherited from

[`ParsedPgControldata`](ParsedPgControldata.md).[`databaseClusterState`](ParsedPgControldata.md#databaseclusterstate)

---

### dataPageChecksumVersion

> `readonly` **dataPageChecksumVersion**: `number`

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:12

#### Inherited from

[`ParsedPgControldata`](ParsedPgControldata.md).[`dataPageChecksumVersion`](ParsedPgControldata.md#datapagechecksumversion)

---

### postgresMajor

> `readonly` **postgresMajor**: `18`

Defined in: packages/private-postgres/dist/cluster-inspection.d.ts:16
