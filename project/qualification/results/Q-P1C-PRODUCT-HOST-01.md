# Q-P1C-PRODUCT-HOST-01 Product Host closure-correction qualification

```yaml
qualificationId: Q-P1C-PRODUCT-HOST-01
role: P1 post-implementation closure correction
date: 2026-09-03
evidenceLevel: L3
evidenceStatus: PASS
qualificationState: PARTIAL
roleDecision: ADOPTED
implementationQualification: REQUIRED
testedProperty: "Build-carried generation identity, live first-claim maintenance, current Management contracts, truthful readiness, public surfaces, OpenAPI ownership, and P1 regression"
```

## Scope and evidence boundary

The qualification ran against the P1C working tree based on implementation
commit `bcb5a2ba65ba929f39373da9781ddd3248936741`. The result proves the
corrected repository/build/process behavior on the exercised Windows profile;
it does not prove a source-less release artifact or another operating system.

```yaml
platform: Windows x64
runtime: Node 24.20.0
packageManager: pnpm 11.24.0
postgres: PostgreSQL 18.6 from HEPTALOGOS_TEST_PG_BIN
nativeKeyring: Windows OS credential store
ordinaryGitHubActions: DISABLED_CURRENT_EXECUTION_POLICY
```

## Corrected properties

```yaml
productRuntimeRepoScan: false
bootstrapConstantGeneration: false
productBuildIdentity: PASS
bootstrapBuildIdentity: PASS
repositoryCwdRequired: false
liveFirstClaimRotation: PASS
restartRequiredAfterExpiry: false
genericSchedulerAdded: false
systemActionTypesAndSchemas: PASS
systemActionRuntime: false
readModelEnvelope: PASS
optionalLineageForStatelessRead: PASS
artificialActivityPerPoll: false
problemCategory: PASS
problemRetryClass: PASS
runtimeGraphTypedSchemas: PASS
capabilityGraphTypedSchemas: PASS
unsafeRuntimeAdapterCast: false
managementServiceRunningDerived: true
runtimeKernelActiveDerived: true
hardcodedReadiness: false
productHostAuthorityInternalsPublic: false
managementMechanicsPublic: false
openApiOwner: PRODUCT_HOST
openApiArtifact: PASS
managementClientProductHostGenerationImport: false
managementClientGeneratedWildcardRoot: false
managementClientPublicTransport: false
```

## Focused P1C scenarios

```yaml
Q-C1_builtHostOutsideRepositoryCwd: PASS
Q-C2_buildIdentityDeterminism: PASS
Q-C3_claimRotationWithoutRestart: PASS
Q-C4_systemActionContractSurface: PASS
Q-C5_readModelEnvelope: PASS
Q-C6_problemSemantics: PASS
Q-C7_generatedGraphTypes: PASS
Q-C8_publicSurfaces: PASS
Q-C9_openApiGenerationDirection: PASS
Q-C10_readinessTruth: PASS
Q-C11_P1Regression: PASS
```

Evidence sources:

- `pnpm nx run product-host:test --skip-nx-cache`: 5 files, 10 tests passed;
  includes build-identity determinism, controlled claim rotation/retry and
  Fastify rate-limit Problem projection.
- `pnpm nx run management:test --skip-nx-cache`: 1 file, 6 tests passed;
  includes claim expiry replacement, envelopes, readiness derivation, and
  SystemAction schema validation.
- `pnpm nx run management-client:test --skip-nx-cache`: 1 file, 3 tests passed;
  includes stable facade and typed graph consumer checks.
- `pnpm nx run runtime-kernel:test --skip-nx-cache`: 5 files, 130 tests passed.
- `pnpm nx run repository:check:product-artifacts --skip-nx-cache`: build
  identity, ProductHost OpenAPI, and ManagementClient drift checks passed.
- `pnpm nx run product-host-integration:test --skip-nx-cache` with explicit
  PostgreSQL and native-keyring environment: 2 files, 9 tests passed. The
  built Host ran with a temporary working directory outside the repository and
  covered claim/login/logout, envelope reads, restart, stale descriptor
  replacement, credential failure, Host-fenced ACLs, Problem semantics, and
  generated-client boundaries.

The original `Q-P1-PRODUCT-HOST-01` record remains historical P1 evidence for
the pre-correction implementation. It is not deleted or rewritten.

## Intentionally unexecuted properties

```yaml
sourceLessReleaseArtifact: NOT_RUN
releaseProductHost: NOT_RUN
installedServiceHeadless: NOT_RUN
serviceAccountAcl: NOT_RUN
linuxProductHost: NOT_RUN
macosProductHost: NOT_RUN
finalCrossPlatformCI: NOT_RUN
browserPresentation: NOT_RUN
liveSSEProjection: NOT_RUN
providerOrAIRuntime: NOT_RUN
SubjectOrMessaging: NOT_RUN
OpenClawIntegration: NOT_RUN
hardwarePowerLoss: NOT_RUN
```

The intentionally unexecuted release-form, source-less, service, platform,
and live-provider properties remain `NOT_RUN`. Release-form qualification is
required before making the corresponding shipping/runtime claim; it does not
block independent Provider prerequisite semantic development or independent
OpenClaw Machine Operations work. This record owns only the observed P1C
properties and does not define long-term development sequencing or authorize
later work; the current Roadmap owns that sequence.
