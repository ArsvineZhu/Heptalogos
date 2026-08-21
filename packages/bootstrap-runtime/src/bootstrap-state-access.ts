import { join } from "node:path";
import {
  BootstrapJournal,
  BootstrapStateStore,
  type BootstrapStateBody,
  type BootstrapStateEnvelope,
  type BootstrapStateLoadResult,
} from "@heptalogos/bootstrap-state";
import {
  assertBootstrapOwnershipFor,
  type BootstrapOwnershipLease,
} from "./bootstrap-ownership.js";
import type { BootstrapPathProfile } from "./roots.js";

export interface OwnedBootstrapStateStore {
  load(): Promise<BootstrapStateLoadResult>;
  commit(candidate: BootstrapStateBody): Promise<BootstrapStateEnvelope>;
}

export interface BootstrapStateAccess {
  readonly journal: BootstrapJournal;
  readonly state: OwnedBootstrapStateStore;
}

const BOOTSTRAP_STATE_DIRECTORY = "bootstrap-state";

export function openBootstrapStateAccess(
  profile: BootstrapPathProfile,
  lease: BootstrapOwnershipLease,
): BootstrapStateAccess {
  const instanceRoot = profile.resolve("INSTANCE").canonicalPath;
  assertBootstrapOwnershipFor(lease, instanceRoot);
  const rawState = new BootstrapStateStore(
    join(instanceRoot, BOOTSTRAP_STATE_DIRECTORY),
  );
  const journal = new BootstrapJournal(instanceRoot);

  return {
    journal,
    state: {
      load(): Promise<BootstrapStateLoadResult> {
        return rawState.load();
      },
      async commit(candidate: BootstrapStateBody): Promise<BootstrapStateEnvelope> {
        assertBootstrapOwnershipFor(lease, instanceRoot);
        return rawState.commit(candidate);
      },
    },
  };
}
