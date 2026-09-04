# P0 — Current-Truth Documentation Semantic Correction

**State:** COMPLETED
**Intended state:** first successor Plan to activate
**Change class:** canonical documentation/spec correction only
**Code changes:** none except generated/index artifacts already owned by the docs workflow
**Purpose:** remove the current Chatbot-centric Subject interpretation before further implementation

## 1. Problem statement

Current canonical documents correctly say `Subject != Model`, `Subject != System Assistant`, and `CognitiveOpportunity` does not imply a reply. However current L4 Reaction/Behavior material presents this spine too close to final Subject behavior authority:

```text
MessageFact
→ ConversationMailbox
→ Reaction
→ BehaviorIntent(REPLY | SILENCE)
→ DecisionCommit
→ CommunicationCommit
→ Expression
→ outbound MessageFact
```

That bounded L4 vertical slice has leaked into the conceptual model.

Approved current truth:

1. Subject is a persistent world-facing cognitive/social subject.
2. Messaging is one observation and communication channel among other world interfaces.
3. A new MessageFact can create a cognition opportunity; it does not impose a mandatory binary global decision `REPLY | SILENCE`.
4. When a cognition episode considers a particular communication opportunity, producing no communication is a legitimate completion result.
5. No-communication is not a heavyweight global Subject behavior entity.
6. Once the Subject decides to communicate with a person, semantic communication must be separated from final human-facing language realization.
7. `CommunicationCommit → Expression` is therefore a valuable semantic seam and remains.
8. General ActionPlan/world-action machinery remains future work and is not created merely to fix the ontology.
9. Subject and System Assistant both use OpenClaw, but in different runtime/trust roles.

## 2. Required context

Read current versions before editing:

```text
AGENTS.md
project/governance/constitution.md
project/roadmap/development-roadmap.md

docs/architecture/authority-and-core-concepts.md
docs/architecture/subject.md
docs/architecture/machine-operations.md
docs/architecture/management-authority.md
docs/architecture/configuration.md
docs/architecture/platform-distribution.md
docs/architecture/messaging.md
docs/reference/glossary.md
docs/architecture/INDEX.md

specs/subject/subject-base.md
specs/subject/reaction-behavior.md
specs/system/configuration.md
specs/system/ai-runtime.md
specs/management/system-authority.md

packages/product/subject/README.md
packages/product/subject/src/contracts.ts
packages/product/subject/src/service.ts
packages/application/product-host/README.md
```

Code is read only to ensure docs describe implementation status truthfully. Do not perform P1 code changes in P0.

## 3. Canonical decisions to encode

### 3.1 Subject is world-facing

Add an explicit distinction:

```text
Observation source != Conversation != Messaging
```

A Subject may observe or act through Messaging, web/network information services, external applications/capabilities, files/resources when authorized, Machine Operations handoff when appropriate, future sensors/providers, and internal Subject-owned state.

Do not create a `World` mega-object, universal event bus, or generic Observation store.

### 3.2 Current L4 is a bounded conversation vertical slice

Rewrite every current-truth statement that can be read as:

```text
Subject behavior = REPLY | SILENCE
```

into:

```text
Current L4 conversation-triggered cognition slice
= bounded proof of message → cognition → optional communication → expression
```

The current implementation may temporarily remain narrower until P1. Documentation must mark that implementation lag explicitly rather than calling the narrow shape the final Subject ontology.

### 3.3 No-communication semantics

Refine Constitution/Architecture language so the invariant is:

> Subject does not owe a message for every Observation. A considered communication opportunity may legitimately complete without producing a CommunicationCommit or outbound message.

Keep distinctions such as NotObserved, Deferred, policy-suppressed, unable, and deliberately-no-communication where analytically useful, but do not require all of them to be canonical durable states in the current implementation.

Do not require a model-generated free-text reason for silence.

### 3.4 Communication and Expression

Define:

```text
Communication decision
= whether to communicate, to whom, for what semantic purpose/content

CommunicationCommit
= durable canonical authorization/obligation for an already accepted communication

Expression
= human-facing linguistic/social realization of committed semantic content
```

Expression may adjust wording, register, politeness, interpersonal tone, brevity, organization, punctuation, emoji/platform style.

Expression must not change recipient, communicate/no-communicate decision, material facts/commitments, SystemAction, consequential external action, permission, or Authority.

### 3.5 DecisionCommit status

The current generic-looking `DecisionCommit` is not retained as a timeless global Subject decision primitive merely because L4 created it.

Document that P1 will review/remove the current conversation-specific DecisionCommit and move required accepted-communication provenance into CommunicationCommit.

Do **not** replace it with a prematurely specified generic ActionPlan/Decision framework.

### 3.6 Dual OpenClaw roles

Create one concise canonical owner for the role separation. A dedicated `docs/architecture/openclaw-runtime-boundaries.md` is justified if it avoids duplication; otherwise place one canonical section and reference it.

Normative role table:

| Dimension                | Subject OpenClaw Runtime                                                    | System Assistant / Machine Operations OpenClaw        |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| Purpose                  | Subject cognition/agent-loop mechanics                                      | machine/deployment inspection, repair, maintenance    |
| Authority                | none by itself; proposals/tools remain bounded by Subject/Product Authority | external Machine/Deployment Authority                 |
| Machine privilege        | low/minimum                                                                 | deliberately higher                                   |
| Lifecycle                | Product-supervised replaceable runtime                                      | independent of Product Host                           |
| Host health prerequisite | normally integrated with Product runtime                                    | must remain usable while Host is unhealthy            |
| State/config/workspace   | Subject-runtime-specific                                                    | Operations-specific                                   |
| Credentials              | Subject/model/tool credentials only                                         | operator/machine credentials                          |
| Messaging channels       | Heptalogos Messaging remains canonical Product channel owner                | operator channels only where independently configured |
| Product identity         | implementation detail, not Subject identity                                 | implementation detail behind System Assistant label   |

Current rule:

```text
same OpenClaw software
!= same Gateway
!= same agent fleet
!= same state root
!= same credentials
!= same authority
```

For the current implementation target, require two distinct OpenClaw runtime instances/profiles/processes. Do not use “two agents in one Gateway” as the trust boundary.

### 3.7 Subject OpenClaw lifecycle target

Document the P3 route:

```text
Product Host
→ supervises one replaceable Subject OpenClaw Gateway child
→ communicates through public Gateway protocol/client
→ never reads OpenClaw private SQLite/state files
```

OpenClaw is runtime mechanics. It does not own canonical Subject identity, Persona, Memory, Relationship, CommunicationCommit, or MessageFact.

OpenClaw session/workspace state may assist runtime continuity, but loss/recreation of provider-private state must not define loss of Subject identity.

### 3.8 Machine Operations distribution correction

Update `machine-operations.md` so “external independent runtime” means independent lifecycle/trust, not “must never be shipped in the same Heptalogos distribution”.

```text
may be distributed together
!= launched together
!= same trust domain
!= Host child
```

Do not implement bundling mechanics in P0.

### 3.9 Configuration implication

Encode:

- Subject OpenClaw behavior that Heptalogos intentionally controls belongs to typed Product Configuration or SecretService as appropriate.
- OpenClaw provider-private runtime state/config may be a generated/provider projection; it is not a second editable Product Authority.
- Machine Operations OpenClaw configuration is owned by the independent operations plane and is not silently imported into normal ConfigurationService.

## 4. Required file edits

### `project/governance/constitution.md`

- Preserve C1.
- Refine C4 so identical implementation technology does not collapse Subject/System/Machine Authority.
- Rewrite C6 as optional communication rather than a global Silence ontology.
- Preserve Proposal != Authority.
- Add no new procedural governance.

### `docs/architecture/authority-and-core-concepts.md`

- Remove `Subject accepted behavior -> DecisionCommit` as timeless generic Authority.
- Keep `Communication semantics -> CommunicationCommit`.
- Mark generic `ActionPlan` as future semantic work.
- Replace Current L4 spine with corrected communication slice.
- Add dual OpenClaw non-equivalence.

### `docs/architecture/subject.md`

Add/rewrite sections for world-facing Subject, Observation vs Messaging, CognitiveOpportunity, current conversation L4 boundary, optional communication, CommunicationCommit, Expression, Subject OpenClaw runtime role, and future general action semantics.

### `docs/architecture/machine-operations.md`

- Keep Machine Operations trust boundary.
- Clarify this page owns the high-privilege OpenClaw role only.
- Contrast it explicitly with Subject OpenClaw runtime.
- Allow same-distribution packaging without shared runtime state/privilege.

### `specs/subject/reaction-behavior.md`

Rewrite normative target for P1:

```text
ConversationMailbox
→ Reaction
→ current conversation cognition proposal
   ├─ NO_COMMUNICATION → complete
   └─ COMMUNICATE
        → deterministic Review
        → CommunicationCommit
        → Expression
        → outbound MessageFact
```

Remove normative requirement for SILENCE DecisionCommit.

### `project/roadmap/development-roadmap.md`

Correct L4 description and add immediate Product Reality Convergence sequence:

```text
documentation semantic correction
→ current communication-spine correction
→ configuration catch-up
→ Subject OpenClaw runtime integration
→ source-less portable product reality
→ first real IM / Observation Window research
```

This remains sequencing guidance, not a rigid waterfall.

### Configuration/distribution/glossary/index pages

Update only necessary current-truth entries and links. Do not create a new documentation family where an existing owner already exists.

## 5. Explicit non-goals

P0 MUST NOT change TypeScript implementation, add OpenClaw dependencies, add generic Observation persistence, implement ActionPlan/tools/System Assistant/external IM/Memory/Persona/Relationship, create compatibility language for the current wrong model, or add a document-review gate/linter.

## 6. Acceptance

P0 is complete when:

1. no canonical current-truth document presents `REPLY | SILENCE` as total Subject behavior space;
2. no canonical document implies Subject and System Assistant are the same because both use OpenClaw;
3. separate Subject/OpenClaw and Machine-Operations/OpenClaw runtime roles are explicit;
4. `CommunicationCommit → Expression` is retained and correctly owned;
5. no-communication is a legitimate local outcome without requiring heavyweight durable Silence machinery;
6. docs explicitly mark P1/P3 implementation lag where code still reflects the older shape;
7. Roadmap reflects the corrected immediate sequence;
8. existing documentation verification passes if one already exists.

Do not create a new gate solely for this correction.

## 7. STOP boundary

After documentation correction is committed and current-truth indexes are updated, mark P0 complete and STOP. Do not begin P1 under the same active Plan.

## 8. Completion record

**Completed:** 2026-09-04
**Repository baseline:** 9b9ffc9 (the exact pre-change branch HEAD)
**Scope result:** P0 documentation/spec correction only; no TypeScript, SQL, OpenClaw dependency, or runtime implementation changes.

**Verification:**

- PASS pnpm check:knowledge
- PASS pnpm check:repository
- PASS pnpm check:agents
- PASS pnpm format:check
- PASS pnpm check:static
- PASS pnpm verify
- PASS git diff --check

**Evidence boundary:** These checks prove repository documentation/static/code-health correctness for this checkout. They do not claim P1 implementation, Subject OpenClaw runtime integration, live OpenClaw/provider behavior, source-less packaging, cross-platform qualification, or external IM qualification; those remain successor-plan work or NOT_RUN.

**Successor boundary:** P1–P4 remain inactive successor specs. P0 is complete and execution stops here.
