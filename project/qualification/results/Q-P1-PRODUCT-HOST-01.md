# Q-P1-PRODUCT-HOST-01 Product Host and Management qualification

```yaml
qualificationId: Q-P1-PRODUCT-HOST-01
role: built headless Product Host, initial Management plane, generated client, and reference CLI
date: 2026-09-03
evidenceLevel: L3
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: PASSED
testedProperty: "Built Product Host composition, loopback Management contract, generated client, reference CLI, production bootstrap credentials, and Q1-Q8 process scenarios"
```

## Current observed evidence

```yaml
platform: Windows x64
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6 from HEPTALOGOS_TEST_PG_BIN
startingRepositoryHead: 0dcc79380d51db6bc5677b0740cb4175f0f460d0
selectedP1PackageVersions:
  fastify: 5.12.1
  "@fastify/swagger": 9.8.1
  "@fastify/rate-limit": 11.2.0
  "@hey-api/openapi-ts": 0.99.0
  "@oclif/core": 5.0.0
  "@inquirer/password": 5.2.0
  "@napi-rs/keyring": 2.0.0
builtHostExecutable: PASS
builtCliExecutable: PASS
productionBootstrapKeyProvider: PASS
nativeOsCredentialAdapter: PASS
productGenerationId: PASS
canonicalManagementSchema: PASS
managementHttpOpenApi: PASS
generatedManagementClient: PASS
referenceCliMachineMode: PASS
```

## Product Host scenarios

The real integration target launched the built `heptalogos-host` and built
`heptalogos` executables against an isolated installation and the repository's
explicit PostgreSQL 18.6 binary root.

```yaml
Q1_fresh_real_boot: PASS
Q2_claim_login_cli_read_models_logout: PASS
Q3_restart_identity_and_host_exclusion: PASS
Q4_hard_kill_stale_descriptor_replacement_and_graceful_shutdown: PASS
Q5_missing_bootstrap_credential_fails_closed: PASS
Q6_runtime_direct_DML_denied_and_host_fenced_management_path: PASS
Q7_route_schema_openapi_generated_client_chain: PASS
Q8_built_process_and_package_boundary: PASS
integrationTestFiles: 1
integrationTests: 4
```

The native keyring unit profile also exercised create, callback-scoped read,
replace, delete, and not-found normalization. Q3 exercised credential reuse
across a child-process Host restart, so the result is limited to this Windows
profile and does not imply another platform or an installed service profile.

## Current Management surface

```yaml
routes:
  discovery: GET /.well-known/heptalogos-management
  claim: POST /management/v1/bootstrap/claim
  login: POST /management/v1/session
  logout: DELETE /management/v1/session/current
  systemStatus: GET /management/v1/system/status
  host: GET /management/v1/host
  runtimeGraph: GET /management/v1/runtime/graph
  capabilityGraph: GET /management/v1/capabilities
  readiness: GET /management/v1/readiness
authentication: opaque server-side session token with Argon2id password verifier
rateLimiting: PASS
problemProjection: PASS
lineageAndEvidenceForCanonicalMutations: PASS
```

The single wire source is the Management route schema, projected by Fastify
OpenAPI and materialized by `@hey-api/openapi-ts`. The CLI reaches the Host
only through the local discovery adapter and generated client; it has no
database, RuntimeKernel, PostgreSQL, or HostOwnership import path.

## Intentionally unexecuted or out-of-scope properties

```yaml
linuxNativeKeyring: NOT_RUN
macosNativeKeyring: NOT_RUN
linuxProductHost: NOT_RUN
macosProductHost: NOT_RUN
sourceLessArtifact: NOT_RUN
installedServiceAccountAcl: NOT_RUN
hardwarePowerLoss: NOT_RUN
finalCrossPlatformCI: NOT_RUN
browserCookieProjection: NOT_RUN
liveSSEProjection: NOT_RUN
providerOrAIRuntime: NOT_RUN
SubjectOrMessaging: NOT_RUN
OpenClawIntegration: NOT_RUN
GUI: NOT_RUN
```

These statuses are not defects in the P1 slice and are not promoted by the
Windows process result. Ordinary GitHub Actions remain disabled under the
current execution policy and are not a P1 closure dependency.

## Authority boundary

This record reports the observed P1 implementation/product properties. The
dependency role decisions remain owned by
`project/qualification/dependency-status.json`, exact package pins by the
pnpm Catalog and lockfile, current sequencing by the Roadmap, and historical
execution by the completed P1 Plan. No GUI, OpenClaw integration,
ConfigurationService, SecretService, NetworkAccess, AIRuntime, Subject,
Messaging, Cedar runtime, or Approval runtime was implemented.
