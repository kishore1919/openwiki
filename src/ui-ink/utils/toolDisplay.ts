/**
 * Path-aware tool labels. Ported near-verbatim from `src/cli.tsx`
 * (createToolDisplay / getStringField / pickToolDisplay / pickVariantIndex,
 * ~lines 3304-3531). gemini-cli drives tool grouping through its own
 * scheduler; here the same phrasing-variety logic is reused to build the
 * `ToolCallDisplay.label` for OpenWiki's own grouped tool items.
 */

import type { OpenWikiRunEvent } from "../../agent/types.js";
import type { ToolCallDisplay } from "../ui/types.js";

type ToolDisplay = {
  done: string;
  running: string;
  showDetail: boolean;
};

function parseToolInput(input: unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function getStringField(input: unknown, key: string): string | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const value = input[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function countToolTargets(input: unknown, keys: string[]): number {
  if (Array.isArray(input)) {
    return Math.max(input.length, 1);
  }
  if (!isRecord(input)) {
    return 1;
  }
  for (const key of keys) {
    const value = input[key];
    if (Array.isArray(value)) {
      return Math.max(value.length, 1);
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return 1;
    }
  }
  return 1;
}

function countTodoItems(input: unknown): number {
  if (!isRecord(input)) {
    return 1;
  }
  const todos = input.todos ?? input.items;
  return Array.isArray(todos) ? Math.max(todos.length, 1) : 1;
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function pickVariantIndex(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickToolDisplay(
  variantIndex: number,
  running: string[],
  done: string[],
  showDetail = true,
): ToolDisplay {
  const index = variantIndex % Math.min(running.length, done.length);
  return { done: done[index], running: running[index], showDetail };
}

export function createToolDisplay(
  event: Extract<OpenWikiRunEvent, { type: "tool_start" }>,
): ToolDisplay {
  const input = parseToolInput(event.input);
  const variantIndex = pickVariantIndex(
    `${event.id}:${event.name}:${event.call}`,
  );

  switch (event.name) {
    case "read_file": {
      const target = getStringField(input, "file_path") ?? "a file";
      return pickToolDisplay(
        variantIndex,
        [`Reading ${target}`, `Examining ${target}`, `Taking a look at ${target}`],
        [`Read ${target}`, `Examined ${target}`, `Looked at ${target}`],
      );
    }
    case "edit_file": {
      const target = getStringField(input, "file_path") ?? "a file";
      return pickToolDisplay(
        variantIndex,
        [`Editing ${target}`, `Updating ${target}`, `Applying changes to ${target}`],
        [`Edited ${target}`, `Updated ${target}`, `Applied changes to ${target}`],
        false,
      );
    }
    case "write_file": {
      const target = getStringField(input, "file_path") ?? "a file";
      return pickToolDisplay(
        variantIndex,
        [`Writing ${target}`, `Creating ${target}`, `Saving ${target}`],
        [`Wrote ${target}`, `Created ${target}`, `Saved ${target}`],
        false,
      );
    }
    case "ls": {
      const dir = getStringField(input, "path");
      const label = dir && dir !== "/" ? dir : "a directory";
      return pickToolDisplay(
        variantIndex,
        [`Listing ${label}`, `Scanning ${label}`, `Checking ${label}`],
        [`Listed ${label}`, `Scanned ${label}`, `Checked ${label}`],
      );
    }
    case "glob": {
      const pattern = getStringField(input, "pattern");
      const dir = getStringField(input, "path");
      const patternLabel = pattern ? ` for '${pattern}'` : "";
      const dirLabel = dir && dir !== "/" ? ` in ${dir}` : "";
      return pickToolDisplay(
        variantIndex,
        [
          `Finding files${patternLabel}${dirLabel}`,
          `Searching file paths${patternLabel}${dirLabel}`,
          `Scanning for matches${patternLabel}${dirLabel}`,
        ],
        [
          `Found files${patternLabel}${dirLabel}`,
          `Searched file paths${patternLabel}${dirLabel}`,
          `Scanned for matches${patternLabel}${dirLabel}`,
        ],
      );
    }
    case "grep": {
      const pattern = getStringField(input, "pattern");
      const dir = getStringField(input, "path");
      const patternLabel = pattern ? ` for '${pattern}'` : "";
      const dirLabel = dir && dir !== "/" ? ` in ${dir}` : "";
      return pickToolDisplay(
        variantIndex,
        [
          `Searching file contents${patternLabel}${dirLabel}`,
          `Grepping the codebase${patternLabel}${dirLabel}`,
          `Looking for matches${patternLabel}${dirLabel}`,
        ],
        [
          `Searched file contents${patternLabel}${dirLabel}`,
          `Grepped the codebase${patternLabel}${dirLabel}`,
          `Looked for matches${patternLabel}${dirLabel}`,
        ],
      );
    }
    case "write_todos": {
      const count = countTodoItems(input);
      return pickToolDisplay(
        variantIndex,
        [
          `Updating ${formatCount(count, "todo", "todos")}`,
          `Organizing ${formatCount(count, "todo", "todos")}`,
          `Refreshing ${formatCount(count, "todo", "todos")}`,
        ],
        [
          `Updated ${formatCount(count, "todo", "todos")}`,
          `Organized ${formatCount(count, "todo", "todos")}`,
          `Refreshed ${formatCount(count, "todo", "todos")}`,
        ],
      );
    }
    case "task": {
      const count = countToolTargets(input, [
        "tasks",
        "subagents",
        "agents",
        "items",
      ]);
      return pickToolDisplay(
        variantIndex,
        [
          `Spinning up ${formatCount(count, "subagent", "subagents")}`,
          `Starting ${formatCount(count, "subagent", "subagents")}`,
          `Delegating to ${formatCount(count, "subagent", "subagents")}`,
        ],
        [
          `Finished ${formatCount(count, "subagent", "subagents")}`,
          `Completed ${formatCount(count, "subagent", "subagents")}`,
          `Wrapped up ${formatCount(count, "subagent", "subagents")}`,
        ],
      );
    }
    default:
      return {
        done: event.call,
        running: event.call,
        showDetail: false,
      };
  }
}

export function toToolCallDisplay(
  event: Extract<OpenWikiRunEvent, { type: "tool_start" }>,
): ToolCallDisplay {
  const display = createToolDisplay(event);
  return {
    id: event.id,
    name: event.name,
    label: display.running,
    doneLabel: display.done,
    input: event.input,
    status: "Executing",
  };
}
