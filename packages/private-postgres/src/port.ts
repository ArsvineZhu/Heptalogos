import { createProblemError } from "@heptalogos/foundation-contracts";

export function assertPrivatePostgresPort(port: number): void {
  if (Number.isInteger(port) && port >= 1 && port <= 65535) return;
  throw createProblemError({
    problemCode: "private-postgres.cluster.invalid_port",
    category: "validation",
    retryClass: "manual",
    title: "Private PostgreSQL port is invalid",
    detail: "The private PostgreSQL port must be an integer from 1 through 65535",
  });
}
