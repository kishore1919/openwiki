/**
 * OpenWiki stream hook — the crux of the port.
 *
 * Mirrors gemini-cli's `useGeminiStream` contract shape
 * ({ streamingState, pendingHistoryItems, submitQuery, cancelOngoingRequest,
 * pendingToolCalls }) but is driven by OpenWiki's own `OpenWikiRunEvent`
 * union (runOpenWikiAgentCore's `onEvent`).
 */

import { useCallback, useRef, useState } from "react";
import { runOpenWikiAgent } from "../../agent/index.js";
import type { OpenWikiCommand, OpenWikiRunEvent } from "../../agent/types.js";
import type { HistoryItem, ToolCallDisplay } from "../ui/types.js";
import {
  applyToolEnd,
  applyToolStart,
  useOpenWikiToolTracking,
} from "./useOpenWikiToolTracking.js";

export type StreamingState =
  | "idle"
  | "pending"
  | "responding"
  | "complete"
  | "error"
  | "cancelled";

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UseOpenWikiStream {
  streamingState: StreamingState;
  pendingHistoryItems: HistoryItem[];
  pendingToolCalls: ToolCallDisplay[];
  usage: UsageInfo | null;
  lastCommandResult: { command: OpenWikiCommand; model: string; skipped?: boolean } | null;
  lastError: string | null;
  submitQuery: (query: string) => Promise<void>;
  submitCommand: (command: Extract<OpenWikiCommand, "init" | "update">) => Promise<void>;
  cancelOngoingRequest: () => void;
  reset: () => void;
}

export function useOpenWikiStream(): UseOpenWikiStream {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>("idle");
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastCommandResult, setLastCommandResult] = useState<{
    command: OpenWikiCommand;
    model: string;
    skipped?: boolean;
  } | null>(null);
  const cancelledRef = useRef(false);

  const { pendingToolCalls } = useOpenWikiToolTracking(history);

  const cancelOngoingRequest = useCallback(() => {
    cancelledRef.current = true;
    setStreamingState("cancelled");
  }, []);

  const submitQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || streamingState === "pending" || streamingState === "responding") {
        return;
      }

      cancelledRef.current = false;
      setStreamingState("pending");
      setUsage(null);
      setHistory((prev) => [...prev, { type: "user", text: trimmed }]);

      const handleEvent = (event: OpenWikiRunEvent) => {
        if (cancelledRef.current) {
          return;
        }
        setStreamingState((s) => (s === "pending" ? "responding" : s));
        setHistory((prev) => {
          switch (event.type) {
            case "text":
              return appendText(prev, event.text);
            case "tool_start":
              return applyToolStart(prev, event);
            case "tool_end":
              return applyToolEnd(prev, event);
            case "usage":
              setUsage({
                inputTokens: event.inputTokens,
                outputTokens: event.outputTokens,
                totalTokens: event.totalTokens,
              });
              return prev;
            case "debug":
              return [...prev, { type: "debug", text: event.message }];
            default:
              return prev;
          }
        });
      };

      try {
        await runOpenWikiAgent("chat", undefined, {
          userMessage: trimmed,
          onEvent: handleEvent,
        });
        if (!cancelledRef.current) {
          setStreamingState("complete");
        }
      } catch (error) {
        if (!cancelledRef.current) {
          const message =
            error instanceof Error ? error.message : String(error);
          setLastError(message);
          setHistory((prev) => [...prev, { type: "error", text: message }]);
          setStreamingState("error");
        }
      }
    },
    [streamingState],
  );

  const submitCommand = useCallback(
    async (command: Extract<OpenWikiCommand, "init" | "update">) => {
      if (streamingState === "pending" || streamingState === "responding") {
        return;
      }
      cancelledRef.current = false;
      setStreamingState("pending");
      setUsage(null);
      setLastCommandResult(null);
      setHistory((prev) => [
        ...prev,
        { type: "info", text: `Running /${command}…` },
      ]);

      const handleEvent = (event: OpenWikiRunEvent) => {
        if (cancelledRef.current) {
          return;
        }
        setStreamingState((s) => (s === "pending" ? "responding" : s));
        setHistory((prev) => {
          switch (event.type) {
            case "text":
              return appendText(prev, event.text);
            case "tool_start":
              return applyToolStart(prev, event);
            case "tool_end":
              return applyToolEnd(prev, event);
            case "usage":
              setUsage({
                inputTokens: event.inputTokens,
                outputTokens: event.outputTokens,
                totalTokens: event.totalTokens,
              });
              return prev;
            case "debug":
              return [...prev, { type: "debug", text: event.message }];
            default:
              return prev;
          }
        });
      };

      try {
        const result = await runOpenWikiAgent(command, undefined, {
          onEvent: handleEvent,
        });
        if (!cancelledRef.current) {
          setLastCommandResult({
            command: result.command,
            model: result.model,
            skipped: result.skipped,
          });
          setStreamingState("complete");
        }
      } catch (error) {
        if (!cancelledRef.current) {
          const message =
            error instanceof Error ? error.message : String(error);
          setLastError(message);
          setHistory((prev) => [...prev, { type: "error", text: message }]);
          setStreamingState("error");
        }
      }
    },
    [streamingState],
  );

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setHistory([]);
    setUsage(null);
    setLastError(null);
    setLastCommandResult(null);
    setStreamingState("idle");
  }, []);

  return {
    streamingState,
    pendingHistoryItems: history,
    pendingToolCalls,
    usage,
    lastCommandResult,
    lastError,
    submitQuery,
    submitCommand,
    cancelOngoingRequest,
    reset,
  };
}

function appendText(history: HistoryItem[], text: string): HistoryItem[] {
  const last = history.at(-1);
  if (last && last.type === "assistant") {
    return [
      ...history.slice(0, -1),
      { type: "assistant", text: last.text + text },
    ];
  }
  return [...history, { type: "assistant", text }];
}
