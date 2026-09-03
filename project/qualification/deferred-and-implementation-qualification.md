# 延期角色与实现期资格边界

正式机器状态见 `project/qualification/dependency-status.json`；实现路由见 `project/dependencies/dependency-routing.json`。

当前 Foundation provider selection 已收敛：**不存在 `PRIMARY_CANDIDATE` 或 `UNRESOLVED` 的 Foundation role**。本文件只记录两类不会阻断 Implementation Plan 的边界：明确 `DEFERRED` 的未来角色，以及 `ADOPTED` role 尚未完成的 implementation/product qualification。

## 1. Deferred Roles

### Windows SCM wrapper

```text
RoleDecision = DEFERRED
first L3 comparator = WinSW
```

只有 Windows service packaging 进入 shipping implementation 时才进行真实 install/update/service-account/shutdown/recovery/source-less qualification。Foundation 阶段不得为了消除该延期而自研 service wrapper。

### WASM sandbox runtime

```text
RoleDecision = DEFERRED
```

只有 untrusted WASM ExecutionDomain 正式进入实现范围时才重新研究当前维护的 sandbox runtime。Node Permission Model / `node:vm` 不承担 malicious-code sandbox。

## 2. Adopted Roles with Required Implementation Qualification

这些角色已经决定，不能因为还缺 L3 evidence 而替换成平行实现：

```text
Node 24 shipping release/platform/source-less
PostgreSQL private runtime/native closure
DBOS DurableExecution + DBOS Queue crash/restart/source-less
cordis RuntimeSubstrate exact package/product runtime
@cedar-policy/cedar-wasm loading/source-less
platform SecretBackend desktop/service/headless/native closure
proper-lockfile crash/power-loss/platform behavior
OneBot/Milky live Driver conformance
Fastify + @fastify/* endpoint/security projection
Node/Undici provider transport/proxy/custom-CA behavior
opaque PostgreSQL-backed Session implementation
sharp/FFmpeg/native media closure
TUF/update/backup/restore product behavior
```

`ImplementationQualification=REQUIRED` 的含义是：**角色已冻结，但在声明对应 shipping/product capability 前必须证明 exact implementation**。

## 3. Reopening Rule

只有实际 implementation 暴露具体 hard blocker 时才允许重新打开 `RoleDecision`：

```text
record reproducible blocker
→ establish smallest sufficient evidence
→ update dependency-status.json + dependency-routing.json + decision-ledger together
→ replace route
```

“少一个依赖”“自己写更简单”“当前没有预算继续验证”都不是绕开已采用 route 的理由。
