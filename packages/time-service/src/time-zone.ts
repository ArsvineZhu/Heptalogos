import type { TimeZoneId } from "./contracts.js";

export function parseTimeZoneId(value: unknown): TimeZoneId | undefined {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return undefined;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value as TimeZoneId;
  } catch {
    return undefined;
  }
}
