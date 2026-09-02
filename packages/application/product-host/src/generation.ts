/**
 * Derives the current ProductGenerationId from production source, package, and
 * toolchain content without timestamps, random values, or absolute paths.
 * @module generation
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import {
  asContentDigest,
  digestCanonicalJson,
  type ProductGenerationId,
} from "@heptalogos/foundation-contracts";
import { MANAGEMENT_CONTRACT_VERSION } from "@heptalogos/management";

/** The canonical content descriptor hashed into ProductGenerationId. */
export interface ProductGenerationDescriptor {
  readonly schemaVersion: 1;
  readonly product: "heptalogos";
  readonly sourceContentDigest: string;
  readonly lockfileSha256: string;
  readonly managementContractVersion: typeof MANAGEMENT_CONTRACT_VERSION;
}

const ignoredDirectoryNames = new Set([
  ".codegraph",
  ".git",
  ".nx",
  "coverage",
  "dist",
  "node_modules",
  "tmp",
]);

function normalizedPath(repositoryRoot: string, filePath: string): string {
  return relative(repositoryRoot, filePath).split(sep).join("/");
}

function includedFile(repositoryRoot: string, filePath: string): boolean {
  const path = normalizedPath(repositoryRoot, filePath);
  if (path === "") return false;
  if (path.startsWith("packages/")) {
    if (path.includes("/test/") || path.includes("/tests/")) return false;
    if (path.endsWith("/README.md")) return false;
    return (
      path.startsWith("packages/") &&
      (path.includes("/src/") ||
        path.endsWith("/package.json") ||
        path.endsWith("/project.json") ||
        /\/tsconfig(?:\.build)?\.json$/u.test(path))
    );
  }
  return new Set([
    "eslint.config.mjs",
    "nx.json",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "tsconfig.json",
    "typedoc.json",
    "vitest.config.ts",
  ]).has(path);
}

async function collectFiles(
  repositoryRoot: string,
  directory: string,
  output: string[],
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        if (ignoredDirectoryNames.has(entry.name)) return;
        await collectFiles(repositoryRoot, join(directory, entry.name), output);
        return;
      }
      if (entry.isFile()) {
        const filePath = join(directory, entry.name);
        if (includedFile(repositoryRoot, filePath)) output.push(filePath);
      }
    }),
  );
}

/** Computes the content descriptor used by the Product Host at startup. */
export async function deriveProductGenerationDescriptor(
  repositoryRoot: string,
): Promise<ProductGenerationDescriptor> {
  const files: string[] = [];
  await collectFiles(repositoryRoot, repositoryRoot, files);
  files.sort((left, right) =>
    normalizedPath(repositoryRoot, left).localeCompare(
      normalizedPath(repositoryRoot, right),
    ),
  );
  const entries = await Promise.all(
    files.map(async (filePath) => ({
      path: normalizedPath(repositoryRoot, filePath),
      sha256: createHash("sha256")
        .update(await readFile(filePath))
        .digest("hex"),
    })),
  );
  const sourceContentDigest = digestCanonicalJson(
    "heptalogos.product-source/v1",
    entries,
  ).hex;
  const lockfileSha256 = createHash("sha256")
    .update(await readFile(join(repositoryRoot, "pnpm-lock.yaml")))
    .digest("hex");
  return Object.freeze({
    schemaVersion: 1,
    product: "heptalogos",
    sourceContentDigest,
    lockfileSha256,
    managementContractVersion: MANAGEMENT_CONTRACT_VERSION,
  });
}

/** Derives the deterministic ProductGenerationId for the current repository. */
export async function deriveProductGenerationId(
  repositoryRoot: string,
): Promise<ProductGenerationId> {
  const descriptor = await deriveProductGenerationDescriptor(repositoryRoot);
  return asContentDigest(
    "ProductGenerationId",
    digestCanonicalJson(
      "heptalogos.product-generation/v1",
      descriptor as unknown as import("@heptalogos/foundation-contracts").CanonicalJsonValue,
    ),
  );
}
