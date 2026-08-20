import { runPnpm } from "./process.mjs";

export async function discoverWorkspacePackages({ cwd = process.cwd() } = {}) {
  const result = await runPnpm(["list", "-r", "--depth", "-1", "--json"], { cwd });
  const entries = JSON.parse(result.stdout);
  if (!Array.isArray(entries)) {
    throw new Error("pnpm recursive package listing did not return an array");
  }
  return entries.map((entry) => ({
    name: entry.name,
    version: entry.version,
    path: entry.path,
    private: entry.private === true,
  }));
}
