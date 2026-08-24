import type { Branded, ContentDigest, UuidV7Id } from "./identity.js";
import { createUuidV7Id, parseUuidV7Id } from "./identity.js";

export type ProductGenerationId = ContentDigest<"ProductGenerationId">;
export type PackageGenerationId = ContentDigest<"PackageGenerationId">;
export type MicroSystemInstanceId = UuidV7Id<"MicroSystemInstanceId">;
export type NamespacedId<TBrand extends string> = Branded<
  string,
  `namespaced:${TBrand}`
>;

export type MicroSystemId = NamespacedId<"MicroSystemId">;
export type ServiceId = NamespacedId<"ServiceId">;
export type CapabilityId = NamespacedId<"CapabilityId">;
export type ProviderId = NamespacedId<"ProviderId">;

export const NAMESPACED_ID_PATTERN = "^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$";
const namespacedIdShape = new RegExp(NAMESPACED_ID_PATTERN, "u");

function parseNamespacedId<TBrand extends string>(
  brand: TBrand,
  value: unknown,
): NamespacedId<TBrand> | undefined {
  void brand;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !namespacedIdShape.test(value)
  ) {
    return undefined;
  }
  return value as NamespacedId<TBrand>;
}

function createNamespacedId<TBrand extends string>(
  brand: TBrand,
  value: string,
): NamespacedId<TBrand> {
  const parsed = parseNamespacedId(brand, value);
  if (parsed === undefined) {
    throw new TypeError(`Invalid ${brand} NamespacedId`);
  }
  return parsed;
}

export const parseMicroSystemId = (value: unknown): MicroSystemId | undefined =>
  parseNamespacedId("MicroSystemId", value);
export const parseServiceId = (value: unknown): ServiceId | undefined =>
  parseNamespacedId("ServiceId", value);
export const parseCapabilityId = (value: unknown): CapabilityId | undefined =>
  parseNamespacedId("CapabilityId", value);
export const parseProviderId = (value: unknown): ProviderId | undefined =>
  parseNamespacedId("ProviderId", value);

export const createMicroSystemId = (value: string): MicroSystemId =>
  createNamespacedId("MicroSystemId", value);
export const createServiceId = (value: string): ServiceId =>
  createNamespacedId("ServiceId", value);
export const createCapabilityId = (value: string): CapabilityId =>
  createNamespacedId("CapabilityId", value);
export const createProviderId = (value: string): ProviderId =>
  createNamespacedId("ProviderId", value);

export const createMicroSystemInstanceId = (): MicroSystemInstanceId =>
  createUuidV7Id("MicroSystemInstanceId");
export const parseMicroSystemInstanceId = (
  value: unknown,
): MicroSystemInstanceId | undefined => parseUuidV7Id("MicroSystemInstanceId", value);
