import type {
  ContentDigest,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export const PRIVATE_POSTGRES_ARCHITECTURE_MAJOR = 18 as const;
export const PRIVATE_POSTGRES_QUALIFIED_VERSION = "18.6" as const;
export const PRIVATE_POSTGRES_DATA_LAYOUT_VERSION = 1 as const;
export const PRIVATE_POSTGRES_RELATIVE_DATA_PATH = "private-postgres" as const;
export const PRIVATE_POSTGRES_BOOTSTRAP_ROLE_NAME = "heptalogos_bootstrap" as const;

export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export interface PrivatePostgresToolchain {
  readonly version: typeof PRIVATE_POSTGRES_QUALIFIED_VERSION;
  readonly major: typeof PRIVATE_POSTGRES_ARCHITECTURE_MAJOR;
  readonly binDirectory: string;
  readonly postgres: string;
  readonly initdb: string;
  readonly pgCtl: string;
  readonly pgControldata: string;
  readonly pgIsReady: string;
}

export interface PrivatePostgresPlacement {
  readonly rootId: "DATA";
  readonly relativePath: "private-postgres";
  readonly dataLayoutVersion: 1;
  readonly canonicalDataDirectory: string;
}

export interface PrivatePostgresClusterIdentity {
  readonly bootstrapRoleName: string;
  readonly clusterSystemIdentifier: string;
  readonly postgresMajor: typeof PRIVATE_POSTGRES_ARCHITECTURE_MAJOR;
}

export interface PrivatePostgresExpectedIdentity {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly postgresMajor: typeof PRIVATE_POSTGRES_ARCHITECTURE_MAJOR;
  readonly bootstrapRoleName: string;
  readonly placement: Omit<PrivatePostgresPlacement, "canonicalDataDirectory">;
  readonly persistedPort: number;
  readonly clusterSystemIdentifier: string;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
}

export interface PrivatePostgresLifecycleOptions {
  readonly startupTimeoutMs: number;
  readonly shutdownTimeoutMs: number;
  readonly readinessPollIntervalMs: number;
}

export type PrivatePostgresControlGuard = () => void;

export type PrivatePostgresStartupDisposition =
  "STARTED_BY_THIS_BOOTSTRAP" | "ALREADY_RUNNING";

export interface PrivatePostgresInitializationProfile {
  readonly bootstrapRoleName: string;
  readonly encoding: "UTF8";
  readonly dataChecksums: true;
  readonly hostAuthentication: "scram-sha-256";
  readonly listenAddress: "127.0.0.1";
  readonly unixSocketDirectories: "";
  readonly persistedPort: number;
}

export interface PrivatePostgresInitializationResult {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly identity: PrivatePostgresClusterIdentity;
  readonly port: number;
  readonly initializationProfileRevision: PrivatePostgresInitializationProfileRevision;
  readonly dataPageChecksumVersion: number;
  readonly databaseClusterState: string;
  readonly catalogVersionNumber: string;
}

export interface ReadyPrivatePostgresMechanics {
  readonly toolchain: PrivatePostgresToolchain;
  readonly placement: PrivatePostgresPlacement;
  readonly identity: PrivatePostgresClusterIdentity;
  readonly port: number;
  readonly startupDisposition: PrivatePostgresStartupDisposition;
  stop(): Promise<void>;
  restart(): Promise<void>;
}
