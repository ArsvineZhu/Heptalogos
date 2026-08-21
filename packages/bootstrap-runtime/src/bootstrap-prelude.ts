import { join } from "node:path";
import {
  BootstrapJournal,
  BootstrapStateStore,
  type BootstrapActivityId,
  type BootstrapJournalCheckpointV2,
  type BootstrapStateLoadResult,
  type BootstrapStageOutcome,
} from "@heptalogos/bootstrap-state";
import {
  createBootId,
  createUuidV7Id,
  type BootId,
  type InstallationId,
  type InstanceId,
} from "@heptalogos/foundation-contracts";
import { loadBootstrapLocator, type BootstrapLocatorV1 } from "./locator.js";
import { resolveBootstrapPathProfile, type BootstrapPathProfile } from "./roots.js";
import {
  acquireBootstrapOwnership,
  type BootstrapOwnershipLease,
  type BootstrapOwnershipOptions,
} from "./bootstrap-ownership.js";
import {
  openBootstrapStateAccess,
  type OwnedBootstrapStateStore,
} from "./bootstrap-state-access.js";

export interface PreparedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly journal: BootstrapJournal;
  readonly preliminaryState: BootstrapStateLoadResult;
  acquireOwnership(options: BootstrapOwnershipOptions): Promise<OwnedBootstrapPrelude>;
}

export interface OwnedBootstrapPrelude {
  readonly installationId: InstallationId;
  readonly instanceId: InstanceId;
  readonly bootId: BootId;
  readonly bootstrapActivityId: BootstrapActivityId;
  readonly paths: BootstrapPathProfile;
  readonly ownership: BootstrapOwnershipLease;
  readonly state: OwnedBootstrapStateStore;
  readonly authoritativeState: BootstrapStateLoadResult;
  close(): Promise<void>;
}

const BOOTSTRAP_STATE_DIRECTORY = "bootstrap-state";
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

function checkpoint(
  installationId: InstallationId,
  instanceId: InstanceId,
  bootId: BootId,
  bootstrapActivityId: BootstrapActivityId,
  stage: string,
  at: string,
  outcome: BootstrapStageOutcome,
  problemCode?: string,
): BootstrapJournalCheckpointV2 {
  return {
    schemaVersion: 2,
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

export async function prepareBootstrapPrelude(
  anchorRoot: string,
): Promise<PreparedBootstrapPrelude> {
  const bootId = createBootId();
  const bootstrapActivityId = createUuidV7Id("ActivityId");
  const startedAt = instant();

  const locator: BootstrapLocatorV1 = await loadBootstrapLocator(anchorRoot);
  const locatorResolvedAt = instant();
  const paths = await resolveBootstrapPathProfile(locator);
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
    options: BootstrapOwnershipOptions,
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
    options: BootstrapOwnershipOptions,
  ): Promise<OwnedBootstrapPrelude> {
    let ownership: BootstrapOwnershipLease;
    try {
      ownership = await acquireBootstrapOwnership(paths.resolve("INSTANCE"), options);
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
      const access = openBootstrapStateAccess(paths, ownership);
      const authoritativeState = await access.state.load();
      await record(
        journal,
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        STAGE_STATE_AUTHORITATIVE_RELOAD,
        instant(),
        "SUCCEEDED",
      );
      await record(
        journal,
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        STAGE_PRELUDE_OWNED,
        instant(),
        "SUCCEEDED",
      );

      let closePromise: Promise<void> | undefined;
      return {
        installationId,
        instanceId,
        bootId,
        bootstrapActivityId,
        paths,
        ownership,
        state: access.state,
        authoritativeState,
        close(): Promise<void> {
          if (closePromise) return closePromise;
          closePromise = (async () => {
            await ownership.release();
            await record(
              journal,
              installationId,
              instanceId,
              bootId,
              bootstrapActivityId,
              STAGE_PRELUDE_RELEASED,
              instant(),
              "SUCCEEDED",
            );
          })();
          return closePromise;
        },
      };
    } catch (error) {
      await ownership.release();
      throw error;
    }
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
