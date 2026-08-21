export const runtimeStatus = "GENESIS_READY" as const;

export type RuntimeNodeVersion = typeof process.version;

export function getRuntimeStatus(): typeof runtimeStatus {
  return runtimeStatus;
}
