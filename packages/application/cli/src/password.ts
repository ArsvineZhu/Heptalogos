/**
 * Protected password input for interactive and deterministic CLI modes.
 * @module password
 */

import password from "@inquirer/password";

/** Reads one password from stdin while preserving all non-line-ending bytes. */
async function readPasswordFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const value = Buffer.concat(chunks).toString("utf8");
  return value.replace(/(?:\r\n|\n|\r)$/u, "");
}

/** Uses the adopted Inquirer password prompt for protected TTY input. */
export async function readProtectedPassword(
  useStdin: boolean,
  message: string,
): Promise<string> {
  if (useStdin) return readPasswordFromStdin();
  return password({ message, mask: "*" });
}
