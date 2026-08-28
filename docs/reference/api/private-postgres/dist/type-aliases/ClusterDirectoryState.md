[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [private-postgres/dist](../README.md) / ClusterDirectoryState

# Type Alias: ClusterDirectoryState

> **ClusterDirectoryState** = \{ `kind`: `"ABSENT"`; \} \| \{ `kind`: `"EMPTY"`; \} \| \{ `entryCountLowerBound`: `number`; `kind`: `"NON_EMPTY"`; \}

Defined in: packages/private-postgres/dist/cluster-layout.d.ts:8

Classifies whether the managed data directory is absent, empty, or occupied.
