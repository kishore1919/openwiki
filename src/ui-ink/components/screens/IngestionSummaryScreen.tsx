/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Ingestion summary screen — shown after a successful /init or /update run,
 * summarizing the result.
 */

import { Box, Text, useInput } from "ink";
import { Colors } from "../../colors.js";

export function IngestionSummaryScreen({
  result,
  onClose,
}: {
  result: { command: string; model: string; skipped?: boolean };
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
      <Text color={Colors.AccentGreen} bold>
        /{result.command} complete
      </Text>
      <Text color={Colors.Foreground}>
        {result.skipped
          ? "No repository changes detected — documentation was skipped."
          : `OpenWiki documentation was ${result.command === "init" ? "generated" : "updated"}.`}
      </Text>
      <Box marginTop={1}>
        <Text color={Colors.Gray}>model: {result.model}</Text>
      </Box>
      <Box>
        <Text color={Colors.Comment}>Press Enter or Esc to continue.</Text>
      </Box>
    </Box>
  );
}
