import { SHA256_HEX_PATTERN } from "@heptalogos/foundation-contracts";
import { Type } from "@heptalogos/schema-runtime/typebox";

export const bootstrapDigestSchema = Type.Object(
  {
    algorithm: Type.Literal("sha256"),
    canonicalization: Type.Literal("RFC8785-JCS"),
    domain: Type.String({ minLength: 1 }),
    hex: Type.String({ pattern: SHA256_HEX_PATTERN }),
  },
  { additionalProperties: false },
);
