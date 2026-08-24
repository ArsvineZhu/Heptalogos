import { join } from "node:path";
import {
  BootstrapJournal,
  BootstrapStateStore,
  type BootstrapActivityId,
  type BootstrapRuntimeGenerationId,
  type BootstrapJournalCheckpointV1,
  type BootstrapStateEnvelope,
  type BootstrapStateLoadResult,
  type BootstrapStageOutcome,
  type ProductGenerationId,
} from "@heptalogos/bootstrap-state";
import {
  createBootId,
  createContinuityEpochId,
  createUuidV7Id,
  ProblemError,
  type BootId,
  type InstallationId,
  type InstanceId,
} from "@heptalogos/foundation-contracts";
import { loadBootstrapLocator, type BootstrapLocatorV1 } from "./locator.js";
import { resolveBootstrapPathProfile, type BootstrapPathProfile } from "./roots.js";
import {
  acquireBootstrapOwnership,
  assertBootstrapOwnershipFor,
  type BootstrapOwnershipLease,
  type BootstrapOwnershipOptions,
} from "./bootstrap-ownership.js";
import {
  openBootstrapStateAccess,
  type OwnedBootstrapStateStore,
} from "./bootstrap-state-access.js";
import { inspectMaintenanceObligation } from "./maintenance-obligation.js";
import {
  createPrivatePostgresSessionTracker,
  assertReadyPrivatePostgresSession,
  preparePrivatePostgresForOwnedPrelude,
  type PreparePrivatePostgresOptions,
  type ReadyPrivatePostgres,
} from "./private-postgres-bootstrap.js";
import {
  handoffPrivatePostgresToManagedHostForOwnedPrelude,
  type HostOwnershipHandoffOptions,
} from "./host-ownership-handoff.js";
import type { BootstrapManagedHostContext } from "./managed-host.js";

export interface PreparedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
  readonly preliminaryState: BootstrapStateLoadResult;
  acquireOwnership(
    options: Omit<BootstrapOwnershipOptions, "bootId">,
  ): Promise<OwnedBootstrapPrelude>;
}

export interface OwnedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly ownershipState: BootstrapOwnershipLease["state"];
  readonly ownershipSignal: AbortSignal;
  readonly state: OwnedBootstrapStateStore;
  readonly authoritativeState: BootstrapStateLoadResult;
  ensureBootstrapStateInitialized(
    selection: BootstrapStateGenesisSelection,
  ): Promise<BootstrapStateEnvelope>;
  preparePrivatePostgres(
    options: PreparePrivatePostgresOptions,
  ): Promise<ReadyPrivatePostgres>;
  handoffPrivatePostgresToHost(
    ready: ReadyPrivatePostgres,
    options: HostOwnershipHandoffOptions,
  ): Promise<BootstrapManagedHostContext>;
  close(): Promise<void>;
}

export interface BootstrapStateGenesisSelection {
  readonly activeBootstrapRuntimeGeneration: BootstrapRuntimeGenerationId;
  readonly activeProductGeneration: ProductGenerationId;
  readonly lastKnownGoodProductGeneration?: ProductGenerationId;
}

const BOOTSTRAP_STATE_DIRECTORY = "bootstrap-state";
const BOOTSTRAP_PRELUDE_ROOTS = ["INSTANCE", "DATA", "LOG", "TEMP"] as const;
const STAGE_PRELUDE_STARTED = "bootstrap.prelude.started";
const STAGE_LOCATOR_RESOLVED = "bootstrap.locator.resolved";
const STAGE_ROOTS_RESOLVED = "bootstrap.roots.resolved";
const STAGE_STATE_PRELIMINARY_READ = "bootstrap.state.preliminary_read";
const STAGE_OWNERSHIP_ACQUIRED = "bootstrap.ownership.acquired";
const STAGE_OWNERSHIP_BLOCKED = "bootstrap.ownership.blocked";
const STAGE_STATE_AUTHORITATIVE_RELOAD = "bootstrap.state.authoritative_reload";
const STAGE_PRELUDE_OWNED = "bootstrap.prelude.owned";
const STAGE_PRELUDE_RELEASED = "bootstrap.prelude.released";

function instant(): string {
  return new Date().toISOString();
}

function problemCodeOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("problem" in error)) {
    return undefined;
  }
  const problem = error.problem;
  if (typeof problem !== "object" || problem === null || !("problemCode" in problem)) {
    return undefined;
  }
  return typeof problem.problemCode === "string" ? problem.problemCode : undefined;
}

function currentBootstrapStateAuthorityRequired(): ProblemError {
  return new ProblemError({
    schemaVersion: 1,
    problemCode: "bootstrap.state.current_authority_required",
    category: "integrity",
    retryClass: "manual",
    title: "Current BootstrapState authority is required",
    detail:
      "A recovered previous BootstrapState revision is inspection evidence only and cannot authorize bootstrap",
  });
}

function assertMaintenanceObligationClear(
  obligation: Awaited<ReturnType<typeof inspectMaintenanceObligation>>,
): void {
  if (obligation.problem !== undefined) {
    throw new ProblemError(obligation.problem);
  }
  if (!obligation.incomplete) return;
  throw new ProblemError({
    schemaVersion: 1,
    problemCode: "bootstrap.recovery.maintenance_required",
    category: "conflict",
    retryClass: "manual",
    title: "Incomplete maintenance recovery is required",
    detail:
      obligation.operationId === undefined
        ? "BootstrapState references an incomplete maintenance obligation that must be recovered before normal bootstrap"
        : `MaintenanceJournal operation ${obligation.operationId} is incomplete and must be recovered before normal bootstrap`,
  });
}

function checkpoint(
  installationId: InstallationId,
  instanceId: InstanceId,
  bootId: BootId,
  bootstrapActivityId: BootstrapActivityId,
  stage: string,
  at: string,
  outcome: BootstrapStageOutcome,
  problemCode?: string,
): BootstrapJournalCheckpointV1 {
  return {
    schemaVersion: 1,
    bootId,
    bootstrapActivityId,
    installationId,
    instanceId,
    stage,
    at,
    outcome,
    ...(problemCode ? { problemCode } : {}),
  };
}

async function record(
  journal: BootstrapJournal,
  installationId: InstallationId,
  instanceId: InstanceId,
  bootId: BootId,
  bootstrapActivityId: BootstrapActivityId,
  stage: string,
  at: string,
  outcome: BootstrapStageOutcome,
  problemCode?: string,
): Promise<void> {
  await journal.checkpoint(
    checkpoint(
      installationId,
      instanceId,
      bootId,
      bootstrapActivityId,
      stage,
      at,
      outcome,
      problemCode,
    ),
  );
}

async function loadPreliminaryState(
  paths: BootstrapPathProfile,
): Promise<BootstrapStateLoadResult> {
  const instanceRoot = paths.resolve("INSTANCE").canonicalPath;
  return new BootstrapStateStore(join(instanceRoot, BOOTSTRAP_STATE_DIRECTORY)).load();
}

interface OwnedPreludeMaterializationContext {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
}

async function materializeOwnedBootstrapPrelude(
  context: OwnedPreludeMaterializationContext,
  ownership: BootstrapOwnershipLease,
): Promise<OwnedBootstrapPrelude> {
  try {
    const access = openBootstrapStateAccess(context.paths, ownership);
    let authoritativeState = await access.state.load();
    if (authoritativeState.status === "RECOVERED_PREVIOUS") {
      throw currentBootstrapStateAuthorityRequired();
    }
    await inspectMaintenanceObligation(
      context.paths.resolve("INSTANCE").canonicalPath,
      authoritativeState,
    ).then(assertMaintenanceObligationClear);
    const privatePostgresSession = createPrivatePostgresSessionTracker();
    await record(
      context.journal,
      context.installationId,
      context.instanceId,
      context.bootId,
      context.bootstrapActivityId,
      STAGE_STATE_AUTHORITATIVE_RELOAD,
      instant(),
      "SUCCEEDED",
    );
    await record(
      context.journal,
      context.installationId,
      context.instanceId,
      context.bootId,
      context.bootstrapActivityId,
      STAGE_PRELUDE_OWNED,
      instant(),
      "SUCCEEDED",
    );

    let closePromise: Promise<void> | undefined;
    return {
      installationId: context.installationId,
      instanceId: context.instanceId,
      bootId: context.bootId,
      bootstrapActivityId: context.bootstrapActivityId,
      paths: context.paths,
      get ownershipState() {
        return ownership.state;
      },
      get ownershipSignal() {
        return ownership.signal;
      },
      state: access.state,
      get authoritativeState() {
        return authoritativeState;
      },
      async ensureBootstrapStateInitialized(
        selection: BootstrapStateGenesisSelection,
      ): Promise<BootstrapStateEnvelope> {
        assertBootstrapOwnershipFor(
          ownership,
          context.paths.resolve("INSTANCE").canonicalPath,
        );
        const current = await access.state.load();
        if (current.status === "CORRUPT") {
          throw new ProblemError(current.problem);
        }
        if (current.status === "RECOVERED_PREVIOUS") {
          throw currentBootstrapStateAuthorityRequired();
        }
        if (current.status === "CURRENT") {
          authoritativeState = current;
          return current.value;
        }

        assertBootstrapOwnershipFor(
          ownership,
          context.paths.resolve("INSTANCE").canonicalPath,
        );
        const committed = await access.state.commit({
          schemaVersion: 1,
          revision: 1,
          activeBootstrapRuntimeGeneration: selection.activeBootstrapRuntimeGeneration,
          activeProductGeneration: selection.activeProductGeneration,
          ...(selection.lastKnownGoodProductGeneration === undefined
            ? {}
            : {
                lastKnownGoodProductGeneration:
                  selection.lastKnownGoodProductGeneration,
              }),
          continuityEpochId: createContinuityEpochId(),
        });
        authoritativeState = { status: "CURRENT", value: committed };
        return committed;
      },
      preparePrivatePostgres(options: PreparePrivatePostgresOptions) {
        return preparePrivatePostgresForOwnedPrelude(
          {
            installationId: context.installationId,
            instanceId: context.instanceId,
            bootId: context.bootId,
            bootstrapActivityId: context.bootstrapActivityId,
            paths: context.paths,
            ownership,
            state: access.state,
            journal: context.journal,
            privatePostgresSession,
          },
          options,
        );
      },
      handoffPrivatePostgresToHost(
        ready: ReadyPrivatePostgres,
        options: HostOwnershipHandoffOptions,
      ) {
        return handoffPrivatePostgresToManagedHostForOwnedPrelude(
          {
            installationId: context.installationId,
            instanceId: context.instanceId,
            bootId: context.bootId,
            bootstrapActivityId: context.bootstrapActivityId,
            paths: context.paths,
            ownership,
            assertOwnership: () =>
              assertBootstrapOwnershipFor(
                ownership,
                context.paths.resolve("INSTANCE").canonicalPath,
              ),
            state: access.state,
            journal: context.journal,
            privatePostgresSession,
            assertReady: (candidate) =>
              assertReadyPrivatePostgresSession(candidate, privatePostgresSession),
          },
          ready,
          options,
        );
      },
      close(): Promise<void> {
        if (closePromise) return closePromise;
        if (ownership.state === "RELEASED") return Promise.resolve();
        try {
          privatePostgresSession.assertReleaseAllowed();
        } catch (error) {
          return Promise.reject(error);
        }
        const current = (async () => {
          await ownership.release();
          await record(
            context.journal,
            context.installationId,
            context.instanceId,
            context.bootId,
            context.bootstrapActivityId,
            STAGE_PRELUDE_RELEASED,
            instant(),
            "SUCCEEDED",
          );
        })();
        closePromise = current;
        void current.catch(() => {
          if (closePromise === current) closePromise = undefined;
        });
        return current;
      },
    };
  } catch (error) {
    await ownership.release();
    throw error;
  }
}

export interface RecoveredBootstrapPreludeIdentity {
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
}

export async function adoptRecoveredBootstrapOwnershipForPrelude(
  anchorRoot: string,
  ownership: BootstrapOwnershipLease,
  identity: RecoveredBootstrapPreludeIdentity,
): Promise<OwnedBootstrapPrelude> {
  try {
    const locator = await loadBootstrapLocator(anchorRoot);
    const paths = await resolveBootstrapPathProfile(locator, BOOTSTRAP_PRELUDE_ROOTS);
    const instanceRoot = paths.resolve("INSTANCE").canonicalPath;
    assertBootstrapOwnershipFor(ownership, instanceRoot);
    const journal = new BootstrapJournal(instanceRoot);
    return await materializeOwnedBootstrapPrelude(
      {
        installationId: locator.installationId,
        instanceId: locator.instanceId,
        bootId: identity.bootId,
        bootstrapActivityId: identity.bootstrapActivityId,
        paths,
        journal,
      },
      ownership,
    );
  } catch (error) {
    if (ownership.state !== "RELEASED") await ownership.release();
    throw error;
  }
}

export async function prepareBootstrapPrelude(
  anchorRoot: string,
): Promise<PreparedBootstrapPrelude> {
  const bootId = createBootId();
  const bootstrapActivityId = createUuidV7Id("ActivityId");
  const startedAt = instant();

  const locator: BootstrapLocatorV1 = await loadBootstrapLocator(anchorRoot);
  const locatorResolvedAt = instant();
  const paths = await resolveBootstrapPathProfile(locator, BOOTSTRAP_PRELUDE_ROOTS);
  const rootsResolvedAt = instant();
  const installationId = locator.installationId;
  const instanceId = locator.instanceId;
  const journal = new BootstrapJournal(paths.resolve("INSTANCE").canonicalPath);

  await record(
    journal,
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId,
    STAGE_PRELUDE_STARTED,
    startedAt,
    "STARTED",
  );
  await record(
    journal,
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId,
    STAGE_LOCATOR_RESOLVED,
    locatorResolvedAt,
    "SUCCEEDED",
  );
  await record(
    journal,
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId,
    STAGE_ROOTS_RESOLVED,
    rootsResolvedAt,
    "SUCCEEDED",
  );

  let preliminaryState: BootstrapStateLoadResult;
  try {
    preliminaryState = await loadPreliminaryState(paths);
    if (preliminaryState.status === "RECOVERED_PREVIOUS") {
      throw currentBootstrapStateAuthorityRequired();
    }
    await inspectMaintenanceObligation(
      paths.resolve("INSTANCE").canonicalPath,
      preliminaryState,
    ).then(assertMaintenanceObligationClear);
  } catch (error) {
    await record(
      journal,
      installationId,
      instanceId,
      bootId,
      bootstrapActivityId,
      STAGE_STATE_PRELIMINARY_READ,
      instant(),
      "FAILED",
      problemCodeOf(error),
    );
    throw error;
  }
  await record(
    journal,
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId,
    STAGE_STATE_PRELIMINARY_READ,
    instant(),
    "SUCCEEDED",
  );

  let acquisition: Promise<OwnedBootstrapPrelude> | undefined;
  const acquireOwnershipForPrelude = (
    options: Omit<BootstrapOwnershipOptions, "bootId">,
  ): Promise<OwnedBootstrapPrelude> => {
    if (acquisition) return acquisition;
    const current = acquireOwnedPrelude(options);
    acquisition = current;
    void current.catch(() => {
      if (acquisition === current) acquisition = undefined;
    });
    return current;
  };

  async function acquireOwnedPrelude(
    options: Omit<BootstrapOwnershipOptions, "bootId">,
  ): Promise<OwnedBootstrapPrelude> {
    let ownership: BootstrapOwnershipLease;
    try {
      ownership = await acquireBootstrapOwnership(paths.resolve("INSTANCE"), {
        ...options,
        bootId,
      });
    } catch (error) {
      await record(
        journal,
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        STAGE_OWNERSHIP_BLOCKED,
        instant(),
        "FAILED",
        problemCodeOf(error),
      );
      throw error;
    }

    try {
      await record(
        journal,
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        STAGE_OWNERSHIP_ACQUIRED,
        instant(),
        "SUCCEEDED",
      );
    } catch (error) {
      await ownership.release();
      throw error;
    }
    return materializeOwnedBootstrapPrelude(
      {
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        paths,
        journal,
      },
      ownership,
    );
  }

  return {
    installationId,
    instanceId,
    bootId,
    bootstrapActivityId,
    paths,
    journal,
    preliminaryState,
    acquireOwnership: acquireOwnershipForPrelude,
  };
}
