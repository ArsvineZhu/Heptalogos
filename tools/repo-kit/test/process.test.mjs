import { describe, expect, it } from "vitest";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runNode, runPnpm, runProcessChecked } from "../src/process.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "fixtures/echo-argv.mjs");
const repoRoot = resolve(here, "../../..");

describe("repository process runner", () => {
  it("preserves argv without shell parsing", async () => {
    const argv = [
      "space value",
      'quote"value',
      "amp&value",
      "paren(value)",
      "caret^value",
    ];
    const result = await runNode(fixture, argv, { cwd: repoRoot });
    expect(JSON.parse(result.stdout)).toEqual(argv);
  });

  it("runs the repository pnpm shim without cmd.exe command-string construction", async () => {
    const result = await runPnpm(["--version"], { cwd: repoRoot });
    expect(result.stdout.trim()).toBe("11.22.0");
  });

  it("returns structured non-zero results when rejection is disabled", async () => {
    const result = await runProcessChecked(
      process.execPath,
      ["-e", "process.exit(7)"],
      {
        cwd: repoRoot,
        reject: false,
      },
    );
    expect(result.exitCode).toBe(7);
    expect(result.failed).toBe(true);
  });
});
