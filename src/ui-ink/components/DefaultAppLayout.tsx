/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Default app layout: header/banner, main content (active screen or chat
 * history), composer, merged footer, and a dialog overlay slot.
 */

import type { ReactNode } from "react";
import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import type { ToolCallDisplay } from "../ui/types.js";
import type { StreamingState, UsageInfo } from "../hooks/useOpenWikiStream.js";
import { Footer } from "./Footer.js";

export interface DefaultAppLayoutProps {
  providerLabel: string;
  modelLabel: string;
  main: ReactNode;
  composer: ReactNode | null;
  dialog: ReactNode | null;
  streamingState: StreamingState;
  pendingToolCalls: ToolCallDisplay[];
  usage: UsageInfo | null;
  scrollOffset?: number;
}

export function DefaultAppLayout({
  providerLabel,
  modelLabel,
  main,
  composer,
  dialog,
  streamingState,
  pendingToolCalls,
  usage,
  scrollOffset = 0,
}: DefaultAppLayoutProps) {
  return (
    <Box flexDirection="column" height="100%">
      <Box
        paddingX={1}
        justifyContent="space-between"
        borderStyle="single"
        borderBottom
        borderColor={Colors.DarkGray}
      >
        <Text color={Colors.AccentBlue} bold>
          ✦ OpenWiki
        </Text>
        <Text color={Colors.Comment}>
          {providerLabel} · {modelLabel}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column" overflow="hidden" paddingX={1}>
        {dialog ?? main}
      </Box>
      {composer}
      <Footer
        streamingState={streamingState}
        pendingToolCalls={pendingToolCalls}
        usage={usage}
        scrollOffset={scrollOffset}
      />
    </Box>
  );
}
