import { createRequire } from "node:module";
import { open } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const writeFileAtomic = require("write-file-atomic") as (
  filename: string,
  data: string,
  options?: { readonly encoding?: BufferEncoding },
) => Promise<void>;

export type PublicationDurability = "DIRECTORY_SYNCED" | "PLATFORM_UNVERIFIED";

export async function writeCrashSafeFile(
  filename: string,
  data: string,
): Promise<PublicationDurability> {
  const target = resolve(filename);

  await writeFileAtomic(target, data, { encoding: "utf8" });

  if (process.platform === "win32") {
    return "PLATFORM_UNVERIFIED";
  }

  const directory = await open(dirname(target), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }

  return "DIRECTORY_SYNCED";
}
