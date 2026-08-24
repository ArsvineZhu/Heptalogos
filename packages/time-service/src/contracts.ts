import type { Branded, Instant } from "@heptalogos/foundation-contracts";

export type MonotonicTick = Branded<bigint, "MonotonicTick">;
export type ElapsedNanoseconds = Branded<bigint, "ElapsedNanoseconds">;
export type TimeZoneId = Branded<string, "TimeZoneId">;

export interface TimeService {
  now(): Instant;
  monotonicNow(): MonotonicTick;
  elapsedSince(start: MonotonicTick): ElapsedNanoseconds;
}

export interface FakeTimeService extends TimeService {
  setWallClock(value: Instant): void;
  advanceWallClock(milliseconds: number): void;
  advanceMonotonic(nanoseconds: bigint): void;
}
