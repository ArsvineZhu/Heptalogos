export const LIFECYCLE_ROOT_IDS = [
  "PROGRAM",
  "INSTANCE",
  "CONFIGURATION",
  "DATA",
  "SECRET",
  "BLOB",
  "BACKUP",
  "LOG",
  "CACHE",
  "TEMP",
  "RUN",
  "PACKAGE_STAGING",
] as const;

export type LifecycleRootId = (typeof LIFECYCLE_ROOT_IDS)[number];
