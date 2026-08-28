[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [signal/dist](../README.md) / PostgresSignalService

# Class: PostgresSignalService

Defined in: packages/signal/dist/postgres-signal.d.ts:11

Maintains one dedicated LISTEN connection and converts loss into a durable
rescan request so notification delivery never becomes the source of truth.

## Implements

- [`SignalService`](../interfaces/SignalService.md)

## Constructors

### Constructor

> **new PostgresSignalService**(`authority`, `options`): `PostgresSignalService`

Defined in: packages/signal/dist/postgres-signal.d.ts:26

Create a listener bound to the host-owned PostgreSQL runtime.

#### Parameters

##### authority

[`HostPersistenceAuthority`](../../../host-ownership/dist/interfaces/HostPersistenceAuthority.md)

##### options

[`PostgresSignalRuntimeOptions`](../interfaces/PostgresSignalRuntimeOptions.md)

#### Returns

`PostgresSignalService`

## Methods

### subscribe()

> **subscribe**(`topic`, `listener`): `Promise`\<[`SignalSubscription`](../interfaces/SignalSubscription.md)>\>

Defined in: packages/signal/dist/postgres-signal.d.ts:28

Register a topic listener and establish the shared connection on demand.

#### Parameters

##### topic

[`SignalTopic`](../type-aliases/SignalTopic.md)

##### listener

[`SignalListener`](../interfaces/SignalListener.md)

#### Returns

`Promise`\<[`SignalSubscription`](../interfaces/SignalSubscription.md)\>

#### Implementation of

[`SignalService`](../interfaces/SignalService.md).[`subscribe`](../interfaces/SignalService.md#subscribe)
