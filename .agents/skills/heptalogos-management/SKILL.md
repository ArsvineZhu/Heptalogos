---
name: heptalogos-management
description: Use when changing Heptalogos System Authority, Policy, Approval, SystemAction/SystemChangePlan, ManagementOperation, administrator authentication/session flows, Management API, CLI/Web management projections, or the Operator Assistant.
---

# Heptalogos Management

## Authority route

Corpus root: `../../../Architecture_Corpus/`  
Route index: `../../heptalogos/corpus-routes.json`

Read first:

- [System Authority and Operator Assistant](../../../Architecture_Corpus/11-System-Authority与Operator-Assistant.md)
- [Interfaces / CLI / Web / Presentation](../../../Architecture_Corpus/18-接口-CLI-Web与Presentation.md)
- [S05 Policy / Approval / Management / Operator](../../../Architecture_Corpus/specs/S05-Policy-Approval-Management-Operator.md)
- [S14 Canonical end-to-end flows](../../../Architecture_Corpus/specs/S14-Canonical-End-to-End-Flows.md)
- [S15 Cross-cutting contracts](../../../Architecture_Corpus/specs/S15-Foundation横切合同.md)

## Procedure

1. Identify principal, acting principal, authority, action, resource, context, and owner.
2. Keep Subject Authority and System Authority separate. Authority handoff may transfer intent/context references, never implicit authority.
3. Define one typed SystemAction/Management contract and project it to Web, CLI, and Operator Assistant. Presentation clients do not gain a second mutation path.
4. Separate authorization from approval. Approval must bind to normalized arguments and the concrete SystemChangePlan/risk context; changed plans require new approval.
5. Let the model propose actions only. The server deterministically validates schema, authorizes, verifies approval/auth freshness/plan identity, and invokes the owning service.
6. Operator Assistant must not receive arbitrary shell, SQL, raw configuration-file mutation, extension-file mutation, or unrestricted Secret plaintext access.
7. Consequential ManagementOperation execution must survive browser/model/session interruption when the operation semantics require durability.
8. Project canonical `Problem` identities to HTTP/CLI/human text; transport-specific status or prose is not machine identity.

Use the configuration route for credentials/secrets, runtime route for durable operations/restart behavior, and lineage route when audit/Evidence behavior changes.

## Completion

CLI, Web, and Operator Assistant must remain projections of the same System Authority and owning services, with no presentation-only bypass.
