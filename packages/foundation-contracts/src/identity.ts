import { v7 as uuidv7 } from "uuid";
import type { Sha256Digest } from "./digest.js";

export type Branded<T, TBrand extends string> = T & {
  readonly __brand: TBrand;
};
export type UuidV7Id<TBrand extends string> = Branded<string, `uuidv7:${TBrand}`>;
export type ContentDigest<TBrand extends string> = Branded<string, `sha256:${TBrand}`>;

export function createUuidV7Id<TBrand extends string>(brand: TBrand): UuidV7Id<TBrand> {
  void brand;
  return uuidv7() as UuidV7Id<TBrand>;
}

export function asContentDigest<TBrand extends string>(
  brand: TBrand,
  digest: Sha256Digest,
): ContentDigest<TBrand> {
  void brand;
  return digest.hex as ContentDigest<TBrand>;
}
