/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Credential diagnostics screen — surfaces `getCredentialDiagnostics` output
 * when a run fails for auth/env reasons.
 */

import { Box, Text, useInput } from "ink";
import { Colors } from "../../colors.js";

export interface CredentialDiagnosticView {
  label: string;
  value: string;
  status?: "ok" | "error" | "warning";
}

export function CredentialDiagnosticsScreen({
  diagnostics,
  onClose,
}: {
  diagnostics: CredentialDiagnosticView[];
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

  const colorFor = (status?: string) =>
    status === "error"
      ? Colors.AccentRed
      : status === "warning"
        ? Colors.AccentYellow
        : status === "ok"
          ? Colors.AccentGreen
          : Colors.Gray;

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={Colors.AccentYellow} bold>
        Credential diagnostics
      </Text>
      {diagnostics.length === 0 ? (
        <Text color={Colors.Gray}>No issues detected.</Text>
      ) : (
        diagnostics.map((d) => (
          <Box key={d.label}>
            <Text color={Colors.Foreground}>{d.label.padEnd(22)} </Text>
            <Text color={colorFor(d.status)}>{d.value}</Text>
          </Box>
        ))
      )}
      <Box marginTop={1}>
        <Text color={Colors.Comment}>Press Enter or Esc to dismiss.</Text>
      </Box>
    </Box>
  );
}
