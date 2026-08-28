/**
 * Runs the current-tree provenance, compatibility, and residue sweep against
 * the repository's executable surfaces and reports only observed findings.
 * @module current-tree-hygiene
 */

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { scanCurrentTree } from "@heptalogos/repo-kit";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const result = scanCurrentTree({ root });

if (result.findings.length > 0) {
  for (const finding of result.findings) {
    console.error(`FAIL ${finding.code} ${finding.path}: ${finding.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "PASS current-tree hygiene: zero provenance, compatibility, and closed-phase residue",
  );
}
