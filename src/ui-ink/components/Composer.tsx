/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Composer hosts the input prompt and a one-line status hint. In Phase 2 this
 * is extended with the slash-command menu and @-mention suggestion list.
 */

import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import type { OpenWikiProvider } from "../../constants.js";
import type { StreamingState } from "../hooks/useOpenWikiStream.js";
import { InputPrompt } from "./InputPrompt.js";

export interface ComposerProps {
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onExit: () => void;
  streamingState: StreamingState;
  active: boolean;
  messageHistory: string[];
  currentProvider: OpenWikiProvider;
  currentModelId: string;
  onShowChatHistory: () => void;
  scrollOffset: number;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export function Composer({
  onSubmit,
  onCancel,
  onExit,
  streamingState,
  active,
  messageHistory,
  currentProvider,
  currentModelId,
  onShowChatHistory,
  scrollOffset,
  onScrollUp,
  onScrollDown,
}: ComposerProps) {
  const disabled =
    streamingState === "pending" || streamingState === "responding";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={Colors.DarkGray} paddingX={1}>
      <InputPrompt
        onSubmit={onSubmit}
        onCancel={onCancel}
        onExit={onExit}
        disabled={disabled}
        active={active}
        messageHistory={messageHistory}
        currentProvider={currentProvider}
        currentModelId={currentModelId}
        onShowChatHistory={onShowChatHistory}
        scrollOffset={scrollOffset}
        onScrollUp={onScrollUp}
        onScrollDown={onScrollDown}
      />
      {disabled && (
        <Box>
          <Text color={Colors.Comment}>Responding… (Esc to cancel)</Text>
        </Box>
      )}
    </Box>
  );
}
