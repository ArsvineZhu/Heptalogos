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

export function createUuidV7Id<TBrand extends string>(brand: TBrand): UuidV7Id<TBrand> {
  void brand;
  return uuidv7() as UuidV7Id<TBrand>;
}

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
