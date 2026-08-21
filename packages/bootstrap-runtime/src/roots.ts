import { lstat, realpath } from "node:fs/promises";
import {
  LIFECYCLE_ROOT_IDS,
  ProblemError,
  type InstallationId,
  type InstanceId,
  type LifecycleRootId,
} from "@heptalogos/foundation-contracts";
import type { BootstrapLocatorV1 } from "./locator.js";

export interface ResolvedLifecycleRoot {
  readonly id: LifecycleRootId;
  readonly configuredPath: string;
  readonly canonicalPath: string;
}

export interface BootstrapPathProfile {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  resolve(root: LifecycleRootId): ResolvedLifecycleRoot;
  list(): readonly ResolvedLifecycleRoot[];
}

function rootProblem(problemCode: string, title: string, detail: string): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "manual",
    title,
    detail,
  });
}

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function resolveRoot(
  id: LifecycleRootId,
  configuredPath: string,
): Promise<ResolvedLifecycleRoot> {
  let entry: Awaited<ReturnType<typeof lstat>>;
  try {
    entry = await lstat(configuredPath);
  } catch (error) {
    if (hasCode(error, "ENOENT")) {
      throw rootProblem(
        "bootstrap.root.not_found",
        "Bootstrap lifecycle root is missing",
        `Configured lifecycle root ${id} does not exist`,
      );
    }
    throw rootProblem(
      "bootstrap.root.realpath_failed",
      "Bootstrap lifecycle root could not be inspected",
      `Configured lifecycle root ${id} could not be inspected`,
    );
  }

  if (entry.isSymbolicLink()) {
    throw rootProblem(
      "bootstrap.root.link_rejected",
      "Bootstrap lifecycle root link is not accepted",
      `Configured lifecycle root ${id} must not be a terminal symlink or junction`,
    );
  }
  if (!entry.isDirectory()) {
    throw rootProblem(
      "bootstrap.root.not_directory",
      "Bootstrap lifecycle root is not a directory",
      `Configured lifecycle root ${id} is not a directory`,
    );
  }

  let canonicalPath: string;
  try {
    canonicalPath = await realpath(configuredPath);
  } catch {
    throw rootProblem(
      "bootstrap.root.realpath_failed",
      "Bootstrap lifecycle root could not be canonicalized",
      `Configured lifecycle root ${id} could not be canonicalized`,
    );
  }

  // M2 verifies the configured terminal entry only. Parent-component TOCTOU and
  // every Windows reparse-point class remain platform-qualification boundaries.
  return { id, configuredPath, canonicalPath };
}

export async function resolveBootstrapPathProfile(
  locator: BootstrapLocatorV1,
): Promise<BootstrapPathProfile> {
  const resolvedRoots = await Promise.all(
    LIFECYCLE_ROOT_IDS.map((id) => resolveRoot(id, locator.roots[id])),
  );
  const roots = Object.freeze([...resolvedRoots]);
  const byId = new Map(roots.map((root) => [root.id, root]));

  return {
    installationId: locator.installationId,
    instanceId: locator.instanceId,
    resolve(root: LifecycleRootId): ResolvedLifecycleRoot {
      const resolved = byId.get(root);
      if (!resolved) {
        throw rootProblem(
          "bootstrap.root.not_found",
          "Bootstrap lifecycle root is not available",
          `Lifecycle root ${root} is not available in the bootstrap path profile`,
        );
      }
      return resolved;
    },
    list(): readonly ResolvedLifecycleRoot[] {
      return roots;
    },
  };
}
