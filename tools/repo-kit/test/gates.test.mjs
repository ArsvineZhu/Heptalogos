import { describe, expect, it } from "vitest";
import { defineGate, runGateGraph, validateGateGraph } from "../src/gates.mjs";

const nodeGate = (id, script, options = {}) =>
  defineGate({
    id,
    label: id,
    command: process.execPath,
    args: ["-e", script],
    ...options,
  });

describe("repository gate graph", () => {
  it("runs independent gates concurrently", async () => {
    const events = [];
    const result = await runGateGraph({
      gates: [
        nodeGate("alpha", "setTimeout(() => process.stdout.write('alpha'), 220)"),
        nodeGate("beta", "setTimeout(() => process.stdout.write('beta'), 220)"),
      ],
      concurrency: 2,
      onResult: (entry) => events.push(entry.id),
    });

    expect(result.ok).toBe(true);
    expect(result.results.map((entry) => entry.id)).toEqual(["alpha", "beta"]);
    expect(new Set(events)).toEqual(new Set(["alpha", "beta"]));
    expect(
      Math.abs(result.results[0].startedAt - result.results[1].startedAt),
    ).toBeLessThan(180);
  });

  it("waits for needs dependencies before running a gate", async () => {
    const events = [];
    const result = await runGateGraph({
      gates: [
        nodeGate("consumer", "process.stdout.write('consumer')", {
          needs: ["producer"],
        }),
        nodeGate("producer", "setTimeout(() => process.stdout.write('producer'), 30)"),
      ],
      concurrency: 2,
      onResult: (entry) => events.push(entry.id),
    });

    expect(result.ok).toBe(true);
    expect(events).toEqual(["producer", "consumer"]);
    expect(result.results.find((entry) => entry.id === "consumer").stdout).toBe(
      "consumer",
    );
  });

  it("skips a gate whose needs dependency fails", async () => {
    const result = await runGateGraph({
      gates: [
        nodeGate("broken", "process.exit(7)"),
        nodeGate("blocked", "process.stdout.write('must not run')", {
          needs: ["broken"],
        }),
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.results.find((entry) => entry.id === "broken").status).toBe("failed");
    expect(result.results.find((entry) => entry.id === "blocked")).toMatchObject({
      status: "skipped",
      exitCode: null,
    });
  });

  it("runs an after gate after a failed dependency settles", async () => {
    const events = [];
    const result = await runGateGraph({
      gates: [
        nodeGate("cleanup", "process.stdout.write('cleanup')", {
          after: ["primary"],
        }),
        nodeGate("primary", "setTimeout(() => process.exit(9), 30)"),
      ],
      onResult: (entry) => events.push(entry.id),
    });

    expect(events).toEqual(["primary", "cleanup"]);
    expect(result.results.find((entry) => entry.id === "cleanup")).toMatchObject({
      status: "passed",
      stdout: "cleanup",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid graph relationships and cycles", () => {
    expect(() =>
      validateGateGraph([
        defineGate({ id: "duplicate", label: "one", command: "node" }),
        defineGate({ id: "duplicate", label: "two", command: "node" }),
      ]),
    ).toThrow(/duplicate gate id/u);

    expect(() =>
      validateGateGraph([
        defineGate({ id: "self", label: "self", command: "node", needs: ["self"] }),
      ]),
    ).toThrow(/self-dependency/u);

    expect(() =>
      validateGateGraph([
        defineGate({ id: "left", label: "left", command: "node", needs: ["right"] }),
        defineGate({ id: "right", label: "right", command: "node", needs: ["left"] }),
      ]),
    ).toThrow(/cycle/u);

    expect(() =>
      validateGateGraph([
        defineGate({
          id: "duplicate-edge",
          label: "duplicate-edge",
          command: "node",
          needs: ["other"],
          after: ["other"],
        }),
        defineGate({ id: "other", label: "other", command: "node" }),
      ]),
    ).toThrow(/both needs and after/u);
  });

  it("returns results in declared order despite parallel completion order", async () => {
    const result = await runGateGraph({
      gates: [
        nodeGate("slow", "setTimeout(() => process.stdout.write('slow'), 70)"),
        nodeGate("fast", "process.stdout.write('fast')"),
      ],
      concurrency: 2,
    });

    expect(result.results.map((entry) => entry.id)).toEqual(["slow", "fast"]);
    expect(result.results.map((entry) => entry.status)).toEqual(["passed", "passed"]);
  });
});
