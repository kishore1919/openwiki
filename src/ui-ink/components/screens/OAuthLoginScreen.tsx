/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * OAuth login screen — for providers that require browser OAuth (e.g.
 * openai-chatgpt). The actual auth flow reuses OpenWiki's existing
 * `runOAuthAuth`; this screen is the dialog slot that triggers it.
 */

import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Colors } from "../../colors.js";

export function OAuthLoginScreen({
  providerLabel,
  onAuthenticate,
  onClose,
}: {
  providerLabel: string;
  onAuthenticate: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  useInput(
    (_input, key) => {
      if (busy) {
        return;
      }
      if (key.escape) {
        onClose();
        return;
      }
      if (key.return) {
        setBusy(true);
        void Promise.resolve(onAuthenticate()).finally(() => {
          setBusy(false);
          onClose();
        });
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={Colors.AccentBlue} bold>
        Sign in to {providerLabel}
      </Text>
      <Text color={Colors.Foreground}>
        A browser window will open to complete authentication.
      </Text>
      <Box marginTop={1}>
        <Text color={busy ? Colors.AccentYellow : Colors.Comment}>
          {busy ? "Opening browser…" : "Press Enter to authenticate · Esc to cancel"}
        </Text>
      </Box>
    </Box>
  );
}
