# Product Host integration

This project qualifies the built `heptalogos-host` and `heptalogos` processes
against an isolated installation anchor, the real private PostgreSQL toolchain,
and the current Windows OS credential store. It does not recreate Product Host
composition in test fixtures.

Set `HEPTALOGOS_TEST_PG_BIN` to the extracted PostgreSQL 18.6 `bin` directory
before running the process qualification target.
