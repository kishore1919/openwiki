/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Main content region. Messages are bottom-aligned (a flexible spacer sits
 * above them) so the latest message stays visible as the conversation grows;
 * `scrollOffset` hides the newest N items to let the user scroll back through
 * history. A ported `ScrollableList`/`VirtualizedList` can later replace the
 * manual slicing with true virtualization.
 */

import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import type { HistoryItem } from "../ui/types.js";
import { HistoryItemDisplay } from "./HistoryItemDisplay.js";

export function MainContent({
  items,
  scrollOffset = 0,
}: {
  items: HistoryItem[];
  scrollOffset?: number;
}) {
  const visible =
    scrollOffset > 0 ? items.slice(0, Math.max(0, items.length - scrollOffset)) : items;

  return (
    <Box flexGrow={1} flexDirection="column" overflow="hidden" paddingX={1}>
      <Box flexGrow={1} />
      {visible.length === 0 ? (
        <Box flexDirection="column" marginY={1}>
          <Text color={Colors.Foreground}>
            OpenWiki — ask me to document, explain, or update this codebase.
          </Text>
          <Text color={Colors.Comment}>
            Try: &quot;Summarize the agent run loop&quot; · /help for commands
          </Text>
        </Box>
      ) : (
        visible.map((item, index) => (
          <Box key={index} marginBottom={1}>
            <HistoryItemDisplay item={item} />
          </Box>
        ))
      )}
    </Box>
  );
}
