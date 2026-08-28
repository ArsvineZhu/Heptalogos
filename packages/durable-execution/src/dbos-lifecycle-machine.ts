/**
 * Keeps the DurableExecution lifecycle transitions in package-private XState
 * mechanics while exposing only the semantic state and event seam.
 * @module dbos-lifecycle-machine
 */

import { createActor, createMachine } from "xstate";
import type { DurableExecutionLifecycleState } from "./contracts.js";
import { durableExecutionProblem } from "./problems.js";

type DurableExecutionLifecycleEvent =
  | "START"
  | "START_SUCCEEDED"
  | "BEGIN_QUIESCE"
  | "QUIESCE_SUCCEEDED"
  | "BEGIN_RESUME"
  | "RESUME_SUCCEEDED"
  | "FAIL"
  | "BEGIN_CLOSE"
  | "CLOSED";

const lifecycleMachine = createMachine({
  id: "heptalogos-durable-execution",
  initial: "CREATED",
  states: {
    CREATED: { on: { START: "STARTING" } },
    STARTING: {
      on: { START_SUCCEEDED: "OPEN", FAIL: "FAILED" },
    },
    OPEN: {
      on: { BEGIN_QUIESCE: "QUIESCING", BEGIN_CLOSE: "CLOSING" },
    },
    QUIESCING: {
      on: { QUIESCE_SUCCEEDED: "QUIESCED", FAIL: "FAILED" },
    },
    QUIESCED: {
      on: { BEGIN_RESUME: "RESUMING", BEGIN_CLOSE: "CLOSING" },
    },
    RESUMING: {
      on: { RESUME_SUCCEEDED: "OPEN", FAIL: "FAILED" },
    },
    CLOSING: { on: { CLOSED: "CLOSED" } },
    CLOSED: {},
    FAILED: { on: { BEGIN_CLOSE: "CLOSING" } },
  },
});

/** Hides XState while exposing a bounded local lifecycle state machine. */
export interface DurableExecutionLifecycleMachine {
  readonly state: DurableExecutionLifecycleState;
  send(event: DurableExecutionLifecycleEvent): void;
  stop(): void;
}

function stateValue(value: unknown): DurableExecutionLifecycleState {
  if (
    value === "CREATED" ||
    value === "STARTING" ||
    value === "OPEN" ||
    value === "QUIESCING" ||
    value === "QUIESCED" ||
    value === "RESUMING" ||
    value === "CLOSING" ||
    value === "CLOSED" ||
    value === "FAILED"
  ) {
    return value;
  }
  throw durableExecutionProblem(
    "durable.execution.runtime.invalid_transition",
    "The DurableExecution lifecycle machine produced an unknown state",
  );
}

/** Creates one package-private XState-backed lifecycle machine. */
export function createDurableExecutionLifecycleMachine(): DurableExecutionLifecycleMachine {
  const actor = createActor(lifecycleMachine);
  actor.start();
  return {
    get state() {
      return stateValue(actor.getSnapshot().value);
    },
    send(event) {
      const before = stateValue(actor.getSnapshot().value);
      actor.send({ type: event });
      const after = stateValue(actor.getSnapshot().value);
      if (before === after) {
        throw durableExecutionProblem(
          "durable.execution.runtime.invalid_transition",
          `DurableExecution cannot apply ${event} while it is ${before}`,
        );
      }
    },
    stop() {
      actor.stop();
    },
  };
}
