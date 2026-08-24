import type {
  CanonicalSchemaInitializer,
  CanonicalSchemaRuntimeOptions,
} from "./contracts.js";

export function createCanonicalSchemaInitializer(
  _options: CanonicalSchemaRuntimeOptions,
): CanonicalSchemaInitializer {
  return async () => undefined;
}
