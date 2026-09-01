/**
 * Public injectable time contracts and system/fake constructors for Foundation
 * services that need deterministic elapsed and wall-clock semantics.
 * @packageDocumentation
 */

export {
  type ElapsedNanoseconds,
  type FakeTimeService,
  type MonotonicTick,
  type TimeService,
  type TimeZoneId,
} from "./contracts.js";
export { createFakeTimeService } from "./fake-time-service.js";
export { createSystemTimeService } from "./system-time-service.js";
export { parseTimeZoneId } from "./time-zone.js";
