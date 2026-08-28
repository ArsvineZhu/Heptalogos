[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [durable-execution/dist](../README.md) / DurableExecutionSchemaProvisioner

# Interface: DurableExecutionSchemaProvisioner

Defined in: packages/durable-execution/dist/contracts.d.ts:36

Owns provisioning of the current DBOS vendor schema under migration Authority.

## Methods

### ensureCurrent()

> **ensureCurrent**(`authority`): `Promise`\<`void`>\>

Defined in: packages/durable-execution/dist/contracts.d.ts:38

Ensure the installed DBOS schema is current using the supplied Authority.

#### Parameters

##### authority

[`HostCanonicalMigrationAuthority`](../../../host-ownership/dist/interfaces/HostCanonicalMigrationAuthority.md)

#### Returns

`Promise`\<`void`\>
