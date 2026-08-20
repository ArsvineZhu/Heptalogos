import { execa } from "execa";

export async function runProcess(command, args = [], options = {}) {
  const { reject = false, ...execaOptions } = options;
  const result = await execa(command, [...args], {
    ...execaOptions,
    reject: false,
    shell: false,
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });

  const normalized = {
    command,
    args: [...args],
    exitCode: result.exitCode ?? null,
    signal: result.signal ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    failed: result.failed,
  };

  if (reject && normalized.failed) {
    const error = new Error(
      `Process failed: ${command} (exit=${String(normalized.exitCode)}, signal=${String(normalized.signal)})`,
    );
    error.result = normalized;
    throw error;
  }

  return normalized;
}

export function runProcessChecked(command, args = [], options = {}) {
  return runProcess(command, args, { ...options, reject: options.reject ?? true });
}

export function runPnpm(args, options = {}) {
  return runProcessChecked("pnpm", args, options);
}

export function runNode(script, args = [], options = {}) {
  return runProcessChecked(process.execPath, [script, ...args], options);
}
