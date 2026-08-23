import { describe, expect, it } from "vitest";
import {
  createHostMaintenanceTracker,
  type HostMaintenanceEvent,
} from "./host-maintenance-machine.js";

function move(
  tracker: ReturnType<typeof createHostMaintenanceTracker>,
  ...events: readonly HostMaintenanceEvent[]
): void {
  for (const event of events) tracker.send(event);
}

describe("Host maintenance transition tracker", () => {
  it("allows the bounded restart path and reaches COMPLETED", () => {
    const tracker = createHostMaintenanceTracker();

    move(
      tracker,
      { type: "QUIESCENCE_PROVEN" },
      { type: "TOKEN_REVOKED" },
      { type: "WINDOW_ENTERED" },
      { type: "POSTGRES_STOPPED" },
      { type: "POSTGRES_READY" },
      { type: "HOST_LEASE_ACQUIRED" },
      { type: "HOST_REACQUIRED" },
      { type: "COMPLETED" },
    );

    expect(tracker.state).toBe("COMPLETED");
    expect(tracker.can({ type: "QUIESCENCE_PROVEN" })).toBe(false);
  });

  it("permits ABORTED only before the point of no return", () => {
    const prepared = createHostMaintenanceTracker();
    expect(prepared.can({ type: "ABORTED" })).toBe(true);
    prepared.send({ type: "ABORTED" });
    expect(prepared.state).toBe("ABORTED");

    const afterRevocation = createHostMaintenanceTracker();
    move(afterRevocation, { type: "QUIESCENCE_PROVEN" }, { type: "TOKEN_REVOKED" });
    expect(afterRevocation.can({ type: "ABORTED" })).toBe(false);
    expect(() => afterRevocation.send({ type: "ABORTED" })).toThrow();
  });

  it.each([
    ["PREPARED", [] as const],
    [
      "ENTERED",
      [
        { type: "QUIESCENCE_PROVEN" },
        { type: "TOKEN_REVOKED" },
        { type: "WINDOW_ENTERED" },
      ] as const,
    ],
  ] as const)(
    "rejects POSTGRES_READY during %s without mutating the tracker",
    (_expectedState, events) => {
      const tracker = createHostMaintenanceTracker();
      move(tracker, ...events);

      let error: unknown;
      try {
        tracker.assertCan({ type: "POSTGRES_READY" });
      } catch (caught) {
        error = caught;
      }
      expect(error).toMatchObject({
        problem: { problemCode: "bootstrap.maintenance.invalid_transition" },
      });
      expect(tracker.state).toBe(_expectedState);
    },
  );

  it("makes RECOVERY_REQUIRED terminal and never returns to a pre-PONR state", () => {
    const tracker = createHostMaintenanceTracker();
    move(tracker, { type: "QUIESCENCE_PROVEN" }, { type: "RECOVERY_REQUIRED" });

    expect(tracker.state).toBe("RECOVERY_REQUIRED");
    expect(tracker.can({ type: "QUIESCENCE_PROVEN" })).toBe(false);
    expect(tracker.can({ type: "HOST_REACQUIRED" })).toBe(false);
  });

  it("does not permit an active transition after COMPLETED", () => {
    const tracker = createHostMaintenanceTracker();
    move(
      tracker,
      { type: "QUIESCENCE_PROVEN" },
      { type: "TOKEN_REVOKED" },
      { type: "WINDOW_ENTERED" },
      { type: "POSTGRES_STOPPED" },
      { type: "POSTGRES_READY" },
      { type: "HOST_LEASE_ACQUIRED" },
      { type: "HOST_REACQUIRED" },
      { type: "COMPLETED" },
    );
    expect(() => tracker.send({ type: "WINDOW_ENTERED" })).toThrow();
  });
});
