# P2 — Configuration Surface Catch-Up

**State:** COMPLETED  
**Authorized specification:** `tmp/heptalogos-next-spec-pack-2026-09-04/P2-configuration-surface-catch-up.md`  
**Repository baseline:** `43821da4caaa8b0f77c2712494bd636c7306d0c2`  
**Change class:** current Product configuration realization  
**Compatibility:** none; repository is `PRE_PRODUCTION`

## Result

The current Product composition now supplies owner-owned typed
`ConfigurationDefinition` values to a generic `ConfigurationService`. The
historical gateway-only validator and activation lookup were removed.

The realized definitions are:

- `ai.gateway.transport.v1`, owned by NetworkAccess and consumed by the real
  gateway transport/AIRuntime path;
- `subject.expression.v1`, Subject-scoped with an explicit Product default of
  `maxOutputTokens: 256`, consumed by the real Expression invocation; and
- `management.http.admission.v1`, installation-scoped with bounded body and
  claim/login admission values consumed by the Product Host Fastify app.

Subject WorkQueue and DBOS timing/concurrency values remain explicit mechanics
owned by WorkQueue/DBOS or the Product Host composition. P2 did not create a
fake editable configuration surface without a current Product consumer.
Bootstrap and private-runtime inputs remain Bootstrap-owned.

First materialization pins the Subject and HTTP Product defaults as managed
revisions and activations. Management and the reference CLI use the existing
plan/execute path for definition lookup, validation, immutable revision
creation, activation impact, and expected-active CAS. Secret material remains
outside configuration values.

## Executed evidence

All evidence below is scoped to the current Windows process and real private
PostgreSQL environment. It is not source-less, cross-platform, installed
service, or live-provider evidence.

```text
pnpm exec nx run configuration:build --skip-nx-cache                  PASS
pnpm exec nx run network-access:build --skip-nx-cache                PASS
pnpm exec nx run subject:build --skip-nx-cache                        PASS
pnpm exec nx run product-host:build --skip-nx-cache                   PASS
pnpm exec nx run canonical-schema:test --skip-nx-cache                PASS
pnpm exec nx run configuration:test --skip-nx-cache                   PASS
pnpm exec nx run network-access:test --skip-nx-cache                  PASS
pnpm exec nx run management:test --skip-nx-cache                      PASS
pnpm exec nx run product-host:test --skip-nx-cache                    PASS
pnpm exec nx run management-client:generate --skip-nx-cache           PASS
pnpm exec nx run product-host-integration:test --skip-nx-cache        PASS
git diff --check                                                       PASS
```

The real Product Host integration executed 12 tests across the built Host,
real private PostgreSQL, DBOS, WorkQueue/Signal, Management/CLI, and Subject
Chat path. The focused configuration scenario proved:

```yaml
definition_registration_and_default_materialization: PASS
gateway_transport_real_consumer: PASS
subject_expression_default_256_real_invocation: PASS
subject_expression_active_revision_128_real_invocation: PASS
invalid_revision_rejected_before_activation: PASS
stale_activation_cas_preserves_active_revision: PASS
http_admission_definition_and_default_materialization: PASS
management_and_cli_canonical_path: PASS
secret_plaintext_in_configuration: PASS
```

The loopback AI fixture remains a controlled OpenAI-compatible test boundary;
live external-provider qualification is `NOT_RUN`. Cross-platform, source-less,
service-account, and release-form qualification remain `NOT_RUN`. The P1
prepared-inbound stale-authority seam and post-outbound/pre-WorkItem-completion
crash seam remain carried verification debt and are not upgraded by this P2
record.
