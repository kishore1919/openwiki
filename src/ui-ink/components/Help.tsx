/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Slash-command help dialog.
 */

import { Box, Text } from "ink";
import { Colors } from "../colors.js";
import { slashCommandOptions } from "../commands/openWikiSlashCommandProcessor.js";

export function Help() {
  return (
    <Box flexDirection="column">
      <Text color={Colors.AccentBlue} bold>
        OpenWiki commands
      </Text>
      {slashCommandOptions.map((option) => (
        <Box key={option.id}>
          <Text color={Colors.Foreground}>{option.label.padEnd(16)} </Text>
          <Text color={Colors.Gray}>{option.description}</Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color={Colors.Comment}>
          Type / then Tab to autocomplete. Up/Down recalls history. @ mentions
          files.
        </Text>
      </Box>
    </Box>
  );
}
