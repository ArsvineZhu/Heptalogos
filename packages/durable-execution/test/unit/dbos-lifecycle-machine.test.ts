import { describe, expect, it } from "vitest";
import { createDurableExecutionLifecycleMachine } from "../../src/dbos-lifecycle-machine.js";

describe("DurableExecution lifecycle machine", () => {
  it("enforces the public startup, quiesce, resume, and close states", () => {
    const machine = createDurableExecutionLifecycleMachine();
    expect(machine.state).toBe("CREATED");

    machine.send("START");
    expect(machine.state).toBe("STARTING");
    machine.send("START_SUCCEEDED");
    expect(machine.state).toBe("OPEN");
    machine.send("BEGIN_QUIESCE");
    machine.send("QUIESCE_ABORTED");
    expect(machine.state).toBe("OPEN");
    machine.send("BEGIN_QUIESCE");
    machine.send("QUIESCE_SUCCEEDED");
    expect(machine.state).toBe("QUIESCED");
    machine.send("BEGIN_RESUME");
    machine.send("RESUME_SUCCEEDED");
    expect(machine.state).toBe("OPEN");
    machine.send("BEGIN_CLOSE");
    machine.send("CLOSED");
    expect(machine.state).toBe("CLOSED");
    machine.stop();
  });

  it("fails closed on illegal transitions and supports startup failure closure", () => {
    const machine = createDurableExecutionLifecycleMachine();
    machine.send("BEGIN_CLOSE");
    machine.send("CLOSED");
    expect(machine.state).toBe("CLOSED");
    machine.stop();

    const failed = createDurableExecutionLifecycleMachine();
    expect(() => failed.send("BEGIN_RESUME")).toThrowError(
      expect.objectContaining({
        problem: expect.objectContaining({
          problemCode: "durable.execution.runtime.invalid_transition",
        }),
      }),
    );
    failed.send("START");
    failed.send("FAIL");
    failed.send("BEGIN_CLOSE");
    failed.send("FAIL");
    expect(failed.state).toBe("FAILED");
    failed.send("BEGIN_CLOSE");
    failed.send("CLOSED");
    expect(failed.state).toBe("CLOSED");
    failed.stop();
  });
});
