/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Chat history screen — lists completed OpenWiki runs (the ported equivalent
 * of OpenWiki's existing completed-run list).
 */

import { Box, Text, useInput } from "ink";
import { Colors } from "../../colors.js";

export interface CompletedRunView {
  id: number;
  command: string;
  message: string | null;
}

export function ChatHistoryScreen({
  runs,
  onClose,
}: {
  runs: CompletedRunView[];
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
        Recent runs
      </Text>
      {runs.length === 0 ? (
        <Text color={Colors.Gray}>No completed runs yet.</Text>
      ) : (
        runs
          .slice()
          .reverse()
          .map((run) => (
            <Box key={run.id}>
              <Text color={Colors.Gray}>
                #{run.id} /{run.command}{" "}
              </Text>
              <Text color={Colors.Foreground}>
                {run.message ?? "(no message)"}
              </Text>
            </Box>
          ))
      )}
      <Box marginTop={1}>
        <Text color={Colors.Comment}>Press Enter or Esc to dismiss.</Text>
      </Box>
    </Box>
  );
}
