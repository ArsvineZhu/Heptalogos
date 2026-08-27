function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSchemaVersion(value: unknown, property: string): unknown {
  if (!isJsonRecord(value) || !isJsonRecord(value[property])) return undefined;
  return value[property].schemaVersion;
}
