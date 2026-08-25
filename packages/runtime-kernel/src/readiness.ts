import type {
  CapabilityId,
  ProviderId,
  ServiceId,
} from "@heptalogos/foundation-contracts";
import type { CapabilityRegistry } from "./capability-registry.js";
import type { ReadinessProfileDefinition, ReadinessResult } from "./contracts.js";
import type { ServiceRegistry } from "./service-registry.js";

export function evaluateReadiness(
  profile: ReadinessProfileDefinition,
  services: ServiceRegistry,
  capabilities: CapabilityRegistry,
  serviceBindings: ReadonlyMap<ServiceId, ProviderId>,
  capabilityBindings: ReadonlyMap<CapabilityId, ProviderId>,
): ReadinessResult {
  const missingServices = profile.requiredServices
    .filter(
      (requirement) =>
        !services.hasEligible(requirement, serviceBindings.get(requirement.serviceId)),
    )
    .map((requirement) => requirement.serviceId);
  const missingRequiredCapabilities = profile.requiredCapabilities
    .filter(
      (requirement) =>
        !capabilities.hasEligible(
          requirement,
          capabilityBindings.get(requirement.capabilityId),
        ),
    )
    .map((requirement) => requirement.capabilityId);
  const missingOptionalCapabilities = profile.optionalCapabilities
    .filter(
      (requirement) =>
        !capabilities.hasEligible(
          requirement,
          capabilityBindings.get(requirement.capabilityId),
        ),
    )
    .map((requirement) => requirement.capabilityId);
  const state =
    missingServices.length > 0 || missingRequiredCapabilities.length > 0
      ? "BLOCKED"
      : missingOptionalCapabilities.length > 0
        ? "DEGRADED"
        : "READY";
  return Object.freeze({
    profileId: profile.profileId,
    state,
    missingServices: Object.freeze(missingServices),
    missingRequiredCapabilities: Object.freeze(missingRequiredCapabilities),
    missingOptionalCapabilities: Object.freeze(missingOptionalCapabilities),
  });
}
