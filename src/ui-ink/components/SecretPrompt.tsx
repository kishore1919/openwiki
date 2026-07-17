/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Masked secret prompt for /api-key and /langsmith-key. gemini-cli uses a
 * terminal raw-mode secret input; here we capture keystrokes directly and
 * mask them, since the TUI already owns the raw terminal.
 */

import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Colors } from "../colors.js";

export interface SecretPromptProps {
  label: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function SecretPrompt({
  label,
  placeholder = "Paste key, or Enter empty to clear",
  onSubmit,
  onCancel,
}: SecretPromptProps) {
  const [value, setValue] = useState("");

  useInput(
    (input, key) => {
      const keyName = (key as { name?: string }).name;
      if (key.ctrl && keyName === "c") {
        onCancel();
        return;
      }
      if (key.escape) {
        onCancel();
        return;
      }
      if (key.return) {
        onSubmit(value);
        return;
      }
      if (key.backspace || key.delete) {
        setValue((v) => v.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setValue((v) => v + input);
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column">
      <Text color={Colors.Foreground}>{label}</Text>
      <Text color={Colors.Comment}>{placeholder}</Text>
      <Box marginTop={1}>
        <Text color={Colors.AccentGreen}>{"●".repeat(value.length) || " "}</Text>
        <Text color={Colors.Foreground}>█</Text>
      </Box>
    </Box>
  );
}
