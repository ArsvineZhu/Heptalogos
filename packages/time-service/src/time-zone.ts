/**
 * Parses timezone identifiers into the shared branded value while rejecting
 * invalid platform timezone input at the time-service boundary.
 * @module time-zone
 */

import type { TimeZoneId } from "./contracts.js";

/** Validate an IANA timezone identifier without allowing platform exceptions to escape. */
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
