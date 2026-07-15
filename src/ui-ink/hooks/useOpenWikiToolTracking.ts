/**
 * Thin tool-tracking layer. No scheduler or confirmation queue (OpenWiki's
 * DeepAgents backend runs tools non-interactively). Provides pure reducers
 * that merge consecutive `tool_start` events into a single grouped
 * `HistoryItem` and flip statuses on `tool_end`, plus a thin hook that
 * derives the list of in-flight tool calls for the footer.
 */

import type { OpenWikiRunEvent } from "../../agent/types.js";
import {
  isGroupRunning,
  type HistoryItem,
  type ToolCallDisplay,
  type ToolCallStatus,
} from "../ui/types.js";
import { toToolCallDisplay } from "../utils/toolDisplay.js";

function aggregateGroupStatus(tools: ToolCallDisplay[]): ToolCallStatus {
  if (tools.some((t) => isGroupRunning(t.status))) {
    return "Executing";
  }
  if (tools.some((t) => t.status === "Error")) {
    return "Error";
  }
  return "Success";
}

export function applyToolStart(
  history: HistoryItem[],
  event: Extract<OpenWikiRunEvent, { type: "tool_start" }>,
): HistoryItem[] {
  const display = toToolCallDisplay(event);
  const last = history.at(-1);

  if (last && last.type === "tool_group" && isGroupRunning(last.status)) {
    const tools = [...last.tools, display];
    return [
      ...history.slice(0, -1),
      { type: "tool_group", tools, status: aggregateGroupStatus(tools) },
    ];
  }

  return [
    ...history,
    { type: "tool_group", tools: [display], status: "Executing" },
  ];
}

export function applyToolEnd(
  history: HistoryItem[],
  event: Extract<OpenWikiRunEvent, { type: "tool_end" }>,
): HistoryItem[] {
  let targetIndex = -1;
  let targetToolIndex = -1;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const item = history[i];
    if (item.type !== "tool_group") {
      continue;
    }
    const toolIndex = item.tools.findIndex(
      (t) => t.id === event.id && isGroupRunning(t.status),
    );
    if (toolIndex !== -1) {
      targetIndex = i;
      targetToolIndex = toolIndex;
      break;
    }
  }

  if (targetIndex === -1) {
    return history;
  }

  const group = history[targetIndex];
  if (group.type !== "tool_group") {
    return history;
  }

  const nextStatus: ToolCallStatus =
    event.status === "error" ? "Error" : "Success";
  const tools: ToolCallDisplay[] = group.tools.map((t, i) =>
    i === targetToolIndex ? { ...t, status: nextStatus } : t,
  );

  return history.map((item, i) =>
    i === targetIndex
      ? { type: "tool_group", tools, status: aggregateGroupStatus(tools) }
      : item,
  );
}

export function useOpenWikiToolTracking(history: HistoryItem[]): {
  pendingToolCalls: ToolCallDisplay[];
} {
  const pendingToolCalls: ToolCallDisplay[] = [];
  for (const item of history) {
    if (item.type === "tool_group" && isGroupRunning(item.status)) {
      for (const tool of item.tools) {
        if (isGroupRunning(tool.status)) {
          pendingToolCalls.push(tool);
        }
      }
    }
  }
  return { pendingToolCalls };
}
