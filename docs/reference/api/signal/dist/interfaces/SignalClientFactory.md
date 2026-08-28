[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / SignalClientFactory

# Interface: SignalClientFactory

Defined in: packages/signal/dist/contracts.d.ts:64

Constructs a signal client without exposing the concrete PostgreSQL library.

## Methods

### create()

> **create**(`options`): [`SignalClient`](SignalClient.md)

Defined in: packages/signal/dist/contracts.d.ts:66

Create a client configured for the local signal connection.

#### Parameters

##### options

[`SignalClientOptions`](SignalClientOptions.md)

#### Returns

[`SignalClient`](SignalClient.md)
