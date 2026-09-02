# Control Plane Experience

本页定义 Control Plane 的稳定体验语义，而不是 pixel specification、
页面树、视觉 token 或 frontend 技术选型。它回答产品在静止、注意、对话、
直接管理和助手操作之间如何保持同一个连续的 living surface。

## 1. 一个 living product surface

Control Plane 是一个有 Subject presence 的 living product surface，不是
“dashboard 上附带一个 chatbot”。它至少提供：

```
Home / Subject presence
Subject Chat
Direct Management
Operator Assistant
attention / Presentation intents
```

Home 是主要的 Subject-facing surface。Home 的 resting state 强调 Subject
的存在、状态和可接近性，不把统计卡片或管理指标当作第一视觉中心。
Home 与展开后的 conversation 是同一连续 surface；从静止状态进入对话不
跳转到另一个孤立的 /chat 产品。

## 2. Home resting state

在没有需要呈现的 attention 时：

- Dynamic Island 隐藏；
- 中央显示一个 living、Siri-like orb，作为 Subject presence；
- 输入是窄、精致、居中的 control，视觉上接近 login/password field；
- 输入不是宽大的 ChatGPT-style composer；
- floating Dock 提供进入主要入口的轻量 affordance。

这些是稳定的体验关系。具体图形、动画曲线、颜色数值、字体、尺寸和
responsive breakpoint 留给后续 Presentation 设计。

## 3. 连续的对话展开

用户激活 Home 输入后，仍停留在同一 Home surface：

```
activate input
→ orb shrinks and moves upward
→ conversation history becomes visible
→ composer settles lower on the same surface
→ Dock recedes
```

对话展开不创建第二个产品后端或另一套 Subject Chat Authority。历史、
canonical message state 和连接恢复都来自同一 Subject Chat / Management
contract；具体 renderer 不得把局部 UI state 当作产品真相。

## 4. Dynamic Island 与 attention

Dynamic Island 是 attention surface，不是常驻 dashboard：

```
no meaningful attention → hidden
meaningful event / operation / approval / failure → may surface
```

它可以呈现有意义的 System event、Subject event、Operation progress、
Approval request 或 Failure attention。它不创造新的 canonical state，也不
拥有 System 或 Subject Authority。即使用户看不到 Island，canonical
Operation、Evidence、Message 或 Subject state 仍独立存在。

Live channel 丢失、窗口关闭或客户端重连不能丢失产品真相。客户端重新连接
后重新查询 canonical Read Models 和消息/Operation state。

## 5. Locked / Dormant character

Locked 或 Dormant 是同一产品 composition 的低活动状态：

- composition 保持一致；
- Dynamic Island 隐藏；
- orb 变为灰白、低饱和、较淡的 presence；
- motion 更慢、更弱；
- dormancy 不等于 failure。

锁定 ceremony、解锁交互和精确视觉语言不在本页冻结；它们必须继续保持
Authentication/session state 与 Subject Desired/Actual state 的正交关系。

## 6. Canonical runtime state 的投影

Control Plane 不通过颜色或动画猜测状态。它从 canonical Read Models 投影
下列相互区分的运行状态：

```
STOPPED
STARTING
READY
ACTIVE
DEGRADED
BLOCKED
STOPPING
FAILED
```

Home、Dynamic Island、Direct Management 和 Assistant context 可以以不同
密度呈现这些状态，但它们必须指向同一 canonical owner。Subject 的
Desired 与 Actual 仍然分离；管理员 session、Host state 和 Subject
identity 也不能混成一个 UI boolean。

## 7. Direct Management without AI

Direct Management 是可独立使用的确定性 Control Plane。管理员可以在没有
Operator Assistant 的情况下：

```
inspect resources
inspect readiness / runtime / capability
inspect Subject state and lifecycle
inspect configuration / model / provider
inspect operations / approvals / evidence
request governed actions
```

它不要求用户先理解 Assistant，也不把所有资源强行展开成一棵 full-page
tree。资源详情、影响、状态和动作应由 canonical Read Models、
Management Contract 和 SystemAction metadata 驱动。

## 8. Operator Assistant：Explain、Navigate、Operate

Operator Assistant 的体验分成三个能力层：

```
Explain
→ 基于 Read Models / Lineage / Evidence 解释当前状态

Navigate
→ 生成到资源、Operation、Approval 或诊断位置的 PresentationIntent

Operate
→ 提出并执行受治理的 SystemAction
```

Operate 的产品路径是：

```
natural-language request
→ SystemAction proposal
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ ManagementOperation
→ owning Service
→ verification / Evidence
```

助手应向管理员展示结构化的 action、target、impact、preconditions、
approval requirement 和 operation state。它不能把 shell command、SQL、
raw filesystem mutation、raw secret、raw DBOS control 或 trust-root edit
伪装成普通 assistant tool。隐藏 mutation 不属于此体验；模型和工具的
输出仍是 proposal，canonical mutation 必须经过 System Authority。

## 9. Authority handoff 的可见性

产品应让管理员能够理解一条请求当前属于哪种 Authority：

```
Subject Chat
→ Subject Authority

Direct Management
→ System Authority

Operator Assistant
→ System Authority proposal / delegation

Bootstrap / Recovery
→ bounded Recovery Authority
```

当 Subject Chat 中出现系统管理意图，或系统操作需要 Subject context 时，
产品可以显示显式的 AuthorityHandoff。handoff 传递 intent、bounded context、
reason 和 initiating principal；它不自动转移 permission。目标 Authority
必须重新执行自己的认证、授权、风险和 Approval 规则。

## 10. Browser 与 Desktop carrier convergence

Browser Control Plane 与 Desktop Control Plane 是一个前端产品的不同
carrier，共享同一 Host、Management Contract、Subject Chat contract 和
canonical Read Models：

```
same product surface
├─ Browser carrier
└─ Desktop carrier
```

两种 carrier 的连接中断后都通过重新查询 canonical state 恢复，不把遗漏的
live event 当作事实丢失。Desktop main/preload、快捷键和窗口 chrome 不能
隐藏一条绕过 Management/System Authority 的权限路径；platform-owned
window semantics 仍由平台负责。

本页不冻结 pixel-level layout、frontend framework、Electron package、
具体 credential ceremony 或页面/路由命名。它冻结的是同一 Product Host、
同一 Authority、同一 Subject continuity 与同一可解释管理路径。
