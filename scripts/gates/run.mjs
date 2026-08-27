import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineGate, runGateGraph } from "@heptalogos/repo-kit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const node = (id, script, options = {}) =>
  defineGate({
    id,
    label: id,
    command: process.execPath,
    args: [script],
    ...options,
  });
const pnpm = (id, script, options = {}) =>
  defineGate({
    id,
    label: id,
    command: "pnpm",
    args: [script],
    ...options,
  });

const staticGates = () => [
  node("agents", ".agents/heptalogos/validate-skill-resources.mjs"),
  node("documentation", "scripts/verify/documentation.mjs"),
  node("repository", "scripts/verify/repository.mjs"),
  node("hygiene", "scripts/verify/current-tree-hygiene.mjs"),
  node("dependencies", "scripts/verify/dependencies.mjs"),
  node("boundaries", "scripts/verify/boundaries.mjs"),
  node("toolchain", "scripts/verify/toolchain.mjs"),
  pnpm("format:check", "format:check"),
  pnpm("lint", "lint"),
  pnpm("typecheck", "typecheck"),
  pnpm("tsc6", "tsc6"),
];

const repositoryGates = () => [
  node("agents", ".agents/heptalogos/validate-skill-resources.mjs"),
  node("documentation", "scripts/verify/documentation.mjs"),
  node("repository", "scripts/verify/repository.mjs"),
  node("hygiene", "scripts/verify/current-tree-hygiene.mjs"),
  node("dependencies", "scripts/verify/dependencies.mjs"),
  node("boundaries", "scripts/verify/boundaries.mjs"),
  node("toolchain", "scripts/verify/toolchain.mjs"),
];

function gatesForMode(mode) {
  if (mode === "static") return staticGates();
  if (mode === "repository") return repositoryGates();
  if (mode === "verify") {
    const gates = staticGates();
    const staticIds = gates.map((gate) => gate.id);
    return [
      ...gates,
      pnpm("test", "test", { needs: staticIds }),
      pnpm("build", "build", { needs: staticIds }),
    ];
  }
  throw new Error(`unsupported gate mode: ${mode}`);
}

function printResult(result) {
  const status = result.status.toUpperCase();
  const duration = `${result.durationMs}ms`;
  const exit = result.exitCode === null ? "-" : String(result.exitCode);
  console.log(`${status.padEnd(7)} ${result.id} (${duration}, exit=${exit})`);
  if (result.status === "failed" || result.status === "skipped") {
    const output = `${result.stdout}${result.stderr}`.trim();
    if (output) console.log(output);
  }
}

const mode = process.argv[2] ?? "verify";
try {
  const result = await runGateGraph({
    gates: gatesForMode(mode),
    cwd: root,
    concurrency: 4,
  });
  for (const entry of result.results) printResult(entry);
  console.log(result.ok ? `PASS gate graph: ${mode}` : `FAIL gate graph: ${mode}`);
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
