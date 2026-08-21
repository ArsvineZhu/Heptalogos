import canonicalize from "canonicalize";

export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

function assertCanonicalJsonValue(value: unknown, path: string): void {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`canonical JSON requires a finite number at ${path}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      assertCanonicalJsonValue(item, `${path}[${index}]`);
    }
    return;
  }

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`canonical JSON requires plain objects at ${path}`);
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") {
        throw new TypeError(`canonical JSON requires string keys at ${path}`);
      }
      assertCanonicalJsonValue(
        (value as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
    }
    return;
  }

  throw new TypeError(`unsupported canonical JSON value at ${path}`);
}

export function canonicalizeJson(value: CanonicalJsonValue): string {
  assertCanonicalJsonValue(value, "$.");
  const serialized = canonicalize(value);
  if (typeof serialized !== "string") {
    throw new TypeError("canonical JSON serializer returned no representation");
  }
  return serialized;
}
