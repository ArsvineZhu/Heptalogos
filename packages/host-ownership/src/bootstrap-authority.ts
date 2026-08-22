/**
 * Framework-free capability used to guard bootstrap-authorized PostgreSQL
 * mutations. The bootstrap runtime adapts its authentic ownership lease to
 * this narrow seam; Host ownership never depends on the lock implementation.
 */
export interface BootstrapMutationAuthority {
  assertCurrent(): void;
}
