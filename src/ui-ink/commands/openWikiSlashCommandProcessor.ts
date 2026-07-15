/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * OpenWiki slash-command processor. gemini-cli's `slashCommandProcessor.ts`
 * is the reference shape; here the registry is the 9 OpenWiki commands
 * (/provider, /model, /api-key, /langsmith-key, /init, /update, /clear,
 * /help, /exit) and the parsing/filtering helpers feed the `InputPrompt`
 * suggestion menu and the `AppContainer` dispatcher.
 */

import type { OpenWikiProvider } from "../../constants.js";
import {
  SELECTABLE_OPENWIKI_PROVIDERS,
  getProviderLabel,
  getProviderModelOptions,
} from "../../constants.js";

export type SlashCommandId =
  | "api-key"
  | "clear"
  | "exit"
  | "help"
  | "init"
  | "langsmith-key"
  | "model"
  | "provider"
  | "update";

export interface SlashCommandOption {
  description: string;
  id: SlashCommandId;
  label: string;
}

export type ModelMenuOption =
  | { kind: "model"; label: string; modelId: string }
  | { kind: "custom"; label: string };

export const slashCommandOptions: SlashCommandOption[] = [
  { description: "Switch the model provider", id: "provider", label: "/provider" },
  { description: "Switch the current provider model", id: "model", label: "/model" },
  {
    description: "Set the API key for the current provider",
    id: "api-key",
    label: "/api-key",
  },
  {
    description: "Set or clear the LangSmith API key",
    id: "langsmith-key",
    label: "/langsmith-key",
  },
  {
    description: "Run an initial OpenWiki documentation pass",
    id: "init",
    label: "/init",
  },
  {
    description: "Update existing OpenWiki documentation",
    id: "update",
    label: "/update",
  },
  {
    description: "Start a fresh thread and clear chat history",
    id: "clear",
    label: "/clear",
  },
  { description: "Show slash command help", id: "help", label: "/help" },
  { description: "Exit OpenWiki", id: "exit", label: "/exit" },
];

export function getFilteredCommands(input: string): SlashCommandOption[] {
  return slashCommandOptions.filter((option) => option.label.startsWith(input));
}

export function parseSlashInput(
  input: string,
): { args: string; option: SlashCommandOption } | null {
  const trimmedInput = input.trim();
  const [commandName = "", ...rest] = trimmedInput.split(/\s+/u);
  const option = slashCommandOptions.find((o) => o.label === commandName);
  return option ? { args: rest.join(" "), option } : null;
}

export function getFilteredProviders(input: string): OpenWikiProvider[] {
  const filter = input.slice("/provider".length).trim().toLowerCase();
  return SELECTABLE_OPENWIKI_PROVIDERS.filter((provider) =>
    getProviderLabel(provider).toLowerCase().startsWith(filter),
  );
}

export function getModelMenuOptions(
  currentModelId: string,
  currentProvider: OpenWikiProvider,
): ModelMenuOption[] {
  const modelIds = Array.from(
    new Set(
      [
        currentModelId,
        ...getProviderModelOptions(currentProvider).map((m) => m.id),
      ].filter(Boolean),
    ),
  );

  return [
    ...modelIds.map((modelId) => {
      const preset = getProviderModelOptions(currentProvider).find(
        (m) => m.id === modelId,
      );
      return {
        kind: "model" as const,
        label: preset ? `${preset.label} ${modelId}` : modelId,
        modelId,
      };
    }),
    { kind: "custom" as const, label: "Custom model ID" },
  ];
}

export function getFilteredModels(
  input: string,
  currentModelId: string,
  currentProvider: OpenWikiProvider,
): ModelMenuOption[] {
  const filter = input.slice("/model".length).trim().toLowerCase();
  return getModelMenuOptions(currentModelId, currentProvider).filter((option) =>
    option.label.toLowerCase().includes(filter),
  );
}
