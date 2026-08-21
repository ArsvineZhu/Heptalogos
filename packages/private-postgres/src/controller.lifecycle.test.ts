import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createInstallationId,
  createInstanceId,
  ProblemError,
} from "@heptalogos/foundation-contracts";
import type {
  PrivatePostgresExpectedIdentity,
  PrivatePostgresToolchain,
} from "./contracts.js";

const { runPostgresToolMock } = vi.hoisted(() => ({
  runPostgresToolMock: vi.fn(),
}));

vi.mock("./process-adapter.js", () => ({
  runPostgresTool: runPostgresToolMock,
}));

const {
  createPrivatePostgresInitializationProfileRevision,
  startPrivatePostgresCluster,
} = await import("./controller.js");

describe("private PostgreSQL lifecycle uncertainty", () => {
  it("proves and cleans up a start whose pg_ctl wait returns a timeout", async () => {
    const root = await mkdtemp(join(tmpdir(), "heptalogos-pg-lifecycle-unit-"));
    const dataDirectory = join(root, "private-postgres");
    const logFilePath = join(root, "private-postgres.log");
    const toolchain: PrivatePostgresToolchain = {
      version: "18.6",
      major: 18,
      binDirectory: root,
      postgres: join(root, "postgres.exe"),
      initdb: join(root, "initdb.exe"),
      pgCtl: join(root, "pg_ctl.exe"),
      pgControldata: join(root, "pg_controldata.exe"),
      pgIsReady: join(root, "pg_isready.exe"),
    };
    const placement = {
      rootId: "DATA" as const,
      relativePath: "private-postgres" as const,
      dataLayoutVersion: 1 as const,
      canonicalDataDirectory: dataDirectory,
    };
    const port = 55451;
    const expectedIdentity: PrivatePostgresExpectedIdentity = {
      installationId: createInstallationId(),
      instanceId: createInstanceId(),
      postgresMajor: 18,
      placement: {
        rootId: placement.rootId,
        relativePath: placement.relativePath,
        dataLayoutVersion: placement.dataLayoutVersion,
      },
      persistedPort: port,
      clusterSystemIdentifier: "123456789",
      initializationProfileRevision:
        createPrivatePostgresInitializationProfileRevision(port),
    };
    let statusCalls = 0;

    await mkdir(dataDirectory, { recursive: true });
    await writeFile(join(dataDirectory, "PG_VERSION"), "18\n");
    await writeFile(
      join(dataDirectory, "pg_hba.conf"),
      "# Heptalogos private PostgreSQL HBA profile v1\nhost all all 127.0.0.1/32 scram-sha-256\n",
    );
    runPostgresToolMock.mockImplementation(
      async (executable: string, args: readonly string[]) => {
        if (executable === toolchain.pgCtl && args[0] === "start") {
          throw new ProblemError({
            schemaVersion: 1,
            problemCode: "private-postgres.process.timed_out",
            category: "unavailable",
            retryClass: "backoff",
            title: "PostgreSQL tool invocation timed out",
            detail: "The mocked pg_ctl start continues in the background",
          });
        }
        if (executable === toolchain.pgCtl && args[0] === "status") {
          statusCalls += 1;
          return { exitCode: statusCalls === 1 ? 0 : 3, stdout: "", stderr: "" };
        }
        if (executable === toolchain.pgCtl && args[0] === "stop") {
          return { exitCode: 0, stdout: "", stderr: "" };
        }
        if (executable === toolchain.pgControldata) {
          return {
            exitCode: 0,
            stdout:
              "Database system identifier:           123456789\n" +
              "Database cluster state:               shut down\n" +
              "Catalog version number:               202507181\n" +
              "Data page checksum version:           1\n",
            stderr: "",
          };
        }
        if (executable === toolchain.postgres) {
          const setting = args.at(-1);
          const values: Record<string, string> = {
            listen_addresses: "127.0.0.1",
            unix_socket_directories: "",
            port: String(port),
            password_encryption: "scram-sha-256",
            data_directory: dataDirectory,
            hba_file: join(dataDirectory, "pg_hba.conf"),
          };
          return { exitCode: 0, stdout: values[setting ?? ""] ?? "", stderr: "" };
        }
        throw new Error(`unexpected executable ${executable}`);
      },
    );

    try {
      await expect(
        startPrivatePostgresCluster({
          toolchain,
          placement,
          expectedIdentity,
          logFilePath,
          lifecycle: {
            startupTimeoutMs: 1_000,
            shutdownTimeoutMs: 1_000,
            readinessPollIntervalMs: 10,
          },
          assertControlAuthority: () => undefined,
        }),
      ).rejects.toMatchObject({
        problem: { problemCode: "private-postgres.process.timed_out" },
      });

      expect(statusCalls).toBe(2);
      expect(runPostgresToolMock).toHaveBeenCalledWith(
        toolchain.pgCtl,
        expect.arrayContaining(["stop", "--pgdata", dataDirectory]),
        expect.any(Object),
      );
    } finally {
      runPostgresToolMock.mockReset();
      await rm(root, { recursive: true, force: true });
    }
  });
});
