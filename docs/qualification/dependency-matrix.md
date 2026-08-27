# Foundation 依赖资格矩阵

本矩阵描述**当前已冻结的 Foundation provider route 与其剩余 implementation qualification**。当前没有 Open Selection。

## A. Frozen Foundation Routes

| Role                         | Selected route                                                                  | RoleDecision | ImplementationQualification | 剩余边界                                      |
| ---------------------------- | ------------------------------------------------------------------------------- | -----------: | --------------------------: | --------------------------------------------- |
| trusted in-process lifecycle | `cordis` active 4.x package line                                                |      ADOPTED |                    REQUIRED | exact package/runtime/source-less             |
| runtime dependency graph     | `@dagrejs/graphlib` 4.x                                                         |      ADOPTED |                NOT_REQUIRED | ordinary graph property tests                 |
| WorkQueue scheduling         | DBOS Queue                                                                      |      ADOPTED |                    REQUIRED | crash/restart/source-less/product             |
| OneBot/Milky interop         | direct thin adapters                                                            |      ADOPTED |                    REQUIRED | real live protocol conformance                |
| Cedar binding                | `@cedar-policy/cedar-wasm`                                                      |      ADOPTED |                    REQUIRED | WASM loading/source-less/fail-closed product  |
| Secret backend               | platform OS provider composition; `@napi-rs/keyring` preferred where applicable |      ADOPTED |                    REQUIRED | Windows/macOS/Linux + service/headless/native |
| Bootstrap lock               | `@bybrave/proper-lockfile2` 5.0.0                                               |      ADOPTED |                    REQUIRED | power-loss/platform/source-less               |
| Bootstrap process liveness   | Node `process.kill(pid, 0)` + `pidusage` 4.0.1                                  |      ADOPTED |                    REQUIRED | process-generation/platform qualification     |
| Windows SCM wrapper          | first L3 comparator WinSW                                                       |     DEFERRED |                    DEFERRED | shipping Windows service implementation only  |

## B. Adopted-role Conformance Evidence

| ID               | Route                                         | Evidence state                  | Blocking selection?                         |
| ---------------- | --------------------------------------------- | ------------------------------- | ------------------------------------------- |
| C-TOOLCHAIN-01   | Node24/pnpm11/Nx23/TS7 primary + TS6 API lane | CLOSED                          | no                                          |
| C-SCHEMA-01      | canonicalize + typebox/Ajv                    | CLOSED                          | no                                          |
| C-MGMT-01        | Hey API                                       | PARTIAL                         | no; implementation conformance              |
| C-CLI-01         | oclif                                         | PARTIAL                         | no; platform/product conformance            |
| C-NET-01         | Node/Undici                                   | PARTIAL                         | no; provider/product conformance            |
| C-STORAGE-FS-01  | fs/path + write-file-atomic + Chokidar        | PARTIAL                         | no; platform/product conformance            |
| C-SESSION-01     | opaque token + PostgreSQL session state       | PARTIAL                         | no; real implementation/security projection |
| C-CONFIG-TOML-01 | js-toml                                       | CLOSED                          | no                                          |
| Q-RUNTIME-01     | cordis lifecycle evidence                     | current route property evidence | no                                          |
| Q-ASYNC-01       | DBOS Queue evidence                           | current route property evidence | no                                          |
| Q-MSG-01         | protocol mapping evidence                     | current route property evidence | no                                          |
| Q-POLICY-01      | Cedar fail-closed evidence                    | current route property evidence | no                                          |
| Q-SECRET-01      | SecretBackend contract evidence               | current route property evidence | no                                          |
| Q-BOOT-01        | lock/process/recovery evidence                | current route property evidence | no                                          |

当前 property ledger 见 `results/qualification-status.json`。`NOT_RUN` 可以合法表示 implementation/L3 property 尚未执行；它不自动把 `RoleDecision` 退回候选态。

## C. Foundation Closed Implementation Routes

```text
Node 24 LTS / pnpm 11 / Nx 23.x / TypeScript 7 primary + TS6 compiler-API compatibility lane
PostgreSQL 18 + pg + Kysely
DBOS DurableExecution + DBOS Queue
PostgreSQL LISTEN/NOTIFY Signal
cordis RuntimeSubstrate
@dagrejs/graphlib RuntimeGraph mechanics
canonicalize + node:crypto
uuid UUIDv7
RFC 9457 Problem Details
JSON Schema 2020-12 + typebox/Ajv
Fastify + @fastify/cookie + @fastify/helmet + @fastify/rate-limit + @fastify/csrf-protection + @fastify/sse
Node/Undici
Hey API
oclif
Node node:crypto Argon2id
opaque PostgreSQL-backed session
AI SDK 7
official MCP TypeScript v2 SDK
direct OneBot/Milky Driver adapters
Cedar + @cedar-policy/cedar-wasm
platform-composed SecretBackend
@bybrave/proper-lockfile2 bootstrap lock
pacote
Execa
file-type / sharp / FFmpeg
TUF + tuf-js
Pino / OpenTelemetry / OpenInference
AsyncLocalStorage + OTel Context
node:path / node:fs/promises
write-file-atomic
Chokidar
js-toml
Vitest / fast-check / Playwright / Testcontainers
Syft / OSV-Scanner
```

完整 import/boundary directive 见 `../dependencies/implementation-routing.md`。

## D. Deferred / Out of Current Foundation Scope

```text
Windows SCM wrapper shipping selection
WASM sandbox runtime
isolated Node extension host
remote/distributed broker
advanced Presentation runtime
advanced cognition implementations
Memory retrieval/index/vector/reranker
Extension owner-native storage/codec choices
```

这些角色不能因未来可能使用而提前加入 mandatory Foundation Catalog。
