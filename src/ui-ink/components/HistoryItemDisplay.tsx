/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Dispatches a HistoryItem to the correct visual shell. User/assistant turns
 * get a role label ("You" / "OpenWiki") so the conversation reads clearly.
 */

import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import type { HistoryItem } from "../ui/types.js";
import { AssistantMessage } from "./messages/AssistantMessage.js";
import { ToolGroupMessage } from "./messages/ToolGroupMessage.js";

export function HistoryItemDisplay({ item }: { item: HistoryItem }) {
  switch (item.type) {
    case "user":
      return (
        <Box flexDirection="column">
          <Text color={Colors.AccentBlue} bold>
            {"❯ You"}
          </Text>
          <Text color={Colors.Foreground} wrap="wrap">
            {item.text}
          </Text>
        </Box>
      );
    case "assistant":
      return (
        <Box flexDirection="column">
          <Text color={Colors.AccentPurple} bold>
            {"✦ OpenWiki"}
          </Text>
          <AssistantMessage text={item.text} />
        </Box>
      );
    case "tool_group":
      return (
        <Box flexDirection="column">
          <Text color={Colors.Gray} bold>
            {"⚙ Tools"}
          </Text>
          <ToolGroupMessage tools={item.tools} status={item.status} />
        </Box>
      );
    case "info":
      return (
        <Text color={Colors.AccentCyan} wrap="wrap">
          {item.text}
        </Text>
      );
    case "warning":
      return (
        <Text color={Colors.AccentYellow} wrap="wrap">
          ⚠ {item.text}
        </Text>
      );
    case "error":
      return (
        <Text color={Colors.AccentRed} wrap="wrap">
          ✖ {item.text}
        </Text>
      );
    case "debug":
      return (
        <Text color={Colors.Comment} wrap="wrap">
          · {item.text}
        </Text>
      );
    default:
      return null;
  }
}
