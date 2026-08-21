import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeCrashSafeFile } from "./atomic-file.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("writeCrashSafeFile", () => {
  it("atomically publishes the requested bytes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
    directories.push(directory);
    const file = join(directory, "state.json");

    await writeCrashSafeFile(file, '{"revision":1}');
    await expect(readFile(file, "utf8")).resolves.toBe('{"revision":1}');
  });

  it.runIf(process.platform !== "win32")(
    "reports containing-directory sync on supported POSIX hosts",
    async () => {
      const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
      directories.push(directory);
      const file = join(directory, "state.json");

      await expect(writeCrashSafeFile(file, "{}")).resolves.toBe("DIRECTORY_SYNCED");
    },
  );

  it.runIf(process.platform === "win32")(
    "does not overclaim containing-directory durability on Windows",
    async () => {
      const directory = await mkdtemp(join(tmpdir(), "heptalogos-atomic-file-"));
      directories.push(directory);
      const file = join(directory, "state.json");

      await expect(writeCrashSafeFile(file, "{}")).resolves.toBe("PLATFORM_UNVERIFIED");
    },
  );

  it("keeps store and journal behind the crash-safe adapter", async () => {
    const [store, journal] = await Promise.all([
      readFile(new URL("./store.ts", import.meta.url), "utf8"),
      readFile(new URL("./journal.ts", import.meta.url), "utf8"),
    ]);

    expect(store).not.toContain('require("write-file-atomic")');
    expect(journal).not.toContain('require("write-file-atomic")');
    expect(store).toContain('from "./atomic-file.js"');
    expect(journal).toContain('from "./atomic-file.js"');
  });
});
