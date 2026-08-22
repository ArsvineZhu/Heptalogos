import {
  MaintenanceJournalStore,
  maintenanceOperationRef,
  type BootstrapStateBodyV2,
  type BootstrapStateEnvelopeV2,
  type BootstrapStateLoadResult,
  type MaintenanceOperationId,
} from "@heptalogos/bootstrap-state";
import {
  assertBootstrapOwnershipFor,
  type BootstrapOwnershipLease,
} from "./bootstrap-ownership.js";
import {
  openBootstrapStateAccess,
  type BootstrapStateAccess,
  type OwnedBootstrapStateStore,
} from "./bootstrap-state-access.js";
import type { BootstrapPathProfile } from "./roots.js";
import { ProblemError, type Problem } from "@heptalogos/foundation-contracts";

export interface OwnedMaintenanceStateAccess {
  readonly journal: MaintenanceJournalStore;
  readonly state: OwnedBootstrapStateStore;
  commitOperationPointer(
    operationId: MaintenanceOperationId,
  ): Promise<BootstrapStateEnvelopeV2>;
}

function stateProblem(
  problemCode: string,
  title: string,
  detail: string,
): ProblemError {
  const problem: Problem = {
    schemaVersion: 1,
    problemCode,
    category: "integrity",
    retryClass: "manual",
    title,
    detail,
  };
  return new ProblemError(problem);
}

function requireV2State(
  loaded: BootstrapStateLoadResult,
  profile: BootstrapPathProfile,
): BootstrapStateEnvelopeV2 {
  if (loaded.status === "EMPTY") {
    throw stateProblem(
      "maintenance.state.bootstrap_state_required",
      "BootstrapState is required for maintenance",
      "M5A cannot create a MaintenanceJournal pointer without authoritative BootstrapState",
    );
  }
  if (loaded.status === "CORRUPT") {
    throw new ProblemError(loaded.problem);
  }
  if (loaded.value.state.schemaVersion !== 2) {
    throw stateProblem(
      "maintenance.state.private_postgres_required",
      "M4 private PostgreSQL state is required for maintenance",
      "M5A requires BootstrapState V2 with private PostgreSQL identity",
    );
  }
  const state = loaded.value.state;
  if (
    state.privatePostgres.installationId !== profile.installationId ||
    state.privatePostgres.instanceId !== profile.instanceId
  ) {
    throw stateProblem(
      "maintenance.state.identity_mismatch",
      "BootstrapState identity does not match maintenance scope",
      "BootstrapState private PostgreSQL identity belongs to another installation or instance",
    );
  }
  return loaded.value as BootstrapStateEnvelopeV2;
}

export function openMaintenanceStateAccess(
  profile: BootstrapPathProfile,
  lease: BootstrapOwnershipLease,
): OwnedMaintenanceStateAccess {
  const instanceRoot = profile.resolve("INSTANCE").canonicalPath;
  const assertAuthority = (): void => {
    assertBootstrapOwnershipFor(lease, instanceRoot);
  };
  assertAuthority();

  const bootstrapAccess: BootstrapStateAccess = openBootstrapStateAccess(
    profile,
    lease,
  );
  const state: OwnedBootstrapStateStore = {
    async load() {
      assertAuthority();
      return bootstrapAccess.state.load();
    },
    async commit(candidate) {
      assertAuthority();
      return bootstrapAccess.state.commit(candidate);
    },
  };
  const journal = new MaintenanceJournalStore(instanceRoot, assertAuthority);

  return {
    journal,
    state,
    async commitOperationPointer(operationId) {
      assertAuthority();
      const current = requireV2State(await state.load(), profile);
      const candidate: BootstrapStateBodyV2 = {
        ...current.state,
        revision: current.state.revision + 1,
        lastCommittedOperationRef: maintenanceOperationRef(operationId),
      };
      assertAuthority();
      const committed = await state.commit(candidate);
      if (committed.state.schemaVersion !== 2) {
        throw stateProblem(
          "maintenance.state.pointer_commit_unverified",
          "Maintenance BootstrapState pointer commit is unverified",
          "The committed BootstrapState did not retain its V2 private PostgreSQL state",
        );
      }
      return committed as BootstrapStateEnvelopeV2;
    },
  };
}
