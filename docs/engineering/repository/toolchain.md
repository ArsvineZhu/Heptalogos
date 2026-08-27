# TypeScript 与仓库工具链

本文件冻结 Foundation implementation repository 的语言、模块、编译、包管理和工具链责任边界。它不是“最低兼容版本”清单，而是当前项目应采用的默认实现路线。

机器可读依赖状态见 `docs/qualification/dependency-status.json`；实现路由见 `docs/dependencies/dependency-routing.json`。

---

## 1. 基线

Foundation repository 使用：

```text
Runtime                  Node.js 24 LTS line
Package manager          pnpm 11 stable line
Workspace/task graph     Nx 23.x line
Primary compiler         TypeScript 7.0.x
Compiler-API compat      @typescript/typescript6 6.0.x, only where required
Primary lint              Oxlint 1.x + oxlint-tsgolint 7.x, type-aware
Boundary lint             ESLint 10.x residual Nx module-boundary lane
Module model             ESM-first / NodeNext
JavaScript target        ESNext
Node ambient types       @types/node 24.x, aligned to shipping Node major
```

Repository-only tool ownership is explicit:

```text
Oxlint + oxlint-tsgolint  primary JS/TS lint, including type-aware promise rules
ESLint                    residual @nx/enforce-module-boundaries lane only
TypeScript 7              canonical typecheck/build authority
Knip                      unused files/exports/dependencies
jscpd                     copy/paste clone detection
Prettier                  formatting
Nx                        project/task graph and task scheduling
```

当前 L0 exact observation 保存在
[qualification evidence baseline](../../qualification/evidence/dependency-baseline-2026-08-20.md)。
本文件只保留实现路线和版本 Authority 所有权，不重复手工维护 patch 值。
实现仓库建立 Catalog 或执行依赖升级时，必须重新读取 registry/upstream 当前状态并记录证据，然后由 `package.json` / pnpm Catalog exact-pin 实际使用版本。

---

## 2. TypeScript 7 是主编译器

Canonical build/typecheck 不以 TypeScript 6 为主：

```text
TypeScript 7 tsc
→ canonical compile/typecheck/build authority
```

TypeScript 7.0 当前没有稳定 programmatic compiler API，因此仍需要 TypeScript 6 compatibility lane 服务于必须 `import "typescript"` 的工具：

```text
TypeScript 7
  owns CLI compiler / tsc

TypeScript 6 compatibility package
  owns temporary compiler-API compatibility for tooling only
```

推荐采用官方/Nx 已验证的 side-by-side alias 形态：

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@<PINNED_TS7>",
    "typescript": "npm:@typescript/typescript6@<PINNED_TS6>"
  }
}
```

因此：

```text
`tsc`  → TypeScript 7
`tsc6` → TypeScript 6 compatibility compiler
require/import("typescript") by API-dependent tools → TS6 compatibility API
```

Nx、typescript-eslint 或其他尚依赖 programmatic compiler API 的工具可以处于 TS6 lane；**产品源码不得因此只由 TS6 编译或 typecheck**。

当 TypeScript 7.x 提供稳定 programmatic API 且所需工具正式支持后，应重新 qualification 并删除 TS6 compatibility lane，而不是永久保留双编译器结构。

---

## 3. Canonical tsconfig baseline

普通 Node Foundation package 默认：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2025"],
    "verbatimModuleSyntax": true,
    "strict": true,
    "skipLibCheck": false
  }
}
```

并使用：

```json
{
  "type": "module"
}
```

作为 package 的默认 module posture。

### 为什么 `target = ESNext`

Heptalogos shipping runtime 是受项目控制并精确 pin 的 Node runtime，不需要为了未知旧运行时把产品源码 downlevel 到 ES2022。`ESNext + NodeNext` 使源码和输出跟随当前 TypeScript/Node 的现代 JavaScript 语义。

`ESNext` 是 floating target，因此：

```text
TypeScript upgrade
→ explicit toolchain compatibility gate
→ compile/test/runtime verification
→ then Catalog/lockfile update
```

不得通过长期固定旧 target 来替代版本治理。

### 为什么 `lib = ES2025`

`target` 控制 emit/语法能力；`lib` 控制可见标准 API 类型。Foundation 可以使用 `target = ESNext`，同时把 ambient standard-library surface 限定在 shipping Node 24 明确能够支撑的稳定标准基线，避免 `lib = ESNext` 无意暴露未来 API。

当 shipping Node major 改变时，`lib` 与 `@types/node` 一起重新 qualification。

### `skipLibCheck`

Canonical CI/type-compatibility gate 必须：

```text
skipLibCheck = false
```

否则不能把 `tsc` 成功当作第三方 declaration 与 TypeScript 7 兼容的证据。

编辑器/快速非 Authority lane 如确有性能需要可以单独放宽，但其 PASS 不能替代 canonical typecheck。

---

## 4. Node-native TypeScript execution

Node 24 可直接运行可擦除类型的 TypeScript。只对确实采用 Node native type-stripping 的 build/maintenance script，可使用：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  }
}
```

这不是所有 product package 的强制配置。

```text
Node-native TS script profile
!= emitted product package profile
```

不得为了使用 Node type stripping 改写产品 package 的 module/emit contract。

---

## 5. Node types 必须与 shipping runtime 对齐

不要安装 registry 的全局最新 `@types/node` 后让它隐式决定可用 runtime API。

规则：

```text
shipping Node major = 24
→ @types/node major = 24
```

当前全局 `@types/node` latest 已经进入 Node 26 line，因此使用 `@types/node@latest` 对 Node 24 产品会产生错误的 API surface。

Exact Node runtime、`@types/node` patch 与 Node-dependent native closure 都由 Catalog/lockfile 和 product qualification 记录。

---

## 6. Tooling compatibility 不等于产品语言基线

判断一个依赖是否支持 TS7 时必须区分：

```text
A. hard peer/runtime constraint
B. published .d.ts / consumer compile compatibility
C. upstream repository 自己使用的 dev compiler version
```

只有 A 是直接 blocker。

B 应通过 TS7 consumer compile/conformance 判断；C 仅是 evidence，不得因为某库 upstream 仍使用 TS5/TS6 开发就把 Heptalogos 主编译器降级。

当前 typescript-eslint 的 `typescript` peer range 尚未覆盖 TS7 programmatic API，因此 lint tooling 使用 TS6 compatibility lane。这不改变 TypeScript 7 的 canonical compiler Authority。

---

## 7. Version selection 必须基于当前证据

Agent 不得根据模型记忆、旧 Corpus patch、旧 lockfile 或“通常最新版本”选择 exact dependency version。

每次首次 Catalog freeze 或 role upgrade：

```text
read registry dist-tags/version metadata
+ read current upstream support/release docs
+ check engine/peer constraints
+ check ESM/CJS/native closure
+ check maintenance/release status
+ run only required conformance
→ choose exact version
→ pin Catalog/lockfile
```

Architecture Corpus 冻结：

```text
package identity
major/compatible line
role/boundary
maturity policy
qualification requirement
```

Implementation repository 冻结：

```text
exact direct versions in Catalog
exact resolved closure in pnpm-lock.yaml
```

---

## 8. Prerelease / 0.x / Beta 不是自动拒绝条件

Release label 是 evidence，不是 verdict。

判断候选是否足够适合 Foundation，需要同时评估：

```text
maintenance lineage and active maintainers
time in real use / adoption
release cadence and API churn
upstream test/conformance quality
known issue profile
required capability unavailable in stable line
runtime criticality and blast radius
ability to exact-pin
ability to rollback or replace behind adapter
source-less/native/package closure
```

采用规则：

```text
prefer latest capable line
!= prefer oldest stable line
!= always choose latest/prerelease
```

如果 prerelease/0.x 是满足该角色的最佳工程方案，可以采用；但必须：

```text
exact-pin
record why stable alternative is insufficient or worse
run role-specific qualification
state rollback/reopen conditions
```

反之，如果 stable line 已完整满足角色，不能仅为了“更新”而无收益地切到 beta/RC。

---

## 9. Version Authority graph

Repository verification reads version selections from their owners rather than
maintaining a second executable catalog:

```text
package.json                 → exact Node and pnpm baseline
pnpm-workspace.yaml#catalog  → exact npm direct dependency selections
dependency-routing.json      → independent dependency policy values
domain-owned manifests/code   → non-npm runtime selections
qualification records         → observed evidence only
```

Semantic schema, payload, protocol, and migration versions remain with their
owning contract; they are not globalized into this graph.

For dependency/runtime compatibility, `docs/dependencies/dependency-routing.json`
stores machine-readable `versionConstraint` or
`packageVersionConstraints` values on the owning route. The dependency gate
checks the exact Node selection and exact Catalog selections against those
major/optional-minor lines; it does not infer constraints from prose.

## 10. Repository enforcement

Implementation repository 必须使上述基线可机械检查：

```text
packageManager exact pin
pnpm Catalog exact direct versions
catalogMode: strict
pnpm-lock.yaml only
Nx project graph / affected tasks
Oxlint primary JS/TS lint and import restrictions
ESLint residual Nx module-boundary rules
jscpd clone detection
Nx project graph / affected tasks and task scheduling
TypeScript 7 canonical typecheck
TS6 compiler-API lane isolated from product compile authority
@types/node major-match gate
skipLibCheck=false dependency compatibility gate
```

不得同时出现 npm/yarn lockfile 作为第二 package-resolution Authority。

---

## 11. Qualification boundary

`C-TOOLCHAIN-01` 在 Implementation Plan 前验证：

```text
TypeScript 7 consumer compile for representative adopted dependencies
ESNext / NodeNext / ESM package semantics
skipLibCheck=false
@types/node 24.x alignment
Nx TS7 CLI + TS6 API side-by-side behavior
typescript-eslint / API-dependent tooling through TS6 compatibility lane
no Foundation product package depends on TS6-only compile/typecheck
```

现有 qualification evidence 中，使用 TS6 + `target: ES2022` + `@types/node` 26 + `skipLibCheck: true` 产生的 probe PASS 只能证明对应依赖性质，**不满足本工具链基线的 conformance evidence**。`C-TOOLCHAIN-01` 必须在这里定义的 TypeScript 7 / ESNext / NodeNext / Node24 types / `skipLibCheck:false` 基线上独立运行；与 toolchain 无关且已有有效 evidence 的产品语义 probe 不需要因此重做。
