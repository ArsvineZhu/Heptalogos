#!/usr/bin/env node

/**
 * Runs an Nx verification entrypoint with quiet success output.
 *
 * Nx keeps the full task output useful for troubleshooting, but its nested
 * run-commands and Vitest summaries are too noisy for the normal repository
 * command path. Capture successful output here and expose it only through
 * the explicit --show-output escape hatch. Failures retain a bounded,
 * redacted diagnostic so the command remains actionable without replaying
 * every successful task.
 * @module run-nx
 */

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { runPnpm } from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const rawArgs = process.argv.slice(2);
const showOutput = rawArgs.includes("--show-output");
const forwardStdin = rawArgs.includes("--forward-stdin");
const nxArgs = rawArgs.filter(
  (argument) => argument !== "--show-output" && argument !== "--forward-stdin",
);
const commandLabel = nxArgs.join(" ").slice(0, 180);

function stripAnsi(value) {
  return value.replace(
    // oxlint-disable-next-line no-control-regex -- ANSI control bytes are the data being removed.
    /[\u001B\u009B][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]+)*)?\u0007|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/gu,
    "",
  );
}

function redact(value) {
  return value
    .replace(
      /((?:authorization|bearer|token|password|secret|api[-_]?key)\s*[:=]\s*)[^\s,;]+/giu,
      "$1<redacted>",
    )
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/giu, "$1<redacted>@");
}

function nonEmptyLines(value) {
  return stripAnsi(value)
    .split(/\r?\n/u)
    .map((line) => redact(line.trimEnd()))
    .filter((line) => line.trim().length > 0);
}

function boundedFailureDetail(stdout, stderr) {
  const lines = [...nonEmptyLines(stderr), ...nonEmptyLines(stdout)];
  const diagnosticLines = lines.filter((line) =>
    /\b(?:FAIL|FAILED|ERROR|Error|error|Assertion|Expected|Received|Problem)\b/u.test(
      line,
    ),
  );
  const selected = [...diagnosticLines.slice(-12), ...lines.slice(-20)];
  const unique = [...new Set(selected)].slice(-24);
  return unique.map((line) => line.slice(0, 360)).join("\n");
}

if (nxArgs.length === 0) {
  console.error("FAIL repository command: an Nx command is required");
  process.exitCode = 1;
} else {
  try {
    const quietEnvironment = {
      ...process.env,
      NO_COLOR: "1",
      NX_DEFAULT_OUTPUT_STYLE: "static",
    };
    // FORCE_COLOR wins over NO_COLOR even when set to "0", so remove it
    // instead of assigning another value that makes Node warn in every child.
    delete quietEnvironment.FORCE_COLOR;
    const result = await runPnpm(["exec", "nx", ...nxArgs], {
      cwd: root,
      env: quietEnvironment,
      stdin: forwardStdin ? "inherit" : "ignore",
    });

    if (showOutput) {
      if (result.stdout.length > 0) process.stdout.write(result.stdout);
      if (result.stderr.length > 0) process.stderr.write(result.stderr);
    }
    console.log(`PASS ${commandLabel}`);
  } catch (error) {
    const result = error?.result;
    const exitCode = result?.exitCode ?? 1;
    console.error(`FAIL ${commandLabel} (exit=${String(exitCode)})`);
    if (showOutput && result !== undefined) {
      if (result.stdout.length > 0) process.stdout.write(result.stdout);
      if (result.stderr.length > 0) process.stderr.write(result.stderr);
    } else if (result !== undefined) {
      const detail = boundedFailureDetail(result.stdout, result.stderr);
      if (detail.length > 0) console.error(detail);
    }
    process.exitCode = exitCode;
  }
}
