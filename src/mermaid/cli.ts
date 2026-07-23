#!/usr/bin/env bun
import path from "node:path";
import { openWikiLocalWikiDir } from "../openwiki-home.js";
import { findInvalidMermaidFences } from "./validate.js";
import { extractMermaidFences } from "./fences.js";
import { readFile, readdir, stat } from "node:fs/promises";

const DEFAULT_TARGETS = ["openwiki", openWikiLocalWikiDir];
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);
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

/**
 * Runs Mermaid validation over the given paths (or the repository openwiki/
 * directory and the local personal wiki when no paths are supplied).
 * Returns a process exit code: 0 when every diagram is valid, 1 otherwise.
 */
export async function runMermaidValidation(argv: string[]): Promise<number> {
  const paths = argv.length > 0 ? argv : DEFAULT_TARGETS;
  const targets = paths.map((target) => path.resolve(target));

  const files = (
    await Promise.all(targets.map((target) => collectMarkdownFiles(target)))
  ).flat();

  let totalFences = 0;
  let totalErrors = 0;
  const lines: string[] = [];

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    const fences = extractMermaidFences(markdown);
    totalFences += fences.length;

    if (fences.length === 0) {
      continue;
    }

    const errors = await findInvalidMermaidFences(markdown);
    if (errors.length === 0) {
      continue;
    }

    totalErrors += errors.length;
    lines.push(file);
    for (const { fence, error } of errors) {
      lines.push(`  line ${fence.openLine + 1}: ${error}`);
    }
  }

  let report: string;
  if (totalErrors === 0) {
    report = `Mermaid validation passed: ${totalFences} diagram(s) across ${files.length} file(s).`;
  } else {
    report = `Mermaid validation failed: ${totalErrors} invalid diagram(s) in ${files.length} file(s).\n${lines.join("\n")}`;
  }

  if (totalErrors > 0) {
    process.stderr.write(`${report}\n`);
    return 1;
  }

  process.stdout.write(`${report}\n`);
  return 0;
}

async function collectMarkdownFiles(target: string): Promise<string[]> {
  let stats: { isFile: () => boolean; isDirectory: () => boolean };
  try {
    stats = await stat(target);
  } catch {
    return [];
  }

  if (stats.isFile()) {
    return MARKDOWN_EXTENSIONS.has(path.extname(target).toLowerCase())
      ? [target]
      : [];
  }

  if (!stats.isDirectory()) {
    return [];
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

if (import.meta.main) {
  const exitCode = await runMermaidValidation(process.argv.slice(2));
  process.exit(exitCode);
}
