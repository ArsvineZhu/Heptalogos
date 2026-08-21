import { spawn } from "node:child_process";
import { lstat, mkdtemp, mkdir, readFile, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { acquireBootstrapOwnership } from "./bootstrap-ownership.js";
import type { ResolvedLifecycleRoot } from "./roots.js";

const directories: string[] = [];
const LOCK_DIRECTORY = ".heptalogos-bootstrap.lock";

async function makeInstanceRoot(): Promise<ResolvedLifecycleRoot> {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-bootstrap-owner-"));
  directories.push(root);
  return { id: "INSTANCE", configuredPath: root, canonicalPath: root };
}

async function waitForChild(
  child: ReturnType<typeof spawn>,
): Promise<{ readonly code: number | null; readonly signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("bootstrap ownership", () => {
  it("enforces heartbeat input and exposes HELD to RELEASED state", async () => {
    const instanceRoot = await makeInstanceRoot();

    await expect(
      acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 999 }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.invalid_heartbeat" },
    });

    const lease = await acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 1000 });
    expect(lease.state).toBe("HELD");
    expect(Object.isFrozen(lease)).toBe(true);
    expect(lease.signal.aborted).toBe(false);
    expect(() => lease.assertHeld()).not.toThrow();

    await lease.release();
    expect(lease.state).toBe("RELEASED");
    expect(lease.signal.aborted).toBe(true);
    await lease.release();

    expect(() => lease.assertHeld()).toThrowError();
    try {
      lease.assertHeld();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "bootstrap.ownership.not_held" },
      });
    }
  });

  it("blocks a second in-process owner without a retry policy", async () => {
    const instanceRoot = await makeInstanceRoot();
    const first = await acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 1000 });

    await expect(
      acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 1000 }),
    ).rejects.toMatchObject({
      problem: {
        problemCode: "bootstrap.ownership.lock_present",
        category: "conflict",
        retryClass: "after-change",
        detail:
          "The instance bootstrap lock is present; it may belong to an active bootstrap attempt or require recovery",
      },
    });

    await first.release();
  });

  it("fails safe when the held lock is compromised", async () => {
    const instanceRoot = await makeInstanceRoot();
    const lease = await acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 1000 });

    await rm(join(instanceRoot.canonicalPath, LOCK_DIRECTORY), {
      recursive: true,
      force: true,
    });
    await new Promise<void>((resolve) => {
      if (lease.signal.aborted) {
        resolve();
      } else {
        lease.signal.addEventListener("abort", () => resolve(), { once: true });
      }
    });

    expect(lease.state).toBe("COMPROMISED");
    expect(() => lease.assertHeld()).toThrowError();
    try {
      lease.assertHeld();
    } catch (error) {
      expect(error).toMatchObject({
        problem: { problemCode: "bootstrap.ownership.compromised" },
      });
    }
    await lease.release();
  });

  it("does not reclaim an abandoned lock even when its mtime is old", async () => {
    const instanceRoot = await makeInstanceRoot();
    const lockDirectory = join(instanceRoot.canonicalPath, LOCK_DIRECTORY);
    await mkdir(lockDirectory);
    await utimes(lockDirectory, new Date(0), new Date(0));

    await expect(
      acquireBootstrapOwnership(instanceRoot, { heartbeatMs: 1000 }),
    ).rejects.toMatchObject({
      problem: { problemCode: "bootstrap.ownership.lock_present" },
    });
    await expect(lstat(lockDirectory)).resolves.toMatchObject({
      isDirectory: expect.any(Function),
    });
  });

  it("proves cross-process exclusive ownership with the selected lock settings", async () => {
    const instanceRoot = await makeInstanceRoot();
    const fixture = fileURLToPath(
      new URL("../test/fixtures/lock-contender.mjs", import.meta.url),
    );
    const resultFiles = [
      join(instanceRoot.canonicalPath, "contender-a.result"),
      join(instanceRoot.canonicalPath, "contender-b.result"),
    ];
    const children = resultFiles.map((resultFile) =>
      spawn(
        process.execPath,
        [fixture, instanceRoot.canonicalPath, "250", resultFile],
        {
          stdio: "ignore",
        },
      ),
    );

    const results = await Promise.all(children.map(waitForChild));
    const statuses = await Promise.all(
      resultFiles.map((file) => readFile(file, "utf8")),
    );

    expect(results.filter((result) => result.code === 0)).toHaveLength(1);
    expect(results.filter((result) => result.code === 3)).toHaveLength(1);
    expect(statuses).not.toContain("DOUBLE_OWNER");
  });
});
