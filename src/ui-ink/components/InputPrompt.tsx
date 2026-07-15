/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Full `InputPrompt` port: slash-command suggestion menu, `@`-file-mention
 * autocomplete, and up/down history recall (ported from the old `ChatInput`
 * in src/cli.tsx). Cursor is kept at end of the buffer for Milestone scope.
 */

import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Colors } from "../colors.js";
import type { OpenWikiProvider } from "../../constants.js";
import {
  getProviderLabel,
} from "../../constants.js";
import {
  getFilteredCommands,
  getFilteredModels,
  getFilteredProviders,
  type SlashCommandOption,
} from "../commands/openWikiSlashCommandProcessor.js";
import { getFileSuggestions } from "../utils/fileSuggestions.js";

type MenuKind = "none" | "commands" | "providers" | "models" | "mentions";

export interface InputPromptProps {
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  onExit?: () => void;
  disabled?: boolean;
  active?: boolean;
  messageHistory?: string[];
  currentProvider: OpenWikiProvider;
  currentModelId: string;
  cwd?: string;
  promptGlyph?: string;
  onShowChatHistory?: () => void;
  scrollOffset?: number;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
}

interface MenuState {
  kind: MenuKind;
  index: number;
}

function menuKindFor(value: string): MenuKind {
  if (value.startsWith("/")) {
    if (value === "/provider" || value.startsWith("/provider ")) return "providers";
    if (value === "/model" || value.startsWith("/model ")) return "models";
    if (!value.includes(" ")) return "commands";
    return "none";
  }
  const at = value.lastIndexOf("@");
  if (at !== -1) {
    const after = value.slice(at + 1);
    if (!after.includes(" ") && !after.includes("\n")) {
      return "mentions";
    }
  }
  return "none";
}

export function InputPrompt({
  onSubmit,
  onCancel,
  onExit,
  disabled = false,
  active = true,
  messageHistory = [],
  currentProvider,
  currentModelId,
  cwd = process.cwd(),
  promptGlyph = "❯",
  onShowChatHistory,
  scrollOffset = 0,
  onScrollUp = () => {},
  onScrollDown = () => {},
}: InputPromptProps) {
  const [value, setValue] = useState("");
  const [menu, setMenu] = useState<MenuState>({ kind: "none", index: 0 });
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState("");

  const valueRef = useRef(value);
  const menuRef = useRef(menu);
  const historyIndexRef = useRef(historyIndex);
  valueRef.current = value;
  menuRef.current = menu;
  historyIndexRef.current = historyIndex;

  useEffect(() => {
    const kind = menuKindFor(value);
    setMenu((m) =>
      m.kind === kind ? m : { kind, index: 0 },
    );
  }, [value]);

  useInput(
    (input, key) => {
      const keyName = (key as { name?: string }).name;
      if (key.ctrl && keyName === "c") {
        onExit?.();
        return;
      }
      if (key.ctrl && keyName === "o") {
        onShowChatHistory?.();
        return;
      }

      if (disabled) {
        if (key.escape) {
          onCancel?.();
        }
        return;
      }

      if (key.escape) {
        if (menuRef.current.kind !== "none") {
          setMenu({ kind: "none", index: 0 });
          return;
        }
        onExit?.();
        return;
      }

      const kind = menuRef.current.kind;
      if (kind !== "none") {
        if (key.upArrow) {
          setMenu((m) => ({ ...m, index: Math.max(0, m.index - 1) }));
          return;
        }
        if (key.downArrow) {
          setMenu((m) => ({ ...m, index: m.index + 1 }));
          return;
        }
        if (key.tab || key.return) {
          completeSuggestion();
          if (key.return) {
            submit();
          }
          return;
        }
      } else if (!disabled) {
        if (key.upArrow) {
          if (scrollOffset > 0) {
            onScrollUp();
          } else if (messageHistory.length > 0) {
            recallUp();
          }
          return;
        }
        if (key.downArrow) {
          if (scrollOffset > 0) {
            onScrollDown();
          } else if (historyIndexRef.current !== null) {
            recallDown();
          }
          return;
        }
      }

      if (key.return) {
        submit();
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
    { isActive: active },
  );

  function submit() {
    const trimmed = valueRef.current.trim();
    if (!trimmed) {
      return;
    }
    setValue("");
    setMenu({ kind: "none", index: 0 });
    setHistoryIndex(null);
    onSubmit(trimmed);
  }

  function recallUp() {
    const history = messageHistory;
    if (history.length === 0) {
      return;
    }
    const current = historyIndexRef.current;
    const nextIndex =
      current === null ? history.length - 1 : Math.max(0, current - 1);
    if (current === null) {
      setHistoryDraft(valueRef.current);
    }
    setHistoryIndex(nextIndex);
    setValue(history[nextIndex] ?? "");
  }

  function recallDown() {
    const history = messageHistory;
    const current = historyIndexRef.current;
    if (current === null) {
      return;
    }
    const nextIndex = current + 1;
    if (nextIndex >= history.length) {
      setHistoryIndex(null);
      setValue(historyDraft);
    } else {
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex] ?? "");
    }
  }

  function completeSuggestion() {
    const v = valueRef.current;
    const m = menuRef.current;
    if (m.kind === "commands") {
      const options = getFilteredCommands(v);
      const option = options[m.index % Math.max(1, options.length)];
      if (option) {
        setValue(option.label + " ");
      }
    } else if (m.kind === "providers") {
      const providers = getFilteredProviders(v);
      const provider = providers[m.index % Math.max(1, providers.length)];
      if (provider) {
        setValue(`/provider ${getProviderLabel(provider)}`);
      }
    } else if (m.kind === "models") {
      const models = getFilteredModels(v, currentModelId, currentProvider);
      const model = models[m.index % Math.max(1, models.length)];
      if (model && model.kind === "model") {
        setValue(`/model ${model.label}`);
      }
    } else if (m.kind === "mentions") {
      const at = v.lastIndexOf("@");
      const after = v.slice(at + 1);
      const suggestions = getFileSuggestions(cwd, after);
      const suggestion = suggestions[m.index % Math.max(1, suggestions.length)];
      if (suggestion) {
        setValue(v.slice(0, at) + "@" + suggestion + " ");
      }
    }
  }

  const suggestions = renderSuggestions();

  return (
    <Box flexDirection="column">
      {suggestions}
      <Box>
        <Text color={Colors.AccentBlue} bold>
          {promptGlyph}{" "}
        </Text>
        <Text color={Colors.Foreground}>
          {value}
          {!disabled && "█"}
        </Text>
      </Box>
    </Box>
  );

  function renderSuggestions() {
    const m = menu;
    if (m.kind === "none") {
      return null;
    }
    let items: { label: string; detail?: string }[] = [];
    if (m.kind === "commands") {
      items = getFilteredCommands(value).map((o: SlashCommandOption) => ({
        label: o.label,
        detail: o.description,
      }));
    } else if (m.kind === "providers") {
      items = getFilteredProviders(value).map((p) => ({
        label: getProviderLabel(p),
      }));
    } else if (m.kind === "models") {
      items = getFilteredModels(value, currentModelId, currentProvider).map(
        (o) => ({ label: o.label }),
      );
    } else if (m.kind === "mentions") {
      const at = value.lastIndexOf("@");
      const after = value.slice(at + 1);
      items = getFileSuggestions(cwd, after).map((f) => ({ label: f }));
    }
    if (items.length === 0) {
      return null;
    }
    const visible = items.slice(
      Math.max(0, m.index - 7),
      Math.max(0, m.index - 7) + 8,
    );
    const baseIndex = Math.max(0, m.index - 7);
    return (
      <Box flexDirection="column" marginBottom={1}>
        {visible.map((item, i) => {
          const selected = baseIndex + i === m.index;
          return (
            <Box key={item.label}>
              <Text color={selected ? Colors.AccentBlue : Colors.Gray}>
                {selected ? "❯ " : "  "}
                {item.label}
                {item.detail ? `  ${item.detail}` : ""}
              </Text>
            </Box>
          );
        })}
      </Box>
    );
  }
}
