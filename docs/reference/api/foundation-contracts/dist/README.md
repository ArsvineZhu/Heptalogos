[**heptalogos**](../../README.md)

---

[heptalogos](../../README.md) / foundation-contracts/dist

# foundation-contracts/dist

Public shared Foundation vocabulary for canonical values, identities,
lifecycle roots, Problems, and data governance without runtime side effects.

## Classes

- [ProblemError](classes/ProblemError.md)

## Interfaces

- [CanonicalJsonSnapshot](interfaces/CanonicalJsonSnapshot.md)
- [FieldError](interfaces/FieldError.md)
- [Problem](interfaces/Problem.md)
- [Sha256Digest](interfaces/Sha256Digest.md)

## Type Aliases

- [ActivityId](type-aliases/ActivityId.md)
- [Branded](type-aliases/Branded.md)
- [CanonicalJsonValue](type-aliases/CanonicalJsonValue.md)
- [CapabilityId](type-aliases/CapabilityId.md)
- [ContentDigest](type-aliases/ContentDigest.md)
- [ContinuityEpochId](type-aliases/ContinuityEpochId.md)
- [ContributionId](type-aliases/ContributionId.md)
- [EvidenceId](type-aliases/EvidenceId.md)
- [HostOwnershipToken](type-aliases/HostOwnershipToken.md)
- [InstallationId](type-aliases/InstallationId.md)
- [InstanceId](type-aliases/InstanceId.md)
- [Instant](type-aliases/Instant.md)
- [LifecycleRootId](type-aliases/LifecycleRootId.md)
- [MicroSystemId](type-aliases/MicroSystemId.md)
- [MicroSystemInstanceId](type-aliases/MicroSystemInstanceId.md)
- [NamespacedId](type-aliases/NamespacedId.md)
- [PackageGenerationId](type-aliases/PackageGenerationId.md)
- [ProblemInit](type-aliases/ProblemInit.md)
- [ProviderId](type-aliases/ProviderId.md)
- [RetentionClass](type-aliases/RetentionClass.md)
- [RetryClass](type-aliases/RetryClass.md)
- [Sensitivity](type-aliases/Sensitivity.md)
- [ServiceId](type-aliases/ServiceId.md)
- [UuidV7Id](type-aliases/UuidV7Id.md)
- [WorkItemId](type-aliases/WorkItemId.md)

## Variables

- [createActivityId](variables/createActivityId.md)
- [createBootId](variables/createBootId.md)
- [createCapabilityId](variables/createCapabilityId.md)
- [createContinuityEpochId](variables/createContinuityEpochId.md)
- [createContributionId](variables/createContributionId.md)
- [createEvidenceId](variables/createEvidenceId.md)
- [createHostOwnershipToken](variables/createHostOwnershipToken.md)
- [createInstallationId](variables/createInstallationId.md)
- [createInstanceId](variables/createInstanceId.md)
- [createMicroSystemId](variables/createMicroSystemId.md)
- [createMicroSystemInstanceId](variables/createMicroSystemInstanceId.md)
- [createProviderId](variables/createProviderId.md)
- [createServiceId](variables/createServiceId.md)
- [createWorkItemId](variables/createWorkItemId.md)
- [formatInstant](variables/formatInstant.md)
- [LIFECYCLE\_ROOT\_IDS](variables/LIFECYCLE_ROOT_IDS.md)
- [NAMESPACED\_ID\_PATTERN](variables/NAMESPACED_ID_PATTERN.md)
- [parseActivityId](variables/parseActivityId.md)
- [parseBootId](variables/parseBootId.md)
- [parseCapabilityId](variables/parseCapabilityId.md)
- [parseContinuityEpochId](variables/parseContinuityEpochId.md)
- [parseContributionId](variables/parseContributionId.md)
- [parseEvidenceId](variables/parseEvidenceId.md)
- [parseHostOwnershipToken](variables/parseHostOwnershipToken.md)
- [parseInstallationId](variables/parseInstallationId.md)
- [parseInstanceId](variables/parseInstanceId.md)
- [parseInstant](variables/parseInstant.md)
- [parseMicroSystemId](variables/parseMicroSystemId.md)
- [parseMicroSystemInstanceId](variables/parseMicroSystemInstanceId.md)
- [parseProviderId](variables/parseProviderId.md)
- [parseServiceId](variables/parseServiceId.md)
- [parseWorkItemId](variables/parseWorkItemId.md)
- [POSTGRES\_INTEGER\_MAX](variables/POSTGRES_INTEGER_MAX.md)
- [SHA256\_HEX\_PATTERN](variables/SHA256_HEX_PATTERN.md)
- [UUID\_V7\_PATTERN](variables/UUID_V7_PATTERN.md)

## Functions

- [asContentDigest](functions/asContentDigest.md)
- [canonicalizeJson](functions/canonicalizeJson.md)
- [createProblem](functions/createProblem.md)
- [createProblemError](functions/createProblemError.md)
- [createUuidV7Id](functions/createUuidV7Id.md)
- [digestCanonicalJson](functions/digestCanonicalJson.md)
- [isSha256Hex](functions/isSha256Hex.md)
- [isUuidV7](functions/isUuidV7.md)
- [parseContentDigest](functions/parseContentDigest.md)
- [parseUuidV7Id](functions/parseUuidV7Id.md)
- [snapshotCanonicalJson](functions/snapshotCanonicalJson.md)

## References

### BootId

Re-exports [BootId](../../bootstrap-state/dist/type-aliases/BootId.md)

---

### ProductGenerationId

Re-exports [ProductGenerationId](../../bootstrap-state/dist/type-aliases/ProductGenerationId.md)
