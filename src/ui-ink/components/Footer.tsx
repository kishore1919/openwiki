/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Merged footer (replaces OpenWiki's old footer + gemini-cli's Footer into a
 * single status line). Shows streaming state, in-flight tool count, and the
 * latest token usage. The full footer config dialog / theme switcher is
 * Phase 2/3 work.
 */

import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import type { ToolCallDisplay } from "../ui/types.js";
import type { StreamingState, UsageInfo } from "../hooks/useOpenWikiStream.js";

const STATE_LABEL: Record<StreamingState, string> = {
  idle: "Ready",
  pending: "Starting…",
  responding: "Responding…",
  complete: "Ready",
  error: "Error",
  cancelled: "Cancelled",
};

const STATE_COLOR: Record<StreamingState, string> = {
  idle: Colors.AccentGreen,
  pending: Colors.AccentYellow,
  responding: Colors.AccentCyan,
  complete: Colors.AccentGreen,
  error: Colors.AccentRed,
  cancelled: Colors.AccentYellow,
};

export interface FooterProps {
  streamingState: StreamingState;
  pendingToolCalls: ToolCallDisplay[];
  usage: UsageInfo | null;
  scrollOffset?: number;
}

export function Footer({
  streamingState,
  pendingToolCalls,
  usage,
  scrollOffset = 0,
}: FooterProps) {
  const right = usage
    ? `${usage.totalTokens} tokens`
    : pendingToolCalls.length > 0
      ? `${pendingToolCalls.length} tool${pendingToolCalls.length === 1 ? "" : "s"} running`
      : scrollOffset > 0
        ? `↑ ${scrollOffset} scrolled · ↑/↓ to view`
        : "";

  return (
    <Box paddingX={1} justifyContent="space-between">
      <Text color={STATE_COLOR[streamingState]}>
        {streamingState === "responding" ? "◐ " : ""}
        {STATE_LABEL[streamingState]}
      </Text>
      <Text color={Colors.Comment}>{right}</Text>
    </Box>
  );
}
