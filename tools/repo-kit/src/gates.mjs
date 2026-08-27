import { runProcess } from "./process.mjs";

function list(value, name) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new TypeError(`${name} must be an array of strings`);
  }
  return [...value];
}

export function defineGate(spec) {
  if (spec === null || typeof spec !== "object") {
    throw new TypeError("gate specification must be an object");
  }

  return {
    ...spec,
    needs: list(spec.needs, "needs"),
    after: list(spec.after, "after"),
    args: spec.args === undefined ? [] : [...spec.args],
    allowFailure: spec.allowFailure === true,
  };
}

export function validateGateGraph(gates) {
  if (!Array.isArray(gates)) {
    throw new TypeError("gates must be an array");
  }

  const byId = new Map();
  for (const gate of gates) {
    if (gate === null || typeof gate !== "object") {
      throw new TypeError("each gate must be an object");
    }
    if (typeof gate.id !== "string" || gate.id.trim() === "") {
      throw new TypeError("gate id must be a non-empty string");
    }
    if (byId.has(gate.id)) {
      throw new Error(`duplicate gate id: ${gate.id}`);
    }
    if (typeof gate.command !== "string" || gate.command.trim() === "") {
      throw new TypeError(`gate command must be non-empty: ${gate.id}`);
    }
    if (
      gate.args !== undefined &&
      (!Array.isArray(gate.args) || gate.args.some((arg) => typeof arg !== "string"))
    ) {
      throw new TypeError(`gate args must be an array of strings: ${gate.id}`);
    }

    const needs = list(gate.needs, "needs");
    const after = list(gate.after, "after");
    const needsSet = new Set(needs);
    for (const dependency of after) {
      if (needsSet.has(dependency)) {
        throw new Error(
          `gate relationship appears in both needs and after: ${gate.id} -> ${dependency}`,
        );
      }
    }
    for (const dependency of [...needs, ...after]) {
      if (dependency === gate.id) {
        throw new Error(`gate self-dependency: ${gate.id}`);
      }
    }
    byId.set(gate.id, { ...gate, needs, after });
  }

  for (const gate of byId.values()) {
    for (const dependency of [...gate.needs, ...gate.after]) {
      if (!byId.has(dependency)) {
        throw new Error(`missing gate dependency: ${gate.id} -> ${dependency}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new Error(`gate dependency cycle detected at: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const gate = byId.get(id);
    for (const dependency of [...gate.needs, ...gate.after]) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) visit(id);

  return [...byId.values()];
}

function skippedResult(gate, reason) {
  const now = Date.now();
  return {
    id: gate.id,
    label: gate.label ?? gate.id,
    status: "skipped",
    exitCode: null,
    signal: null,
    stdout: "",
    stderr: reason,
    durationMs: 0,
    startedAt: now,
    finishedAt: now,
    allowFailure: gate.allowFailure === true,
  };
}

async function executeGate(gate, cwd) {
  const startedAt = Date.now();
  const start = performance.now();
  let processResult;
  try {
    processResult = await runProcess(gate.command, gate.args ?? [], {
      cwd,
      env: { ...process.env, ...(gate.env ?? {}) },
      reject: false,
    });
  } catch (error) {
    processResult = {
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      failed: true,
    };
  }

  return {
    id: gate.id,
    label: gate.label ?? gate.id,
    status: processResult.failed ? "failed" : "passed",
    exitCode: processResult.exitCode ?? null,
    signal: processResult.signal ?? null,
    stdout: processResult.stdout ?? "",
    stderr: processResult.stderr ?? "",
    durationMs: Math.round(performance.now() - start),
    startedAt,
    finishedAt: Date.now(),
    allowFailure: gate.allowFailure === true,
  };
}

export async function runGateGraph({
  gates,
  concurrency = 1,
  cwd = process.cwd(),
  executeGate: executeGateFn = executeGate,
  onResult,
} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError(
      "gate concurrency must be an integer greater than or equal to 1",
    );
  }
  if (typeof executeGateFn !== "function") {
    throw new TypeError("executeGate must be a function");
  }

  const validated = validateGateGraph(gates ?? []);
  const byId = new Map(validated.map((gate) => [gate.id, gate]));
  const state = new Map(validated.map((gate) => [gate.id, "pending"]));
  const settled = new Map();
  const running = new Map();

  const publish = async (result) => {
    settled.set(result.id, result);
    state.set(result.id, "settled");
    if (onResult !== undefined) await onResult(result);
  };

  while (settled.size < validated.length) {
    let madeProgress = false;
    for (const gate of validated) {
      if (state.get(gate.id) !== "pending") continue;
      const dependencies = [...gate.needs, ...gate.after];
      if (!dependencies.every((dependency) => settled.has(dependency))) continue;

      const failedNeed = gate.needs.find(
        (dependency) => settled.get(dependency).status !== "passed",
      );
      if (failedNeed !== undefined) {
        await publish(
          skippedResult(
            gate,
            `skipped because needs dependency did not pass: ${failedNeed}`,
          ),
        );
        madeProgress = true;
        continue;
      }

      if (running.size >= concurrency) continue;
      state.set(gate.id, "running");
      const task = executeGateFn(gate, cwd).then(async (result) => {
        await publish(result);
        return result;
      });
      running.set(gate.id, task);
      madeProgress = true;
    }

    if (running.size > 0) {
      const completed = await Promise.race(
        [...running.entries()].map(async ([id, task]) => ({
          id,
          result: await task,
        })),
      );
      running.delete(completed.id);
      continue;
    }

    if (!madeProgress && settled.size < validated.length) {
      throw new Error("gate graph could not make progress");
    }
  }

  const results = validated.map((gate) => settled.get(gate.id));
  const ok = results.every(
    (result) =>
      result.status === "passed" ||
      (result.status === "failed" && result.allowFailure === true),
  );
  return { ok, results };
}
