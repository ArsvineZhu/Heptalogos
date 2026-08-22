import { createHash } from "node:crypto";
import type { InstanceId } from "@heptalogos/foundation-contracts";

const HOST_LEASE_KEY_DOMAIN = "heptalogos.host-lease/v1\0";

export interface HostAdvisoryKey {
  readonly key1: number;
  readonly key2: number;
}

export function deriveHostAdvisoryKey(instanceId: InstanceId): HostAdvisoryKey {
  const digest = createHash("sha256")
    .update(`${HOST_LEASE_KEY_DOMAIN}${instanceId}`, "utf8")
    .digest();

  return {
    key1: digest.readInt32BE(0),
    key2: digest.readInt32BE(4),
  };
}
