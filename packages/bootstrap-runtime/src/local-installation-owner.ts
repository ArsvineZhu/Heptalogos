import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, lstat, open, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import {
  ProblemError,
  type InstallationId,
  type InstanceId,
  type Problem,
} from "@heptalogos/foundation-contracts";
import { loadBootstrapLocator } from "./locator.js";
import { resolveBootstrapPathProfile } from "./roots.js";

export interface LocalInstallationOwnerRecoveryPrincipal {
  readonly kind: "LOCAL_INSTALLATION_OWNER";
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
}

interface IssuedPrincipalScope {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly canonicalInstanceRoot: string;
}

const issuedPrincipals = new WeakMap<
  LocalInstallationOwnerRecoveryPrincipal,
  IssuedPrincipalScope
>();

function recoveryProblem(
  problemCode: string,
  category: Problem["category"],
  title: string,
  detail: string,
): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category,
    retryClass: "manual",
    title,
    detail,
  });
}

function isNodeCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function assertAnchorIsCanonicalDirectory(anchorRoot: string): Promise<void> {
  let entry;
  try {
    entry = await lstat(anchorRoot);
  } catch {
    throw recoveryProblem(
      "bootstrap.recovery.anchor_unavailable",
      "unavailable",
      "Installation anchor is unavailable",
      "The local recovery principal could not inspect the installation anchor",
    );
  }
  if (entry.isSymbolicLink()) {
    throw recoveryProblem(
      "bootstrap.recovery.anchor_link_rejected",
      "integrity",
      "Installation anchor alias is not accepted",
      "LOCAL_INSTALLATION_OWNER must be proven against the canonical installation anchor",
    );
  }
  if (!entry.isDirectory()) {
    throw recoveryProblem(
      "bootstrap.recovery.anchor_not_directory",
      "integrity",
      "Installation anchor is not a directory",
      "The local recovery principal requires a directory installation anchor",
    );
  }
}

async function assertPosixOwner(instanceRoot: string): Promise<void> {
  if (process.platform === "win32" || typeof process.geteuid !== "function") return;
  const euid = process.geteuid();
  if (euid === 0) return;
  const entry = await stat(instanceRoot);
  if (entry.uid !== euid) {
    throw recoveryProblem(
      "bootstrap.recovery.owner_mismatch",
      "integrity",
      "Installation owner does not match the target root",
      "The current POSIX effective user does not own the canonical INSTANCE root",
    );
  }
}

async function assertRootsReadable(roots: readonly string[]): Promise<void> {
  try {
    await Promise.all(roots.map((root) => access(root, constants.R_OK)));
  } catch {
    throw recoveryProblem(
      "bootstrap.recovery.root_unavailable",
      "unavailable",
      "Recovery roots are unavailable",
      "The local recovery principal could not access all bootstrap-relevant lifecycle roots",
    );
  }
}

async function proveInstanceWrite(instanceRoot: string): Promise<void> {
  const probePath = join(
    instanceRoot,
    `.heptalogos-recovery-owner-probe-${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let failure: unknown;
  try {
    handle = await open(
      probePath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await handle.writeFile("heptalogos-local-recovery-proof\n", "utf8");
    await handle.sync();
  } catch (error) {
    failure = error;
  } finally {
    await handle?.close().catch((error) => {
      failure ??= error;
    });
    try {
      await unlink(probePath);
    } catch (error) {
      if (!isNodeCode(error, "ENOENT")) failure ??= error;
    }
  }
  if (failure !== undefined) {
    throw recoveryProblem(
      "bootstrap.recovery.write_probe_failed",
      "unavailable",
      "Recovery write proof failed",
      "The local installation owner could not create, flush, and remove an exclusive proof file in INSTANCE root",
    );
  }
}

export async function proveLocalInstallationOwner(
  anchorRoot: string,
): Promise<LocalInstallationOwnerRecoveryPrincipal> {
  await assertAnchorIsCanonicalDirectory(anchorRoot);
  const locator = await loadBootstrapLocator(anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator);
  const instanceRoot = profile.resolve("INSTANCE").canonicalPath;
  await assertRootsReadable(profile.list().map((root) => root.canonicalPath));
  await assertPosixOwner(instanceRoot);
  await proveInstanceWrite(instanceRoot);

  const principal: LocalInstallationOwnerRecoveryPrincipal = Object.freeze({
    kind: "LOCAL_INSTALLATION_OWNER",
    installationId: locator.installationId,
    instanceId: locator.instanceId,
  });
  issuedPrincipals.set(principal, {
    installationId: locator.installationId,
    instanceId: locator.instanceId,
    canonicalInstanceRoot: instanceRoot,
  });
  return principal;
}

export function assertLocalInstallationOwnerFor(
  principal: LocalInstallationOwnerRecoveryPrincipal,
  installationId: InstallationId,
  instanceId: InstanceId,
  canonicalInstanceRoot: string,
): void {
  const issued = issuedPrincipals.get(principal);
  if (!issued || principal.kind !== "LOCAL_INSTALLATION_OWNER") {
    throw recoveryProblem(
      "bootstrap.recovery.invalid_principal",
      "integrity",
      "Local installation owner principal is invalid",
      "The recovery principal was not issued by the local installation owner proof boundary",
    );
  }
  if (
    issued.installationId !== installationId ||
    issued.instanceId !== instanceId ||
    issued.canonicalInstanceRoot !== canonicalInstanceRoot
  ) {
    throw recoveryProblem(
      "bootstrap.recovery.scope_mismatch",
      "conflict",
      "Local installation owner principal scope does not match",
      "The recovery principal is bound to a different installation, instance, or canonical root",
    );
  }
}
