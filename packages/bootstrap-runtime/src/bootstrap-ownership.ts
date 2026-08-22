import { createRequire } from "node:module";
import { join } from "node:path";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";
import type { ResolvedLifecycleRoot } from "./roots.js";

type ProperLockOptions = {
  readonly stale: number;
  readonly update: number;
  readonly retries: number;
  readonly realpath: boolean;
  readonly lockfilePath: string;
  readonly onCompromised: (error: Error) => void;
  readonly onReclaimed?: () => void;
};

type ProperLockfile = {
  lock(file: string, options: ProperLockOptions): Promise<() => Promise<void>>;
};

const require = createRequire(import.meta.url);
const properLockfile = require("@bybrave/proper-lockfile2") as ProperLockfile;

const BOOTSTRAP_LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";
const NO_AUTOMATIC_STALE_RECLAIM_MS = Number.MAX_SAFE_INTEGER;

export type BootstrapOwnershipState = "HELD" | "RELEASING" | "COMPROMISED" | "RELEASED";

export interface BootstrapOwnershipLease {
  readonly state: BootstrapOwnershipState;
  readonly signal: AbortSignal;
  assertHeld(): void;
  release(): Promise<void>;
}

export interface BootstrapOwnershipOptions {
  readonly heartbeatMs: number;
}

interface IssuedOwnershipRecord {
  readonly canonicalInstanceRoot: string;
  readonly assertHeld: () => void;
}

const issuedOwnership = new WeakMap<BootstrapOwnershipLease, IssuedOwnershipRecord>();

function ownershipProblem(
  problemCode: string,
  category: string,
  retryClass: Problem["retryClass"],
  title: string,
  detail: string,
): Problem {
  return {
    schemaVersion: 1,
    problemCode,
    category,
    retryClass,
    title,
    detail,
  };
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

function assertHeartbeat(heartbeatMs: number): void {
  if (!Number.isInteger(heartbeatMs) || heartbeatMs < 1000) {
    throw new ProblemError(
      ownershipProblem(
        "bootstrap.ownership.invalid_heartbeat",
        "validation",
        "manual",
        "Bootstrap ownership heartbeat is invalid",
        "Bootstrap ownership heartbeatMs must be an integer of at least 1000 milliseconds",
      ),
    );
  }
}

function lockPresentProblem(): Problem {
  return ownershipProblem(
    "bootstrap.ownership.lock_present",
    "conflict",
    "after-change",
    "Bootstrap ownership could not be acquired",
    "The instance bootstrap lock is present; it may belong to an active bootstrap attempt or require recovery",
  );
}

function compromisedProblem(): Problem {
  return ownershipProblem(
    "bootstrap.ownership.compromised",
    "integrity",
    "manual",
    "Bootstrap ownership was compromised",
    "The bootstrap ownership lease can no longer authorize mutation",
  );
}

function notHeldProblem(): Problem {
  return ownershipProblem(
    "bootstrap.ownership.not_held",
    "conflict",
    "after-change",
    "Bootstrap ownership is not held",
    "The bootstrap ownership lease is no longer held by this attempt",
  );
}

function invalidCapabilityProblem(): Problem {
  return ownershipProblem(
    "bootstrap.ownership.invalid_capability",
    "integrity",
    "manual",
    "Bootstrap ownership capability is invalid",
    "The bootstrap ownership capability was not issued by the bootstrap ownership adapter",
  );
}

function scopeMismatchProblem(): Problem {
  return ownershipProblem(
    "bootstrap.ownership.scope_mismatch",
    "conflict",
    "manual",
    "Bootstrap ownership scope does not match",
    "The bootstrap ownership capability is bound to a different instance",
  );
}

export function assertBootstrapOwnershipFor(
  lease: BootstrapOwnershipLease,
  canonicalInstanceRoot: string,
): void {
  const issued = issuedOwnership.get(lease);
  if (!issued) {
    throw new ProblemError(invalidCapabilityProblem());
  }
  if (issued.canonicalInstanceRoot !== canonicalInstanceRoot) {
    throw new ProblemError(scopeMismatchProblem());
  }
  issued.assertHeld();
}

export async function acquireBootstrapOwnership(
  instanceRoot: ResolvedLifecycleRoot,
  options: BootstrapOwnershipOptions,
): Promise<BootstrapOwnershipLease> {
  assertHeartbeat(options.heartbeatMs);

  let state: BootstrapOwnershipState = "HELD";
  let safeCompromisedCause: Problem | undefined;
  const abortController = new AbortController();
  const lockfilePath = join(instanceRoot.canonicalPath, BOOTSTRAP_LOCK_DIRECTORY);

  let releaseLock: () => Promise<void>;
  try {
    releaseLock = await properLockfile.lock(instanceRoot.canonicalPath, {
      stale: NO_AUTOMATIC_STALE_RECLAIM_MS,
      update: options.heartbeatMs,
      retries: 0,
      realpath: true,
      lockfilePath,
      onCompromised: () => {
        safeCompromisedCause = compromisedProblem();
        state = "COMPROMISED";
        abortController.abort();
      },
    });
  } catch (error) {
    if (errorCode(error) === "ELOCKED") {
      throw new ProblemError(lockPresentProblem());
    }
    throw new ProblemError(
      ownershipProblem(
        "bootstrap.ownership.acquire_failed",
        "unavailable",
        "manual",
        "Bootstrap ownership could not be acquired",
        "The bootstrap ownership lock could not be acquired",
      ),
    );
  }

  let releasePromise: Promise<void> | undefined;
  const internalAssertHeld = (): void => {
    if (state === "HELD") return;
    if (state === "COMPROMISED") {
      throw new ProblemError(safeCompromisedCause ?? compromisedProblem());
    }
    throw new ProblemError(notHeldProblem());
  };

  const lease: BootstrapOwnershipLease = {
    get state() {
      return state;
    },
    get signal() {
      return abortController.signal;
    },
    assertHeld: internalAssertHeld,
    release() {
      if (releasePromise) return releasePromise;
      if (state === "RELEASED") return Promise.resolve();
      const releaseLockIsRequired = state === "HELD";
      state = "RELEASING";
      abortController.abort();
      releasePromise = (async () => {
        if (!releaseLockIsRequired) {
          state = "RELEASED";
          return;
        }
        try {
          await releaseLock();
          if (safeCompromisedCause) {
            state = "COMPROMISED";
            throw new ProblemError(safeCompromisedCause);
          }
          state = "RELEASED";
        } catch {
          safeCompromisedCause ??= compromisedProblem();
          state = "COMPROMISED";
          throw new ProblemError(safeCompromisedCause);
        }
      })();
      return releasePromise;
    },
  };

  issuedOwnership.set(lease, {
    canonicalInstanceRoot: instanceRoot.canonicalPath,
    assertHeld: internalAssertHeld,
  });
  Object.freeze(lease);

  return lease;
}
