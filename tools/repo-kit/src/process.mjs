import { execa, execaSync } from "execa";

function text(value) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
}

function normalizeResult(command, args, result) {
  return {
    command,
    args: [...args],
    exitCode: result.exitCode ?? null,
    signal: result.signal ?? null,
    stdout: text(result.stdout),
    stderr: text(result.stderr),
    failed: result.failed,
  };
}

function throwProcessError(normalized) {
  const error = new Error(
    `Process failed: ${normalized.command} (exit=${String(normalized.exitCode)}, signal=${String(normalized.signal)})`,
  );
  error.result = normalized;
  throw error;
}

function execaOptions(options) {
  const { reject: _reject, ...rest } = options;
  return {
    ...rest,
    reject: false,
    shell: false,
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  };
}

export async function runProcess(command, args = [], options = {}) {
  const result = await execa(command, [...args], execaOptions(options));
  const normalized = normalizeResult(command, args, result);
  if (options.reject && normalized.failed) throwProcessError(normalized);
  return normalized;
}

export function runProcessChecked(command, args = [], options = {}) {
  return runProcess(command, args, { ...options, reject: options.reject ?? true });
}

export function runProcessSync(command, args = [], options = {}) {
  const result = execaSync(command, [...args], execaOptions(options));
  const normalized = normalizeResult(command, args, result);
  if (options.reject && normalized.failed) throwProcessError(normalized);
  return normalized;
}

export function runProcessSyncChecked(command, args = [], options = {}) {
  return runProcessSync(command, args, {
    ...options,
    reject: options.reject ?? true,
  });
}

export function runPnpm(args, options = {}) {
  return runProcessChecked("pnpm", args, options);
}

export function runNode(script, args = [], options = {}) {
  return runProcessChecked(process.execPath, [script, ...args], options);
}

export function runGitSync(args, options = {}) {
  return runProcessSyncChecked("git", args, options);
}
