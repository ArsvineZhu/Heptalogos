import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const authority = JSON.parse(
  readFileSync(
    join(root, "Architecture_Corpus", "references", "dependency-routing.json"),
    "utf8",
  ),
);

const routes = new Map();
const packageRoutes = new Map();
for (const route of authority.routes ?? []) {
  if (routes.has(route.roleId)) {
    throw new Error(
      `dependency-routing authority has duplicate roleId: ${route.roleId}`,
    );
  }
  if (!Array.isArray(route.packages)) {
    throw new Error(
      `dependency-routing authority route is missing packages[]: ${route.roleId}`,
    );
  }
  routes.set(route.roleId, route);
  for (const packageName of route.packages) {
    if (packageRoutes.has(packageName)) {
      throw new Error(
        `dependency-routing authority has duplicate package identity: ${packageName}`,
      );
    }
    packageRoutes.set(packageName, route);
  }
}

const repositoryToolingPackages = new Set(
  authority.repositoryMaterialization?.repositoryToolingPackages ?? [],
);

export { authority, packageRoutes, repositoryToolingPackages, routes };

export function routeForDependency(packageName) {
  return packageRoutes.get(packageName);
}
