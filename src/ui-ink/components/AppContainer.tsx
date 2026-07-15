/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Phase 2 application container. Owns the stream hook, OpenWiki config
 * (provider/model), command dispatch (openWikiSlashCommandProcessor), the
 * dialog slot, and the secondary screen router (Phase 4).
 *
 * gemini-cli's full `AppContainer` (2868 lines, ~50 state hooks) is the
 * reference shape; this is the OpenWiki-adapted equivalent with the real
 * backend wired in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "ink";
import {
  OPENWIKI_MODEL_ID_ENV_KEY,
  OPENWIKI_PROVIDER_ENV_KEY,
  SELECTABLE_OPENWIKI_PROVIDERS,
  getDefaultModelId,
  getProviderApiKeyEnvKey,
  getProviderLabel,
  normalizeModelId,
  resolveConfiguredProvider,
  type OpenWikiProvider,
} from "../../constants.js";
import {
  getCredentialDiagnostics,
  saveOpenWikiEnv,
  type CredentialDiagnostic,
} from "../../env.js";
import {
  codexTokensToEnv,
  loginWithChatGPT,
} from "../../agent/openai-chatgpt-oauth.js";
import { useOpenWikiStream } from "../hooks/useOpenWikiStream.js";
import { DefaultAppLayout } from "./DefaultAppLayout.js";
import { MainContent } from "./MainContent.js";
import { Composer } from "./Composer.js";
import { DialogManager, type Dialog } from "./DialogManager.js";
import { parseSlashInput, type SlashCommandId } from "../commands/openWikiSlashCommandProcessor.js";
import { WelcomeScreen } from "./screens/WelcomeScreen.js";
import { CredentialDiagnosticsScreen } from "./screens/CredentialDiagnosticsScreen.js";
import { IngestionSummaryScreen } from "./screens/IngestionSummaryScreen.js";
import { OAuthLoginScreen } from "./screens/OAuthLoginScreen.js";
import { ChatHistoryScreen, type CompletedRunView } from "./screens/ChatHistoryScreen.js";

type ScreenId = "chat" | "welcome" | "credentials" | "ingestion" | "oauth" | "chatHistory";

interface CredentialDiagnosticView {
  label: string;
  value: string;
  status?: "ok" | "error" | "warning";
}

function toDiagnosticView(d: CredentialDiagnostic): CredentialDiagnosticView {
  return {
    label: d.key,
    value: `${d.source}: ${d.preview} (${d.length ?? 0} chars)`,
    status: d.warnings.length > 0 ? "warning" : "ok",
  };
}

const AUTH_ERROR = /key|auth|token|credential|401|403|unauthorized|permission/i;

export function AppContainer() {
  const stream = useOpenWikiStream();
  const { exit } = useApp();

  const [config, setConfig] = useState<{ provider: OpenWikiProvider; modelId: string }>(
    () => {
      const provider = resolveConfiguredProvider();
      return { provider, modelId: getDefaultModelId(provider) };
    },
  );
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [completedRuns, setCompletedRuns] = useState<CompletedRunView[]>([]);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [screen, setScreen] = useState<ScreenId>("chat");
  const [diagnostics, setDiagnostics] = useState<CredentialDiagnosticView[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);

  const nextRunId = useRef(0);
  const pendingChatRef = useRef<string | null>(null);
  const recordedRef = useRef(false);
  const authErrorShownRef = useRef(false);

  const onExit = useCallback(() => exit(), [exit]);
  const onCloseDialog = useCallback(() => setDialog(null), []);
  const onCloseScreen = useCallback(() => setScreen("chat"), []);
  const onScrollUp = useCallback(
    () => setScrollOffset((o) => o + 1),
    [],
  );
  const onScrollDown = useCallback(
    () => setScrollOffset((o) => Math.max(0, o - 1)),
    [],
  );

  const applyProvider = useCallback(async (provider: OpenWikiProvider) => {
    await saveOpenWikiEnv({ [OPENWIKI_PROVIDER_ENV_KEY]: provider });
    process.env[OPENWIKI_PROVIDER_ENV_KEY] = provider;
    setConfig({ provider, modelId: getDefaultModelId(provider) });
  }, []);

  const applyModel = useCallback(async (modelId: string) => {
    const normalized = normalizeModelId(modelId);
    await saveOpenWikiEnv({ [OPENWIKI_MODEL_ID_ENV_KEY]: normalized });
    process.env[OPENWIKI_MODEL_ID_ENV_KEY] = normalized;
    setConfig((c) => ({ ...c, modelId: normalized }));
  }, []);

  const applySecret = useCallback(
    async (envKey: string, value: string) => {
      await saveOpenWikiEnv({ [envKey]: value });
      process.env[envKey] = value;
    },
    [],
  );

  const resolveProviderArg = (arg: string): OpenWikiProvider | null => {
    const lower = arg.toLowerCase();
    return (
      SELECTABLE_OPENWIKI_PROVIDERS.find(
        (p) => p === arg || getProviderLabel(p).toLowerCase() === lower,
      ) ?? null
    );
  };

  const runCommand = useCallback(
    (id: SlashCommandId, args: string) => {
      switch (id) {
        case "provider": {
          if (!args) {
            return;
          }
          const provider = resolveProviderArg(args);
          if (provider) {
            void applyProvider(provider);
          }
          return;
        }
        case "model": {
          if (!args) {
            return;
          }
          void applyModel(args);
          return;
        }
        case "api-key": {
          if (args) {
            void applySecret(getProviderApiKeyEnvKey(config.provider), args);
          } else {
            setDialog({
              kind: "secret",
              secretKind: "api-key",
              label: `API key for ${getProviderLabel(config.provider)}`,
              onSubmit: (value) =>
                void applySecret(getProviderApiKeyEnvKey(config.provider), value),
            });
          }
          return;
        }
        case "langsmith-key": {
          if (args) {
            void applySecret("LANGSMITH_API_KEY", args);
          } else {
            setDialog({
              kind: "secret",
              secretKind: "langsmith-key",
              label: "LangSmith API key",
              onSubmit: (value) => void applySecret("LANGSMITH_API_KEY", value),
            });
          }
          return;
        }
        case "clear": {
          stream.reset();
          setMessageHistory([]);
          setCompletedRuns([]);
          setScreen("chat");
          return;
        }
        case "help": {
          setDialog({ kind: "help" });
          return;
        }
        case "exit": {
          onExit();
          return;
        }
        case "init":
        case "update": {
          const runId = nextRunId.current++;
          setScrollOffset(0);
          void stream.submitCommand(id).then(() => {
            setCompletedRuns((runs) => [
              ...runs,
              { id: runId, command: id, message: null },
            ]);
            setScreen("ingestion");
          });
          return;
        }
        default:
          return;
      }
    },
    [applyModel, applyProvider, applySecret, config.provider, onExit, stream],
  );

  const handleSubmit = useCallback(
    (value: string) => {
      if (value === "/exit") {
        onExit();
        return;
      }
      if (value.startsWith("/")) {
        const parsed = parseSlashInput(value);
        if (!parsed) {
          return;
        }
        runCommand(parsed.option.id, parsed.args.trim());
        return;
      }
      pendingChatRef.current = value;
      recordedRef.current = false;
      setScrollOffset(0);
      void stream.submitQuery(value).then(() => {
        if (stream.streamingState !== "error" && !recordedRef.current) {
          recordedRef.current = true;
          setCompletedRuns((runs) => [
            ...runs,
            { id: nextRunId.current++, command: "chat", message: value },
          ]);
        }
      });
      setMessageHistory((h) => [...h, value]);
      if (screen === "welcome") {
        setScreen("chat");
      }
    },
    [onExit, runCommand, screen, stream],
  );

  useEffect(() => {
    if (!stream.lastError) {
      authErrorShownRef.current = false;
      return;
    }
    if (authErrorShownRef.current) {
      return;
    }
    if (AUTH_ERROR.test(stream.lastError)) {
      authErrorShownRef.current = true;
      if (config.provider === "openai-chatgpt") {
        setScreen("oauth");
      } else {
        void getCredentialDiagnostics()
          .then((d) => setDiagnostics(d.map(toDiagnosticView)))
          .then(() => setScreen("credentials"));
      }
    }
  }, [stream.lastError, config.provider]);

  const main = (() => {
    switch (screen) {
      case "welcome":
        return (
          <WelcomeScreen
            providerLabel={getProviderLabel(config.provider)}
            modelId={config.modelId}
            onClose={() => setScreen("chat")}
          />
        );
      case "credentials":
        return (
          <CredentialDiagnosticsScreen
            diagnostics={diagnostics}
            onClose={onCloseScreen}
          />
        );
      case "ingestion":
        return stream.lastCommandResult ? (
          <IngestionSummaryScreen
            result={stream.lastCommandResult}
            onClose={onCloseScreen}
          />
        ) : (
          <MainContent items={stream.pendingHistoryItems} scrollOffset={scrollOffset} />
        );
      case "chat":
      default:
        return <MainContent items={stream.pendingHistoryItems} scrollOffset={scrollOffset} />;
    }
  })();

  const composer =
    screen === "chat" ? (
      <Composer
        onSubmit={handleSubmit}
        onCancel={stream.cancelOngoingRequest}
        onExit={onExit}
        streamingState={stream.streamingState}
        active={!dialog}
        messageHistory={messageHistory}
        currentProvider={config.provider}
        currentModelId={config.modelId}
        onShowChatHistory={() => setScreen("chatHistory")}
        scrollOffset={scrollOffset}
        onScrollUp={onScrollUp}
        onScrollDown={onScrollDown}
      />
    ) : null;

  const dialogNode = dialog ? (
    <DialogManager dialog={dialog} onClose={onCloseDialog} />
  ) : null;

  return (
    <DefaultAppLayout
      providerLabel={getProviderLabel(config.provider)}
      modelLabel={config.modelId}
      main={main}
      composer={composer}
      dialog={dialogNode}
      streamingState={stream.streamingState}
      pendingToolCalls={stream.pendingToolCalls}
      usage={stream.usage}
      scrollOffset={scrollOffset}
    />
  );
}
