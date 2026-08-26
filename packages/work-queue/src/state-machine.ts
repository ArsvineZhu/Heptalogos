import { initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import type { WorkItemState } from "./contracts.js";
import { workQueueProblem } from "./problems.js";

export type WorkItemTransitionEvent =
  | { readonly type: "CLAIM" }
  | { readonly type: "WAIT_DEPENDENCY" }
  | { readonly type: "RETRY_WAIT" }
  | { readonly type: "SUCCEED" }
  | { readonly type: "FAIL" }
  | { readonly type: "CANCEL" }
  | { readonly type: "SUPERSEDE" }
  | { readonly type: "WAKE_DEPENDENCY" }
  | { readonly type: "WAKE_RETRY" };

const workItemMachine = setup({
  types: {
    events: {} as WorkItemTransitionEvent,
  },
}).createMachine({
  id: "work-item",
  initial: "PENDING",
  states: {
    PENDING: {
      on: {
        CLAIM: "RUNNING",
        WAIT_DEPENDENCY: "WAITING_DEPENDENCY",
        RETRY_WAIT: "RETRY_WAIT",
        CANCEL: "CANCELLED",
        SUPERSEDE: "SUPERSEDED",
      },
    },
    RUNNING: {
      on: {
        SUCCEED: "SUCCEEDED",
        FAIL: "FAILED",
        RETRY_WAIT: "RETRY_WAIT",
        CANCEL: "CANCELLED",
        SUPERSEDE: "SUPERSEDED",
      },
    },
    WAITING_DEPENDENCY: {
      on: {
        WAKE_DEPENDENCY: "PENDING",
        CANCEL: "CANCELLED",
        SUPERSEDE: "SUPERSEDED",
      },
    },
    RETRY_WAIT: {
      on: {
        WAKE_RETRY: "PENDING",
        CANCEL: "CANCELLED",
        SUPERSEDE: "SUPERSEDED",
      },
    },
    WAITING_RESTORE_RECONCILIATION: {},
    SUCCEEDED: {},
    FAILED: {},
    CANCELLED: {},
    SUPERSEDED: {},
  },
});

type WorkItemSnapshot = SnapshotFrom<typeof workItemMachine>;

function stateOf(snapshot: WorkItemSnapshot): WorkItemState {
  return snapshot.value as WorkItemState;
}

function snapshotFor(state: WorkItemState): WorkItemSnapshot {
  if (state === "PENDING") return initialTransition(workItemMachine)[0];
  return workItemMachine.resolveState({ value: state, context: {} });
}

export interface WorkItemStateMachine {
  readonly state: WorkItemState;
  can(event: WorkItemTransitionEvent): boolean;
  send(event: WorkItemTransitionEvent): WorkItemState;
}

export function createWorkItemStateMachine(
  initialState: WorkItemState = "PENDING",
): WorkItemStateMachine {
  let snapshot = snapshotFor(initialState);

  return {
    get state() {
      return stateOf(snapshot);
    },
    can(event) {
      return snapshot.can(event);
    },
    send(event) {
      const state = stateOf(snapshot);
      if (!snapshot.can(event)) {
        throw workQueueProblem(
          "work_queue.invalid_transition",
          `WorkItem cannot accept ${event.type} while it is ${state}`,
        );
      }
      snapshot = transition(workItemMachine, snapshot, event)[0];
      return stateOf(snapshot);
    },
  };
}

export function canTransitionWorkItem(
  state: WorkItemState,
  event: WorkItemTransitionEvent,
): boolean {
  return snapshotFor(state).can(event);
}

export function transitionWorkItemState(
  state: WorkItemState,
  event: WorkItemTransitionEvent,
): WorkItemState {
  const tracker = createWorkItemStateMachine(state);
  return tracker.send(event);
}
