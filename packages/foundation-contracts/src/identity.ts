import { validate as validateUuid, v7 as uuidv7, version as uuidVersion } from "uuid";
import type { Sha256Digest } from "./digest.js";

export const UUID_V7_PATTERN =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";
export const SHA256_HEX_PATTERN = "^[0-9a-f]{64}$";

const uuidV7Shape = new RegExp(UUID_V7_PATTERN, "u");
const sha256HexShape = new RegExp(SHA256_HEX_PATTERN, "u");

export type Branded<T, TBrand extends string> = T & {
  readonly __brand: TBrand;
};
export type UuidV7Id<TBrand extends string> = Branded<string, `uuidv7:${TBrand}`>;
export type ContentDigest<TBrand extends string> = Branded<string, `sha256:${TBrand}`>;

export type InstallationId = UuidV7Id<"InstallationId">;
export type InstanceId = UuidV7Id<"InstanceId">;
export type BootId = UuidV7Id<"BootId">;
export type ContinuityEpochId = UuidV7Id<"ContinuityEpochId">;
export type HostOwnershipToken = UuidV7Id<"HostOwnershipToken">;

export function createUuidV7Id<TBrand extends string>(brand: TBrand): UuidV7Id<TBrand> {
  void brand;
  return uuidv7() as UuidV7Id<TBrand>;
}

export const createInstallationId = (): InstallationId =>
  createUuidV7Id("InstallationId");
export const createInstanceId = (): InstanceId => createUuidV7Id("InstanceId");
export const createBootId = (): BootId => createUuidV7Id("BootId");
export const createContinuityEpochId = (): ContinuityEpochId =>
  createUuidV7Id("ContinuityEpochId");
export const createHostOwnershipToken = (): HostOwnershipToken =>
  createUuidV7Id("HostOwnershipToken");

export function isUuidV7(value: unknown): value is UuidV7Id<string> {
  return (
    typeof value === "string" &&
    uuidV7Shape.test(value) &&
    validateUuid(value) &&
    uuidVersion(value) === 7
  );
}

export function parseUuidV7Id<TBrand extends string>(
  brand: TBrand,
  value: unknown,
): UuidV7Id<TBrand> | undefined {
  void brand;
  return isUuidV7(value) ? (value as UuidV7Id<TBrand>) : undefined;
}

export const parseInstallationId = (value: unknown): InstallationId | undefined =>
  parseUuidV7Id("InstallationId", value);
export const parseInstanceId = (value: unknown): InstanceId | undefined =>
  parseUuidV7Id("InstanceId", value);
export const parseBootId = (value: unknown): BootId | undefined =>
  parseUuidV7Id("BootId", value);
export const parseContinuityEpochId = (value: unknown): ContinuityEpochId | undefined =>
  parseUuidV7Id("ContinuityEpochId", value);
export const parseHostOwnershipToken = (
  value: unknown,
): HostOwnershipToken | undefined => parseUuidV7Id("HostOwnershipToken", value);

export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && sha256HexShape.test(value);
}

export function parseContentDigest<TBrand extends string>(
  brand: TBrand,
  value: unknown,
): ContentDigest<TBrand> | undefined {
  void brand;
  return isSha256Hex(value) ? (value as ContentDigest<TBrand>) : undefined;
}

export function asContentDigest<TBrand extends string>(
  brand: TBrand,
  digest: Sha256Digest,
): ContentDigest<TBrand> {
  void brand;
  if (!isSha256Hex(digest.hex)) {
    throw new TypeError("Content digest must be a lowercase SHA-256 hex value");
  }
  return digest.hex as ContentDigest<TBrand>;
}
