import { join } from "node:path";
import {
  BootstrapJournal,
  BootstrapStateStore,
  type BootstrapStateBodyV1,
  type BootstrapStateEnvelopeV1,
  type BootstrapStateLoadResult,
} from "@heptalogos/bootstrap-state";
import type { BootstrapOwnershipLease } from "./bootstrap-ownership.js";
import type { BootstrapPathProfile } from "./roots.js";

export interface OwnedBootstrapStateStore {
  load(): Promise<BootstrapStateLoadResult>;
  commit(candidate: BootstrapStateBodyV1): Promise<BootstrapStateEnvelopeV1>;
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
      async commit(candidate: BootstrapStateBodyV1): Promise<BootstrapStateEnvelopeV1> {
        lease.assertHeld();
        return rawState.commit(candidate);
      },
    },
  };
}
