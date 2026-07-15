import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Reads the current git branch by walking up from `cwd` to find `.git/HEAD`.
 *
 * Synchronous and cheap so it can be called during render. Returns null when the
 * directory is not a git repository or HEAD is detached/unreadable.
 */
export function readGitBranch(cwd: string): string | null {
  let dir = cwd;

  // Walk up until we hit the filesystem root.
  for (;;) {
    const headPath = join(dir, ".git", "HEAD");

    if (existsSync(headPath)) {
      try {
        const head = readFileSync(headPath, "utf8").trim();
        const match = head.match(/^ref:\s*refs\/heads\/(.+)$/u);

        if (match) {
          return match[1];
        }

        // Detached HEAD: show a short commit hash.
        return head.length >= 7 ? head.slice(0, 7) : null;
      } catch {
        return null;
      }
    }

    const parent = dirname(dir);

    if (parent === dir) {
      return null;
    }

    dir = parent;
  }
}
