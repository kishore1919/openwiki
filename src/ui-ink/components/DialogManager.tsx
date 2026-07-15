/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Dialog slot. gemini-cli's `DialogManager.tsx` renders an overlay dialog;
 * here it hosts the help screen, masked secret prompts (api-key /
 * langsmith-key), and simple confirm dialogs. While a dialog is open the
 * chat `InputPrompt` is deactivated (see AppContainer) so input ownership is
 * unambiguous.
 */

import { Box, Text, useInput } from "ink";
import { Colors } from "../colors.js";
import { Help } from "./Help.js";
import { SecretPrompt } from "./SecretPrompt.js";

export type Dialog =
  | { kind: "help" }
  | {
      kind: "secret";
      secretKind: "api-key" | "langsmith-key";
      label: string;
      placeholder?: string;
      onSubmit: (value: string) => void;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel?: string;
      onConfirm: () => void;
    };

export function DialogManager({
  dialog,
  onClose,
}: {
  dialog: Dialog;
  onClose: () => void;
}) {
  useInput(
    (_input, key) => {
      if (dialog.kind === "secret") {
        return;
      }
      if (key.escape) {
        onClose();
        return;
      }
      if (dialog.kind === "confirm" && key.return) {
        dialog.onConfirm();
      }
    },
    { isActive: true },
  );

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.AccentBlue}
      paddingX={2}
      paddingY={1}
      flexDirection="column"
    >
      {dialog.kind === "help" && <Help />}
      {dialog.kind === "secret" && (
        <SecretPrompt
          label={dialog.label}
          placeholder={dialog.placeholder}
          onSubmit={(value) => {
            dialog.onSubmit(value);
            onClose();
          }}
          onCancel={onClose}
        />
      )}
      {dialog.kind === "confirm" && (
        <Box flexDirection="column">
          <Text color={Colors.Foreground} bold>
            {dialog.title}
          </Text>
          <Text color={Colors.Gray}>{dialog.message}</Text>
          <Box marginTop={1}>
            <Text color={Colors.Comment}>
              Enter: {dialog.confirmLabel ?? "confirm"} · Esc: cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
