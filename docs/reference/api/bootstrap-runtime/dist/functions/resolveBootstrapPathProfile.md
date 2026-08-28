[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [bootstrap-runtime/dist](../README.md) / resolveBootstrapPathProfile

# Function: resolveBootstrapPathProfile()

> **resolveBootstrapPathProfile**(`locator`, `requiredRoots`): `Promise`\<[`BootstrapPathProfile`](../interfaces/BootstrapPathProfile.md)>\>

Defined in: packages/bootstrap-runtime/dist/roots.d.ts:24

Resolves and validates the lifecycle roots required by Bootstrap.

## Parameters

### locator

[`BootstrapLocatorV1`](../interfaces/BootstrapLocatorV1.md)

### requiredRoots

readonly (`"PROGRAM"` \| `"INSTANCE"` \| `"CONFIGURATION"` \| `"DATA"` \| `"SECRET"` \| `"BLOB"` \| `"BACKUP"` \| `"LOG"` \| `"CACHE"` \| `"TEMP"` \| `"RUN"` \| `"PACKAGE_STAGING"`)[]

## Returns

`Promise`\<[`BootstrapPathProfile`](../interfaces/BootstrapPathProfile.md)\>
