# Foundation 依赖资格证据

本目录保存当前 Architecture decision 所依据的 Q/C property evidence。**Evidence record 不是 RoleDecision Authority**；角色状态只读取 `project/qualification/dependency-status.json`，实现路由只读取 `project/dependencies/dependency-routing.json`。

当前 Foundation pre-implementation provider selection 已关闭。Q 系列记录中的 `NOT_RUN` 表示某些 platform/native/source-less/product property 尚待实现期验证，不表示 role 仍为候选。

```text
Pre-implementation selection: CLOSED

CLOSED conformance
  C-TOOLCHAIN-01
  C-SCHEMA-01
  C-CONFIG-TOML-01

Implementation conformance remaining
  C-MGMT-01
  C-CLI-01
  C-NET-01
  C-STORAGE-FS-01
  C-SESSION-01

Current Product slice qualification
  Q-P1-PRODUCT-HOST-01

Product qualification deferred to later implementation
  Q-RUNTIME-01
  Q-ASYNC-01
  Q-SECRET-01
  Q-MSG-01
  Q-POLICY-01
  Q-BOOT-01
  Q-PRIVATE-POSTGRES-01
  Q-PERSISTENCE-01
```

Machine-readable property ledger: `project/qualification/results/qualification-status.json`。

`project/qualification/results/qualification-status.json` is the current property ledger. Historical sections
in `Q-*.md` are evidence history, not the current behavior contract.
Independent review, final CI, and squash merge are external candidate-closure
evidence; they must not be self-recorded by a post-review repository commit.

`qualificationState` 只描述该证据记录的剩余 qualification 完整度：`CLOSED` 表示该记录要求的 property 已关闭，`PARTIAL/OPEN` 表示仍有 implementation/product property 未运行；它**不表示 RoleDecision 重新开放**。RoleDecision 是否开放只读取 `project/qualification/dependency-status.json` / `preImplementationDecisionState`。

| ID                    | Evidence                                             |
| --------------------- | ---------------------------------------------------- |
| C-TOOLCHAIN-01        | [C-TOOLCHAIN-01.md](C-TOOLCHAIN-01.md)               |
| Q-RUNTIME-01          | [Q-RUNTIME-01.md](Q-RUNTIME-01.md)                   |
| Q-ASYNC-01            | [Q-ASYNC-01.md](Q-ASYNC-01.md)                       |
| Q-EFFECT-01           | [Q-EFFECT-01.md](Q-EFFECT-01.md)                     |
| Q-SECRET-01           | [Q-SECRET-01.md](Q-SECRET-01.md)                     |
| Q-MSG-01              | [Q-MSG-01.md](Q-MSG-01.md)                           |
| Q-POLICY-01           | [Q-POLICY-01.md](Q-POLICY-01.md)                     |
| Q-BOOT-01             | [Q-BOOT-01.md](Q-BOOT-01.md)                         |
| Q-PRIVATE-POSTGRES-01 | [Q-PRIVATE-POSTGRES-01.md](Q-PRIVATE-POSTGRES-01.md) |
| Q-PERSISTENCE-01      | [Q-PERSISTENCE-01.md](Q-PERSISTENCE-01.md)           |
| C-SCHEMA-01           | [C-SCHEMA-01.md](C-SCHEMA-01.md)                     |
| C-MGMT-01             | [C-MGMT-01.md](C-MGMT-01.md)                         |
| C-CLI-01              | [C-CLI-01.md](C-CLI-01.md)                           |
| C-NET-01              | [C-NET-01.md](C-NET-01.md)                           |
| C-STORAGE-FS-01       | [C-STORAGE-FS-01.md](C-STORAGE-FS-01.md)             |
| C-SESSION-01          | [C-SESSION-01.md](C-SESSION-01.md)                   |
| C-CONFIG-TOML-01      | [C-CONFIG-TOML-01.md](C-CONFIG-TOML-01.md)           |
| Q-P1-PRODUCT-HOST-01  | [Q-P1-PRODUCT-HOST-01.md](Q-P1-PRODUCT-HOST-01.md)   |
