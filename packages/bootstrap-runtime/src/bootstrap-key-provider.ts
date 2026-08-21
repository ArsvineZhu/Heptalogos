import type { BootId, InstallationId, InstanceId } from "@heptalogos/foundation-contracts";

export interface BootstrapKeyRequestContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly purpose: "private-postgres-bootstrap-superuser";
}

export interface BootstrapKeyProvider {
  withPrivatePostgresBootstrapPassword<T>(
    context: BootstrapKeyRequestContext,
    use: (passwordUtf8: Uint8Array) => Promise<T>,
  ): Promise<T>;
}
