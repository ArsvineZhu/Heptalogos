# S12 验证与 Research Evaluation

## Verification Matrix

### Unit

Pure logic/schema.

### Property

Graph/state/invariants/compatibility/admission.

### Contract

Extension/Provider/Driver/Management API/CLI.

### Integration

Real PostgreSQL/DBOS/controlled network fixtures.

### Fault/Crash

Process kill/network ambiguity/resource pressure.

### Replay

Deterministic Foundation semantics.

### CLI E2E

Complete reference Management coverage.

### Source-less

Exact shipping artifact.

### Native Platform

Windows/macOS/Linux.

### Live Integration

Real providers/protocols only for claims being shipped.

### Research Evaluation

Separate, subsystem-specific work outside Foundation release gates.

---

## Dependency Selection Evidence

Dependency selection must use the smallest evidence that resolves the uncertainty:

```text
L0 direct evidence
L1 micro probe
L2 boundary probe
```

Do not build a real Driver/Subject/Extension stack only to compare generic runtime libraries.

Synthetic fixtures must keep candidate difficulty equivalent.

---

## Dependency Comparison Evidence

When a boundary probe is required, collect only decision-relevant data, for example：

```text
adapter/custom LOC
ownership duplication
resource cleanup behavior
failure diagnostics
API/framework leakage
runtime dependencies
package/native closure
startup overhead where material
upgrade/API stability risk
```

Do not optimize for minimum LOC alone.

---

## Product Qualification

After implementation exists, verify exact product claims with exact artifacts/environments:

```text
source-less closure
native transitive load
service/headless mode
real PostgreSQL
crash/restart
provider/protocol live behavior
backup/update/restore
```

This stage validates the product implementation, not the original library-selection hypothesis.

---

## Advanced Research Boundary

Persona、Memory、Relationship、Attention、Reflection、Diary、Dream、Proactive Behavior 等高级 subsystem 的 metrics、datasets、baselines 和 ablations 不属于 Foundation Corpus 的实现/释放 gate。

当某个 subsystem 正式进入研究阶段时，它必须单独建立 evaluation specification，并复用 Foundation 的：

```text
Evidence
Replay
Fake Time
Context/Activity contracts
Capability contracts
configuration
fault injection
```

Foundation 只验证高级 subsystem integration hooks 的 contract correctness，不提前定义其研究指标。

---

## Release Gate

最终 gate 不接受：

```text
“应该可以”
“文档说支持”
“Linux 已通过所以 Windows 也行”
“mock 通过所以 live protocol 没问题”
“开发工作区能加载所以 source-less 也行”
```

每个 claim 必须有匹配的 evidence state：

```text
PASS | FAIL | NOT_RUN | BLOCKED
```
