/**
 * Encapsulates the Host maintenance lifecycle state machine and its bounded
 * transitions while keeping the adopted statechart behind Bootstrap contracts.
 * @module host-maintenance-machine
 */

import { initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import {
  createProblemError,
  type ProblemError,
} from "@heptalogos/foundation-contracts";

/** Enumerates the legal Host maintenance lifecycle states. */
export type HostMaintenanceState =
  | "PREPARED"
  | "QUIESCED"
  | "TOKEN_REVOKED"
  | "ENTERED"
  | "POSTGRES_STOPPED"
  | "POSTGRES_READY"
  | "HOST_LEASE_ACQUIRED"
  | "HOST_REACQUIRED"
  | "COMPLETED"
  | "ABORTED"
  | "RECOVERY_REQUIRED";

/** Describes one state transition admitted by the maintenance protocol. */
export type HostMaintenanceEvent =
  | { readonly type: "QUIESCENCE_PROVEN" }
  | { readonly type: "TOKEN_REVOKED" }
  | { readonly type: "WINDOW_ENTERED" }
  | { readonly type: "POSTGRES_STOPPED" }
  | { readonly type: "POSTGRES_READY" }
  | { readonly type: "HOST_LEASE_ACQUIRED" }
  | { readonly type: "HOST_REACQUIRED" }
  | { readonly type: "COMPLETED" }
  | { readonly type: "ABORTED" }
  | { readonly type: "RECOVERY_REQUIRED" };

/** Provides query and transition operations for the maintenance state machine. */
export interface HostMaintenanceTracker {
  readonly state: HostMaintenanceState;
  /** Reports whether the event is legal in the current state. */
  can(event: HostMaintenanceEvent): boolean;
  /** Throws a Problem when the event would violate maintenance ordering. */
  assertCan(event: HostMaintenanceEvent): void;
  /** Advances the tracker after validating the event against current state. */
  send(event: HostMaintenanceEvent): void;
}

const machine = setup({
  types: {
    events: {} as HostMaintenanceEvent,
  },
}).createMachine({
  id: "host-maintenance",
  initial: "prepared",
  states: {
    prepared: {
      on: {
        QUIESCENCE_PROVEN: "quiesced",
        ABORTED: "aborted",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    quiesced: {
      on: {
        TOKEN_REVOKED: "tokenRevoked",
        ABORTED: "aborted",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    tokenRevoked: {
      on: {
        WINDOW_ENTERED: "entered",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    entered: {
      on: {
        POSTGRES_STOPPED: "postgresStopped",
        COMPLETED: "completed",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    postgresStopped: {
      on: {
        POSTGRES_READY: "postgresReady",
        COMPLETED: "completed",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    postgresReady: {
      on: {
        HOST_LEASE_ACQUIRED: "hostLeaseAcquired",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    hostLeaseAcquired: {
      on: {
        HOST_REACQUIRED: "hostReacquired",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    hostReacquired: {
      on: {
        COMPLETED: "completed",
        RECOVERY_REQUIRED: "recoveryRequired",
      },
    },
    completed: {},
    aborted: {},
    recoveryRequired: {},
  },
});

type Snapshot = SnapshotFrom<typeof machine>;

const stateByValue: Readonly<Record<string, HostMaintenanceState>> = {
  prepared: "PREPARED",
  quiesced: "QUIESCED",
  tokenRevoked: "TOKEN_REVOKED",
  entered: "ENTERED",
  postgresStopped: "POSTGRES_STOPPED",
  postgresReady: "POSTGRES_READY",
  hostLeaseAcquired: "HOST_LEASE_ACQUIRED",
  hostReacquired: "HOST_REACQUIRED",
  completed: "COMPLETED",
  aborted: "ABORTED",
  recoveryRequired: "RECOVERY_REQUIRED",
};

function invalidTransition(
  state: HostMaintenanceState,
  event: HostMaintenanceEvent,
): ProblemError {
  return createProblemError({
    problemCode: "bootstrap.maintenance.invalid_transition",
    category: "conflict",
    retryClass: "manual",
    title: "Host maintenance transition is invalid",
    detail: `Host maintenance cannot accept ${event.type} while it is ${state}`,
  });
}

/** Creates a Host maintenance tracker backed by the adopted XState machine. */
export function createHostMaintenanceTracker(): HostMaintenanceTracker {
  let snapshot: Snapshot = initialTransition(machine)[0];
  const currentState = (): HostMaintenanceState => stateByValue[String(snapshot.value)];
  const assertCan = (event: HostMaintenanceEvent): void => {
    if (!snapshot.can(event)) throw invalidTransition(currentState(), event);
  };

  return {
    get state() {
      return currentState();
    },
    can(event) {
      return snapshot.can(event);
    },
    assertCan,
    send(event) {
      assertCan(event);
      snapshot = transition(machine, snapshot, event)[0];
    },
  };
}
