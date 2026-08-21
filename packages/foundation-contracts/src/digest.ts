import { createHash } from "node:crypto";
import { canonicalizeJson, type CanonicalJsonValue } from "./canonical-json.js";

export interface Sha256Digest {
  readonly algorithm: "sha256";
  readonly canonicalization: "RFC8785-JCS";
  readonly domain: string;
  readonly hex: string;
}

export function digestCanonicalJson(
  domain: string,
  payload: CanonicalJsonValue,
): Sha256Digest {
  if (domain.length === 0) {
    throw new TypeError("digest domain must not be empty");
  }

  const envelope: CanonicalJsonValue = {
    domain,
    canonicalization: "RFC8785-JCS",
    hashAlgorithm: "sha256",
    payload,
  };
  const hex = createHash("sha256")
    .update(canonicalizeJson(envelope), "utf8")
    .digest("hex");

  return {
    algorithm: "sha256",
    canonicalization: "RFC8785-JCS",
    domain,
    hex,
  };
}
