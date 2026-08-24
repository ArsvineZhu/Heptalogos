import type {
  BootId,
  InstallationId,
  InstanceId,
} from "@heptalogos/foundation-contracts";

export interface BootstrapKeyRequestContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly purpose:
    | "private-postgres-bootstrap-superuser"
    | "private-postgres-host-lease-role"
    | "private-postgres-runtime-role"
    | "private-postgres-migration-role";
}

export interface BootstrapKeyProvider {
  withPrivatePostgresBootstrapPassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
  withPrivatePostgresHostLeasePassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
  withPrivatePostgresRuntimePassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
  withPrivatePostgresMigrationPassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
