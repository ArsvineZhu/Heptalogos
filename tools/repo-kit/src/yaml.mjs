import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";

function assertYamlText(text, label) {
  if (typeof text !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
}

export function parseYaml(text, label = "YAML") {
  assertYamlText(text, label);
  const document = parseDocument(text, {
    prettyErrors: true,
    strict: true,
  });
  if (document.errors.length > 0) {
    throw new Error(
      `${label} is invalid YAML: ${document.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }
  return document.toJS({ mapAsMap: false });
}

export function readYamlFile(path) {
  return parseYaml(readFileSync(path, "utf8"), path);
}
