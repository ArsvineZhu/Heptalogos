import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validatePackageDocumentation } from "../src/package-docs.mjs";

const packageReadme = `# @heptalogos/example

## Purpose
Example purpose.

## Owns
Example ownership.

## Does not own
Example boundary.

## Public surface
Example surface.

## Dependencies and boundaries
Example dependencies.

## Change constraints
Example constraints.

## Verification
Example verification.

## Architecture references
- [Architecture](../../docs/architecture/authority-and-core-concepts.md)
`;

async function fixtureTree(setup) {
  const root = await mkdtemp(join(tmpdir(), "heptalogos-package-docs-"));
  try {
    await mkdir(join(root, "packages/example"), { recursive: true });
    await mkdir(join(root, "docs/architecture"), { recursive: true });
    await mkdir(join(root, "docs/plans"), { recursive: true });
    await writeFile(
      join(root, "packages/AGENTS.md"),
      "# Package Workspace Agent Contract\n",
    );
    await writeFile(join(root, "packages/README.md"), "# Packages\n");
    await writeFile(
      join(root, "packages/INDEX.md"),
      "| Package | Layer | Responsibility |\n| --- | --- | --- |\n| [example](./example/README.md) | test | example |\n",
    );
    await writeFile(
      join(root, "packages/example/package.json"),
      '{"name":"@heptalogos/example"}\n',
    );
    await writeFile(join(root, "packages/example/README.md"), packageReadme);
    await writeFile(
      join(root, "docs/architecture/authority-and-core-concepts.md"),
      "# Architecture\n",
    );
    await writeFile(join(root, "docs/plans/current.md"), "# Current plan\n");
    await setup(root);
    return validatePackageDocumentation({
      root,
      productPackages: [
        {
          directory: join(root, "packages/example"),
          directoryName: "example",
          manifestName: "@heptalogos/example",
          workspacePackage: {
            name: "@heptalogos/example",
            path: join(root, "packages/example"),
          },
        },
      ],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function hasError(result, text) {
  return result.errors.some((error) => error.includes(text));
}

describe("package documentation topology", () => {
  it("fails when packages/AGENTS.md is missing", async () => {
    const result = await fixtureTree(async (root) => {
      await rm(join(root, "packages/AGENTS.md"));
    });
    expect(hasError(result, "packages/AGENTS.md is missing")).toBe(true);
  });

  it("fails when packages/INDEX.md is missing", async () => {
    const result = await fixtureTree(async (root) => {
      await rm(join(root, "packages/INDEX.md"));
    });
    expect(hasError(result, "packages/INDEX.md is missing")).toBe(true);
  });

  it("fails when a package README is missing", async () => {
    const result = await fixtureTree(async (root) => {
      await rm(join(root, "packages/example/README.md"));
    });
    expect(hasError(result, "package README.md is missing")).toBe(true);
  });

  it("fails when a nested package AGENTS.md is present", async () => {
    const result = await fixtureTree(async (root) => {
      await mkdir(join(root, "packages/example/src"), { recursive: true });
      await writeFile(join(root, "packages/example/src/AGENTS.md"), "# forbidden\n");
    });
    expect(hasError(result, "package AGENTS.md is forbidden")).toBe(true);
  });

  it("fails when Change constraints is missing", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "packages/example/README.md"),
        packageReadme.replace("## Change constraints\nExample constraints.\n\n", ""),
      );
    });
    expect(hasError(result, 'missing heading "Change constraints"')).toBe(true);
  });

  it("fails when a package README has no architecture documentation link", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "packages/example/README.md"),
        packageReadme.replace(
          "- [Architecture](../../docs/architecture/authority-and-core-concepts.md)\n",
          "",
        ),
      );
    });
    expect(hasError(result, "must contain an architecture documentation link")).toBe(
      true,
    );
  });

  it("does not treat a plan link as an architecture reference", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "packages/example/README.md"),
        packageReadme.replace(
          "- [Architecture](../../docs/architecture/authority-and-core-concepts.md)",
          "- [Plan](../../docs/plans/current.md)",
        ),
      );
    });
    expect(hasError(result, "must contain an architecture documentation link")).toBe(
      true,
    );
  });

  it("fails when a package architecture documentation link is broken", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "packages/example/README.md"),
        packageReadme.replace("authority-and-core-concepts.md", "missing.md"),
      );
    });
    expect(hasError(result, "broken architecture documentation link")).toBe(true);
  });

  it("fails when INDEX omits an existing package", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(join(root, "packages/INDEX.md"), "# Package index\n");
    });
    expect(hasError(result, "INDEX.md must link package README exactly once")).toBe(
      true,
    );
  });

  it("fails when INDEX links a nonexistent package", async () => {
    const result = await fixtureTree(async (root) => {
      await writeFile(
        join(root, "packages/INDEX.md"),
        "[example](./example/README.md)\n[missing](./missing/README.md)\n",
      );
    });
    expect(hasError(result, "INDEX.md links nonexistent package")).toBe(true);
  });

  it("passes a valid package documentation topology", async () => {
    const result = await fixtureTree(async () => {});
    expect(result.errors).toEqual([]);
  });
});
