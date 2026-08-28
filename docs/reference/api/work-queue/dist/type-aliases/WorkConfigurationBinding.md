[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [work-queue/dist](../README.md) / WorkConfigurationBinding

# Type Alias: WorkConfigurationBinding

> **WorkConfigurationBinding** = \{ `configRevisionRef?`: `undefined`; `policy`: `"LATEST_COMPATIBLE_AT_ATTEMPT"`; \} \| \{ `configRevisionRef`: `string`; `policy`: `"CONFIG_PINNED"`; \}

Defined in: packages/work-queue/dist/contracts.d.ts:19

Selects whether a handler attempt resolves current or pinned configuration.
