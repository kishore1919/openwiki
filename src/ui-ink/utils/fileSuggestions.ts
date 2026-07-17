/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Lightweight file-path suggestions for the `@`-mention autocomplete. Lists
 * entries in the working directory (one level deep) filtered by the query
 * typed after `@`.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export function getFileSuggestions(cwd: string, query: string): string[] {
  const results = new Set<string>();
  const lower = query.toLowerCase();

  const walk = (dir: string, depth: number) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      if (!entry.name.toLowerCase().includes(lower)) {
        continue;
      }
      const relative = path.relative(cwd, path.join(dir, entry.name));
      results.add(relative);
      if (
        entry.isDirectory() &&
        depth < 1 &&
        results.size < 50
      ) {
        walk(path.join(dir, entry.name), depth + 1);
      }
      if (results.size >= 50) {
        return;
      }
    }
  };

  walk(cwd, 0);
  return Array.from(results).sort().slice(0, 12);
}
