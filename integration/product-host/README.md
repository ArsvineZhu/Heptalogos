# Product Host integration

This project qualifies the built `heptalogos-host` and `heptalogos` processes
against an isolated installation anchor, the real private PostgreSQL toolchain,
and the current Windows OS credential store. It does not recreate Product Host
composition in test fixtures.

The built Host is launched with a temporary working directory outside the
repository. P1C qualification additionally checks both build-carried generation
identities, Management read envelopes, complete Problem semantics, public API
containment, and the ProductHost OpenAPI-to-client generation direction. This
does not claim a source-less release artifact.

Set `HEPTALOGOS_TEST_PG_BIN` to the extracted PostgreSQL 18.6 `bin` directory
before running the process qualification target.
