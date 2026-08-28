/**
 * Owns branded Runtime, Service, Capability, Provider, and WorkItem identities
 * while preserving their namespace and UUID validation semantics.
 * @module runtime-identity
 */

import type { Branded, ContentDigest, UuidV7Id } from "./identity.js";
import { createUuidV7Id, parseUuidV7Id } from "./identity.js";

/** Identifies a product generation by its canonical content digest. */
export type ProductGenerationId = ContentDigest<"ProductGenerationId">;
/** Identifies a package generation by its canonical content digest. */
export type PackageGenerationId = ContentDigest<"PackageGenerationId">;
/** Identifies one instantiated MicroSystem generation. */
export type MicroSystemInstanceId = UuidV7Id<"MicroSystemInstanceId">;
/** Brands a normalized namespaced identifier for a semantic owner. */
export type NamespacedId<TBrand extends string> = Branded<
  string,
  `namespaced:${TBrand}`
>;

/** Identifies a MicroSystem definition. */
export type MicroSystemId = NamespacedId<"MicroSystemId">;
/** Identifies a Runtime Service contract. */
export type ServiceId = NamespacedId<"ServiceId">;
/** Identifies a Runtime Capability contract. */
export type CapabilityId = NamespacedId<"CapabilityId">;
/** Identifies a Runtime provider. */
export type ProviderId = NamespacedId<"ProviderId">;
/** Identifies an Extension contribution. */
export type ContributionId = NamespacedId<"ContributionId">;
/** Identifies a durable WorkItem. */
export type WorkItemId = UuidV7Id<"WorkItemId">;

/** The syntax accepted for normalized namespaced Runtime identities. */
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

/** Parses a MicroSystem identity and rejects malformed namespace syntax. */
export const parseMicroSystemId = (value: unknown): MicroSystemId | undefined =>
  parseNamespacedId("MicroSystemId", value);
/** Parses a Service identity and rejects malformed namespace syntax. */
export const parseServiceId = (value: unknown): ServiceId | undefined =>
  parseNamespacedId("ServiceId", value);
/** Parses a Capability identity and rejects malformed namespace syntax. */
export const parseCapabilityId = (value: unknown): CapabilityId | undefined =>
  parseNamespacedId("CapabilityId", value);
/** Parses a Provider identity and rejects malformed namespace syntax. */
export const parseProviderId = (value: unknown): ProviderId | undefined =>
  parseNamespacedId("ProviderId", value);
/** Parses a Contribution identity and rejects malformed namespace syntax. */
export const parseContributionId = (value: unknown): ContributionId | undefined =>
  parseNamespacedId("ContributionId", value);
/** Parses a WorkItem UUID-v7 identity. */
export const parseWorkItemId = (value: unknown): WorkItemId | undefined =>
  parseUuidV7Id("WorkItemId", value);

/** Creates a validated MicroSystem identity from its canonical name. */
export const createMicroSystemId = (value: string): MicroSystemId =>
  createNamespacedId("MicroSystemId", value);
/** Creates a validated Service identity from its canonical name. */
export const createServiceId = (value: string): ServiceId =>
  createNamespacedId("ServiceId", value);
/** Creates a validated Capability identity from its canonical name. */
export const createCapabilityId = (value: string): CapabilityId =>
  createNamespacedId("CapabilityId", value);
/** Creates a validated Provider identity from its canonical name. */
export const createProviderId = (value: string): ProviderId =>
  createNamespacedId("ProviderId", value);
/** Creates a validated Contribution identity from its canonical name. */
export const createContributionId = (value: string): ContributionId =>
  createNamespacedId("ContributionId", value);
/** Creates a new WorkItem UUID-v7 identity. */
export const createWorkItemId = (): WorkItemId => createUuidV7Id("WorkItemId");

/** Creates a new MicroSystem instance identity. */
export const createMicroSystemInstanceId = (): MicroSystemInstanceId =>
  createUuidV7Id("MicroSystemInstanceId");
/** Parses a MicroSystem instance UUID-v7 identity. */
export const parseMicroSystemInstanceId = (
  value: unknown,
): MicroSystemInstanceId | undefined => parseUuidV7Id("MicroSystemInstanceId", value);
