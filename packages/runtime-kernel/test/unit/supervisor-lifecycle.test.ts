import { describe, expect, it } from "vitest";
import { createSupervisorLifecycleTracker } from "../../src/supervisor-lifecycle.js";

describe("Runtime supervisor lifecycle", () => {
  it("accepts the quiesce and resume path", () => {
    const lifecycle = createSupervisorLifecycleTracker();

    lifecycle.send({ type: "BEGIN_QUIESCE" });
    lifecycle.send({ type: "QUIESCE_COMPLETED" });
    lifecycle.send({ type: "BEGIN_RESUME" });
    lifecycle.send({ type: "RESUME_COMPLETED" });

    expect(lifecycle.state).toBe("ACTIVE");
  });

  it("accepts close from each non-terminal phase and never reopens", () => {
    for (const events of [
      [{ type: "BEGIN_CLOSE" }],
      [{ type: "BEGIN_QUIESCE" }, { type: "BEGIN_CLOSE" }],
      [
        { type: "BEGIN_QUIESCE" },
        { type: "QUIESCE_COMPLETED" },
        { type: "BEGIN_CLOSE" },
      ],
      [
        { type: "BEGIN_QUIESCE" },
        { type: "QUIESCE_COMPLETED" },
        { type: "BEGIN_RESUME" },
        { type: "BEGIN_CLOSE" },
      ],
    ] as const) {
      const lifecycle = createSupervisorLifecycleTracker();
      for (const event of events) lifecycle.send(event);
      lifecycle.send({ type: "CLOSE_COMPLETED" });
      expect(lifecycle.state).toBe("CLOSED");
      expect(() => lifecycle.send({ type: "BEGIN_CLOSE" })).toThrow(
        "cannot accept BEGIN_CLOSE while it is CLOSED",
      );
    }
  });

  it("rejects illegal resume and completion transitions", () => {
    const lifecycle = createSupervisorLifecycleTracker();

    expect(() => lifecycle.send({ type: "BEGIN_RESUME" })).toThrow(
      "cannot accept BEGIN_RESUME while it is ACTIVE",
    );
    expect(lifecycle.can({ type: "QUIESCE_COMPLETED" })).toBe(false);
  });
});
