import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBootId,
  createInstallationId,
  createUuidV7Id,
} from "@heptalogos/foundation-contracts";
import {
  deriveProductGenerationDescriptor,
  deriveProductGenerationId,
} from "../../src/generation.js";
import {
  readManagementEndpointDescriptor,
  removeCurrentEndpointDescriptor,
  writeManagementEndpointDescriptor,
} from "../../src/files.js";
import { parseProductHostInputs } from "../../src/inputs.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("Product Host focused contracts", () => {
  it("derives a stable content generation from the current source tree", async () => {
    const repositoryRoot = resolve(process.cwd());
    const first = await deriveProductGenerationDescriptor(repositoryRoot);
    const second = await deriveProductGenerationDescriptor(repositoryRoot);
    expect(first).toEqual(second);
    expect(await deriveProductGenerationId(repositoryRoot)).toMatch(/^[0-9a-f]{64}$/u);
    expect(JSON.stringify(first)).not.toContain(repositoryRoot);
  });

  it("accepts only the bounded daemon input surface", () => {
    expect(
      parseProductHostInputs([
        "--anchor-root",
        "C:\\install",
        "--postgres-bin",
        "C:\\postgres\\bin",
        "--initial-postgres-port",
        "54321",
      ]),
    ).toMatchObject({ initialPostgresPort: 54321 });
    expect(() => parseProductHostInputs(["--password", "secret"])).toThrow();
  });

  it("removes only a descriptor belonging to the current BootId", async () => {
    const runRoot = await mkdtemp(join(tmpdir(), "heptalogos-product-host-files-"));
    directories.push(runRoot);
    const descriptor = {
      schemaVersion: 1 as const,
      installationId: createInstallationId(),
      bootId: createBootId(),
      origin: "http://127.0.0.1:12345",
    };
    await writeManagementEndpointDescriptor(runRoot, descriptor);
    await removeCurrentEndpointDescriptor(runRoot, createUuidV7Id("BootId"));
    await expect(readManagementEndpointDescriptor(runRoot)).resolves.toEqual(
      descriptor,
    );
    await removeCurrentEndpointDescriptor(runRoot, descriptor.bootId);
    await expect(
      readFile(join(runRoot, "management-endpoint.json")),
    ).rejects.toBeDefined();
  });
});
