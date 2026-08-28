[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / signal/dist

# signal/dist

Public PostgreSQL Signal contracts, codecs, and service construction for
wakeup hints; listener client and query mechanics remain internal.

## Classes

- [PostgresSignalService](classes/PostgresSignalService.md)

## Interfaces

- [PostgresSignalRuntimeOptions](interfaces/PostgresSignalRuntimeOptions.md)
- [SignalClient](interfaces/SignalClient.md)
- [SignalClientFactory](interfaces/SignalClientFactory.md)
- [SignalClientOptions](interfaces/SignalClientOptions.md)
- [SignalHintV1](interfaces/SignalHintV1.md)
- [SignalListener](interfaces/SignalListener.md)
- [SignalNotification](interfaces/SignalNotification.md)
- [SignalPublisher](interfaces/SignalPublisher.md)
- [SignalService](interfaces/SignalService.md)
- [SignalSubscription](interfaces/SignalSubscription.md)

## Type Aliases

- [SignalHostAuthority](type-aliases/SignalHostAuthority.md)
- [SignalTopic](type-aliases/SignalTopic.md)

## Variables

- [postgresSignalPublisher](variables/postgresSignalPublisher.md)
- [SIGNAL\_CHANNEL](variables/SIGNAL_CHANNEL.md)
- [SIGNAL\_HINT\_MAX\_BYTES](variables/SIGNAL_HINT_MAX_BYTES.md)

## Functions

- [createPostgresSignalService](functions/createPostgresSignalService.md)
- [createSignalTopic](functions/createSignalTopic.md)
- [decodeSignalHint](functions/decodeSignalHint.md)
- [encodeSignalHint](functions/encodeSignalHint.md)
- [parseSignalTopic](functions/parseSignalTopic.md)
- [signalProblem](functions/signalProblem.md)
