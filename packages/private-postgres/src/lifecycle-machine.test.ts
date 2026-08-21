import { describe, expect, it } from "vitest";
import {
  createPrivatePostgresLifecycleTracker,
  type PrivatePostgresLifecycleTracker,
} from "./lifecycle-machine.js";

function expectTracker(
  tracker: PrivatePostgresLifecycleTracker,
  state: string,
  detail: string,
): void {
  expect(tracker.state).toBe(state);
  expect(tracker.detail).toBe(detail);
}

describe("private PostgreSQL lifecycle transition mechanics", () => {
  it("allows a stopped cluster to become ready only after command success and readiness proof", () => {
    const tracker = createPrivatePostgresLifecycleTracker();

    expectTracker(tracker, "STOPPED", "stopped");
    tracker.send({ type: "START_COMMAND_ISSUED" });
    expectTracker(tracker, "STARTING", "startCommandPending");
    tracker.send({ type: "START_COMMAND_SUCCEEDED" });
    expectTracker(tracker, "STARTING", "startedPendingReady");
    tracker.send({ type: "READY_PROVEN" });
    expectTracker(tracker, "READY", "ready");
  });

  it("allows a ready cluster to restart through the same pending and readiness stages", () => {
    const tracker = createPrivatePostgresLifecycleTracker();

    tracker.send({ type: "START_COMMAND_ISSUED" });
    tracker.send({ type: "START_COMMAND_SUCCEEDED" });
    tracker.send({ type: "READY_PROVEN" });
    tracker.send({ type: "RESTART_COMMAND_ISSUED" });
    expectTracker(tracker, "STARTING", "startCommandPending");
    tracker.send({ type: "START_COMMAND_SUCCEEDED" });
    tracker.send({ type: "READY_PROVEN" });
    expectTracker(tracker, "READY", "ready");
  });

  it("allows a ready cluster to stop only after a positive stopped observation", () => {
    const tracker = createPrivatePostgresLifecycleTracker();

    tracker.send({ type: "START_COMMAND_ISSUED" });
    tracker.send({ type: "START_COMMAND_SUCCEEDED" });
    tracker.send({ type: "READY_PROVEN" });
    tracker.send({ type: "STOP_COMMAND_ISSUED" });
    expectTracker(tracker, "STOPPING", "stopping");
    tracker.send({ type: "STATUS_STOPPED_PROVEN" });
    expectTracker(tracker, "STOPPED", "stopped");
  });

  it("does not treat one stopped observation as quiescence after an ambiguous start", () => {
    const tracker = createPrivatePostgresLifecycleTracker();

    tracker.send({ type: "START_COMMAND_ISSUED" });
    tracker.send({ type: "START_OUTCOME_UNCERTAIN" });
    expectTracker(tracker, "UNCERTAIN", "startOutcomeUncertain");
    expect(tracker.can({ type: "STATUS_STOPPED_PROVEN" })).toBe(false);

    let thrown: unknown;
    try {
      tracker.send({ type: "STATUS_STOPPED_PROVEN" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      problem: {
        problemCode: "private-postgres.lifecycle.invalid_transition",
        category: "conflict",
        retryClass: "manual",
      },
    });
    expectTracker(tracker, "UNCERTAIN", "startOutcomeUncertain");
  });
});
