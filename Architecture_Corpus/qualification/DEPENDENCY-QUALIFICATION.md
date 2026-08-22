# Foundation Dependency Qualification

本文件定义当前 Architecture Corpus 的依赖资格边界。机器可读角色 Authority 为 `dependency-status.json`；实现路由 Authority 为 `../references/dependency-routing.json`。

## 1. Current State

Foundation pre-implementation provider selection 已关闭：

```text
PRIMARY_CANDIDATE = 0
UNRESOLVED        = 0
```

这不等于所有 shipping evidence 已完成。依赖状态使用两个正交维度：

```text
RoleDecision
  ADOPTED | DEFERRED | REJECTED_FOR_ROLE
  （PRIMARY_CANDIDATE / UNRESOLVED 只保留为未来新角色的临时治理值）

ImplementationQualification
  NOT_REQUIRED | REQUIRED | RUNNING | PASSED | FAILED | DEFERRED
```

`ADOPTED + REQUIRED` 的准确含义是：**mechanics provider 已决定；exact package/binary/platform/source-less/product behavior 尚需在实现存在后证明。**

## 2. Evidence Levels

### L0 — Direct Evidence

优先使用 official spec/docs、API/types/source、upstream tests、release metadata、dependency tree、license/support/maintenance evidence。能直接回答的问题不写 spike。

### L1 — Micro Probe

只验证单一 generic property；不得先实现 Subject、完整 Extension Runtime、真实 Management backend 等产品系统。

### L2 — Boundary Probe

只在 adapter ownership / double lifecycle / framework leakage 仍无法由 L0/L1 判断时使用最薄 boundary fixture。

### L3 — Product Qualification

真实 implementation/shipping artifact 存在后验证：

```text
exact version/binary closure
source-less artifact
Windows/macOS/Linux platform behavior
service/headless profile
real PostgreSQL/provider/protocol
native/WASM loading
crash/restart/update/restore
backup/secret/recovery continuity
```

L3 不用于拖延已经足够确定的 provider selection。

## 3. Frozen Selection Dispositions

### Runtime lifecycle — `cordis`

`cordis` active 4.x package line 是 trusted in-process generic service/context/scope/disposal provider，behind `RuntimeSubstrate`。Heptalogos owns Supervisor/Reconciler/Generation/Desired-Actual/Readiness/Lineage/resource ownership。当前 property evidence 已满足该 RoleDecision 的关闭条件；exact package integration/source-less/runtime diagnostics 属 implementation qualification。

### Runtime graph — `@dagrejs/graphlib`

承担 directed graph、traversal、topological ordering、cycle mechanics。它不拥有 Service/Capability/Reconcile semantics。只需要普通 property/state tests。

### WorkQueue — DBOS Queue

固定边界：

```text
WorkItemId = durable obligation
DispatchAttemptId = deterministic attempt identity
DBOS Queue → scheduling mechanics
static dispatchWorkItem(WorkItemId, dispatchRevision)
```

Dynamic Extension 不注册 raw DBOS workflow。真实 crash-after-terminal-commit、restart、source-less 在 implementation qualification 中验证；不得并行引入第二套 queue。

### Messaging — direct thin OneBot/Milky adapters

Canonical Messaging 始终为 Heptalogos Authority。OneBot/Milky 采用薄 anti-corruption Driver，复用 Foundation transport/schema/runtime/media/evidence mechanics。Satori 不作为 mandatory Foundation runtime；未来需要支持 Satori protocol 时可增加独立 Driver。

### Policy — `@cedar-policy/cedar-wasm`

Cedar model 与 official WASM binding 已冻结。`PolicyService` owns mapping/fail-closed/diagnostics；binding 只承担 evaluation mechanics。WASM loading/source-less 是 L3/implementation evidence。

### Secret backend — platform-composed OS providers

```text
BootstrapKeyProvider != SecretService
SecretBackend → OS credential/keyring provider composition
@napi-rs/keyring → preferred Node adapter where profile supports it
service/headless → profile-specific provider/provisioning path
plaintext fallback → forbidden
```

三平台、service account、native closure、rotation/lost-key/restore 在 implementation qualification 中关闭。

### Bootstrap lock — `@bybrave/proper-lockfile2`

只覆盖 PostgreSQL Host lease 尚不可取得的短暂 bootstrap window。`proper-lockfile@4.1.2` 的 stale `rmdir`/reacquire 交错在 M5B deterministic #121 probe 中失败；`@bybrave/proper-lockfile2@5.0.0` 的 atomic rename claim 通过 delayed/double-reclaimer、heartbeat、killed-owner reclaim、compromise fence、Unicode/space path 与 Node24/ESM/TS7 boundary qualification。正常 Host Authority 始终是 dedicated PostgreSQL advisory lease + HostOwnershipFence + HostOwnershipToken。power-loss/cross-platform/source-less 是 implementation qualification。

### Bootstrap process liveness — Node + `pidusage`

The abandoned-owner boundary uses `process.kill(pid, 0)` followed by
`pidusage@4.0.1` start-time evidence. Heptalogos owns the
`SAME_PROCESS`/`PROCESS_DEAD`/`PID_REUSED`/`UNKNOWN` semantics and the fixed
5-second tolerance; a permission or measurement error is `UNKNOWN` and never
authorizes reclaim.

### Windows service wrapper — DEFERRED

不进入 Foundation mandatory Catalog。Windows L3 时首先评估 WinSW；真实 shipping evidence 决定最终 wrapper。不得因此提前自研 Windows service framework。

## 4. Adopted-route Conformance

以下 Q/C evidence 仍用于证明 adapter fidelity，但不重新打开 provider selection：

| ID | Route | Current use |
|---|---|---|
| C-TOOLCHAIN-01 | Node24/pnpm11/Nx23/TS7+TS6 API lane | canonical toolchain conformance |
| C-SCHEMA-01 | canonicalize + typebox/Ajv | canonical JSON/schema conformance |
| C-MGMT-01 | Hey API | generated ManagementClient fidelity |
| C-CLI-01 | oclif | reference CLI projection |
| C-NET-01 | Node/Undici | NetworkAccess/provider transport fidelity |
| C-STORAGE-FS-01 | Node fs/path + write-file-atomic + Chokidar | workspace/file mechanics |
| C-SESSION-01 | opaque token + PostgreSQL session state | session/security projection |
| C-CONFIG-TOML-01 | js-toml | Foundation TOML codec |
| Q-RUNTIME-01 | cordis | current lifecycle/adapter property evidence; product integration remains |
| Q-ASYNC-01 | DBOS Queue | current dispatcher/revision property evidence; crash/product qualification remains |
| Q-MSG-01 | direct adapters | current anti-corruption/mapping property evidence; live protocol remains |
| Q-POLICY-01 | Cedar | current fail-closed property evidence; selected binding is cedar-wasm |
| Q-SECRET-01 | SecretBackend contract | current contract property evidence; real OS providers remain |
| Q-BOOT-01 | @bybrave/proper-lockfile2 | current process/stale/recovery property evidence; L3 remains |
| bootstrap.process-liveness | Node `process.kill(pid, 0)` + `pidusage` | process-generation boundary evidence; platform/L3 remains |

Property ledger: `results/qualification-status.json`.

## 5. Platform Rule

跨平台 Architecture 已由 Platform/Deployment Profile 统一治理；pre-implementation Pilot 不要求为了形式覆盖而在每个 OS 重跑所有 probe。

```text
platform-independent mechanics property
→ one representative host may be sufficient for selection

platform-specific claim
→ mark deferred to implementation/L3
→ one OS PASS never implies another OS PASS
```

Foundation selection、Implementation Plan 与常规本地验收必须保持可直接执行且可复现，不依赖 GitHub Actions；平台无关 property 可在代表性 host 上证明，真实 Windows/macOS/Linux claim 仍必须在对应 shipping qualification 时分别证明。当前仓库的里程碑集成在独立审查通过 exact reviewed SHA 后，还要求手动 dispatch cross-platform final CI 并确认其仍针对该 SHA。该 CI 是最终跨平台 closure projection，不是 dependency/architecture Authority 或唯一 verification substrate。

## 6. Stop Rule

不要继续扩大 pre-implementation qualification。若一个“probe”开始要求真实 Subject、complete Messaging runtime、MicroSystemSupervisor、ExtensionPackageManager、ConfigurationService、Control Plane、shipping installer 或完整 source-less product，应立即停止：这已经是 implementation/L3。

## 7. Reopening a Frozen Role

仅允许基于 reproducible hard blocker：

```text
exact failure property
→ smallest sufficient evidence
→ explicit role reopening
→ update dependency-status + dependency-routing + ledger in one change
```

不得以“减少依赖”“自己写很容易”“当前预算有限”作为自研 generic mechanics 的理由。
