import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { markdownLinks, markdownTargets, section } from "../src/markdown.mjs";
import { isWithinPath, normalizeRepositoryPath } from "../src/paths.mjs";

describe("repo-kit Markdown mechanics", () => {
  it("extracts local links and ignores fenced examples when requested", () => {
    const source = [
      "[local](docs/README.md#section)",
      "[remote](https://example.test)",
      "```md",
      "[fenced](ignored.md)",
      "```",
    ].join("\n");

    expect(markdownLinks(source, { ignoreFencedCode: true })).toEqual([
      { target: "docs/README.md" },
    ]);
    expect(markdownTargets(source)).toEqual(["docs/README.md", "ignored.md"]);
  });

  it("extracts a named second-level section", () => {
    expect(section("## Purpose\nfirst\n## Owns\nsecond\n", "Owns")).toBe("\nsecond\n");
    expect(section("# Root\n", "Missing")).toBe("");
  });
});

describe("repo-kit path mechanics", () => {
  it("normalizes repository paths and rejects escapes", () => {
    const root = join("C:\\repo", "project");
    const child = join(root, "docs", "README.md");
    expect(normalizeRepositoryPath(root, child)).toBe("docs/README.md");
    expect(isWithinPath(root, child)).toBe(true);
    expect(isWithinPath(root, join(root, "..", "outside.md"))).toBe(false);
  });
});
