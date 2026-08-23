import { initialTransition, setup, transition, type SnapshotFrom } from "xstate";
import { ProblemError } from "@heptalogos/foundation-contracts";

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

export interface HostMaintenanceTracker {
  readonly state: HostMaintenanceState;
  can(event: HostMaintenanceEvent): boolean;
  assertCan(event: HostMaintenanceEvent): void;
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
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "bootstrap.maintenance.invalid_transition",
    category: "conflict",
    retryClass: "manual",
    title: "Host maintenance transition is invalid",
    detail: `Host maintenance cannot accept ${event.type} while it is ${state}`,
  });
}

export function createHostMaintenanceTracker(): HostMaintenanceTracker {
  let snapshot: Snapshot = initialTransition(machine)[0];
  const currentState = (): HostMaintenanceState =>
    stateByValue[String(snapshot.value)];
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
