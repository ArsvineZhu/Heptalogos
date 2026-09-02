# Machine Operations Plane

## 1. Purpose and boundary

The Machine Operations Plane is the independent operational trust and failure
domain used to inspect, repair, and maintain the machine or deployment around
a Heptalogos installation. Its implementation route is an external OpenClaw
runtime with Heptalogos operational tools and Skills where those integrations
are separately authorized.

It is outside normal Heptalogos Product Authority and outside the normal
Runtime Graph:

```
OpenClaw process / Gateway
!= Product Host child process
!= Heptalogos MicroSystem
!= Product Host System Service
!= Extension loaded into Product Host
!= Subject
```

OpenClaw Desired/Actual state is not modeled in RuntimeKernel, and Product
Host health is not a prerequisite for the Machine Operations Plane to remain
available.

Normal Heptalogos System Authority still owns canonical product state.
Machine-level authority does not make filesystem, database, service-manager,
or deployment state into Heptalogos domain facts automatically.

## 2. Independent lifecycle and failure domain

OpenClaw must be deployable as an independent process or service with
independent:

```
process lifecycle
state
configuration
credentials
model configuration
workspace
upgrade lifecycle
operational logs and state
```

A failed or non-booting Heptalogos Host must not imply that the machine
operator cannot inspect or repair the installation. Conversely, compromise of
the Machine Operations Plane can imply machine compromise; the plane is not a
magical security sandbox.

The default trust direction is:

```
OpenClaw
→ may manage or repair Heptalogos

Heptalogos Product Host
→ does not require privileged control of OpenClaw
```

The Host does not own OpenClaw administrator tokens, privileged UI
credentials, operator sessions, host-execution credentials, or OpenClaw state
directories by default. A future Host-to-OpenClaw privileged invocation would
be a separate security and product decision.

## 3. Operation hierarchy

Machine operations use the smallest available semantic boundary.

### Level 1 — Semantic Product Management

When the Host is healthy enough, prefer:

```
typed Heptalogos OpenClaw tools
Management API
ManagementClient
```

This preserves structured input/output, canonical Problems, resource and
operation identity, Lineage, Evidence, and less state guessing. Normal
Product Management mutations still pass through the owning Heptalogos
System/Domain Authority.

### Level 2 — Product CLI and diagnostics

Use the complete reference CLI, diagnostic exports, product logs, and bounded
recovery commands when the API is unavailable or the CLI is the clearer
contract. CLI remains a first-class headless product of this repository.

### Level 3 — Machine repair and break glass

Within the permissions deliberately granted to its OS/deployment principal,
the Machine Operations Plane may use:

```
shell
filesystem
Git
package manager
service/process manager
PostgreSQL tools
network diagnostics
repository editing and source repair
test/qualification commands
deployment files
```

These capabilities are intentional for machine maintenance. They do not
become ordinary Product Management endpoints and are not wrapped as invented
Heptalogos SystemAction records merely to make the authority model appear
universal. External machine actions enter Heptalogos Activity or Evidence
only when a real integration records them.

Generic machine operations that already have good shell or operating-system
mechanics should remain generic OpenClaw tool use. Create a typed Heptalogos
tool when a domain contract materially improves correctness or precision, for
example subject.inspect, runtime.graph, readiness.inspect,
configuration.inspect, operation.inspect, or lineage.query. Exact tool
schemas are future integration work, not this Architecture page.

## 4. Trust and credential separation

The deployment target has two distinct privilege profiles:

```
Product Management Plane
→ lower machine privilege
→ canonical Heptalogos product state

Machine Operations Plane
→ deliberately higher machine privilege
→ OS/deployment repair and administration
```

The normal Product Host should run under a dedicated low-privilege OS
principal and receive only resources required for product operation. It must
not require machine administrator/root privilege, OpenClaw Gateway admin
credentials, OpenClaw model/provider credentials, arbitrary service-manager
authority, repository-owner credentials, or unbounded host filesystem write
where an owned product mechanic does not genuinely require them.

Heptalogos Product Presentation and a System Assistant/Maintenance surface
may both use Heptalogos visual language, but they remain separate trust
surfaces. They use separate authentication context, session/cookie scope,
privileged credentials, and practical origin/security boundaries. A
low-privilege Presentation must not receive Machine Operations credentials;
visual embedding, iframe, preload, or hidden route shortcuts do not relax
this rule.

## 5. Skills and typed tools

Heptalogos operational knowledge is delivered through small, composable
OpenClaw Skills rather than one omniscient Skill. Future families may include
diagnosis, Subject operations, provider management, Host recovery, repository
repair, upgrade, and qualification.

Skills follow this operational doctrine:

```
Gather
→ understand current machine/product truth
Mutate
→ make the smallest justified change
Repair
→ recover discovered breakage when necessary
Prove
→ run the strongest applicable verification
Report
→ return exact evidence and state
```

Skills must not contain plaintext credentials. A typed tool is a thin
integration adapter over the canonical Management Contract, ManagementClient,
or CLI; it is not a second domain contract or Authority path.

The first Machine Operations implementation Plan must either create a focused
normative integration Spec or demonstrate that the external OpenClaw
contracts and repository operational documentation are sufficient. It must
not recreate an internal assistant runtime.

## 6. Recovery relationship

Internal Heptalogos Bootstrap/Recovery remains the bounded first-order
recovery path for normal product failures and substrate transitions. The
Machine Operations Plane provides an independent route for severe
installation, deployment, repository, service, database, or Host-not-booting
failures.

The existence of the external plane is a reason to avoid speculative
recursive self-healing. It is not a reason to remove the internal Recovery
Authority or to make normal recovery depend on OpenClaw.

## 7. Product identity and distribution

The user-facing product capability is named **System Assistant**. **Maintenance
Assistant** is a product label for higher-risk or break-glass contexts; it is
not a second runtime identity. OpenClaw is the implementation/dependency name,
not the ordinary Heptalogos navigation label, assistant title, or product
identity.

Current dependency Authority records the upstream OpenClaw license observation
and the fact that exact distribution qualification has not been performed.
When an exact OpenClaw release or commit is first bundled, downloaded,
modified, patched, or redistributed, the implementation/distribution Plan
must re-verify:

```
exact upstream release/commit
LICENSE and copyright notice
MIT permission notice
THIRD_PARTY_NOTICES
dependency license closure
redistribution files
upstream branding/trademark guidance
SBOM and license evidence
```

Required notices remain in the legal/dependency surfaces, including
third-party license pages, distribution manifests, SBOM, and license bundles.
No distribution may imply that OpenClaw Foundation endorses Heptalogos or that
Heptalogos owns the OpenClaw project. A current upstream observation is not a
permanent future licensing guarantee.
