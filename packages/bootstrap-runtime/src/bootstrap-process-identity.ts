import pidusage from "pidusage";

const PROCESS_START_IDENTITY_TOLERANCE_MS = 5_000;

export interface BootstrapProcessIdentity {
  readonly pid: number;
  readonly startedAtMs: number;
}

export type BootstrapProcessIdentityStatus =
  "SAME_PROCESS" | "PROCESS_DEAD" | "PID_REUSED" | "UNKNOWN";

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

function isDefinitelyMissingProcess(error: unknown): boolean {
  const code = errorCode(error);
  return code === "ESRCH" || code === "ENOENT";
}

export function currentBootstrapProcessIdentity(): BootstrapProcessIdentity {
  return {
    pid: process.pid,
    startedAtMs: Date.now() - process.uptime() * 1000,
  };
}

export async function inspectBootstrapProcessIdentity(
  expected: BootstrapProcessIdentity,
): Promise<BootstrapProcessIdentityStatus> {
  try {
    process.kill(expected.pid, 0);
  } catch (error) {
    return isDefinitelyMissingProcess(error) ? "PROCESS_DEAD" : "UNKNOWN";
  }

  try {
    const stats = await pidusage(expected.pid);
    if (
      stats.pid !== expected.pid ||
      !Number.isFinite(stats.timestamp) ||
      !Number.isFinite(stats.elapsed)
    ) {
      return "UNKNOWN";
    }
    const startedAtMs = stats.timestamp - stats.elapsed;
    return Math.abs(startedAtMs - expected.startedAtMs) <=
      PROCESS_START_IDENTITY_TOLERANCE_MS
      ? "SAME_PROCESS"
      : "PID_REUSED";
  } catch {
    return "UNKNOWN";
  }
}
