/**
 * Encodes supervisor lifecycle legality with XState while exposing only the
 * Runtime Kernel transition semantics and failure outcomes.
 * @module supervisor-lifecycle
 */

import { initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import { runtimeKernelProblem } from "./problems.js";

type SupervisorLifecycleState =
  "ACTIVE" | "QUIESCING" | "QUIESCED" | "RESUMING" | "CLOSING" | "CLOSED";

type SupervisorLifecycleEvent =
  | { readonly type: "BEGIN_QUIESCE" }
  | { readonly type: "QUIESCE_COMPLETED" }
  | { readonly type: "BEGIN_RESUME" }
  | { readonly type: "RESUME_COMPLETED" }
  | { readonly type: "BEGIN_CLOSE" }
  | { readonly type: "CLOSE_COMPLETED" };

/** Provides validated lifecycle transition operations for Runtime supervision. */
export interface SupervisorLifecycleTracker {
  readonly state: SupervisorLifecycleState;
  /** Reports whether the supervisor can accept an event in its current state. */
  can(event: SupervisorLifecycleEvent): boolean;
  /** Advances supervision lifecycle or raises an invalid-transition Problem. */
  send(event: SupervisorLifecycleEvent): void;
}

const lifecycleMachine = setup({
  types: {
    events: {} as SupervisorLifecycleEvent,
  },
}).createMachine({
  id: "runtime-supervisor-lifecycle",
  initial: "active",
  states: {
    active: {
      on: {
        BEGIN_QUIESCE: "quiescing",
        BEGIN_CLOSE: "closing",
      },
    },
    quiescing: {
      on: {
        QUIESCE_COMPLETED: "quiesced",
        BEGIN_CLOSE: "closing",
      },
    },
    quiesced: {
      on: {
        BEGIN_RESUME: "resuming",
        BEGIN_CLOSE: "closing",
      },
    },
    resuming: {
      on: {
        RESUME_COMPLETED: "active",
        BEGIN_CLOSE: "closing",
      },
    },
    closing: {
      on: {
        CLOSE_COMPLETED: "closed",
      },
    },
    closed: {},
  },
});

type LifecycleSnapshot = SnapshotFrom<typeof lifecycleMachine>;

function stateOf(snapshot: LifecycleSnapshot): SupervisorLifecycleState {
  return snapshot.value.toUpperCase() as SupervisorLifecycleState;
}

function invalidTransition(
  state: SupervisorLifecycleState,
  event: SupervisorLifecycleEvent,
): ReturnType<typeof runtimeKernelProblem> {
  return runtimeKernelProblem(
    "runtime.supervisor.invalid_transition",
    `The Runtime supervisor cannot accept ${event.type} while it is ${state}`,
  );
}

/** Creates the XState-backed Runtime supervisor lifecycle tracker. */
export function createSupervisorLifecycleTracker(): SupervisorLifecycleTracker {
  let snapshot = initialTransition(lifecycleMachine)[0];

  return {
    get state() {
      return stateOf(snapshot);
    },
    can(event) {
      return snapshot.can(event);
    },
    send(event) {
      const state = stateOf(snapshot);
      if (!snapshot.can(event)) throw invalidTransition(state, event);
      snapshot = transition(lifecycleMachine, snapshot, event)[0];
    },
  };
}
