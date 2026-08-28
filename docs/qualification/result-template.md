# 依赖验证结果模板

> 只记录当前 Foundation dependency selection 的证据。若问题已经由 L0 直接证据解决，不要求人为补写代码实验。

# 1. 基本信息

```yaml
qualificationId:
role:
date:
reviewer:
evidenceLevel: L0 | L1 | L2 | L3
evidenceStatus: PASS | FAIL | NOT_RUN
testedProperty: "本记录实际测试的单一性质"
qualificationState: OPEN | PARTIAL | CLOSED
```

`evidenceStatus` 只描述 `testedProperty`，不描述整个 qualification 是否关闭。若一个 qualification 包含多个性质，必须在结果末尾列出 `evidence` map；未执行的性质必须写 `NOT_RUN`，不能因测试文件退出码为 0 而写成 PASS。

# 2. 当前决策状态

```yaml
roleDecision: ADOPTED | PRIMARY_CANDIDATE | UNRESOLVED | DEFERRED | REJECTED_FOR_ROLE
implementationQualification: NOT_REQUIRED | REQUIRED | RUNNING | PASSED | FAILED | DEFERRED
preImplementationDecisionState: CLOSED | REOPENED # 仅当该记录涉及 provider selection
```

记录当前 Authority，不记录 before/after 修订叙事。

# 3. 精确未知问题

只写本次需要消除的 uncertainty：

```text
validationKind: SELECTION | CONFORMANCE | PRODUCT_QUALIFICATION
例如：required service 消失后，候选是否能可靠 dispose dependent scope？
```

禁止写成：

```text
“Cordis 好不好”
“DBOS 能不能做我们的系统”
```

# 4. Heptalogos-owned Semantics

列出绝不能交给候选定义的产品语义。

# 5. Candidate-owned Mechanics

列出候选只需承担的 generic mechanics。

# 6. L0 Direct Evidence

```text
source/spec/API/type/test/release/package metadata
relevant fact
confidence/limitation
```

如果 L0 足够，直接进入结论。

# 7. L1 Micro Probe（仅在需要时）

```yaml
question:
fixture:
expected:
observed:
artifactPath:
```

约束：

```text
synthetic fixture
single uncertainty
no real product subsystem unless unavoidable
```

# 8. L2 Boundary Probe（仅在需要时）

```text
minimal Heptalogos-shaped interface
candidate adapter
explicit/native comparator
```

记录：

```text
adapter complexity
ownership duplication
failure visibility
framework leakage
custom glue
```

# 9. Stop Condition

如果验证开始要求实现多个真实 Heptalogos subsystem：

```text
STOP
→ split uncertainty
→ return to L0/L1 design
```

记录是否触发 stop condition。

# 10. Product Qualification Remaining

列出实现后仍需 L3 证明的内容：

```text
exact version
source-less
native platforms
service/headless
live protocol
crash/upgrade
```

不要把这些未运行项误写成架构选择未决。

# 11. Decision

```yaml
roleDecision:
implementationQualification:
reason:
knownLimitations:
reopenConditions:
```

# 12. Authority Sync

结果写入：

[dependency-status.json](./dependency-status.json)、
[decision-ledger.md](../dependencies/decision-ledger.md)、以及
[dependency-matrix.md](./dependency-matrix.md)。

三者状态必须一致。Q evidence 可以存在 NOT_RUN product properties，但不得与当前 `RoleDecision` 冲突；`ImplementationQualification` 单独表达真实产品资格是否完成。

`CONFORMANCE` 只验证已经 ADOPTED route 的 adapter/contract fidelity，不得把角色重新表述为“未选型”。

# 13. Property ledger

```yaml
evidence:
  property_name: PASS | FAIL | NOT_RUN
qualificationState: OPEN | PARTIAL | CLOSED
```

`qualificationState: CLOSED` 只有在本项所有 required properties 都是 `PASS` 且没有未运行的 selection/conformance 边界时允许使用。
