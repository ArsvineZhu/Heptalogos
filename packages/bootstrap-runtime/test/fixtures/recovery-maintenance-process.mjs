import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { BootstrapJournal } = require("@heptalogos/bootstrap-state");
const { createBootId, createUuidV7Id } = require("@heptalogos/foundation-contracts");
const {
  acquireBootstrapOwnership,
  loadBootstrapLocator,
  resolveBootstrapPathProfile,
} = require("@heptalogos/bootstrap-runtime");

const anchorRoot = process.argv[2];
if (!anchorRoot) throw new Error("usage: recovery-maintenance-process.mjs <anchor>");

function send(message) {
  if (typeof process.send === "function") process.send(message);
}

const locator = await loadBootstrapLocator(anchorRoot);
const profile = await resolveBootstrapPathProfile(locator);
const bootId = createBootId();
const activityId = createUuidV7Id("ActivityId");
const lease = await acquireBootstrapOwnership(profile.resolve("INSTANCE"), {
  heartbeatMs: 1_000,
  bootId,
});
await new BootstrapJournal(profile.resolve("INSTANCE").canonicalPath).checkpoint({
  schemaVersion: 2,
  bootId,
  bootstrapActivityId: activityId,
  installationId: locator.installationId,
  instanceId: locator.instanceId,
  stage: "test.m5b.durable-boundary",
  at: new Date().toISOString(),
  outcome: "SUCCEEDED",
});
send({ type: "durable-boundary" });

process.on("message", async (message) => {
  if (message?.type !== "release") return;
  await lease.release();
  send({ type: "released" });
});
