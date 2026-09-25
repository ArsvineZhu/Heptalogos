# Product Host integration

This project qualifies the built `heptalogos-host` and `heptalogos` processes
against an isolated installation anchor, the real private PostgreSQL toolchain,
and the current Windows OS credential store. It does not recreate Product Host
composition in test fixtures.

The built Host is launched with a temporary working directory outside the
repository. Product Host qualification additionally checks both build-carried generation
identities, Management read envelopes, complete Problem semantics, public API
containment, and the ProductHost OpenAPI-to-client generation direction. The
dedicated `pnpm qualify:portable` target assembles one candidate, moves or
copies it outside the repository, removes developer PATH entries, and exercises
the portable Windows x64 interaction/restart boundary. Its current result is
`PASS` for Windows x64 only; it does not claim an installer, service/daemon,
signing, notarization, or live external-provider boundary.

Set `HEPTALOGOS_TEST_PG_BIN` to the extracted PostgreSQL 18.6 `bin` directory
before running the process qualification target.
