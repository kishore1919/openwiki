#!/usr/bin/env bun
import path from "node:path";
import { openWikiLocalWikiDir } from "../openwiki-home.js";
import {
  formatMermaidReport,
  validateMermaidPaths,
  type MermaidFileResult,
} from "./validate.js";

const DEFAULT_TARGETS = ["openwiki", openWikiLocalWikiDir];

/**
 * Runs Mermaid validation over the given paths (or the repository openwiki/
 * directory and the local personal wiki when no paths are supplied).
 * Returns a process exit code: 0 when every diagram is valid, 1 otherwise.
 */
export async function runMermaidValidation(
  argv: string[],
): Promise<number> {
  const paths = argv.length > 0 ? argv : DEFAULT_TARGETS;
  const targets = paths.map((target) => path.resolve(target));

  const results: MermaidFileResult[] = await validateMermaidPaths(targets);
  const report = formatMermaidReport(results);

  const hasErrors = results.some((result) => result.issues.length > 0);

  if (hasErrors) {
    process.stderr.write(`${report}\n`);

    return 1;
  }

  process.stdout.write(`${report}\n`);

  return 0;
}

if (import.meta.main) {
  const exitCode = await runMermaidValidation(process.argv.slice(2));

  process.exit(exitCode);
}
