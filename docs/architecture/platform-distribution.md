# 跨平台产品运行与分发

## 1. 一个产品，多 Deployment Profile

目标平台：

```text
Windows
macOS
Linux
```

部署形态至少考虑：

```text
interactive desktop/user process
headless foreground
OS service/daemon
recovery invocation
```

Domain semantics 不随平台变化；path、service manager、signal、credential backend、native payload 等通过 Platform/Deployment Profile 显式表达。

---

## 2. Lifecycle Roots 与 PathProfile

生产布局由独立 lifecycle roots 定义：

```text
ProgramRoot          → BootstrapRuntime / ProductGeneration / bundled package code
InstanceRoot         → logical instance / Extension instance binding metadata
ConfigurationRoot    → bootstrap/declarative/owner-native configuration
DataRoot             → Foundation/Extension/Domain durable data
SecretRoot           → file-backed secret material only when backend uses filesystem
BlobRoot             → CAS objects/staging/quarantine
BackupRoot           → operational backup artifacts
LogRoot              → operational logs
CacheRoot            → rebuildable cache/index where applicable
TempRoot / RunRoot   → ephemeral/process state
PackageStagingRoot   → hostile package staging
```

这些 root 可以物理共置，也可以完全分开；不得假设共同父目录。`PathProfile` 根据 Windows/macOS/Linux 与 portable/native/service deployment 映射逻辑 root。

```text
Program/Package generation replace/delete
!= Instance delete
!= Config delete
!= Data delete
!= Secret delete
```

### Example profiles

Linux system profile 可以映射：

```text
ProgramRoot        /usr/lib/heptalogos
ConfigurationRoot  /etc/heptalogos
DataRoot           /var/lib/heptalogos
LogRoot            /var/log/heptalogos
RunRoot            /run/heptalogos
```

portable profile 可以把这些 root 放入同一外层目录，但那只是 profile convenience，不是 architecture ownership。

### InstallationAnchor / Bootstrap Locator

OS service/shortcut/foreground/recovery 的固定 entrypoint 是 `InstallationAnchor`。它不依赖当前 ProductGeneration，只选择 verified current/previous BootstrapRuntime generation。

InstallationAnchor 使用平台默认 `PathProfile`，并可以读取一个固定、极小、human-readable bootstrap locator 覆盖独立 root mapping。Locator 不包含 Secret plaintext，不承载普通业务 state，由 Bootstrap ownership 保护。

Exact executable/script/wrapper 由平台资格验证，但必须保证 ProductGeneration 损坏时仍有可启动 Recovery path。

BootstrapRuntime 默认可作为稳定 Host shell 在同一 OS process 中加载 ProductGeneration Host entrypoint；ProductGeneration 切换通过 maintenance restart 生效。若平台采用 parent/child launcher，也必须保持同一 ownership/Recovery contract。

## 3. Private Runtime

Shipping product 自带并 pin 必要 runtime/toolchain，例如：

```text
Node
PostgreSQL
platform service helper when used
other required native/WASM payloads
```

正常运行不依赖 global installation 或 developer PATH。

FFmpeg/ffprobe is an external executable prerequisite for an implemented
audio/video capability. It is installed and configured by the operator or
deployment profile and is not part of the default Heptalogos payload.

OpenClaw 的分发必须按角色区分：未来 Product distribution 可以同时携带
Subject OpenClaw Runtime 与独立的 Machine Operations OpenClaw，但这不表示
两者共享 Gateway、state/config/workspace、credentials、ports、权限或启动
生命周期。当前 Product Host 尚未携带或监督 Subject OpenClaw；该集成属于
后续 P3/P4 计划。详见 [Machine Operations Plane](machine-operations.md)。

---

## 4. Native Transitive Closure

任何 direct/transitive：

```text
.node addon
shared library
WASM binary
external executable
OS helper
```

都属于产品依赖，而不是“npm 内部细节”。

必须进入：

```text
ReleaseManifest
SBOM
hash inventory
platform qualification
update compatibility
```

开发机 `pnpm install` 成功不能证明 shipping artifact 可加载。

---

## 5. Stable Bootstrap Closure

Bootstrap 是 dependency-closed、可恢复 normal Host 的最小闭包，只承担：

```text
resolve InstallationId/InstanceId and independent PathProfile lifecycle roots
validate bootstrap metadata
single-instance/bootstrap coordination
select active/LKG ProductGeneration
select approved runtime generation
start/inspect private PostgreSQL
maintain BootstrapJournal
bounded RecoveryOperation
launch Host
```

它不依赖 Subject、System Assistant、Machine Operations integration,
third-party Extension、normal Configuration/SecretService 或 Web/GUI。

Private PostgreSQL 默认使用 loopback-only TCP、installation-owned persisted port、SCRAM、private PostgreSQL DataRoot subspace。Cluster/bootstrap owner、migration role、runtime role、DBOS role按最小权限分离；normal Host 不使用 cluster superuser。

Bootstrap 的 `PrivatePostgresController` 只使用 product-pinned PostgreSQL executables/tools。Cluster version/identity/profile 与 persisted port 进入 BootstrapStateStore；normal boot 遇到 mismatch/unknown data dir/port conflict 不 silently reinitialize or major-upgrade。

Bootstrap cryptographic material 通过 `BootstrapKeyProvider` 获取，避免 normal SecretService/PostgreSQL 启动环。

## 6. Host Packaging

Host 是 dependency-closed source-less product payload，不要求单文件 executable。

Node SEA 不是整个 Host 的 Foundation packaging model；可以在未来局部 helper 场景单独评估。

---

## 7. Release Closure

Release candidate 必须是不可变、可哈希、可复验的 closure：

```text
Host JS/assets
bundled web/static protocol assets when present
private Node/PostgreSQL
native/WASM transitive dependencies
platform helpers
built-in Extension generations
licenses
SBOM
ReleaseManifest
```

Acceptance 后不得 rebuild 再沿用旧证据。

---

## 8. OS Service

使用 OS-native 或成熟 wrapper：

```text
Windows SCM wrapper
launchd / ServiceManagement
systemd
```

Windows SCM wrapper 在当前 Foundation baseline 中 DEFERRED。Windows service packaging 进入 L3 时首先评估 WinSW；最终 shipping route 必须由真实 install/update/service-account/shutdown/recovery/source-less qualification 证明。该延期不阻断 Foundation Implementation Plan，也不授权自研 service wrapper。

---

## 9. Source-less Acceptance

在仓库外、无开发环境假设下运行 exact artifact。

不得依赖：

```text
monorepo/src
workspace symlink
Git
global Node/PostgreSQL
online npm registry
pnpm/npm install at runtime
dev server
```

---

## 10. Native Matrix

每个平台至少验证：

```text
bootstrap/start/stop/restart
private PostgreSQL lifecycle
filesystem paths/permissions
single-instance behavior
signals/service shutdown
Secret/key backend
native/WASM dependency loading
subprocess/media tools
source-less Extension load
backup/restore/update
CLI invocation/shell behavior
network/proxy/TLS profile behavior
```

一个平台 PASS 不能推断其他平台 PASS。

---

## 11. Release Evidence

每个 release candidate 形成：

```text
artifact digests
manifest
SBOM
license inventory
OSV/vulnerability scan evidence
native/WASM dependency inventory
platform qualification results
source-less acceptance
live gateway/protocol results for claimed support
```

## 12. Desktop Presentation 与平台 preset

Core capability 不依赖 Desktop Presentation package。Desktop Presentation 是可选的
product component，只在需要 local window 时携带或获取。

```text
Windows / macOS / Linux / Linux Server
  = distribution entry/preset targets
  != domain product lines
```

Packaging 不得仅凭平台创建 `serverMode`、`desktopMode`、`serverEdition` 或等价
domain semantics。Linux Host/Subject/Web/service/headless capability 是一等能力；
Linux local desktop visuals 可以接受合理 degradation，Windows/macOS 是 high-fidelity
visual targets。Linux Server 使用同一 capability model，默认不携带或获取 Desktop
Presentation。

以下仍是 provisional/qualification work，而不是当前 Foundation implementation：generation-
coupled Core/Web/Desktop manifest，signing/notarization/update mechanics，remote Web
TLS/auth，Electron cold-start/RSS/GPU，以及详细 installer behavior。
