/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Welcome screen — shown before the first chat message. Reads provider/model
 * from props (sourced from OpenWiki's constants/env in AppContainer).
 */

import { Box, Text, useInput } from "ink";
import { Colors } from "../../colors.js";

export function WelcomeScreen({
  providerLabel,
  modelId,
  onClose,
}: {
  providerLabel: string;
  modelId: string;
  onClose: () => void;
}) {
  useInput(
    (_input, key) => {
      if (key.return || key.escape) {
        onClose();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={Colors.AccentBlue} bold>
        ✦ OpenWiki
      </Text>
      <Text color={Colors.Foreground}>
        A documentation agent for your codebase.
      </Text>
      <Box marginTop={1}>
        <Text color={Colors.Gray}>
          provider: {providerLabel} · model: {modelId}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.Comment}>
          Ask a question, try /init or /update, or type /help for commands.
        </Text>
        <Text color={Colors.Comment}>Press Enter to start.</Text>
      </Box>
    </Box>
  );
}
