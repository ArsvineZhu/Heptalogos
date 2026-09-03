# OpenAI provider qualification harness

This is a manually dispatched qualification harness for the current OpenAI
Responses route. It is deliberately outside normal `pnpm verify` and does not
create a second Product Host. The test composes the current Configuration,
Secret, NetworkAccess, and AIRuntime owners over the existing PostgreSQL/Host
fixture, then performs one bounded structured generation.

Supply the API key through protected stdin only. It is written to the current
OS credential backend through `SecretService`; it is not accepted through an
argument, checked-in file, ordinary environment variable, log, or result
record.

Example from a protected secret source:

```text
$env:HEPTALOGOS_TEST_PG_BIN = (Resolve-Path 'tmp/pg/extracted/pgsql/bin').Path
Get-ProtectedSecretBytes |
  pnpm nx run provider-openai-integration:qualification
```

The example source is intentionally illustrative only and must not be a
checked-in or ordinary project file. The qualification result is recorded
separately under `project/qualification/results/` without key material or
provider bodies.
