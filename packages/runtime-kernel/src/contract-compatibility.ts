import type { ContractVersion, ContractVersionRange } from "./contracts.js";
import { runtimeKernelProblem } from "./problems.js";

export const CONTRACT_VERSION_PATTERN = "^[a-z0-9][a-z0-9._-]{0,63}$";
const contractVersionShape = new RegExp(CONTRACT_VERSION_PATTERN, "u");

export function parseContractVersion(value: unknown): ContractVersion | undefined {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 64 ||
    !contractVersionShape.test(value)
  ) {
    return undefined;
  }
  return value as ContractVersion;
}

export function createContractVersion(value: string): ContractVersion {
  const parsed = parseContractVersion(value);
  if (parsed === undefined) {
    throw new TypeError("Invalid exact ContractVersion");
  }
  return parsed;
}

export function exactContract(version: ContractVersion): ContractVersionRange {
  return Object.freeze({ kind: "exact", version });
}

export class ContractCompatibilityRegistry {
  isCompatible(
    requirement: ContractVersionRange,
    providerVersion: ContractVersion,
  ): boolean {
    if (requirement.kind !== "exact") return false;
    return requirement.version === providerVersion;
  }

  assertCompatible(
    requirement: ContractVersionRange,
    providerVersion: ContractVersion,
    kind: "service" | "capability",
  ): void {
    if (!this.isCompatible(requirement, providerVersion)) {
      throw runtimeKernelProblem(
        `runtime.${kind}.incompatible_contract`,
        `No exact ${kind} contract match for ${requirement.version}`,
      );
    }
  }
}
