[**heptalogos**](../../../README.md)

---

[heptalogos](../../../README.md) / [execution-lineage/dist](../README.md) / BootstrapHandoffProjection

# Interface: BootstrapHandoffProjection

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:32

Projects Bootstrap journal evidence into a retained Activity draft.

## Properties

### draft

> `readonly` **draft**: [`BootstrapRetainedActivityDraft`](BootstrapRetainedActivityDraft.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:39

INCOMPLETE is deliberately represented as a bounded FAILED draft if a
caller elects to retain the historical fact. The explicit status keeps
it from being mistaken for a successful handoff.

---

### status

> `readonly` **status**: [`BootstrapHandoffStatus`](../type-aliases/BootstrapHandoffStatus.md)

Defined in: packages/execution-lineage/dist/bootstrap-handoff.d.ts:33
