# T1 — Product Authority & Post-H3 Roadmap Convergence

**State:** `COMPLETED`<br>
**Mode:** `PRE_PRODUCTION`<br>
**Task class:** `PRODUCT_AUTHORITY_AND_ROADMAP_CONVERGENCE`<br>
**Current maturity:** `H3_CLOSED / PRODUCT_ENTRY`<br>
**Executable Truth target:** `KNOWLEDGE_AUTHORITY_DECISION_COMPLETE_FOR_T2`<br>
**Intended repository path:** `project/plans/active/product/t1-product-authority-roadmap-convergence-2026-09-02.md`<br>
**Completion path:** `project/plans/completed/product/t1-product-authority-roadmap-convergence-2026-09-02.md`

---

## 0. Mission

Establish the current **product-level Authority** required before normative Product/H4-Min/H6 specifications are written.

This task closes the knowledge gap between:

- the already-established Heptalogos product goals;
- the already-established System / Subject / Management / Presentation architecture;
- the already-agreed Control Plane product form;
- and the post-H3 development Roadmap.

The task MUST leave the repository in a state where a later T2 Plan can write normative implementation Specs without inventing product semantics, user-facing product shape, Authority boundaries, or development order.

This task is not an implementation task.

It MUST NOT create product code, placeholder packages, DTOs, protocol schemas, OpenAPI documents, database schema, dependency pins, frontend code, or normative Specs.

The task ends when:

```text
Product purpose
+ Product shape
+ Control Plane experience
+ Subject/System Authority surfaces
+ post-H3 product-entry sequence
+ next-Spec ownership

are explicit current Authority.
```

Then **STOP**.

---

# 1. Authorization ceiling

```yaml
mode: PRE_PRODUCTION

authorized:
  productDocumentation: true
  documentationNavigation: true
  roadmapReconciliation: true
  planLifecycle: true

notAuthorized:
  executableCode: true
  packageOrWorkspaceTopology: true
  dependencyChanges: true
  normativeSpecs: true
  architectureRedesign: true
  databaseSchema: true
  qualificationFabrication: true
  productImplementation: true
  presentationImplementation: true
  externalResearchRequiredForExecution: true

compatibility:
  epoch: PRE_PRODUCTION
  obligations: []
```

`notAuthorized: true` means the corresponding class of mutation is forbidden by this Plan.

No development history creates compatibility obligations.

Do not add, preserve, or justify product semantics using:

```text
legacy
old behavior
temporary compatibility
migration bridge
fallback for the former design
v1 compatibility
old Control Plane mode
old Subject Chat mode
```

unless the wording is inside a historical Plan/evidence document that this task does not modify.

---

# 2. Standing engineering constraints

The executor MUST apply the current repository governance, including:

1. **Library-first / Anti-NIH.**
   This task does not select implementation libraries, but it must not create future architecture that assumes custom mechanics where an adopted provider already owns the role.

2. **Anti-overengineering.**
   Product Authority describes current product semantics and durable interaction requirements. It MUST NOT freeze speculative subsystems, future feature inventories, plugin frameworks, generic UI engines, or unnecessary abstractions.

3. **One semantic owner.**
   Product, Architecture, Specs, Roadmap, Plans, Qualification, and Git have different Authority roles. Do not duplicate the same fact into every layer.

4. **State > Prompt.**
   Product documentation must preserve the distinction between the persistent Subject and transient model/prompt invocations.

5. **Proposal != Authority.**
   Operator Assistant and Subject model output remain proposal-producing participants, not canonical mutation authority.

6. **Subject Authority != System Authority.**
   Product-facing similarity MUST NOT collapse these two planes.

7. **Presentation is projection.**
   Browser/Desktop/UI state is not canonical product truth.

8. **Current truth before chronology.**
   Living Product documents describe the product directly. Development chronology belongs in Roadmap, Plans, Qualification, and Git.

9. **STOP after closure.**
   Once this Plan's acceptance criteria pass, do not continue into T2 or implementation.

---

# 3. Required reading before mutation

Before installing or editing Product Authority, read the current versions of:

```text
AGENTS.md

project/governance/project-charter.md
project/governance/constitution.md
project/governance/pre-production-evolution.md

project/roadmap/development-roadmap.md

project/plans/README.md
project/plans/INDEX.md
project/plans/completed/repository/post-h3-current-authority-reconciliation-2026-09-02.md

docs/INDEX.md
docs/product/product-goals.md

docs/architecture/README.md
docs/architecture/system-architecture.md
docs/architecture/authority-and-core-concepts.md
docs/architecture/management-authority.md
docs/architecture/management-presentation.md
docs/architecture/execution-model.md
docs/architecture/configuration.md
docs/architecture/ai-runtime.md
docs/architecture/subject.md
docs/architecture/messaging.md

specs/INDEX.md

project/dependencies/README.md
project/qualification/README.md
```

The executor must use the current repository copies, not this Plan as a substitute for reading current Authority.

If any current governing file materially contradicts a decision frozen by this Plan, classify it as `PLAN_GAP` and report:

```text
file
section
current statement
conflicting T1 decision
why both cannot be true
```

Do not silently redesign around the contradiction.

---

# 4. Starting-state verification

Before substantive mutation, verify:

```yaml
branch: master-or-task-branch-based-on-current-master
workingTree: CLEAN
H3: CLOSED
activeFoundationPlan: NONE
activeProductPlan: NONE
```

Expected recent repository state includes the completed T0 reconciliation commit:

```text
6a37636569ac44124865295796d25456ddb232bc
docs: reconcile H3 post-merge authority
```

Do not hard-reset to this SHA if the repository has legitimately advanced.

The semantic requirement is:

```text
T0 completed
H3 closed
no active implementation Plan
```

not a permanently pinned repository HEAD.

---

# 5. Plan installation rule

The user-provided copy of this file is the approved authorization candidate.

The first repository mutation under T1 MUST be to install this Plan verbatim or semantically equivalently at:

```text
project/plans/active/product/t1-product-authority-roadmap-convergence-2026-09-02.md
```

and update:

```text
project/plans/INDEX.md
```

so that exactly one T1 entry is `ACTIVE`.

No Product/Roadmap mutation may precede installation of the active Plan.

Do not create a second umbrella Plan.

---

# 6. Knowledge Authority model

After T1, the knowledge plane MUST have this responsibility split:

| Authority                                  | Owns                                                                    | Must not own                                                |
| ------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `docs/product/product-goals.md`            | product proposition, research purpose, differentiation                  | implementation sequencing, exact API contracts              |
| `docs/product/product-shape.md`            | what the Heptalogos product is and its durable user-visible composition | implementation package topology, pixel layout               |
| `docs/product/control-plane-experience.md` | current Control Plane interaction model and stable experience semantics | backend Authority implementation, transient prototype notes |
| `docs/architecture/**`                     | conceptual system structure, owners, planes, flows                      | product-stage chronology, implementation authorization      |
| `specs/**`                                 | exact normative implementation contracts                                | design history, roadmap                                     |
| `project/roadmap/development-roadmap.md`   | maturity, sequencing, eligibility, bounded product-entry order          | exact implementation contract                               |
| `project/plans/**`                         | current work authorization and historical execution records             | permanent product semantics                                 |
| `project/qualification/**`                 | observed evidence                                                       | intended product design                                     |
| Git                                        | repository chronology                                                   | semantic Authority by itself                                |

T1 MUST NOT introduce a new parallel "Corpus", design notebook, chat-log archive, decision ledger, or duplicated product-spec tree.

---

# 7. Required output set

T1 MUST create:

```text
docs/product/README.md
docs/product/product-shape.md
docs/product/control-plane-experience.md
```

T1 MUST update:

```text
docs/INDEX.md
project/roadmap/development-roadmap.md
project/plans/INDEX.md
```

T1 SHOULD NOT modify:

```text
docs/product/product-goals.md
```

unless a direct contradiction with the current product shape is found. Navigation alone is not sufficient reason to rewrite it.

T1 MUST NOT modify:

```text
docs/architecture/**
specs/**
packages/**
integration/**
tools/**
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
project/dependencies/**
project/qualification/**
AGENTS.md
```

If a direct Architecture contradiction is found, STOP as `PLAN_GAP`; do not use T1 as permission to rewrite Architecture.

---

# 8. `docs/product/README.md` — exact responsibility

Create a compact Product knowledge entry page.

It MUST state that Product documents describe the current product directly and are intentionally free of development chronology.

It MUST route exactly these three current Product authorities:

```text
product-goals.md
product-shape.md
control-plane-experience.md
```

Recommended table semantics:

| Document                 | Question answered                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Product goals            | Why does Heptalogos exist and what differentiates it?                                                                            |
| Product shape            | What constitutes the product and how do its major user-visible/system-facing parts relate?                                       |
| Control Plane experience | How does the administrator experience Home, Subject Chat, direct management, Operator Assistant, navigation, and product states? |

It MUST state:

```text
Product docs do not authorize code.
Architecture explains how product semantics are structurally realized.
Specs define exact implementation contracts.
Roadmap defines when capabilities enter implementation.
```

Do not add a large documentation framework.

---

# 9. `docs/product/product-shape.md` — normative product content

This document becomes current Authority for the durable product form.

It MUST be written in Chinese, using established English technical nouns where they are canonical.

It MUST NOT read like a proposal, meeting note, comparison essay, or historical explanation.

It MUST NOT use stage language such as:

```text
目前阶段
H6 先
以后再做
MVP
旧设计
上一版
这次
暂时兼容
为了开发方便
```

except where a future-labelled product capability is genuinely part of product scope and the document explicitly distinguishes current durable product shape from optional future feature expansion.

## 9.1 Required product definition

The document MUST define Heptalogos as a product consisting of at least these durable roles:

```text
Installation
Product Host
persistent Subject
Control Plane
Presentation clients/carriers
Bootstrap / Recovery entry
```

It MUST preserve:

```text
one logical Installation
→ one current Host Authority
→ one active logical Subject identity
```

for the currently accepted product model.

Do not turn this into a generic multi-tenant/multi-Subject platform design.

## 9.2 Host and Presentation lifecycle

Freeze these product requirements:

```text
Product Host is the persistent product runtime.

Browser UI and Desktop UI are clients/presentations of the same product,
not two separate backend architectures.

Closing a browser tab or Desktop shell does not stop the Product Host.

Removing/closing the Presentation does not delete Subject identity,
canonical state, durable work, or product data.

Presentation never becomes System, Subject, Host, database, or package Authority.
```

The Desktop carrier may use Electron according to current Architecture direction, but `product-shape.md` MUST NOT make Electron the identity of the product.

Do not select a frontend framework in T1.

## 9.3 Three first-class administrator interaction surfaces

The product shape MUST expose three distinct first-class interaction surfaces:

### A. Subject Chat

```text
Administrator
↔ persistent Subject
→ Subject Authority
```

This is the built-in direct `heptalogos-subject-chat` product channel.

It is not a shortcut from UI to Reactor/model.

### B. Direct Management

```text
Administrator
→ deterministic Control Plane resources/actions
→ System Authority
```

This is the non-AI direct management path for inspection, configuration, operations, approvals, diagnostics, lifecycle actions, and other administratively meaningful resources.

Operator Assistant availability MUST NOT be required for Direct Management.

### C. Operator Assistant

```text
Administrator
↔ internal system assistant
→ System Authority proposal path
```

The Operator Assistant is the Siri-like intelligent system-management assistant.

It is not the Subject.

It is not a second administrator identity.

It is not a root shell.

It is not the only way to manage the product.

## 9.4 Authority separation

Freeze:

```text
Subject Chat            → Subject Authority
Direct Management       → System Authority
Operator Assistant      → System Authority proposal/delegation path
Bootstrap/Recovery      → bounded Recovery Authority
```

Visual similarity does not imply Authority equivalence.

The product MUST NOT use one generic chat endpoint with a `mode=subject|operator` switch to change Authority.

Authority handoff MUST be explicit.

Examples:

```text
Subject Chat:
"升级 Milky"
→ AuthorityHandoff
→ System Authority

Operator Assistant:
"今晚别主动联系 Bob"
→ AuthorityHandoff
→ Subject Governance / Subject Authority
```

Handoff transfers intent/context references, not permission.

## 9.5 Management product spine

The document MUST state the product-level relationship:

```text
Product Host
  └─ Canonical Management Server
       ├─ Read Models
       ├─ SystemAction / ManagementOperation
       ├─ Management Contract
       ├─ Subject Chat endpoint
       ├─ Operator Service endpoint
       └─ live projections

Management clients
  ├─ CLI
  ├─ Browser Control Plane
  ├─ Desktop Control Plane
  └─ Operator Assistant tooling
```

There is no second authoritative Control Plane backend.

Do not make Fastify, OpenAPI, Electron, or a frontend framework product Authority.

## 9.6 Authentication and Subject lifecycle are orthogonal

The product shape MUST explicitly distinguish:

```text
administrator authentication/session state
from
Subject Desired/Actual runtime state
```

Required consequences:

```text
logging in does not automatically start the Subject
unlocking the Control Plane does not imply Subject RUNNING
Subject being STOPPED/BLOCKED is not equivalent to administrator logout/lock
Host process state is not Subject identity
```

Do not define UI microcopy or exact credential ceremony here; those belong to Architecture/Specs/Presentation design.

## 9.7 Product portability distinctions

Retain the existing product distinction:

```text
Installation Backup
Subject Bundle
Product Update
```

State their product-level meanings without inventing implementation format:

```text
Installation Backup
→ preserves/restores an installation and owned product state

Subject Bundle
→ represents Subject portability/transfer semantics

Product Update
→ replaces or advances product software/generation
```

Do not define ZIP layouts, migration compatibility, backup algorithms, or update protocols in T1.

---

# 10. `docs/product/control-plane-experience.md` — normative experience content

This document owns stable product interaction semantics.

It is not a pixel specification.

It MUST distinguish:

```text
stable experience requirement
vs
presentation implementation detail
```

Exact pixel dimensions, color tokens, font families, animation curves, frontend component trees, and complete information architecture are outside T1 unless already required to preserve an established product semantic.

## 10.1 Control Plane character

Define the Control Plane as a **living product surface**, not a conventional dashboard that happens to contain a chatbot.

The Control Plane must support:

```text
Home / Subject presence
Subject Chat
Direct Management
Operator Assistant
system attention/presentation intents
```

while keeping Authority explicit.

## 10.2 Home is the default Subject-facing surface

Freeze:

```text
Home is the administrator's primary Subject-facing surface.

Its resting state emphasizes the persistent Subject's presence,
not statistics, cards, navigation lists, or a generic dashboard.

Home and the expanded Subject conversation are the same continuous surface,
not unrelated pages.
```

Do not describe Home as a ChatGPT-style generic chat page.

## 10.3 Resting Home composition

Freeze the established resting-state composition:

```text
top attention surface:
  Dynamic Island hidden when there is no event requiring attention

center:
  a living Siri-like Subject presence/orb
  dynamic rather than a static logo

below Subject presence:
  one narrow, refined, centered input affordance
  closer in visual scale to a desktop login/password field
  than a wide ChatGPT-style composer

navigation:
  a lightweight floating Dock / space-navigation affordance
  that does not dominate the Subject presence
```

The document SHOULD describe these as product experience requirements rather than pixel measurements.

## 10.4 Resting → conversation transition

Freeze the continuous transition:

```text
administrator activates the Home input
→ same Home surface expands into conversation
→ Subject presence/orb reduces in scale and moves upward
→ conversation history becomes visible
→ input moves toward the lower interaction area and becomes the chat composer
→ Dock collapses/recedes to reduce competing navigation
```

Do not model this as:

```text
click input
→ navigate to unrelated /chat route
→ replace Home with generic chat screen
```

A technical implementation may still use routing internally, but the user-visible product experience is continuous.

## 10.5 Dynamic Island semantics

The top Dynamic Island is an **attention surface**, not permanent decorative chrome.

Freeze:

```text
idle:
  hidden/collapsed

attention required:
  may surface meaningful system/Subject event,
  operation, approval, failure, or other product attention state

truth:
  canonical state does not depend on the Island being visible
```

Do not invent a permanent status ticker.

## 10.6 Locked / Dormant presentation

Authentication state and Subject runtime state must remain visually and semantically distinguishable.

For a locked/unavailable-to-admin and non-running Subject state, retain the established Dormant/Locked character:

```text
same overall Home composition
Dynamic Island normally hidden
Subject presence becomes gray/white, faded, low-saturation
motion becomes slower and weaker
presentation communicates dormancy/non-running state rather than system failure
```

The UI MUST NOT imply that a dormant Subject is corrupted or failed merely because it is not running.

The exact lock input behavior, copy, unlock ceremony, and transitions are not frozen by T1; they must later follow Authentication and Subject lifecycle Specs.

## 10.7 Subject runtime presentation

The experience document MUST preserve the semantic distinction among at least:

```text
STOPPED
STARTING
READY / ACTIVE
DEGRADED
BLOCKED
STOPPING
FAILED
```

without requiring each state to have a unique animation or color in T1.

Key requirement:

```text
BLOCKED/STOPPED/LOCKED/FAILED are not interchangeable visual meanings.
```

Presentation must derive them from canonical read models rather than local inference.

## 10.8 Direct Management experience

Direct Management is a first-class deterministic product surface.

It MUST support the future ability to:

```text
inspect canonical resource state
inspect readiness/runtime state
inspect Subject state
inspect configuration
inspect model/provider binding
inspect operations/approvals/evidence
request governed actions
```

The document MUST NOT freeze a complete page tree or sidebar taxonomy.

Stable requirement:

```text
Direct Management remains usable without Operator Assistant.
```

Do not make the user ask AI to reach ordinary deterministic controls.

## 10.9 Operator Assistant experience

Freeze the Operator Assistant as a **system-level Siri-like assistant affordance** separate from the Subject and separate from the primary Dock navigation.

Its product interaction model has three capability classes:

### Explain

Read structured system state and answer questions such as:

```text
为什么 Subject 现在 BLOCKED？
现在使用哪个模型？
最近一次启动失败在哪里？
这个 Operation 为什么失败？
```

The assistant should use structured Read Models / Lineage / Evidence rather than treating log grep as the normal truth source.

### Navigate

Produce non-Authority `PresentationIntent`, for example:

```text
打开模型配置
带我查看这个 Operation
打开某个组件的诊断
```

Presentation resolves the intent into navigation/focus.

### Operate

For allowed system mutation:

```text
natural-language intent
→ SystemAction proposal
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ ManagementOperation
→ owning System Service
→ verification / Evidence
```

The assistant never gains hidden direct mutation privileges.

The product experience SHOULD show plan/impact/approval as structured product UI rather than presenting a shell transcript.

## 10.10 Operator Assistant security/Authority presentation

The experience MUST make these properties possible to communicate:

```text
assistant suggestion
planned change
approval required
operation running
operation succeeded/failed/uncertain
```

Do not require the user to infer Authority state from natural-language assistant phrasing.

The Operator Assistant MUST NOT expose as ordinary product capability:

```text
arbitrary shell
arbitrary SQL
raw filesystem mutation
raw secret plaintext
raw DBOS control
raw trust-root mutation
```

## 10.11 Authority handoff experience

When an intent crosses Authority planes, the Control Plane must represent it as a handoff, not silent execution.

Examples:

```text
Subject Chat asks for system change
→ surface System Authority handoff

Operator asks for Subject-governance change
→ surface Subject Authority handoff
```

T1 does not freeze the exact modal/card/transition visual.

## 10.12 Presentation reconnection

Browser/Desktop clients are projections.

Freeze:

```text
disconnect/reconnect
→ re-query canonical state
→ restore current presentation

missing a live event
≠ missing canonical truth
```

SSE/live channels may improve experience but cannot become the source of truth.

## 10.13 Desktop and Browser convergence

Freeze:

```text
one front-end product
different carriers

Browser carrier
Desktop carrier
→ same Product Host / same Management and Subject contracts
```

Desktop shell code cannot acquire hidden System Authority through preload/main-process shortcuts.

Platform-owned window behavior remains platform-owned:

```text
snapping
accessibility
fullscreen
DPI
window semantics
```

Application-owned chrome may coexist with those platform semantics.

---

# 11. Product writing quality constraints

The new Product documents MUST avoid known low-quality AI documentation patterns.

## 11.1 Do not write defensive non-claims

Avoid sentences whose only purpose is to say what the document is not claiming.

Bad:

```text
这并不意味着……
我们并不是说……
这里不是……
这不是为了……
```

unless the distinction is an actual product invariant such as Subject Authority vs System Authority.

Prefer direct positive specification.

## 11.2 Do not write imaginary rebuttals

Avoid repeated:

```text
不是 X，而是 Y
```

unless X and Y are genuinely confusable canonical entities whose separation is required by the project Constitution.

## 11.3 No development provenance

Current Product Authority must not contain:

```text
根据上一轮讨论
之前的设计
这一阶段
H3/H6 开发时
我们后来发现
本次修正
旧页面
旧方案
```

## 11.4 Information density

Each section must answer a durable product question.

Do not create decorative headings, motivational prose, filler conclusions, or repeated principle summaries.

## 11.5 Terminology

Use current canonical terminology consistently:

```text
Subject
Subject Chat
Operator Assistant
Control Plane
System Authority
Subject Authority
AuthorityHandoff
SystemAction
SystemChangePlan
ManagementOperation
PresentationIntent
Product Host
Management Contract
ManagementClient
```

Do not invent synonyms such as:

```text
AI soul
master agent
admin bot
brain process
control brain
system persona
```

---

# 12. `docs/INDEX.md` update

Change the Product routing entry so that Product knowledge starts at:

```text
docs/product/README.md
```

rather than routing directly to `product-goals.md`.

The Product row should continue to communicate that this area owns:

```text
product purpose
experience boundaries
research intent
current product shape
```

Do not expand the top-level index into a detailed Product table.

---

# 13. Roadmap reconciliation

Update:

```text
project/roadmap/development-roadmap.md
```

without rewriting completed Horizon history.

## 13.1 Fix self-invalidating repository baseline wording

The current Roadmap must stop describing the current repository by permanently pinning the document to its own pre-document-update HEAD.

Replace semantics equivalent to:

```text
The merged repository baseline is master at 51317428...
```

with a distinction between:

```text
currentRepositoryLocus: master after completed T0 reconciliation

H3ClosureMergeBaseline:
  PR: 32
  mergeCommit: 51317428a89b5545d3ac614f1012d869a1251203
```

The exact prose can differ.

The point is:

```text
current branch/locus
!=
historical H3 executable/merge baseline SHA
```

Do not insert the new T1 commit SHA as another supposedly timeless current baseline.

## 13.2 Preserve H3 closure

H3 remains:

```yaml
H3: CLOSED
H3_FUNCTIONAL: COMPLETE
H3_STABILIZATION: CLOSED
```

T1 must not reopen Foundation.

## 13.3 Replace the post-H3 entry section

Replace the current narrow:

```text
minimum Configuration
minimum Secret
minimum Network/Capability
→ Subject
```

entry description with the following product-entry logic.

### Post-H3 Product Entry

This is a bounded execution route across existing Horizons, not a new Horizon.

```text
T1 Product Authority convergence
        ↓
T2 H4-Min + H6 normative Spec freeze
        ↓
P1 Product Host + minimum Management spine
        ↓
P2 provider prerequisites
        ↓
P3 Subject Base + Messaging + Subject Chat
        ↓
P4 Reaction + Behavior Authority
        ↓
Q H6 real Product L4 slice
        ↓
bounded stabilization
```

The Roadmap MUST make clear that these labels are planning decomposition, not permanent architectural layer names.

## 13.4 Define H4-Min

Roadmap must define H4-Min as only the current consumers needed to enter real Product/H6 work.

### Provider prerequisites

```text
minimal Configuration ownership
minimal Secret ownership
minimal NetworkAccess policy boundary
AIRuntime/provider binding boundary
```

### Minimum Management spine

```text
canonical Management Contract boundary
minimum canonical Read Models needed by first Product Host
minimum SystemAction/System Authority semantics
ManagementClient boundary
loopback Management HTTP/OpenAPI projection as required by the first real Product Host
```

The minimum Management spine exists because Product Host, Subject lifecycle, provider/model inspection, and later Operator Assistant require a real System Authority boundary.

Management API is not merely a future Web backend.

## 13.5 Do not pull full H4 forward

Roadmap MUST explicitly keep these outside H4-Min unless T2 proves a hard current consumer:

```text
complete reference CLI command universe
complete Cedar policy surface
generic/full Approval feature surface
remote administration
all management resource families
Extension/package lifecycle management
backup/restore management
product update management
full H4 closure
```

This is not permission to bypass Authority.

If T2 exposes a system mutation through Management, it must preserve the Architecture invariant:

```text
request
→ normalize/validate
→ SystemChangePlan
→ Authentication / Authorization / Risk
→ Approval when required
→ durable/owned execution semantics as required
→ owning Service
→ verify
→ Evidence
```

T2 decides the minimum exact contract.

T1 MUST NOT invent an insecure "temporary direct mutation API".

## 13.6 H5 remains non-prerequisite for first-party Subject Base

Keep:

```text
full third-party Extension Package Manager
full package lifecycle
full H5 closure
```

out of the first Subject proof unless a concrete current hard edge is demonstrated.

Do not create Package Manager work because future providers/extensions might need it.

## 13.7 Operator Assistant and Presentation timing

Roadmap MUST recognize Operator Assistant and Control Plane Presentation as real product requirements.

However:

```text
full Operator Assistant implementation
full Browser/Desktop Presentation implementation
```

are NOT required to close the semantic H6 Subject Base proof.

Their implementation may begin once the relevant Management/Subject contracts are sufficiently concrete.

Recommended product evolution:

```text
Operator Assistant v0:
  Explain + Navigate

then:
  bounded Operate through SystemAction

Presentation:
  consume canonical Management/Subject contracts
  never define backend Authority
```

Do not make a full frontend a blocker for proving the H6 backend vertical slice.

## 13.8 H6 remains the minimal Subject proof

Preserve the H6 architectural test:

```text
one Subject
built-in Subject Chat
one real model provider
advanced cognition unavailable
message → cognition → committed behavior → Effect → response
```

Do not add Persona, Memory, Relationship, Attention, Diary, Dream, or external IM as H6 prerequisites.

---

# 14. Freeze the T2 normative Spec ownership map

T1 MUST add a concise post-H3 specification-ownership matrix to the Roadmap.

It freezes the intended normative owners for T2 but does NOT create the files.

Use these paths and responsibilities unless an existing current file path already owns the exact same contract:

| Intended Spec                               | Prefix  | Current-slice owner                                                                             |
| ------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `specs/system/configuration.md`             | `CFG`   | Configuration source/revision/activation semantics needed by current product/provider consumers |
| `specs/system/secret.md`                    | `SEC`   | SecretRef and current SecretService/backend semantics; no plaintext leakage                     |
| `specs/system/network-access.md`            | `NET`   | managed outbound network policy boundary required by real provider traffic                      |
| `specs/system/ai-runtime.md`                | `AIR`   | provider/model/profile/binding/invocation mechanics boundary                                    |
| `specs/management/system-authority.md`      | `MGMT`  | current Management Contract + Read Models + minimum SystemAction/System Authority semantics     |
| `specs/subject/subject-base.md`             | `SUBJ`  | Subject identity, Desired/Actual, authority revision, readiness prerequisites                   |
| `specs/messaging/messaging-subject-chat.md` | `MSG`   | canonical messaging facts and built-in Subject Chat path                                        |
| `specs/subject/reaction-behavior.md`        | `REACT` | current Reaction, BehaviorIntent, Review, Commit, Expression, silence/supersession semantics    |

T1 MUST NOT create one Spec per domain noun.

In particular, do not split T2 into separate Specs for:

```text
BehaviorIntent
Review
DecisionCommit
CommunicationCommit
Expression
ConversationMailbox
PresentationIntent
```

unless T2 finds a genuine independent semantic owner and current consumer.

## 14.1 Explicit T2 exclusions

The Roadmap ownership section MUST identify these as outside the immediate T2 freeze:

```text
Persona implementation
Memory implementation
Relationship implementation
Attention implementation
Advanced Observation Window implementation
Living State
Appraisal
Epistemic State
Commitments
Reflection
Diary
Dream
external IM Driver implementation
MCP implementation
full CapabilityBroker
full package lifecycle
backup/restore
product update
complete Presentation visual specification
```

This prevents T2 from silently becoming a whole-product architecture rewrite.

---

# 15. No dependency work in T1

T1 MUST NOT:

```text
search package registries for exact versions
update package catalog
install AI SDK
install provider SDK
install keyring
qualify Cedar
change Node/TypeScript/pnpm versions
```

Those are implementation-qualification tasks for the Plan that first consumes them.

Existing adopted dependency roles remain directives unless current evidence explicitly reopens them.

---

# 16. No Spec work in T1

Do not create or modify:

```text
specs/system/**
specs/management/**
specs/subject/**
specs/messaging/**
```

even though T1 freezes their intended ownership.

Reason:

```text
Product Authority
→ first
Normative contract freeze
→ next
Implementation
→ after
```

T1 acceptance is knowledge completeness for T2, not implementation-contract completeness.

---

# 17. No product prototype in T1

Do not create:

```text
Figma-like mock code
React components
HTML/CSS prototypes
Electron shell
frontend workspace
storybook
screenshots
SVG orb
animation prototype
API mocks
fake Management server
fake Subject Chat endpoint
```

Product shape documentation does not authorize implementation.

---

# 18. Required consistency audit

Before completion, perform a semantic audit across:

```text
docs/product/**
docs/architecture/system-architecture.md
docs/architecture/management-authority.md
docs/architecture/management-presentation.md
docs/architecture/subject.md
docs/architecture/messaging.md
project/roadmap/development-roadmap.md
```

Check at minimum:

### Authority

```text
Subject Chat → Subject Authority
Operator Assistant → System Authority proposal path
Direct Management → System Authority
Recovery → bounded Recovery Authority
```

### Product/runtime separation

```text
Subject != Model
Subject != Host
Subject != Operator Assistant
Presentation != Authority
Desktop shell != Host
```

### Management convergence

```text
one canonical Management Contract
one normal Host Management Server
no second Control Plane backend
no UI direct DB/filesystem mutation
```

### Subject Chat

```text
real built-in messaging protocol path
no Web → Reactor shortcut
```

### Presentation

```text
Browser/Desktop same front-end product, different carriers
client reconnect re-queries canonical state
```

### Roadmap

```text
H3 remains CLOSED
H4-Min recognized
full H4 not forced before H6
H5 not forced before H6
T2 Spec owners explicit
Product implementation not yet authorized
```

If the audit reveals a direct contradiction in Architecture, stop as `PLAN_GAP`.

Do not change Architecture under T1.

---

# 19. Verification

Use existing repository mechanisms only.

Do not create a new docs linter, Product validator, schema checker, or Plan checker.

Run the applicable existing checks for:

```text
documentation/knowledge routing
repository structure
current-tree hygiene
Markdown formatting
broken local links if an existing check owns them
git diff correctness
```

At minimum, use the current repository's canonical equivalents of:

```text
check knowledge/docs
check repository
check hygiene
format check
git diff --check
```

If the aggregate repository verification command is the existing canonical cheap gate for these document changes, it may be run.

No GitHub Actions run is required.

No product/platform qualification is required.

No AI/provider live call is required.

---

# 20. Acceptance criteria

T1 is complete only if all conditions are true.

```yaml
foundation:
  H3: CLOSED
  reopened: false
  executableMutation: false

productAuthority:
  README: PRESENT
  productGoals: PRESERVED
  productShape: PRESENT
  controlPlaneExperience: PRESENT

productShape:
  ProductHost: EXPLICIT
  persistentSubject: EXPLICIT
  ControlPlane: EXPLICIT
  SubjectChat: EXPLICIT
  DirectManagement: EXPLICIT
  OperatorAssistant: EXPLICIT
  SubjectVsSystemAuthority: EXPLICIT
  BrowserDesktopCarrierConvergence: EXPLICIT
  PresentationNonAuthority: EXPLICIT
  authVsSubjectLifecycleOrthogonality: EXPLICIT

controlPlaneExperience:
  HomeRestingSurface: EXPLICIT
  dynamicSubjectPresence: EXPLICIT
  narrowCenteredInput: EXPLICIT
  continuousConversationExpansion: EXPLICIT
  dockRecessionOnConversation: EXPLICIT
  dynamicIslandAttentionSemantics: EXPLICIT
  DormantLockedCharacter: EXPLICIT
  DirectManagementWithoutAI: EXPLICIT
  OperatorExplainNavigateOperate: EXPLICIT
  AuthorityHandoff: EXPLICIT

roadmap:
  selfInvalidatingCurrentHeadPin: REMOVED
  h3ClosureMergeBaseline: PRESERVED
  postH3ProductEntryRoute: EXPLICIT
  H4Min: EXPLICIT
  minimumManagementSpine: EXPLICIT
  fullH4RequiredBeforeH6: false
  fullH5RequiredBeforeH6: false
  operatorAndPresentationRecognizedAsProductRequirements: true
  T2SpecOwnershipMap: COMPLETE

forbiddenChanges:
  executableFilesChanged: false
  dependencyFilesChanged: false
  packageTopologyChanged: false
  normativeSpecsChanged: false
  architectureFilesChanged: false
  qualificationEvidenceChanged: false
  AGENTSChanged: false

quality:
  developmentProvenanceInCurrentProductDocs: NONE_KNOWN
  imaginaryCompatibilityClaims: NONE_KNOWN
  duplicateProductAuthorityTree: false
  repositoryKnowledgeChecks: PASS

plans:
  T1: COMPLETED
  activeFoundationPlan: NONE
  activeProductImplementationPlan: NONE
  T2: ELIGIBLE_NOT_AUTHORIZED
```

---

# 21. Completion procedure

When acceptance passes:

1. Move:

```text
project/plans/active/product/t1-product-authority-roadmap-convergence-2026-09-02.md
```

to:

```text
project/plans/completed/product/t1-product-authority-roadmap-convergence-2026-09-02.md
```

2. Change its state to:

```text
COMPLETED
```

3. Update `project/plans/INDEX.md`.

4. Leave no active Product implementation Plan.

5. Roadmap may state that the next eligible work is:

```text
T2 — H4-Min + H6 Normative Specification Freeze
```

but T1 MUST NOT create or activate T2.

6. STOP.

---

# 22. Completion report format

The executor's final report must contain:

```text
1. repository start/end commit or working-tree state;
2. files created;
3. files modified;
4. Product Authority established;
5. Roadmap decisions changed;
6. exact T2 Spec ownership map installed;
7. architecture contradictions found: yes/no;
8. executable/dependency/spec/package changes: must all be no;
9. verification commands and results;
10. T1 final state;
11. confirmation that T2 and product implementation were not started.
```

Do not append speculative recommendations for Foundation hardening.

Do not start dependency research.

Do not start UI implementation.

Do not begin T2.

---

# 23. Reopen conditions

After completion, T1 may be reopened only by current evidence that one of these is false:

```text
the accepted Product shape materially contradicts current project Charter/Constitution;
Subject and System Authority cannot be represented as documented;
Host/Presentation lifecycle assumptions contradict current Architecture;
Browser/Desktop carrier convergence becomes invalidated by an explicit accepted product decision;
the post-H3 sequence contains a demonstrated hard dependency cycle;
a Product document contains a material current product contradiction.
```

The following do NOT justify reopening T1:

```text
a different UI aesthetic is preferred;
a future feature is imagined;
a library offers a new abstraction;
an Agent wants more generic product taxonomy;
a future multi-Subject possibility appears interesting;
a frontend prototype would be easier with a different backend shortcut;
a completed H3 implementation could theoretically be made more robust.
```

---

# 24. Final STOP statement

Successful completion means:

```text
H3 / Foundation
= CLOSED

Product Authority
= CURRENT AND EXPLICIT

Post-H3 product-entry route
= DECIDED

T2 normative owners
= DECIDED

Normative Product Specs
= NOT YET WRITTEN

Product implementation
= NOT AUTHORIZED
```

At that point:

**STOP.**
