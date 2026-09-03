/**
 * Public current Configuration contracts and managed-revision service.
 * @packageDocumentation
 */

export {
  configurationActivateInputSchema,
  configurationRevisionCreateInputSchema,
  configurationScopeRefSchema,
  PROVIDER_TRANSPORT_DEFINITION_ID,
  providerTransportConfigSchema,
  type ActivateConfigurationInput,
  type ConfigurationActivation,
  type ConfigurationDefinition,
  type ConfigurationDefinitionId,
  type ConfigurationRevision,
  type ConfigurationRevisionId,
  type ConfigurationScopeRef,
  type ConfigurationService,
  type ConfigurationServiceOptions,
  type CreateConfigurationRevisionInput,
  type ProviderTransportConfigV1,
} from "./contracts.js";
export { createConfigurationService } from "./service.js";
