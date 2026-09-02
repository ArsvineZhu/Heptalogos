# T1C — Post-T1 Product Boundary, Machine Operations & Distribution Authority Correction

**State:** `COMPLETED`<br>
**Mode:** `PRE_PRODUCTION`<br>
**Task class:** `PRODUCT_ARCHITECTURE_AUTHORITY_CORRECTION`<br>
**Current maturity:** `T1_COMPLETED / T2_NOT_YET_AUTHORIZED`<br>
**Executable mutation:** `FORBIDDEN`<br>
**Normative Spec mutation:** `FORBIDDEN`<br>
**Primary purpose:** correct Product/Architecture/Roadmap Authority before T2 freezes obsolete assumptions<br>
**Intended active path:** `project/plans/active/product/t1c-machine-operations-product-boundary-correction-2026-09-02.md`<br>
**Completion path:** `project/plans/completed/product/t1c-machine-operations-product-boundary-correction-2026-09-02.md`

---

# 0. Mission

T1 successfully established Product Authority, but several product/architecture assumptions were superseded immediately after T1 by explicit product decisions.

This Plan corrects those assumptions before any T2 normative implementation contract is authored.

The correction has four central decisions:

```text
1. This repository is a headless product/backend repository.
   It does NOT implement Browser/Desktop/other GUI products.

2. This repository MUST provide strong product-facing machine contracts:
   complete Management API coverage over administratively meaningful product capabilities,
   a complete reference CLI,
   Subject Chat backend/protocol surfaces,
   and Host-side read/query/projection surfaces required by real consumers.

3. A high-privilege System Assistant / Maintenance Assistant is NOT implemented
   as an internal Heptalogos agent runtime.
   Machine-level intelligent operations reuse an independent OpenClaw runtime,
   kept in a separate trust/failure domain.

4. OpenClaw is an implementation/distribution dependency, not the user-facing brand.
   Shipped user-visible terminology remains Heptalogos:
   "System Assistant" / "Maintenance Assistant".
   OpenClaw attribution remains in third-party/legal/developer surfaces.
```

This Plan MUST leave the repository ready for T2 without preserving contradictory assumptions such as:

```text
internal Operator Assistant runtime
Operator Service inside Product Host
Operator Assistant must never have shell
GUI implementation belongs in this repository
Host Management API is fixed before external Presentation development
CLI defines the complete shape of every future Presentation query
Heptalogos must itself be the machine-level AI security boundary
```

This task is a **knowledge-plane correction only**.

It does not implement OpenClaw, GUI, Management API, CLI, Subject, AI Runtime, or any new package.

When current Product/Architecture/Roadmap/Dependency Authority is coherent:

**STOP.**

---

# 1. Verified starting reality

At Plan authoring time, current `master` contains:

```text
cad6b12a180377ea1747fb25adc4b648409d9b43
docs: converge post-H3 product authority
```

T1 is completed and stored under:

```text
project/plans/completed/product/
  t1-product-authority-roadmap-convergence-2026-09-02.md
```

Current T1 Product Authority explicitly contains now-superseded assumptions, including:

```text
Operator Assistant = internal system assistant
Product Host exposes Operator Service endpoint
Operator Assistant is constrained to SystemAction proposal/delegation
Operator Assistant cannot use arbitrary shell / SQL / filesystem mutation
Browser/Desktop are described as product carriers without a clear repository-implementation split
```

The executor MUST verify the actual repository state rather than assuming the SHA above remains HEAD.

The semantic baseline required by this Plan is:

```yaml
T0: COMPLETED
T1: COMPLETED
H3: CLOSED
activeImplementationPlan: NONE
T2: NOT_STARTED
productCodeForPostH3: NOT_STARTED
```

A later legitimate documentation commit does not invalidate this Plan.

---

# 2. Current upstream OpenClaw evidence

This Plan adopts OpenClaw as the machine-operations agent runtime based on current upstream evidence and the explicit product decision.

At Plan authoring time:

```text
repository:
  openclaw/openclaw

default branch:
  main

license:
  MIT License
  Copyright (c) 2026 OpenClaw Foundation

license grants include:
  use
  copy
  modify
  merge
  publish
  distribute
  sublicense
  sell

redistribution condition:
  preserve copyright notice and MIT permission notice
  in copies or substantial portions

upstream LICENSE also references:
  THIRD_PARTY_NOTICES.md
```

OpenClaw also provides current extension mechanisms for:

```text
Skills
→ SKILL.md + supporting files

Plugins
→ tool/runtime extension capability

Gateway / Control UI
→ independent operational process and UI surface

host execution
→ machine-level tool execution controlled by OpenClaw's own policy/runtime
```

These facts authorize the architectural route, not an exact release artifact.

## 2.1 License freshness rule

Do NOT treat the current MIT observation as a permanent future guarantee.

The implementation/distribution Plan that first vendors, downloads, bundles, patches, or redistributes an exact OpenClaw version MUST re-verify:

```text
exact upstream commit/release
LICENSE
copyright notice
THIRD_PARTY_NOTICES
dependency license closure
redistribution files
upstream branding/trademark guidance if published
SBOM/license evidence
```

If the exact chosen upstream version has materially different licensing terms:

```text
STOP
→ role remains conceptually OpenClaw
→ distribution candidate requires explicit re-approval
```

Do not silently assume compatibility.

---

# 3. Governing mode

```yaml
mode: PRE_PRODUCTION

authorizedMutations:
  productAuthorityDocs: true
  architectureDocs: true
  architectureIndex: true
  roadmap: true
  projectCharterOrConstitutionWhenDirectlyContradicted: true
  dependencyRoleAuthority: true
  dependencyQualificationProjectionWhenItsRoleDecisionIsStale: true
  glossary: true
  planLifecycle: true

forbiddenMutations:
  executableCode: true
  packageTopology: true
  dependencyInstallation: true
  lockfile: true
  normativeSpecs: true
  databaseSchema: true
  OpenAPIArtifacts: true
  CLIImplementation: true
  GUIImplementation: true
  OpenClawVendoring: true
  OpenClawPatchset: true
  OpenClawSkillImplementation: true
  OpenClawToolImplementation: true
  qualificationClaimsNotActuallyExecuted: true

compatibility:
  epoch: PRE_PRODUCTION
  obligations: []
```

`PRE_PRODUCTION` means current incorrect names and obsolete internal architecture MUST be rewritten directly.

Do NOT preserve:

```text
OperatorAssistantV1
LegacyOperatorService
old Operator API compatibility
mode=operator compatibility endpoint
deprecated internal assistant path
```

There is no production consumer requiring compatibility.

Historical completed Plans remain historical evidence and are not rewritten merely to erase chronology.

---

# 4. Required reading before mutation

Read current versions of:

```text
AGENTS.md

project/governance/project-charter.md
project/governance/constitution.md
project/governance/pre-production-evolution.md

docs/INDEX.md
docs/product/README.md
docs/product/product-goals.md
docs/product/product-shape.md
docs/product/control-plane-experience.md

docs/architecture/README.md
docs/architecture/system-architecture.md
docs/architecture/authority-and-core-concepts.md
docs/architecture/management-authority.md
docs/architecture/management-presentation.md
docs/architecture/configuration.md
docs/architecture/execution-lineage.md
docs/architecture/foundation-services.md
docs/architecture/subject.md
docs/architecture/messaging.md

project/dependencies/README.md
project/qualification/dependency-status.json

project/roadmap/development-roadmap.md

project/plans/README.md
project/plans/INDEX.md
project/plans/completed/product/t1-product-authority-roadmap-convergence-2026-09-02.md

specs/INDEX.md
```

Also perform a current-tree search for:

```text
Operator Assistant
OperatorAssistant
Operator Chat
Operator Service
Operator API
PresentationIntent
arbitrary shell
operator.shell
Browser carrier
Desktop carrier
Electron
future Web
Web UI
GUI
```

Every current-authority occurrence MUST be classified.

Historical completed/superseded Plans generally remain unchanged.

---

# 5. Plan installation

The first repository mutation under this task MUST install this Plan under:

```text
project/plans/active/product/
  t1c-machine-operations-product-boundary-correction-2026-09-02.md
```

and update:

```text
project/plans/INDEX.md
```

so exactly one T1C Plan is active.

Do not activate T2 in parallel.

---

# 6. Frozen terminology

After this correction, use the following terminology.

## 6.1 Product-facing terms

```text
System Assistant
系统助手
```

is the default user-facing intelligent operations capability.

Where a higher-risk/break-glass context needs a distinct label, the product may use:

```text
Maintenance Assistant
维护助手
```

This is a presentation/product label, not a separate runtime identity.

Do NOT use `OpenClaw` as the ordinary assistant title, navigation label, home surface label, or Heptalogos product identity.

## 6.2 Architecture term

Use:

```text
Machine Operations Plane
```

for the high-privilege operational trust/failure domain outside normal Heptalogos Product Authority.

Its implementation route is:

```text
OpenClaw
+
Heptalogos operational tools
+
Heptalogos operational skills
```

## 6.3 Implementation/dependency term

`OpenClaw` is correct and required in:

```text
architecture implementation mapping
dependency ledger
distribution manifest
SBOM
third-party notices
license bundle
developer/operations documentation
upstream patch tracking
```

Do not hide the dependency from technical/legal truth.

## 6.4 Obsolete current term

`Operator Assistant` MUST NOT remain a canonical current product/runtime entity.

Where current documents need the product-facing concept, use:

```text
System Assistant
```

Where they mean external high-privilege operation, use:

```text
Machine Operations Plane
external machine operator
OpenClaw implementation
```

Historical Plans are not rewritten.

---

# 7. Repository product boundary

This repository has the following permanent product responsibility:

```text
Heptalogos repository
│
├─ Product Host
├─ canonical System Services
├─ Subject Runtime / Subject Authority
├─ Messaging / Subject Chat backend
├─ Configuration / Secret / Network / AI integration
├─ canonical Management Contract
├─ Management HTTP API / machine-readable schemas
├─ ManagementClient
├─ complete reference CLI
├─ read models
├─ query/projection surfaces
├─ operation/evidence/lineage diagnostics
├─ bounded Bootstrap / Recovery
├─ distribution integration required to ship the headless product
└─ OpenClaw integration assets when separately authorized
```

This repository MUST NOT implement:

```text
Browser application
Desktop application
Electron shell
mobile GUI
Home renderer
Dock
Dynamic Island
Subject Orb renderer
management dashboard pages
System Assistant visual shell
OpenClaw visual embedding shell
frontend component library
GUI E2E tests
visual regression assets
```

The absence of GUI code does NOT remove Product Authority for the desired user experience.

The Product docs may continue to define Home, Subject presence, System Assistant experience, and other product semantics as requirements consumed by the separate Presentation repository.

---

# 8. Presentation repository relationship

The separate Presentation repository is a **first-class product consumer**, not a passive afterthought.

The relationship is bidirectional at the requirement level:

```text
Heptalogos semantic/product capability
        ↓
formal Host contract
        ↓
Presentation implementation
        ↓
real product requirement discovers missing Host capability
        ↓
requirement returns to correct Heptalogos semantic owner
        ↓
Host contract evolves
```

This MUST NOT be described as:

```text
Host designs all APIs once
→ GUI must adapt forever
```

or:

```text
GUI owns backend semantics
→ Host adds arbitrary UI routes
```

The correct principle is:

> Presentation may drive new Host contract requirements, but Presentation may not acquire or redefine domain Authority.

---

# 9. Host contract evolution rule

The Management/product-facing contract is a **living product interface**.

It evolves as real consumers appear:

```text
CLI
external Presentation
automation
OpenClaw
tests
operations tooling
future integrations
```

## 9.1 Allowed UI-driven Host evolution

A concrete Presentation requirement may legitimately cause Host additions such as:

```text
new canonical Read Model
new aggregate query
new resource summary
new presentation-oriented projection
new live projection
new diagnostic query
new pagination/filter capability
new Subject Chat protocol capability
new action metadata
new resource identity metadata
```

when the data/semantics belong to Host-owned canonical services.

Example:

```text
Presentation needs a runtime topology graph
+
existing endpoints expose only disconnected resources
+
graph relationships are Host-owned semantics
→ Host may add RuntimeGraphReadModel / graph projection
```

Do not force the GUI to reconstruct Host-owned semantics client-side merely to avoid API evolution.

## 9.2 Disallowed UI-driven shortcuts

Reject requirements equivalent to:

```text
direct DB mutation
raw DBOS mutation
raw Secret backend reads
raw filesystem mutation through ordinary Product Management
UI-only hidden mutation endpoint
Desktop preload privilege bypass
route-specific duplicated business rules
unversioned private DTO becoming canonical truth
```

If a requirement implies a new domain semantic owner, it must return to Product/Architecture/Spec before implementation.

---

# 10. Management API target

T1 used the phrase `minimum Management spine` for immediate product-entry sequencing.

T1C MUST prevent that phrase from being interpreted as the final repository product requirement.

The permanent repository requirement is:

> Every administratively meaningful Heptalogos product capability must expose a complete, machine-consumable normal-management surface when that capability enters the product.

This includes, as the corresponding capabilities exist:

```text
status / health / readiness
runtime graph / capability graph
Subject lifecycle
provider/model binding
configuration
secret metadata and governed secret operations
network diagnostics
messaging/driver state
extensions/packages
operations
evidence/lineage
backup/restore
product update
diagnostics
contract/schema introspection
other administratively meaningful capabilities
```

"Complete" means complete relative to the currently implemented product capability set.

It does NOT mean predicting all future GUI needs before those needs exist.

---

# 11. Management API is not the machine security boundary

Normal Product Management remains governed Heptalogos product behavior.

However:

```text
Management API
!= operating-system security boundary
!= machine administrator authority
```

A machine administrator can always act below/around the product through OS-level tools.

T1C therefore narrows the old universal claim.

Correct:

> Normal product management mutations exposed by Heptalogos use canonical Heptalogos management/domain owners.

Incorrect:

> Every possible mutation of the installation or machine must pass through SystemAction.

The Machine Operations Plane intentionally exists outside that restriction for:

```text
break-glass repair
service repair
repository repair
dependency repair
Host-not-booting recovery
database tooling
filesystem diagnosis/repair
deployment repair
machine-level administration
```

Such operations remain accountable to the machine operator/OpenClaw security model and OS permissions, not to an invented claim that Heptalogos can enforce Authority over the whole operating system.

---

# 12. CLI target

CLI remains a first-class product of this repository.

Freeze:

```text
CLI
→ complete reference client for Heptalogos management semantics
→ headless operation
→ automation-friendly
```

CLI coverage should include every administratively meaningful management semantic.

However:

```text
CLI command coverage
!= every Presentation-only query/projection needs a one-to-one command
```

Presentation may need:

```text
dense aggregate read models
multi-resource projections
live UI summaries
presentation metadata
```

that are still legitimate Host interfaces but do not require a dedicated ergonomic CLI command.

CLI may expose generic raw/read/query forms where appropriate.

Do not let CLI ergonomics lock the Host API against legitimate Presentation consumers.

---

# 13. Machine Operations Plane

Create a new canonical Architecture owner:

```text
docs/architecture/machine-operations.md
```

It MUST define the following.

## 13.1 Externality

Machine Operations Plane is outside the normal Heptalogos Runtime Graph.

```text
OpenClaw process/Gateway
!= Product Host child process
!= Heptalogos MicroSystem
!= Extension loaded into Product Host
!= Subject
!= System Service
```

Do NOT model OpenClaw Desired/Actual state inside RuntimeKernel.

Do NOT require Host health to keep OpenClaw alive.

## 13.2 Independent failure domain

OpenClaw MUST be deployable as an independent process/service with independent:

```text
process lifecycle
state
configuration
credentials
model configuration
workspace
upgrade lifecycle
operational logs/state
```

A failed Heptalogos Host MUST NOT imply failed machine assistant availability.

The intended property is:

```text
Heptalogos catastrophically broken
→ Machine Operations Plane can still inspect/repair it
```

## 13.3 Preferred operation hierarchy

Freeze three operation levels.

### Level 1 — Semantic Product Management

Prefer:

```text
typed OpenClaw Heptalogos tools
Management API
ManagementClient
```

when Host is healthy enough.

Reason:

```text
structured input/output
canonical semantics
stable Problems
lineage/evidence
less state guessing
```

### Level 2 — Product CLI / diagnostics

Use:

```text
Heptalogos CLI
diagnostic exports
product logs
recovery commands
```

when API tools are unavailable or CLI is the simpler contract.

### Level 3 — Machine Repair / Break Glass

OpenClaw may use the machine-level capabilities granted to its OS/deployment principal, such as:

```text
shell
filesystem
Git
package manager
service/process manager
PostgreSQL tools
network diagnostics
repository editing
source repair
test/qualification commands
deployment files
```

This is intentional.

Do NOT impose the former internal Operator Assistant no-shell rule on the Machine Operations Plane.

## 13.4 No needless duplication

Do not create custom Heptalogos typed tools for generic machine operations already well represented by shell/tooling.

Examples that normally remain OpenClaw `exec`/generic-tool use:

```text
git status
git diff
pnpm verify
systemctl status
journalctl
ls
cat
grep
psql
process inspection
```

Create typed OpenClaw tools where Heptalogos domain semantics materially improve correctness:

```text
subject.inspect
runtime.graph
readiness.inspect
configuration.inspect
model-binding.inspect
operation.inspect
lineage.query
subject.start
subject.stop
```

Exact tools are a future integration Plan, not T1C implementation.

---

# 14. Trust-domain separation

T1C MUST establish the architectural target:

```text
Product Management Plane
→ lower machine privilege

Machine Operations Plane
→ higher machine privilege
```

The security benefit comes from **enforced trust-domain separation**, not from a claim that any project is intrinsically invulnerable.

## 14.1 Heptalogos low-privilege target

Normal Product Host should be deployable under a dedicated low-privilege OS principal.

It should receive only resources required for product function.

It MUST NOT require:

```text
machine administrator/root privilege
OpenClaw Gateway admin credential
OpenClaw state-directory access
OpenClaw model/provider credentials
arbitrary service-manager authority
repository owner/admin credential
unbounded host filesystem write
```

where not genuinely required by an owned product mechanic.

Exact OS/service ACL qualification belongs to later product qualification.

Do not claim this property PASS merely because T1C documents it.

## 14.2 OpenClaw high-privilege target

OpenClaw may deliberately run with substantially broader host privileges appropriate for machine maintenance.

This is a separate high-value security domain.

Compromise of that domain can imply machine compromise.

The Architecture MUST say this truthfully.

Do not document OpenClaw as a magical security sandbox.

---

# 15. Default trust direction

Freeze the default dependency direction:

```text
OpenClaw
→ may manage Heptalogos

Heptalogos
→ must not require privileged control of OpenClaw
```

Specifically, normal Heptalogos Product Host MUST NOT store or require:

```text
OpenClaw admin/Gateway token
OpenClaw privileged UI credential
OpenClaw operator session
OpenClaw host-execution credential
```

for normal product operation.

If a future feature proposes Host → OpenClaw privileged invocation, it is a new security/product decision and requires explicit Architecture/Spec authorization.

Do not smuggle such a credential through `SecretService` merely because a secret store exists.

---

# 16. Dual Web/Control surfaces

The product may ship two distinct web-based administrative surfaces:

```text
A. Heptalogos Product Presentation
   → product/Subject/direct-management permissions
   → consumes Heptalogos Host contracts

B. System Assistant / Maintenance surface
   → Machine Operations permissions
   → backed by OpenClaw
```

They MUST remain distinct trust domains even when both use Heptalogos visual branding.

Target separation includes:

```text
separate authentication context
separate session/cookie scope
separate privileged credentials
separate origin/security context where practical
no implicit SSO solely for visual convenience
no passing OpenClaw admin token through Heptalogos Host
no iframe/preload shortcut that exposes privileged token to low-privilege UI
```

Exact UI implementation belongs to the separate Presentation repository / OpenClaw integration workstream.

This repository only defines the trust/contract requirement.

---

# 17. System Assistant product branding

Current user-visible product terminology:

```text
System Assistant
系统助手
```

Advanced/break-glass wording may use:

```text
Maintenance Assistant
维护助手
```

Do not make the implementation provider the product identity.

Ordinary user-facing surfaces MUST NOT prominently brand the capability as:

```text
OpenClaw Assistant
Powered by OpenClaw
OpenClaw Control Center
OpenClaw Gateway
OpenClaw Edition
```

unless a future explicit product/brand decision reverses this rule.

OpenClaw is an implementation fact.

---

# 18. OpenClaw attribution and redistribution

Current upstream MIT terms permit modified redistribution if required notices are preserved.

Freeze the product/distribution requirement:

```text
OpenClaw may be bundled with Heptalogos.
OpenClaw may be modified/adapter-wrapped/rebranded at the ordinary product surface.
Required upstream copyright/license notices remain intact.
```

## 18.1 Required legal/technical surfaces

When OpenClaw is actually included in a distribution, its attribution MUST appear in appropriate places such as:

```text
About → Third-Party Software
Third-Party Licenses
distribution license bundle
SBOM
source/distribution manifest
developer dependency ledger
```

At minimum preserve the exact upstream-required:

```text
copyright notice
MIT permission notice
```

and propagate relevant upstream third-party notices.

## 18.2 No false brand claim

Do not represent:

```text
Heptalogos owns OpenClaw
OpenClaw Foundation officially endorses Heptalogos
Heptalogos is official OpenClaw
OpenClaw trademark belongs to Heptalogos
```

unless separately authorized by actual rights.

## 18.3 Normal product UI

Legal attribution does NOT require ordinary navigation or assistant identity to display upstream branding.

Therefore:

```text
ordinary product identity
→ Heptalogos System Assistant

legal/dependency identity
→ OpenClaw, MIT-licensed third-party component
```

---

# 19. Thin downstream OpenClaw policy

The intended integration is **upstream-first**, not a deep product fork.

Allowed future downstream work:

```text
Heptalogos default configuration
branding/presentation adaptation
Heptalogos typed tools
Heptalogos Skills
operations playbooks
distribution/service integration
small compatibility adapters
upstream-version patch carry when strictly required
```

Avoid reimplementing or deeply forking:

```text
agent loop
Gateway security
exec permission model
sandbox framework
session engine
tool authorization core
skill engine
model runtime
machine execution substrate
generic Control UI infrastructure
```

If a needed change is generally useful, prefer:

```text
upstream contribution
or
minimal isolated downstream patch
```

over permanent divergent fork architecture.

---

# 20. OpenClaw Skills strategy

T1C does not author Skills, but it MUST establish the future ownership principle.

Heptalogos operational knowledge should be delivered primarily through focused, composable Skills.

Do NOT create one enormous omniscient skill.

Preferred future families include:

```text
heptalogos-diagnose
heptalogos-subject-operations
heptalogos-provider-management
heptalogos-host-recovery
heptalogos-repository-repair
heptalogos-upgrade
heptalogos-qualification
```

Each Skill should be small enough to own a workflow.

A useful operational doctrine is:

```text
Gather
→ understand current machine/product truth

Mutate
→ make the smallest justified change

Repair
→ recover discovered breakage when necessary

Prove
→ run the strongest applicable verification

Report
→ return exact evidence/state
```

Skills MUST NOT contain plaintext credentials.

They may reference supporting scripts/references where OpenClaw supports them.

---

# 21. Typed OpenClaw Tools strategy

T1C does not implement tools.

Freeze the future rule:

> Create a typed OpenClaw tool when a Heptalogos domain contract is materially safer or more precise than generic shell interaction.

Preferred architecture:

```text
OpenClaw tool
→ typed Heptalogos integration adapter
→ ManagementClient / API
→ canonical Host owner
```

Tool output should preserve:

```text
structured Problems
resource identity
operation identity
activity/lineage refs
machine-readable state
```

Do NOT define tool schema as a second independent domain contract.

Tool input/output derives from or thinly maps the canonical Management Contract.

---

# 22. Internal Recovery remains

Do NOT delete bounded Heptalogos Recovery merely because OpenClaw exists.

Keep the distinction:

```text
normal product failure
→ internal Bootstrap/Recovery where designed

severe installation/deployment/repository failure
→ Machine Operations Plane may intervene
```

The availability of OpenClaw is a reason to avoid speculative recursive self-healing, not a reason to remove first-order product recovery.

---

# 23. SystemAction / Policy / Approval correction

The old Architecture made Operator Assistant a major reason for universal:

```text
SystemAction
→ Cedar Policy
→ Approval
→ ManagementOperation
```

T1C MUST remove that dependency.

## 23.1 Keep normal semantic ownership

Normal management mutation still requires an explicit owning product/domain contract.

Do not allow:

```text
Fastify route owns business rule
CLI parser owns mutation
GUI owns mutation
```

## 23.2 Do not make external machine administration pretend to be SystemAction

OpenClaw Level-3 machine repair is explicitly outside normal Product System Authority.

It may:

```text
repair files
repair repository
use OS/service tools
repair dependencies
```

without being wrapped as a fake `SystemAction`.

## 23.3 Cedar/Approval are not justified solely by System Assistant

T1C MUST change current Authority so that:

```text
Cedar PolicyService
generic durable ApprovalService
AI-specific approval framework
```

are NOT unconditional prerequisites merely because a System Assistant exists.

T2 MUST decide the minimum normal Management authentication/authorization/risk/approval semantics from actual current product consumers.

This correction does NOT delete all future Policy/Approval concepts.

It deletes the inference:

```text
there is an AI operator
→ therefore Heptalogos must build a universal AI security/policy/approval substrate
```

## 23.4 Mandatory normal Management security still exists

Do not weaken ordinary Product Management security.

The Management interface still requires appropriate:

```text
authentication
authorization
session/credential protection
endpoint exposure policy
origin/CSRF controls where applicable
redaction
audit/evidence
rate/admission controls where applicable
```

Exact mechanisms belong to T2 Specs and implementation qualification.

---

# 24. Product document corrections

## 24.1 `docs/product/product-goals.md`

Rewrite only the now-obsolete System Assistant sections.

Preserve the Subject research thesis.

Replace the current product distinction:

```text
Operator Chat
→ internal system intelligent assistant
```

with a product distinction equivalent to:

```text
Subject interaction
→ Subject Authority

Direct Product Management
→ Heptalogos System Authority

System Assistant / Maintenance Assistant
→ separate Machine Operations capability
→ may use normal Management API/CLI when available
→ may use broader machine-level operations when repairing the system
```

Remove the current section whose thesis is:

```text
系统智能助手不是 LLM + Shell
```

That statement is no longer current product truth.

Replace it with a direct positive statement:

> The System Assistant is a high-capability machine operations experience backed by an independent operations runtime. It should prefer structured Heptalogos management contracts when the product is healthy, while retaining machine-level repair capability when those contracts are unavailable.

Do not mention OpenClaw prominently in Product Goals unless a short implementation note is genuinely necessary.

## 24.2 `docs/product/product-shape.md`

Correct:

```text
Presentation clients/carriers
Browser/Desktop implementation ownership
three administrator entries
internal Operator Assistant
Operator Service endpoint
all assistant mutation through System Authority
```

Required product shape:

```text
Installation
├─ Product Host
├─ persistent Subject
├─ headless Management/API/CLI product surface
├─ external Presentation clients
├─ Machine Operations integration
└─ Bootstrap / Recovery
```

The document MUST state that GUI products live outside this repository.

It may still describe the overall Heptalogos product as including external Presentation experiences.

Replace the three-entry model with a clearer four-path model:

```text
Subject Chat
→ Subject Authority

Direct Management
→ Heptalogos System Authority

System Assistant
→ Machine Operations Plane
→ prefers Management API/CLI when available
→ retains machine-level repair authority outside Product Authority

Bootstrap / Recovery
→ bounded internal Recovery Authority
```

Remove `Operator Service endpoint` from Product Host shape.

## 24.3 `docs/product/control-plane-experience.md`

Preserve:

```text
Home
Subject Orb
resting state
continuous conversation expansion
Dynamic Island
Dock
Dormant/Locked character
Direct Management
```

These remain valid Product experience requirements for the external Presentation repository.

Correct implementation ownership:

```text
this repository does not implement those GUI surfaces
```

Replace `Operator Assistant` terminology with `System Assistant`.

Correct the System Assistant experience:

```text
normal operations
→ structured management/product tools preferred

advanced maintenance
→ may expose broader machine operations
```

Do NOT state that the System Assistant itself is forbidden from shell/filesystem/SQL at the machine-operations level.

Instead state that ordinary low-privilege Heptalogos Presentation MUST NOT receive Machine Operations credentials.

Add explicit dual-trust-surface semantics.

Do not freeze exact OpenClaw visual design.

## 24.4 `docs/product/README.md`

Update document summaries if they currently describe `Operator Assistant` as a Heptalogos internal management surface.

Use `System Assistant` and external Machine Operations wording.

---

# 25. Architecture corrections

## 25.1 Create `docs/architecture/machine-operations.md`

This is the canonical owner for Sections 13–21 of this Plan.

It MUST cover:

```text
purpose
external trust/failure domain
OpenClaw implementation route
independent lifecycle
preferred API/CLI path
break-glass machine path
trust direction
credential separation
dual web/control surfaces
skills/tools integration
branding vs implementation identity
redistribution/licensing boundary
relationship to internal Recovery
```

Keep it conceptual.

Do not copy OpenClaw manuals into the repository.

## 25.2 `docs/architecture/management-authority.md`

Retitle or rewrite its focus to:

```text
System Authority / Management Authority
```

Remove Operator Assistant as an internal System Authority feature.

Remove:

```text
Operator Delegation as a required principal model
viaAgent=OperatorAssistant as permanent core requirement
mutating action via Operator Assistant → mandatory Approval
Operator Assistant no-shell architecture
Operator Assistant self-modification semantics
PresentationIntent as a Host requirement justified by internal assistant
```

Preserve valid normal Management concepts only where they remain independently justified.

Add a boundary link to `machine-operations.md`.

State explicitly:

```text
System Authority governs normal Heptalogos management.
Machine Operations can act outside normal Product Authority at the OS/deployment layer.
```

## 25.3 `docs/architecture/management-presentation.md`

Correct the top-level projection model.

Target:

```text
Domain / System Service
        ↓
canonical Management Contract
        ├─ ManagementClient
        ├─ CLI
        ├─ HTTP API
        ├─ automation
        ├─ OpenClaw typed tools
        └─ external Presentation repository
```

Remove `Operator Service endpoint`.

Replace the current Section 8 Subject Chat vs Operator API model.

There is no required Heptalogos `Operator Service`.

Add:

```text
System Assistant integration
→ external OpenClaw/Gateway surface
→ may consume Management API/CLI
```

Rewrite GUI section to say:

```text
no GUI implementation in this repository
external Presentation is a first-class consumer
Presentation may drive new Host projections/contracts
```

Preserve full Management API and CLI requirements.

Correct compatibility wording for PRE_PRODUCTION:

```text
contractVersion / compatibility descriptors can exist for explicit client negotiation,
but development history does not create legacy support obligations.
Breaking changes may be coordinated across current consumers.
```

Do not promise indefinite backward compatibility.

## 25.4 `docs/architecture/system-architecture.md`

Add Machine Operations Plane outside normal Product Host.

Remove any depiction of Operator Assistant as Product Host internal Feature/Application.

Ensure:

```text
OpenClaw independent
Product Host independent
external Presentation independent
```

## 25.5 `docs/architecture/authority-and-core-concepts.md`

Replace `Subject != Operator Assistant` with current terminology.

Add:

```text
Subject != System Assistant
System Authority != Machine/Deployment Authority
```

Clarify that Machine/Deployment Authority is outside the normal Heptalogos product authority graph.

Do not force machine repair actions into SystemAction semantics.

## 25.6 `docs/architecture/configuration.md`

Replace `Operator Assistant readable projection` with neutral/current consumer language:

```text
Management API
CLI
external Presentation
machine operations consumer where authorized
```

Do not add OpenClaw-specific config to Heptalogos Configuration ownership.

OpenClaw config remains OpenClaw-owned unless an explicit future integration contract says otherwise.

## 25.7 `docs/architecture/execution-lineage.md`

Replace "Operator Assistant first queries lineage" with:

```text
CLI / Management clients / machine operations agents may query structured lineage
```

OpenClaw may use lineage when Host is healthy.

Machine-level break-glass actions outside Host lineage are not falsely claimed as canonical Heptalogos Activity unless a real integration records them.

## 25.8 `docs/architecture/foundation-services.md`

Replace Operator-specific consumers with:

```text
Management API
CLI
external Presentation
machine operations agents/tools
```

Do not add OpenClaw as a Foundation Service.

## 25.9 `docs/architecture/subject.md`

Replace stale identity comparison terminology where needed:

```text
Subject != System Assistant
```

No other Subject semantics should change.

## 25.10 `docs/architecture/README.md`

Route readers to the new Machine Operations document.

Do not create a second architecture index hierarchy.

---

# 26. Governance corrections

## 26.1 `project/governance/project-charter.md`

The current invariant:

```text
Proposal != Authority.
Model output, retrieval, tools, extensions, and assistants propose;
explicit commit paths mutate canonical truth.
```

is too broad once a machine-level external operations agent deliberately has OS authority.

Scope it to **Heptalogos canonical product truth**.

Recommended semantic form:

> Within Heptalogos Product Authority, model output, retrieval, tools and extensions do not become canonical truth without the owning commit path. External machine/deployment operators are outside this product Authority boundary and may perform explicit maintenance actions at the OS/deployment layer.

Preserve the research invariant.

Do not weaken Subject Authority.

Also correct:

```text
Presentation is projection
```

so CLI is not casually grouped as a visual Presentation implementation if that wording causes confusion.

CLI is a management client.

## 26.2 `project/governance/constitution.md`

Search for `Operator Assistant` and any universal "assistant can only propose" wording.

Rewrite current standing invariants to the same scoped model.

Do not add a long OpenClaw manual to Constitution.

Constitution should only retain the permanent boundary:

```text
Product Authority
!=
Machine/Deployment Authority
```

---

# 27. Dependency authority correction

The project currently contains an `operator.shell` role decision rejecting arbitrary shell because it bypasses the internal Operator SystemAction/Policy/Approval design.

That rationale is stale.

T1C MUST classify and correct it.

Do NOT simply change:

```text
operator.shell = ADOPTED
```

because Heptalogos Product Host still does not gain arbitrary shell as a normal management capability.

Instead distinguish:

```text
normal Product Management arbitrary shell
→ NOT A PRODUCT MANAGEMENT CAPABILITY

Machine Operations agent runtime
→ OpenClaw
→ ADOPTED external operational route
→ may use host execution according to OpenClaw/OS policy
```

The dependency authority should gain a role equivalent to:

```text
role:
  machine-operations.agent-runtime

selected:
  OpenClaw

decision:
  ADOPTED_EXTERNAL

ownership:
  external independent operational runtime

not:
  Host package
  Product Host child process
  Heptalogos System Service
```

Do not pin an exact OpenClaw version in T1C.

Exact release/commit selection belongs to the first implementation/distribution integration Plan.

If `dependency-status.json` is the current machine-readable role projection, update it consistently without inventing qualification PASS.

Possible qualification state:

```text
roleDecision: ADOPTED
implementationQualification: NOT_RUN
distributionQualification: NOT_RUN
```

Use the repository's actual schema.

Do not invent unsupported fields.

---

# 28. Roadmap correction

Update `project/roadmap/development-roadmap.md`.

## 28.1 Preserve H3 closure

No Foundation reopening.

```yaml
H3: CLOSED
H3_STABILIZATION: CLOSED
```

## 28.2 T1C before T2

Current next sequence becomes:

```text
T1 Product Authority convergence          COMPLETED
        ↓
T1C Product/Machine-Operations correction NEXT/CURRENT
        ↓
T2 H4-Min + H6 normative Spec freeze
```

When T1C completes:

```text
T1C = COMPLETED
T2 = ELIGIBLE_NOT_AUTHORIZED
```

## 28.3 Repository implementation boundary

Roadmap MUST explicitly state:

```text
this repository does not implement GUI/Web/Desktop Presentation applications
```

but:

```text
external Presentation requirements may create new Host/API/read-model work
```

## 28.4 Management target versus sequencing

Roadmap MUST distinguish:

```text
immediate implementation slice
vs
permanent product requirement
```

Permanent requirement:

```text
complete headless Management API over current administratively meaningful capabilities
complete reference CLI
```

Immediate H6 prerequisite may still be a bounded initial implementation slice.

Do not require every future H4 management resource before first H6 Subject proof.

Do not describe that bounded slice as the final Management scope.

## 28.5 Machine Operations workstream

Add a parallel product/operations workstream.

Conceptual sequence:

```text
O0  authority correction (T1C)
        ↓
O1  OpenClaw integration baseline
    - exact upstream qualification
    - independent service/process integration
    - trust/credential separation
    - first Heptalogos operational Skill
    - first typed Management tool where useful
        ↓
O2  operational tool/Skill expansion
    grows with Management/API and product capabilities
        ↓
OD  distribution/branding/license closure
    before shipping bundle
```

These are roadmap decomposition labels, not permanent architecture layer names.

O1 MUST NOT block first H6 semantic Subject proof unless a concrete current dependency requires it.

## 28.6 Remove internal Operator implementation milestones

Delete/defer as obsolete product obligations:

```text
internal Operator Assistant model runtime
Operator Chat backend
Operator Service
Operator AI SDK tool adapter
Operator session persistence
Operator-specific SystemAction adapter
internal assistant readiness profile
internal assistant prompt/runtime framework
```

Do not preserve them for hypothetical compatibility.

---

# 29. T2 ownership map after correction

T1C MUST leave T2 with the following core normative owners.

Exact existing paths should be reused if a current owner already exists.

```text
Configuration
Secret
NetworkAccess
AIRuntime

Management / System Authority
  - normal Management Contract
  - HTTP/OpenAPI projection
  - ManagementClient
  - current authentication/authorization boundary
  - CLI contract expectations
  - SystemAction semantics only to the extent current consumers require

Subject Base

Messaging / Subject Chat

Reaction / Behavior Authority
```

T2 MUST NOT include:

```text
internal Operator Assistant runtime Spec
Operator Chat Spec
internal assistant tool loop
AI-agent approval framework solely for Operator
OpenClaw runtime reimplementation
GUI implementation Spec
Electron implementation
```

## 29.1 Machine Operations normative owner

Do not force exact OpenClaw plugin/Skill contracts into H4-Min/H6 T2 if no implementation begins there.

The future first Machine Operations implementation Plan MUST either:

```text
create a focused normative integration Spec
```

or prove that existing external OpenClaw contracts + repository operational docs are sufficient.

It may not invent an internal Operator Assistant as a substitute.

---

# 30. Product interface evolution and PRE_PRODUCTION compatibility

External Presentation is a real consumer, so contracts require discipline.

But current mode remains PRE_PRODUCTION.

Freeze:

```text
formal schema/version identity
machine-readable Problems
client/server contract negotiation where useful
generated/typed clients where useful
```

without creating historical compatibility burden.

Allowed during PRE_PRODUCTION:

```text
change endpoint
change schema
change contract version
update Presentation repo concurrently
update CLI concurrently
update OpenClaw tools concurrently
delete obsolete route
```

Not automatically required:

```text
v1 legacy endpoint
deprecated alias
dual schema reader
upcaster
compatibility shim
old generated client support
```

Compatibility obligations exist only when declared by the project's machine-readable compatibility authority.

---

# 31. Branding correction in current documentation

Perform a scoped current-authority search for:

```text
OpenClaw
Operator Assistant
System Assistant
Maintenance Assistant
Powered by
OpenClaw Edition
```

Rules:

```text
Product docs
→ use System Assistant / Maintenance Assistant
→ mention OpenClaw only in a restrained implementation/distribution note if needed

Architecture/dependency docs
→ OpenClaw name is correct and required where implementation is discussed

normal user-facing wording examples
→ never use OpenClaw as primary product identity

legal/distribution docs
→ use exact OpenClaw attribution
```

Do not perform deceptive attribution removal.

---

# 32. Do not implement UI under T1C

Even though Product docs describe GUI experience, T1C MUST NOT create:

```text
apps/web
apps/desktop
ui/
frontend/
electron/
react/
vue/
svelte/
css
html product shell
SVG assets
Orb implementation
Dock
Dynamic Island
OpenClaw Control UI patch
```

No UI dependency may be installed.

The external Presentation repository will consume these requirements later.

---

# 33. Do not implement OpenClaw under T1C

No:

```text
git submodule
vendored source
npm dependency
binary download
service definition
Gateway config
branding patch
OpenClaw plugin
OpenClaw Skill
OpenClaw Tool
OpenClaw credential
```

T1C only establishes current Authority and future implementation ownership.

---

# 34. Current-authority residue audit

Search all living/current Authority.

At minimum classify occurrences in:

```text
docs/product/**
docs/architecture/**
project/governance/**
project/dependencies/**
project/qualification/dependency-status.json
project/roadmap/**
specs/INDEX.md
```

Historical locations:

```text
project/plans/completed/**
project/plans/superseded/**
Git history
```

may preserve old Operator Assistant chronology.

A current statement such as:

```text
Operator Assistant cannot use arbitrary shell
```

is stale if it claims the new System Assistant/Machine Operations implementation.

A historical completed T1 Plan saying that was the approved T1 decision is historical truth and remains.

---

# 35. Required consistency model after T1C

The repository must converge on this model:

```text
                    ┌─────────────────────────────┐
                    │       Product intent        │
                    └──────────────┬──────────────┘
                                   │
            ┌──────────────────────┴──────────────────────┐
            │                                             │
            ▼                                             ▼
┌─────────────────────────┐                  ┌──────────────────────────┐
│ Heptalogos Product Host │                  │ Machine Operations Plane │
│                         │                  │                          │
│ low machine privilege   │                  │ independent OpenClaw     │
│ canonical product state │                  │ higher machine privilege │
│ Subject/System services │                  │ repair/operations agent  │
│ Management API          │◄─────────────────│ API/CLI preferred        │
│ CLI                     │                  │ shell/OS break-glass     │
│ Subject Chat            │                  │                          │
└────────────┬────────────┘                  └──────────────────────────┘
             │
             │ formal product contracts
             ▼
┌─────────────────────────┐
│ External Presentation   │
│ repository              │
│                         │
│ Home / Subject UI       │
│ Direct Management UI    │
│ System Assistant UI     │
└─────────────────────────┘
```

Important:

```text
External Presentation
→ may drive new Host contract requirements

OpenClaw
→ may manage/repair Heptalogos

Heptalogos Host
→ does not own privileged OpenClaw control credentials by default
```

---

# 36. Verification

Use existing repository verification only.

No new checker is authorized.

Run the applicable current commands for:

```text
docs/knowledge routing
repository consistency
Markdown formatting
link/reference checks
JSON parse/validation for dependency-status if touched
hygiene
git diff --check
```

If the canonical aggregate verification command is cheap for docs-only changes, run it.

Do not run:

```text
OpenClaw live installation
OpenClaw security qualification
Management API tests
GUI tests
AI provider tests
cross-platform product qualification
```

No such implementation exists under T1C.

---

# 37. Acceptance criteria

T1C is complete only when all are true.

```yaml
startingTruth:
  T1: COMPLETED
  H3: CLOSED

productAuthority:
  canonicalAssistantName: System Assistant
  internalOperatorAssistantRuntimeRequired: false
  MachineOperationsPlaneRecognized: true
  GUIProductExperienceRetained: true
  guiImplementationOwnedByThisRepo: false
  externalPresentationFirstClassConsumer: true

repositoryBoundary:
  ProductHostHeadless: true
  ManagementAPIRequired: true
  CompleteReferenceCLIRequired: true
  BrowserAppImplementation: false
  DesktopAppImplementation: false

interfaceEvolution:
  presentationMayDriveHostRequirements: true
  presentationMayOwnDomainAuthority: false
  managementContractFrozenForeverBeforeUI: false
  presentationProjectionAllowed: true

machineOperations:
  implementationRoute: OpenClaw
  independentProcessDomain: true
  independentStateConfigCredentials: true
  HostChildProcess: false
  HostMicroSystem: false
  HostNormalDependency: false
  apiCliPreferredWhenHealthy: true
  machineBreakGlassAllowed: true
  normalProductArbitraryShellAdded: false

trust:
  HeptalogosLowPrivilegeTarget: explicit
  OpenClawHigherPrivilegeTarget: explicit
  OpenClawCredentialStoredByHostByDefault: false
  dualSurfaceCredentialSeparation: explicit

branding:
  userFacingOpenClawBrandRequired: false
  systemAssistantBrand: Heptalogos
  thirdPartyAttributionRequired: true
  falseEndorsementClaim: false

license:
  currentOpenClawMITObserved: true
  exactDistributionCandidateRevalidationRequired: true
  copyrightNoticePreservedWhenDistributed: true
  permissionNoticePreservedWhenDistributed: true
  upstreamThirdPartyNoticesHandled: true

architecture:
  machineOperationsDoc: PRESENT
  managementAuthorityInternalOperatorModelRemoved: true
  managementPresentationOperatorServiceRemoved: true
  systemArchitectureExternalMachinePlane: explicit
  subjectVsAssistantIdentity: current
  policyApprovalNoLongerJustifiedSolelyByAssistant: true

roadmap:
  T1: COMPLETED
  T1C: COMPLETED
  T2: ELIGIBLE_NOT_AUTHORIZED
  fullGUIImplementationInRepo: false
  OpenClawIntegrationWorkstream: PRESENT
  internalOperatorImplementationWorkstream: REMOVED
  permanentManagementTarget: COMPLETE_HEADLESS_SURFACE
  initialH6ManagementSliceMayRemainBounded: true

dependencies:
  staleInternalOperatorShellRationaleCorrected: true
  machineOperationsAgentRoute: OPENCLAW
  exactOpenClawVersionPinned: false
  OpenClawImplementationQualificationFabricated: false

forbidden:
  executableFilesChanged: false
  specsChanged: false
  packageTopologyChanged: false
  lockfileChanged: false
  OpenClawVendored: false
  OpenClawSkillImplemented: false
  GUIImplemented: false

quality:
  currentAuthorityContradictionKnown: false
  PRE_PRODUCTIONLegacyBridgeAdded: false
  repositoryChecks: PASS
```

---

# 38. Plan completion

When acceptance passes:

1. Move:

```text
project/plans/active/product/
  t1c-machine-operations-product-boundary-correction-2026-09-02.md
```

to:

```text
project/plans/completed/product/
  t1c-machine-operations-product-boundary-correction-2026-09-02.md
```

2. Mark `COMPLETED`.

3. Update `project/plans/INDEX.md`.

4. Leave no active Product implementation Plan.

5. Roadmap may state:

```text
T2 — H4-Min + H6 Normative Specification Freeze
ELIGIBLE
```

6. Do NOT create T2.

7. Do NOT install OpenClaw.

8. Do NOT start GUI work.

9. STOP.

---

# 39. Completion report

The Coding Agent final report must state:

```text
1. starting repository state;
2. files created;
3. files modified;
4. Product terminology correction performed;
5. GUI repository boundary established;
6. Management API/CLI permanent target established;
7. Presentation-driven Host interface evolution rule established;
8. Machine Operations/OpenClaw boundary established;
9. trust/credential separation established;
10. branding/licensing redistribution rule established;
11. stale Operator Assistant assumptions removed from current Authority;
12. dependency role correction performed;
13. Roadmap correction performed;
14. verification commands/results;
15. confirmation that no code/Specs/dependencies/UI/OpenClaw implementation began;
16. T1C final state;
17. T2 eligibility state.
```

Do not append a new implementation plan.

---

# 40. Reopen conditions

T1C may be reopened only if current evidence proves a material contradiction in one of these decisions:

```text
the repository must itself ship/own a GUI executable;
OpenClaw cannot legally be redistributed under the chosen exact upstream candidate;
OpenClaw cannot operate independently from Heptalogos in the required deployment model;
a concrete product requirement requires privileged Host → OpenClaw trust;
Management API/CLI cannot serve as the normal semantic operation path;
Machine Operations separation makes required product recovery impossible;
the separate Presentation repository cannot consume/evolve Host contracts as designed.
```

The following do NOT justify reopening:

```text
OpenClaw releases a new minor version;
a new UI needs another read model;
a new CLI command is needed;
a Skill needs refinement;
an OpenClaw upstream patch changes internal file layout;
a new branding asset is desired;
a future API contract changes during PRE_PRODUCTION;
a Coding Agent prefers an internal assistant abstraction.
```

These are normal evolution.

---

# 41. Final STOP statement

Successful completion means:

```text
T1
= COMPLETED

T1C
= COMPLETED

Heptalogos repository
= HEADLESS PRODUCT HOST + COMPLETE MANAGEMENT TARGET + CLI + SUBJECT BACKEND

GUI implementations
= EXTERNAL PRESENTATION REPOSITORY

System Assistant product identity
= HEPTALOGOS

Machine Operations runtime
= INDEPENDENT OPENCLAW ROUTE

OpenClaw user-facing brand
= NOT ORDINARY PRODUCT IDENTITY

OpenClaw legal/dependency attribution
= PRESERVED

T2
= ELIGIBLE, NOT STARTED

OpenClaw integration implementation
= NOT STARTED

GUI implementation
= NOT STARTED
```

At that point:

**STOP.**
