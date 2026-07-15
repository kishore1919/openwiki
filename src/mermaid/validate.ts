import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type MermaidBlock = {
  /** 1-based line number of the opening ```mermaid fence. */
  line: number;
  /** The diagram source (without the fences). */
  code: string;
};

export type MermaidIssue = {
  /** 1-based line number of the opening fence for the offending diagram. */
  line: number;
  message: string;
};

export type MermaidFileResult = {
  file: string;
  blocks: MermaidBlock[];
  issues: MermaidIssue[];
};

export type MermaidDiagramResult =
  | { valid: true; diagramType?: string }
  | { valid: false; error: string };

const FENCE_PATTERN = /^(```|~~~)([a-zA-Z0-9_-]*)\s*$/;
const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);

/**
 * Extracts every fenced ```mermaid (or ~~~mermaid) code block from Markdown.
 * Returns only blocks whose info string is exactly `mermaid`.
 */
export function extractMermaidBlocks(markdown: string): MermaidBlock[] {
  const lines = markdown.split("\n");
  const blocks: MermaidBlock[] = [];
  let openLine = -1;
  let codeLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = FENCE_PATTERN.exec(line);

    if (!match) {
      if (openLine !== -1) {
        codeLines.push(line);
      }

      continue;
    }

    const fence = match[1];
    const info = match[2];

    if (openLine === -1) {
      if (info === "mermaid") {
        openLine = index + 1;
        codeLines = [];
      }

      continue;
    }

    if (line.startsWith(fence) && info === "") {
      blocks.push({ line: openLine, code: codeLines.join("\n") });
      openLine = -1;
      codeLines = [];
    }
  }

  return blocks;
}

let mermaidApi: { parse: (text: string) => Promise<unknown> } | null = null;
let mermaidReady: Promise<void> | null = null;

/**
 * Lazily installs a minimal DOM shim and loads mermaid so `mermaid.parse`
 * can validate diagram syntax outside a browser. Only invoked when a run
 * actually validates diagrams, so normal OpenWiki startup stays fast.
 */
function ensureMermaid(): Promise<void> {
  if (mermaidReady) {
    return mermaidReady;
  }

  mermaidReady = (async () => {
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      pretendToBeVisual: true,
    });

    const globalRef = globalThis as unknown as Record<string, unknown>;
    globalRef.window = dom.window;
    globalRef.document = dom.window.document;
    globalRef.navigator = dom.window.navigator;

    const mermaidModule = (await import("mermaid")) as {
      default?: { initialize: (config: unknown) => void; parse: (text: string) => Promise<unknown> };
    };
    const mermaid = mermaidModule.default;
    mermaid?.initialize({ startOnLoad: false });
    mermaidApi = mermaid ?? null;
  })();

  return mermaidReady;
}

/** Validates a single Mermaid diagram source string. */
export async function validateMermaidDiagram(
  code: string,
): Promise<MermaidDiagramResult> {
  await ensureMermaid();

  try {
    const result = (await mermaidApi?.parse(code)) as
      | { diagramType?: string }
      | undefined;
    const diagramType =
      typeof result?.diagramType === "string" ? result.diagramType : undefined;

    return { valid: true, diagramType };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    return { valid: false, error: message.split("\n")[0]?.trim() || message };
  }
}

/** Validates every Mermaid block in a Markdown string. */
export async function validateMermaidInMarkdown(
  markdown: string,
): Promise<MermaidIssue[]> {
  const blocks = extractMermaidBlocks(markdown);

  const results = await Promise.all(
    blocks.map(async (block) => ({
      block,
      result: await validateMermaidDiagram(block.code),
    })),
  );

  return results
    .filter(({ result }) => !result.valid)
    .map(({ block, result }) => ({
      line: block.line,
      message: result.valid ? "" : result.error,
    }));
}

async function collectMarkdownFiles(target: string): Promise<string[]> {
  const stats = await import("node:fs/promises").then((fs) =>
    fs.stat(target).catch(() => null),
  );

  if (!stats) {
    return [];
  }

  if (stats.isFile()) {
    return MARKDOWN_EXTENSIONS.has(path.extname(target).toLowerCase())
      ? [target]
      : [];
  }

  const entries = await readdir(target, {
    recursive: true,
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const absolute = path.join(entry.parentPath, entry.name);

    if (EXCLUDED_DIR_NAMES.has(entry.name) || isInsideExcluded(absolute)) {
      continue;
    }

    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolute);
    }
  }

  return files.sort();
}

function isInsideExcluded(absolute: string): boolean {
  return absolute
    .split(path.sep)
    .some((segment) => EXCLUDED_DIR_NAMES.has(segment));
}

/**
 * Validates Mermaid diagrams inside one or more files or directories.
 * Directories are walked recursively for Markdown files. Returns one result
 * per file that contains at least one Mermaid block.
 */
export async function validateMermaidPaths(
  targets: string[],
): Promise<MermaidFileResult[]> {
  const files = (
    await Promise.all(targets.map((target) => collectMarkdownFiles(target)))
  ).flat();

  const perFile = await Promise.all(
    files.map(async (file) => {
      const markdown = await readFile(file, "utf8");
      const blocks = extractMermaidBlocks(markdown);
      const issues = await validateMermaidInMarkdown(markdown);

      return { file, blocks, issues };
    }),
  );

  return perFile.filter((result) => result.blocks.length > 0);
}

/** Returns a human-readable report for validation results. */
export function formatMermaidReport(results: MermaidFileResult[]): string {
  const lines: string[] = [];
  let errorCount = 0;

  for (const result of results) {
    if (result.issues.length === 0) {
      continue;
    }

    errorCount += result.issues.length;
    lines.push(`${result.file}`);

    for (const issue of result.issues) {
      lines.push(`  line ${issue.line}: ${issue.message}`);
    }
  }

  if (errorCount === 0) {
    const blockCount = results.reduce(
      (total, result) => total + result.blocks.length,
      0,
    );

    return `Mermaid validation passed: ${blockCount} diagram(s) across ${results.length} file(s).`;
  }

  lines.unshift(
    `Mermaid validation failed: ${errorCount} invalid diagram(s) in ${results.length} file(s).`,
  );

  return lines.join("\n");
}
