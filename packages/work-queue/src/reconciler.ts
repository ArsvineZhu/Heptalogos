import type { ExecutionContextRuntime } from "@heptalogos/execution-lineage";
import {
  createSignalTopic,
  type SignalListener,
  type SignalService,
} from "@heptalogos/signal";
import type { TimeService } from "@heptalogos/time-service";
import { createDispatchAttemptId } from "./attempt-identity.js";
import type {
  DurableDispatchPort,
  DurableDispatchRequest,
  WorkItem,
  WorkQueueRuntimeOptions,
} from "./contracts.js";
import {
  type WorkHandlerResolver,
  validateWorkQueueRuntimeOptions,
} from "./service.js";
import type { WorkQueueRepository } from "./repository.js";
import { workQueueProblem } from "./problems.js";

const WORK_AVAILABLE_TOPIC = createSignalTopic("work.available");

export interface WorkQueueReconcilerOptions {
  readonly repository: WorkQueueRepository;
  readonly durableDispatch: DurableDispatchPort;
  readonly handlerRegistry: WorkHandlerResolver;
  readonly signal: SignalService;
  readonly execution: ExecutionContextRuntime;
  readonly time: TimeService;
  readonly runtimeOptions: WorkQueueRuntimeOptions;
  readonly onBackgroundError: (error: unknown) => void;
}

export interface ReconciliationScanResult {
  readonly scanned: number;
  readonly awakened: number;
  readonly dispatched: number;
  readonly dispatchFailures: number;
}

export interface WorkQueueReconciler {
  start(): Promise<void>;
  stop(): Promise<void>;
  scan(): Promise<ReconciliationScanResult>;
}

function report(
  sink: (error: unknown) => void,
  problemCode: string,
  detail: string,
): void {
  try {
    sink(workQueueProblem(problemCode, detail));
  } catch {
    // Background diagnostics cannot escape reconciliation.
  }
}

function dispatchRequest(item: WorkItem): DurableDispatchRequest {
  return {
    workItemId: item.workItemId,
    dispatchRevision: item.dispatchRevision,
    dispatchAttemptId: createDispatchAttemptId(item.workItemId, item.dispatchRevision),
    queueProfileId: item.queueProfileId,
    priority: item.priority,
    ...(item.partitionKey === undefined ? {} : { partitionKey: item.partitionKey }),
    ...(item.notBefore === undefined ? {} : { notBefore: item.notBefore }),
  };
}

export function createWorkQueueReconciler(
  options: WorkQueueReconcilerOptions,
): WorkQueueReconciler {
  validateWorkQueueRuntimeOptions(options.runtimeOptions);
  if (typeof options.onBackgroundError !== "function") {
    throw workQueueProblem(
      "work.request.invalid",
      "WorkQueueReconciler requires a background error sink",
    );
  }

  let started = false;
  let subscription: { close(): Promise<void> } | undefined;
  let antiEntropyTimer: ReturnType<typeof setTimeout> | undefined;
  let scanPromise: Promise<ReconciliationScanResult> | undefined;

  const reportScanFailure = (): void => {
    report(
      options.onBackgroundError,
      "work.reconciliation.failed",
      "WorkQueue reconciliation scan failed; the next signal or anti-entropy scan remains authoritative",
    );
  };

  const requestScan = (): Promise<void> =>
    scan().then(
      () => undefined,
      () => {
        reportScanFailure();
      },
    );

  const scheduleAntiEntropy = (): void => {
    if (!started) return;
    antiEntropyTimer = setTimeout(() => {
      antiEntropyTimer = undefined;
      void requestScan().finally(scheduleAntiEntropy);
    }, options.runtimeOptions.antiEntropyIntervalMs);
  };

  const listener: SignalListener = {
    onWakeup: requestScan,
    onRescanRequired: requestScan,
    onBackgroundError: () => {
      report(
        options.onBackgroundError,
        "work.signal.failed",
        "Signal listener reported a background failure; reconciliation remains authoritative",
      );
    },
  };

  const runScan = async (): Promise<ReconciliationScanResult> => {
    const now = options.time.now();
    const dueRetry = await options.repository.listDueRetry({
      now,
      limit: options.runtimeOptions.reconciliationBatchSize,
    });
    const awakened: WorkItem[] = [];
    let awakenedCount = 0;
    for (const item of dueRetry) {
      const result = await options.repository.wakeDueRetry({
        workItemId: item.workItemId,
        expectedDispatchRevision: item.dispatchRevision,
        now,
        updatedAt: now,
      });
      if (result.status === "APPLIED" && result.item?.state === "PENDING") {
        awakened.push(result.item);
        awakenedCount += 1;
      }
    }

    const waiting = await options.repository.listWaitingDependency({
      limit: options.runtimeOptions.reconciliationBatchSize,
    });
    for (const item of waiting) {
      if (options.handlerRegistry.resolve(item.handler) === undefined) continue;
      const result = await options.repository.wakeDependency({
        workItemId: item.workItemId,
        expectedDispatchRevision: item.dispatchRevision,
        updatedAt: now,
      });
      if (result.status === "APPLIED" && result.item?.state === "PENDING") {
        awakened.push(result.item);
        awakenedCount += 1;
      }
    }

    const pending = await options.repository.listDispatchable({
      now,
      limit: options.runtimeOptions.reconciliationBatchSize,
    });
    const candidates = new Map<string, WorkItem>();
    for (const item of [...awakened, ...pending]) {
      if (item.state !== "PENDING") continue;
      candidates.set(`${item.workItemId}\u0000${item.dispatchRevision}`, item);
    }

    let dispatched = 0;
    let dispatchFailures = 0;
    for (const item of candidates.values()) {
      const request = dispatchRequest(item);
      try {
        await options.execution.runActivity(
          {
            kind: "work.dispatch",
            importance: "routine",
            retentionClass: "ephemeral",
            sensitivity: "operational",
          },
          async () => options.durableDispatch.dispatch(request),
        );
        dispatched += 1;
      } catch {
        dispatchFailures += 1;
        report(
          options.onBackgroundError,
          "work.dispatch.failed",
          "Durable dispatch projection failed; the canonical WorkItem remains recoverable",
        );
      }
    }

    return {
      scanned: dueRetry.length + waiting.length + pending.length,
      awakened: awakenedCount,
      dispatched,
      dispatchFailures,
    };
  };

  const scan = (): Promise<ReconciliationScanResult> => {
    if (scanPromise !== undefined) return scanPromise;
    const current = options.execution
      .runActivity(
        {
          kind: "work.reconcile",
          importance: "routine",
          retentionClass: "ephemeral",
          sensitivity: "operational",
        },
        runScan,
      )
      .finally(() => {
        if (scanPromise === current) scanPromise = undefined;
      });
    scanPromise = current;
    return current;
  };

  return {
    scan,
    async start() {
      if (started) return;
      started = true;
      try {
        subscription = await options.signal.subscribe(WORK_AVAILABLE_TOPIC, listener);
        await scan();
        scheduleAntiEntropy();
      } catch (error) {
        started = false;
        if (antiEntropyTimer !== undefined) clearTimeout(antiEntropyTimer);
        antiEntropyTimer = undefined;
        await subscription?.close().catch(() => undefined);
        subscription = undefined;
        throw error;
      }
    },
    async stop() {
      started = false;
      if (antiEntropyTimer !== undefined) clearTimeout(antiEntropyTimer);
      antiEntropyTimer = undefined;
      const currentSubscription = subscription;
      subscription = undefined;
      await currentSubscription?.close();
      await scanPromise?.catch(() => undefined);
    },
  };
}
