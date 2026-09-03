/**
 * Public normal Product Secret contracts and service construction.
 * @packageDocumentation
 */

export {
  secretMetadataSchema,
  secretRefSchema,
  secretReplaceInputSchema,
  secretResolutionContextSchema,
  secretRevokeInputSchema,
  secretScopeRefSchema,
  secretSetInputSchema,
  type ResolvedSecretMaterial,
  type SecretId,
  type SecretMetadata,
  type SecretRef,
  type SecretResolutionContext,
  type SecretScopeRef,
  type SecretService,
  type SecretServiceOptions,
  type SecretWriteInput,
} from "./contracts.js";
export { createSecretService } from "./service.js";
