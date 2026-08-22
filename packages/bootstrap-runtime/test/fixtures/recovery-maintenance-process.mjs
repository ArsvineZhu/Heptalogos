import { join } from "node:path";
import { createRequire } from "node:module";
import { parseRecoveryMaintenanceProcessArgs } from "./recovery-maintenance-process-args.mjs";

const require = createRequire(import.meta.url);
const {
  BootstrapStateStore,
  MaintenanceJournalStore,
} = require("@heptalogos/bootstrap-state");
const { createBootId } = require("@heptalogos/foundation-contracts");
const {
  loadBootstrapLocator,
  prepareBootstrapPrelude,
  proveLocalInstallationOwner,
  recoverInterruptedHostMaintenance,
  resolveBootstrapPathProfile,
} = require("@heptalogos/bootstrap-runtime");
const {
  resolvePrivatePostgresPlacement,
  resolvePrivatePostgresToolchain,
} = require("@heptalogos/private-postgres");

const { anchorRoot, role, pgBin, portText, operationIdText, targetStage } =
  parseRecoveryMaintenanceProcessArgs(process.argv.slice(2));

const LIFECYCLE = {
  startupTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  readinessPollIntervalMs: 100,
};
const HOST_TIMING = {
  connectionTimeoutMs: 10_000,
  statementTimeoutMs: 10_000,
  fenceLockTimeoutMs: 10_000,
  keepAliveInitialDelayMs: 1_000,
};

function send(message, callback) {
  if (typeof process.send !== "function") {
    callback?.();
    return;
  }
  process.send(message, callback);
}

const releaseRequested = new Promise((resolve) => {
  process.on("message", (message) => {
    if (message?.type === "release") resolve();
  });
});

function keyProvider() {
  return {
    async withPrivatePostgresBootstrapPassword(_context, use) {
      const password = new TextEncoder().encode(
        "M5A_TEST_BOOTSTRAP_PASSWORD_0123456789",
      );
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
    async withPrivatePostgresHostLeasePassword(_context, use) {
      const password = new TextEncoder().encode(
        "M5A_TEST_HOST_LEASE_PASSWORD_0123456789",
      );
      try {
        return await use(password);
      } finally {
        password.fill(0);
      }
    },
  };
}

function quiescence() {
  return {
    async quiesce() {
      return { async resumeAfterAbort() {} };
    },
  };
}

async function watchJournalStage(instanceRoot, operationId, stage) {
  const journal = new MaintenanceJournalStore(instanceRoot);
  let stopped = false;
  const timer = setInterval(async () => {
    if (stopped) return;
    try {
      const loaded = await journal.load(operationId);
      if (
        loaded.status === "CURRENT" &&
        loaded.value.state.lastCompletedStage === stage
      ) {
        stopped = true;
        clearInterval(timer);
        send({ type: "durable-stage", operationId, stage }, () =>
          process.kill(process.pid, "SIGSTOP"),
        );
      }
    } catch {
      // The parent independently adjudicates the journal; transient reads retry.
    }
  }, 10);
  return () => clearInterval(timer);
}

async function descriptorForRecovery(anchor, binDirectory, port) {
  const locator = await loadBootstrapLocator(anchor);
  const profile = await resolveBootstrapPathProfile(locator);
  const loaded = await new BootstrapStateStore(
    join(profile.resolve("INSTANCE").canonicalPath, "bootstrap-state"),
  ).load();
  if (
    loaded.status !== "CURRENT" ||
    loaded.value.state.schemaVersion !== 2 ||
    loaded.value.state.privatePostgres.schemaVersion !== 2
  ) {
    throw new Error("recovery child requires BootstrapState V2");
  }
  const persisted = loaded.value.state.privatePostgres;
  const toolchain = await resolvePrivatePostgresToolchain(binDirectory);
  const placement = resolvePrivatePostgresPlacement(
    profile.resolve("DATA").canonicalPath,
  );
  return {
    toolchain,
    placement,
    expectedIdentity: {
      installationId: persisted.installationId,
      instanceId: persisted.instanceId,
      postgresMajor: persisted.postgresMajor,
      bootstrapRoleName: persisted.bootstrapRoleName,
      placement: persisted.dataPlacement,
      persistedPort: Number(port),
      clusterSystemIdentifier: persisted.clusterSystemIdentifier,
      initializationProfileRevision: persisted.initializationProfileRevision,
    },
    logFilePath: join(profile.resolve("LOG").canonicalPath, "private-postgres.log"),
    lifecycle: LIFECYCLE,
  };
}

async function runMaintenance() {
  const prepared = await prepareBootstrapPrelude(anchorRoot);
  const owned = await prepared.acquireOwnership({ heartbeatMs: 1_000 });
  const ready = await owned.preparePrivatePostgres({
    toolchainBinDirectory: pgBin,
    initialPort: Number(portText),
    lifecycle: LIFECYCLE,
    keyProvider: keyProvider(),
  });
  const host = await owned.handoffPrivatePostgresToHost(ready, {
    keyProvider: keyProvider(),
    timing: HOST_TIMING,
  });
  const maintenance = await host.preparePrivatePostgresMaintenance({
    kind: "RESTART_PRIVATE_POSTGRES",
  });
  const profile = await resolveBootstrapPathProfile(
    await loadBootstrapLocator(anchorRoot),
  );
  send({
    type: "maintenance-prepared",
    operationId: maintenance.operationId,
    sourceToken: host.token,
    clusterSystemIdentifier: ready.clusterSystemIdentifier,
  });
  const stopWatching = await watchJournalStage(
    profile.resolve("INSTANCE").canonicalPath,
    maintenance.operationId,
    targetStage,
  );
  try {
    const result = await maintenance.execute(quiescence());
    stopWatching();
    send({ type: "completed", kind: result.kind });
    if (result.kind === "RESTARTED") {
      await releaseRequested;
      await result.host.shutdownKeepingPrivatePostgres(quiescence());
      send({ type: "released" });
    }
  } finally {
    stopWatching();
  }
}

async function runRecovery() {
  const locator = await loadBootstrapLocator(anchorRoot);
  const profile = await resolveBootstrapPathProfile(locator);
  const operationId = operationIdText;
  const descriptor = await descriptorForRecovery(anchorRoot, pgBin, portText);
  send({ type: "recovery-started", operationId });
  const stopWatching =
    targetStage === undefined
      ? () => {}
      : await watchJournalStage(
          profile.resolve("INSTANCE").canonicalPath,
          operationId,
          targetStage,
        );
  try {
    const result = await recoverInterruptedHostMaintenance({
      anchorRoot,
      principal: await proveLocalInstallationOwner(anchorRoot),
      expectedOperationId: operationId,
      keyProvider: keyProvider(),
      timing: HOST_TIMING,
      privatePostgres: descriptor,
    });
    stopWatching();
    send({
      type: "completed",
      kind: result.kind,
      token: result.kind === "RESTARTED" ? result.host.token : undefined,
    });
    if (result.kind === "RESTARTED") {
      await releaseRequested;
      await result.host.shutdownKeepingPrivatePostgres(quiescence());
      send({ type: "released" });
    }
  } finally {
    stopWatching();
  }
}

try {
  if (role === "maintenance") await runMaintenance();
  else if (role === "recovery" || role === "recovery-complete") await runRecovery();
  else throw new Error(`unsupported role ${role}`);
} catch (error) {
  send({
    type: "error",
    problemCode: error?.problem?.problemCode ?? "UNKNOWN",
    message: String(error),
  });
  setTimeout(() => process.exit(1), 20).unref();
}
