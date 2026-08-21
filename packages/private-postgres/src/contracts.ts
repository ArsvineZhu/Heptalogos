import type {
  ContentDigest,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export const PRIVATE_POSTGRES_ARCHITECTURE_MAJOR = 18 as const;
export const PRIVATE_POSTGRES_QUALIFIED_VERSION = "18.6" as const;
export const PRIVATE_POSTGRES_DATA_LAYOUT_VERSION = 1 as const;
export const PRIVATE_POSTGRES_RELATIVE_DATA_PATH = "private-postgres" as const;

export type PrivatePostgresInitializationProfileRevision =
  ContentDigest<"PrivatePostgresInitializationProfileRevision">;

export interface PrivatePostgresToolchain {
  readonly version: "18.6";
  readonly major: 18;
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
  readonly clusterSystemIdentifier: string;
  readonly postgresMajor: 18;
}

export interface PrivatePostgresExpectedIdentity {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly postgresMajor: 18;
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

export interface PrivatePostgresInitializationProfile {
  readonly encoding: "UTF8";
  readonly dataChecksums: true;
  readonly hostAuthentication: "scram-sha-256";
  readonly localAuthentication: "scram-sha-256";
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
  stop(): Promise<void>;
  restart(): Promise<void>;
}
