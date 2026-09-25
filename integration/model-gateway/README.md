# Model gateway qualification harness

This is a manually dispatched qualification harness for the current external
model-gateway Chat route. It is deliberately outside normal `pnpm verify` and
does not create a second Product Host. The test composes the current
Configuration, Secret, NetworkAccess, and AIRuntime owners over the existing
PostgreSQL/Host fixture, then performs one bounded structured generation.

Supply the gateway base URL and model identifier through non-secret environment
variables, and supply the gateway token through protected stdin only. The
token is written to the current OS credential backend through `SecretService`;
it is not accepted through an argument, checked-in file, ordinary environment
variable, log, or result record. The required live proof uses a NewAPI gateway
configured outside Heptalogos with a DeepSeek model.

Example from a protected secret source:

```text
$env:HEPTALOGOS_TEST_PG_BIN = (Resolve-Path 'tmp/pg/extracted/pgsql/bin').Path
$env:HEPTALOGOS_GATEWAY_BASE_URL = 'https://gateway.example/v1'
$env:HEPTALOGOS_GATEWAY_MODEL = 'deepseek-chat'
Get-ProtectedSecretBytes |
  pnpm nx run model-gateway-integration:qualification
```

The example source is intentionally illustrative only and must not be a
checked-in or ordinary project file. The qualification result is recorded
separately under `project/qualification/results/` without token material or
gateway response bodies.
