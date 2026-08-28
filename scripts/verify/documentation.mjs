/**
 * Executes the repository documentation topology and link validator so current
 * document navigation remains aligned with its canonical homes.
 * @module documentation
 */

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { validateDocumentation } from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const result = validateDocumentation({ root });

if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`FAIL ${error.code} ${error.path}: ${error.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `PASS documentation structure: markdown=${result.markdownCount} json=${result.jsonCount}`,
  );
}
