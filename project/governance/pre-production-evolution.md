# 开发阶段闭包：稳定化与兼容性治理

**性质：** 当前态架构治理规则。它定义 milestone 完成后的稳定化和候选闭环，不把未来 review、CI 或 merge 结果预写成已经通过。

## 1. Purpose：功能完成不等于阶段闭包

```text
Hn functional completion != Hn closure
Hn-S is mandatory before Hn CLOSED
Hn-S is short/bounded, not a second development stage
```

功能 milestone 证明目标行为已实现；`Hn-S` 还必须清除会让下一阶段依赖不可信的
canonical state、Authority、recovery、边界和当前证据缺陷。稳定化不得借机实现
下一阶段功能、引入新 subsystem，或把 bounded corrective work 扩展为第二轮开发。

## 2. Decision-complete stabilization plan

Hn-S 计划必须在 executor 开始前解析所有已知的 A/B/C 决策，包括 Authority、
semantic ownership、package/dependency boundary、compatibility、durable shape、
stable identity、lifecycle/failure semantics、stage scope 与 required evidence。

```text
executor may choose only semantics-equivalent local implementation details
unresolved non-trivial decision -> PLAN_GAP -> stop
```

Executor 不得按 filename、recency 或 convenience 选择另一份 active plan，也不得
把现有代码或历史行为提升为 Architecture Authority。当前未解决的事实必须回到
对应的 typed owner：产品意图在 `docs/product/`，概念 Architecture 在
`docs/architecture/`，精确实现契约在 `specs/`，治理政策在 `project/governance/`，
Provider/mechanics 决策在 `project/dependencies/`，当前授权在
`project/plans/active/`，开发 Horizon 在 `project/roadmap/`，已执行证据在
`project/qualification/`。Plan 可以授权修改这些 owner，但完成后不成为第二个
standing Authority；若 owner、边界或语义仍未决定，停止并报告冲突。

## 3. A/B/C scope budget 与 Stop Rule

```text
A — closure blockers: MUST fix
B — bounded structural debt: only local, non-expanding edits
C — explicitly out of scope: defer
```

任何发现若需要新 subsystem、major architecture expansion 或 substantial new
capability work，必须记录为 C 或待重新授权的架构问题。不要用审美重构替代 scope
decision，也不要用 exception list、compatibility shim 或 hidden fallback 绕过 Stop
Rule。

## 4. Development Provenance Neutrality

```text
Development provenance MUST NOT become canonical identity.
Hn-S MUST leave a history-neutral canonical/executable tree.
```

当前 source、tests、fixtures、scripts、tooling、configuration、workflow definitions
与 current agent instructions 描述系统现在是什么，而不是哪个 milestone、PR、session
或 corrective cycle 创建了它。Git、completed plans 与 historical qualification
records 保存 provenance；current executable tree 不是 development archive。

## 5. Compatibility Obligation Purity

```text
COMPATIBILITY REQUIRES A DECLARED OBLIGATION.
No declared obligation -> rewrite/reset/reject/delete; do not adapt.
PRE_PRODUCTION development history creates no compatibility obligation.
```

当前 obligations 的唯一 machine-readable owner 是
[compatibility-obligations.json](compatibility-obligations.json)。`VERSIONED != HISTORICALLY COMPATIBLE`。
在 `CompatibilityEpoch = PRE_PRODUCTION` 下，merged commit、旧 developer DB、local
fixture、previous build 与旧开发格式不能成为兼容 consumer。不得为其新增 V2/V3、
legacy reader、upcaster/downcaster、bridge migration、alias、shim、dual reader/writer
或 deprecated internal API。只有真实 retained state 或明确 external consumer 才能
建立 obligation，并必须回到显式 architecture decision。

## 6. Current-Tree Archaeology

每个当前 artifact 必须同时满足：

```text
1. has a current owner;
2. has a current semantic or operational purpose;
3. is consumed by a current build/test/runtime/governance path, or required by current normative docs;
4. identity describes current purpose rather than its creating phase.
```

只因“历史证据”“旧计划引用”“曾经有用”或“以后可能需要”而存在的 one-time
phase evidence、phase script 与 ownerless artifact 必须从 current tree 删除，不得移入
`archive`、`.history`、`legacy` 或其他 current-tree 目录。未知 artifact 若 live owner
不清楚，必须 `PLAN_GAP`，不得猜测删除或保留。

## 7. Surface classification

### Canonical / executable current surfaces

Production source、可运行 tests、test-support/fixtures、manifests、root config、
workflow definitions、permanent verification tooling、current Skills/package metadata、
AGENTS、runtime/test/resource IDs 与解释当前语义的 comments 必须 history-neutral。

### Provenance / historical surfaces

Git history、`project/plans/completed/**`、历史 qualification records、review/CI/merge
closure records 与 changelog 可以保留 exact historical identifiers，因为它们的目的
就是记录 chronology。它们不得反向成为 current Authority。

### Normative architecture surfaces

`docs/architecture/**` 维护概念模型、语义边界、关系与 rationale；`specs/**` 维护
精确的当前实现契约；`project/governance/**` 维护 standing engineering/evolution
policy。三者不得互相替代，也不复制某时点的 Roadmap/qualification milestone truth。

## 8. Negative test rule

测试可以证明 current schema strictness、required-field validation、unsupported input
rejection 与 current contract behavior；不得以 `legacy`、`obsolete`、旧 milestone 或
“previous shape compatibility”命名并保留已经结束的 development chronology。旧形状
测试若仍证明 current invariant，应改写为 neutral current-contract validation；若只是
重复通用 unsupported-version/unknown-field coverage，应删除。

## 9. Migration rule

PRE_PRODUCTION 的 current migration baseline 是可重写的 development material。当前
shape 变化应 rewrite/squash canonical V1、更新 callers/tests、reset/recreate project-
owned dev/test state，并删除 obsolete implementation。不得追加 migration 以保留开发
数据库 chronology；有 current architecture-owned reason 时才允许额外 migration。

## 10. Mandatory Hn-S sweeps

Candidate freeze 前必须完成并保留 claim-matched evidence：

```text
Sweep A — Development Provenance Neutrality
Sweep B — Undeclared Compatibility Residue
Sweep C — Current-Tree Archaeology / Dead Phase Artifact Removal
Sweep D — Hn cross-milestone architecture seams
Sweep E — Current-candidate qualification truth
```

永久 `check:hygiene` gate 必须覆盖 Sweep A-C，且不得提供 generic allowlist、baseline
或 suppression escape hatch。

## 11. Candidate closure and operational playbooks

稳定化使用一个 bounded Plan 和当前仓库的候选闭环。具体的 candidate transport、
Draft/Ready、Independent Review、qualification 与 merge 操作由当前 Playbooks 负责：

- [pre-production stabilization closure](../engineering/playbooks/repository/pre-production-stabilization-closure.md)
- [milestone PR closure](../engineering/playbooks/repository/milestone-pr-closure.md)

Standing closure invariant 为：

```text
approved Plan complete
+ required local/current qualification complete
+ mandatory Hn-S sweeps complete
+ external Independent Review PASS where the governing workflow requires it
+ candidate unchanged after the applicable review boundary
+ current merge conditions satisfied
```

Independent Review 是 authorized external reviewer 提供的外部治理 verdict，不等于
GitHub Pull Request review、approval、requested reviewer、comment、status check 或
branch protection signal。其具体证据边界和候选不变规则以当前 Playbook 为准。

Ordinary GitHub Actions execution remains disabled by current repository policy. 本规则
不把 workflow definitions 或 GitHub review objects 设为当前 closure Authority；
跨平台、live provider 或 source-less artifact 的 claim 仍必须有对应的实际执行证据。

## 12. Current milestone truth owner

本页面不重复维护某时点的 `Hn`、`Hn-S` 或 `HnA` 状态。当前 milestone truth 的维护
投影是：

```text
project/roadmap/development-roadmap.md
project/qualification/results/qualification-status.json
```

Implementation plan、当前 code、历史 qualification 或预期 CI 结果都不能单独把未发生的
闭包描述为已完成。历史 evidence 与 current evidence 必须显式区分。

## Hard closure formulas

```text
canonical/executable development provenance residue > 0 -> A blocker
undeclared compatibility behavior > 0 -> A blocker
closed-phase current-tree artifact without current owner/purpose > 0 -> A blocker
```
