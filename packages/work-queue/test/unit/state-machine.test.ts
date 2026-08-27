import { describe, expect, it } from "vitest";
import {
  createWorkItemStateMachine,
  type WorkItemState,
  type WorkItemTransitionEvent,
} from "../../src/index.js";

const ALL_STATES: readonly WorkItemState[] = [
  "PENDING",
  "RUNNING",
  "WAITING_DEPENDENCY",
  "RETRY_WAIT",
  "WAITING_RESTORE_RECONCILIATION",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "SUPERSEDED",
];

const ALL_EVENTS: readonly WorkItemTransitionEvent[] = [
  { type: "CLAIM" },
  { type: "WAIT_DEPENDENCY" },
  { type: "RETRY_WAIT" },
  { type: "SUCCEED" },
  { type: "FAIL" },
  { type: "CANCEL" },
  { type: "SUPERSEDE" },
  { type: "WAKE_DEPENDENCY" },
  { type: "WAKE_RETRY" },
];

describe("WorkItem local state machine", () => {
  it("accepts every required legal transition", () => {
    const cases: readonly [WorkItemState, WorkItemTransitionEvent, WorkItemState][] = [
      ["PENDING", { type: "CLAIM" }, "RUNNING"],
      ["PENDING", { type: "WAIT_DEPENDENCY" }, "WAITING_DEPENDENCY"],
      ["PENDING", { type: "RETRY_WAIT" }, "RETRY_WAIT"],
      ["PENDING", { type: "CANCEL" }, "CANCELLED"],
      ["PENDING", { type: "SUPERSEDE" }, "SUPERSEDED"],
      ["RUNNING", { type: "SUCCEED" }, "SUCCEEDED"],
      ["RUNNING", { type: "FAIL" }, "FAILED"],
      ["RUNNING", { type: "RETRY_WAIT" }, "RETRY_WAIT"],
      ["RUNNING", { type: "CANCEL" }, "CANCELLED"],
      ["RUNNING", { type: "SUPERSEDE" }, "SUPERSEDED"],
      ["WAITING_DEPENDENCY", { type: "WAKE_DEPENDENCY" }, "PENDING"],
      ["WAITING_DEPENDENCY", { type: "CANCEL" }, "CANCELLED"],
      ["WAITING_DEPENDENCY", { type: "SUPERSEDE" }, "SUPERSEDED"],
      ["RETRY_WAIT", { type: "WAKE_RETRY" }, "PENDING"],
      ["RETRY_WAIT", { type: "CANCEL" }, "CANCELLED"],
      ["RETRY_WAIT", { type: "SUPERSEDE" }, "SUPERSEDED"],
    ];

    for (const [initial, event, expected] of cases) {
      const tracker = createWorkItemStateMachine(initial);
      expect(tracker.can(event)).toBe(true);
      expect(tracker.send(event)).toBe(expected);
      expect(tracker.state).toBe(expected);
    }
  });

  it("rejects every illegal transition and never exits a terminal state", () => {
    const legal = new Map<string, string>([
      ["PENDING:CLAIM", "RUNNING"],
      ["PENDING:WAIT_DEPENDENCY", "WAITING_DEPENDENCY"],
      ["PENDING:RETRY_WAIT", "RETRY_WAIT"],
      ["PENDING:CANCEL", "CANCELLED"],
      ["PENDING:SUPERSEDE", "SUPERSEDED"],
      ["RUNNING:SUCCEED", "SUCCEEDED"],
      ["RUNNING:FAIL", "FAILED"],
      ["RUNNING:RETRY_WAIT", "RETRY_WAIT"],
      ["RUNNING:CANCEL", "CANCELLED"],
      ["RUNNING:SUPERSEDE", "SUPERSEDED"],
      ["WAITING_DEPENDENCY:WAKE_DEPENDENCY", "PENDING"],
      ["WAITING_DEPENDENCY:CANCEL", "CANCELLED"],
      ["WAITING_DEPENDENCY:SUPERSEDE", "SUPERSEDED"],
      ["RETRY_WAIT:WAKE_RETRY", "PENDING"],
      ["RETRY_WAIT:CANCEL", "CANCELLED"],
      ["RETRY_WAIT:SUPERSEDE", "SUPERSEDED"],
    ]);

    for (const state of ALL_STATES) {
      for (const event of ALL_EVENTS) {
        const tracker = createWorkItemStateMachine(state);
        const expected = legal.get(`${state}:${event.type}`);
        expect(tracker.can(event)).toBe(expected !== undefined);
        if (expected === undefined) {
          expect(() => tracker.send(event)).toThrowError(/cannot accept/u);
          expect(tracker.state).toBe(state);
        }
      }
    }
  });
});
