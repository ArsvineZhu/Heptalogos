import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectPackageIndex,
  renderPackageIndex,
  validatePackageIndex,
} from "../src/package-index.mjs";

const root = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

describe("generated package index", () => {
  it("collects every pnpm workspace package under packages", async () => {
    const model = await collectPackageIndex({ root });

    expect(model.packages).toHaveLength(15);
    expect(model.packages.map((entry) => entry.name)).toContain(
      "@heptalogos/foundation-contracts",
    );
    expect(model.packages.every((entry) => entry.tags.includes("kind:product"))).toBe(
      true,
    );
  });

  it("renders manifest names, README links, tags, and package purpose", async () => {
    const model = await collectPackageIndex({ root });
    const text = renderPackageIndex(model);

    expect(text).toContain(
      "[@heptalogos/foundation-contracts](./foundation-contracts/README.md)",
    );
    expect(text).toContain("kind:product, area:shared");
    expect(text).toContain("low-level shared vocabulary for Foundation packages");
  });

  it("accepts the rendered current package index", async () => {
    const model = await collectPackageIndex({ root });

    await expect(
      validatePackageIndex({ root, text: renderPackageIndex(model) }),
    ).resolves.toEqual([]);
  });

  it("rejects a missing, duplicate, or mismatched package row", async () => {
    const model = await collectPackageIndex({ root });
    const rendered = renderPackageIndex(model);
    const withoutFirst = rendered.replace(
      "[@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md)",
      "",
    );
    const withDuplicate =
      rendered.replace(
        "| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) |",
        "| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) |",
      ) +
      "\n| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) | kind:product, area:bootstrap | duplicate |\n";
    const withWrongTags = rendered.replace(
      "| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) | kind:product, area:bootstrap |",
      "| [@heptalogos/bootstrap-runtime](./bootstrap-runtime/README.md) | kind:product, area:shared |",
    );

    await expect(validatePackageIndex({ root, text: withoutFirst })).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("missing package row")]),
    );
    await expect(validatePackageIndex({ root, text: withDuplicate })).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("duplicate")]),
    );
    await expect(validatePackageIndex({ root, text: withWrongTags })).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("tags")]),
    );
  });
});
