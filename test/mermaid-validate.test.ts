import { afterAll, describe, expect, test } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  extractMermaidBlocks,
  formatMermaidReport,
  validateMermaidDiagram,
  validateMermaidInMarkdown,
  validateMermaidPaths,
  type MermaidFileResult,
} from "../src/mermaid/validate.ts";

describe("extractMermaidBlocks", () => {
  test("returns only mermaid fences with 1-based line numbers", () => {
    const markdown = [
      "# Title",
      "",
      "```mermaid",
      "graph TD",
      "  A-->B",
      "```",
      "",
      "```js",
      "const x = 1;",
      "```",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  A->>B: hi",
      "```",
    ].join("\n");

    const blocks = extractMermaidBlocks(markdown);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      line: 3,
      code: "graph TD\n  A-->B",
    });
    expect(blocks[1].line).toBe(12);
  });

  test("extracts both backtick and tilde mermaid fences, ignoring non-mermaid info strings", () => {
    const markdown = [
      "~~~mermaid",
      "graph TD",
      "~~~",
      "",
      "```mermaid",
      "graph TD",
      "```",
      "",
      "```",
      "plain code",
      "```",
    ].join("\n");

    const blocks = extractMermaidBlocks(markdown);

    expect(blocks).toHaveLength(2);
    expect(blocks.map((block) => block.line).sort((a, b) => a - b)).toEqual([
      1, 5,
    ]);
  });

  test("returns no blocks when there is no mermaid diagram", () => {
    expect(extractMermaidBlocks("just text")).toHaveLength(0);
  });
});

describe("validateMermaidDiagram", () => {
  test("accepts a valid flowchart", async () => {
    const result = await validateMermaidDiagram("graph TD\n  A-->B");

    expect(result.valid).toBe(true);
  });

  test("rejects an unparseable diagram", async () => {
    const result = await validateMermaidDiagram("not a real diagram ???");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("validateMermaidInMarkdown", () => {
  test("reports the line of an invalid diagram only", async () => {
    const markdown = [
      "```mermaid",
      "graph TD",
      "  A-->B",
      "```",
      "",
      "```mermaid",
      "??? broken",
      "```",
    ].join("\n");

    const issues = await validateMermaidInMarkdown(markdown);

    expect(issues).toHaveLength(1);
    expect(issues[0].line).toBe(6);
  });

  test("returns no issues for valid only markdown", async () => {
    const markdown = "```mermaid\nsequenceDiagram\n  A->>B: hi\n```";

    expect(await validateMermaidInMarkdown(markdown)).toHaveLength(0);
  });
});

describe("validateMermaidPaths", () => {
  let dir: string;

  afterAll(async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("walks directories and validates diagrams in markdown files", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "openwiki-mermaid-"));
    const nested = path.join(dir, "docs");
    await mkdir(nested, { recursive: true });
    await writeFile(
      path.join(dir, "index.md"),
      "```mermaid\ngraph TD\n  A-->B\n```\n",
    );
    await writeFile(
      path.join(dir, "notes.txt"),
      "```mermaid\ngraph TD\n  A-->B\n```\n",
    );
    await writeFile(
      path.join(nested, "bad.md"),
      "```mermaid\n??? nope\n```\n",
    );

    const results: MermaidFileResult[] = await validateMermaidPaths([dir]);
    const filesWithBlocks = results.map((result) => result.file).sort();

    expect(filesWithBlocks).toContain(path.join(dir, "index.md"));
    expect(filesWithBlocks).toContain(path.join(nested, "bad.md"));
    // .txt is not a markdown extension, so it is skipped.
    expect(filesWithBlocks).not.toContain(path.join(dir, "notes.txt"));

    const bad = results.find((result) => result.file.endsWith("bad.md"));
    expect(bad?.issues).toHaveLength(1);

    const good = results.find((result) => result.file.endsWith("index.md"));
    expect(good?.issues).toHaveLength(0);
  });

  test("validates a single file directly", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "openwiki-mermaid-"));
    const file = path.join(dir, "single.md");
    await writeFile(file, "```mermaid\nflowchart LR\n  A-->B\n```\n");

    const results = await validateMermaidPaths([file]);

    expect(results).toHaveLength(1);
    expect(results[0].issues).toHaveLength(0);
  });
});

describe("formatMermaidReport", () => {
  test("reports success with diagram and file counts", () => {
    const report = formatMermaidReport([
      { file: "a.md", blocks: [{ line: 1, code: "graph TD" }], issues: [] },
    ]);

    expect(report).toContain("passed");
    expect(report).toContain("1 diagram");
  });

  test("reports failures with file and line", () => {
    const report = formatMermaidReport([
      {
        file: "a.md",
        blocks: [{ line: 1, code: "x" }],
        issues: [{ line: 1, message: "boom" }],
      },
    ]);

    expect(report).toContain("failed");
    expect(report).toContain("a.md");
    expect(report).toContain("line 1");
  });
});
