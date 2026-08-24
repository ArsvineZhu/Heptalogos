import { formatInstant } from "@heptalogos/foundation-contracts";
import type { ElapsedNanoseconds, MonotonicTick, TimeService } from "./contracts.js";

export function createSystemTimeService(): TimeService {
  return {
    now: () => formatInstant(new Date()),
    monotonicNow: () => process.hrtime.bigint() as MonotonicTick,
    elapsedSince(start: MonotonicTick) {
      const current = process.hrtime.bigint();
      if (start > current) {
        throw new RangeError("Monotonic start cannot be in the future");
      }
      return (current - start) as ElapsedNanoseconds;
    },
  };
}
