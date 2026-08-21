import { initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import { ProblemError } from "@heptalogos/foundation-contracts";

export type PrivatePostgresLifecycleState =
  "STOPPED" | "STARTING" | "READY" | "STOPPING" | "UNCERTAIN";

export type PrivatePostgresLifecycleDetail =
  | "stopped"
  | "startCommandPending"
  | "startedPendingReady"
  | "ready"
  | "stopping"
  | "startOutcomeUncertain"
  | "runningObservedUncertain"
  | "processUncertain";

export type PrivatePostgresLifecycleEvent =
  | { readonly type: "START_COMMAND_ISSUED" }
  | { readonly type: "RESTART_COMMAND_ISSUED" }
  | { readonly type: "START_COMMAND_SUCCEEDED" }
  | { readonly type: "START_OUTCOME_UNCERTAIN" }
  | { readonly type: "READY_PROVEN" }
  | { readonly type: "POST_START_PROOF_FAILED" }
  | { readonly type: "STATUS_RUNNING_PROVEN" }
  | { readonly type: "STATUS_STOPPED_PROVEN" }
  | { readonly type: "STOP_COMMAND_ISSUED" }
  | { readonly type: "STOP_OUTCOME_UNCERTAIN" }
  | { readonly type: "UNEXPECTED_PROCESS_EXIT" };

export interface PrivatePostgresLifecycleTracker {
  readonly state: PrivatePostgresLifecycleState;
  readonly detail: PrivatePostgresLifecycleDetail;
  can(event: PrivatePostgresLifecycleEvent): boolean;
  send(event: PrivatePostgresLifecycleEvent): void;
}

const lifecycleMachine = setup({
  types: {
    events: {} as PrivatePostgresLifecycleEvent,
  },
}).createMachine({
  id: "private-postgres-lifecycle",
  initial: "stopped",
  states: {
    stopped: {
      on: {
        START_COMMAND_ISSUED: "startCommandPending",
      },
    },
    startCommandPending: {
      on: {
        START_COMMAND_SUCCEEDED: "startedPendingReady",
        START_OUTCOME_UNCERTAIN: "startOutcomeUncertain",
      },
    },
    startedPendingReady: {
      on: {
        READY_PROVEN: "ready",
        POST_START_PROOF_FAILED: "processUncertain",
      },
    },
    ready: {
      on: {
        RESTART_COMMAND_ISSUED: "startCommandPending",
        STOP_COMMAND_ISSUED: "stopping",
        UNEXPECTED_PROCESS_EXIT: "processUncertain",
      },
    },
    stopping: {
      on: {
        STATUS_STOPPED_PROVEN: "stopped",
        STOP_OUTCOME_UNCERTAIN: "processUncertain",
      },
    },
    startOutcomeUncertain: {
      on: {
        STATUS_RUNNING_PROVEN: "runningObservedUncertain",
      },
    },
    runningObservedUncertain: {
      on: {
        STOP_COMMAND_ISSUED: "stopping",
      },
    },
    processUncertain: {
      on: {
        STATUS_RUNNING_PROVEN: "runningObservedUncertain",
        STATUS_STOPPED_PROVEN: "stopped",
      },
    },
  },
});

type LifecycleSnapshot = SnapshotFrom<typeof lifecycleMachine>;

const semanticStateByDetail: Readonly<
  Record<PrivatePostgresLifecycleDetail, PrivatePostgresLifecycleState>
> = {
  stopped: "STOPPED",
  startCommandPending: "STARTING",
  startedPendingReady: "STARTING",
  ready: "READY",
  stopping: "STOPPING",
  startOutcomeUncertain: "UNCERTAIN",
  runningObservedUncertain: "UNCERTAIN",
  processUncertain: "UNCERTAIN",
};

function detailOf(snapshot: LifecycleSnapshot): PrivatePostgresLifecycleDetail {
  return snapshot.value as PrivatePostgresLifecycleDetail;
}

function invalidTransition(
  detail: PrivatePostgresLifecycleDetail,
  event: PrivatePostgresLifecycleEvent,
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "private-postgres.lifecycle.invalid_transition",
    category: "conflict",
    retryClass: "manual",
    title: "Private PostgreSQL lifecycle transition is invalid",
    detail: `The private PostgreSQL lifecycle cannot accept ${event.type} while it is ${detail}`,
  });
}

export function createPrivatePostgresLifecycleTracker(): PrivatePostgresLifecycleTracker {
  let snapshot = initialTransition(lifecycleMachine)[0];

  return {
    get state() {
      return semanticStateByDetail[detailOf(snapshot)];
    },
    get detail() {
      return detailOf(snapshot);
    },
    can(event) {
      return snapshot.can(event);
    },
    send(event) {
      const detail = detailOf(snapshot);
      if (!snapshot.can(event)) {
        throw invalidTransition(detail, event);
      }
      snapshot = transition(lifecycleMachine, snapshot, event)[0];
    },
  };
}
