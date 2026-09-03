# Foundation integration

Foundation integration is repository-level qualification/composition code, not
a product package. It composes the Bootstrap, data, runtime, and execution
package boundaries needed for the asynchronous Foundation executable spine.

It proves current cross-package claims such as real PostgreSQL bootstrap and
Host handoff, RuntimeKernel composition, Signal/WorkQueue reconciliation,
DBOS durable dispatch and restart recovery, EffectOperation uncertainty, and
Lineage/Evidence persistence. The scenario files own assertions; shared
environment and process fixtures live under `support/` and `fixtures/`.

Fixtures are test-local and must not export production contracts or become a
production dependency/DI surface. Exact normative behavior remains in
`specs/`, while observed qualification status belongs in
`project/qualification/`.

The durable-work qualification is split by semantic owner across creation and
Signal, reconciliation, retry/cancel, integrity/lineage, DBOS recovery and
scheduling, and privilege boundaries. The scenario files retain the same
assertions and real-provider coverage; `support/durable-work-fixture.ts` only
shares test composition.
