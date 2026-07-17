/**
 * OpenWiki-side history item union. Same shape as gemini-cli's `HistoryItem`
 * but trimmed to the variants the DeepAgents backend can actually emit
 * (no tool-confirmation items, no chat-compression items).
 */

export type ToolCallStatus = "Pending" | "Executing" | "Success" | "Error";

export interface ToolCallDisplay {
  id: string;
  name: string;
  /** Short human-readable label shown while the tool is running. */
  label: string;
  /** Short human-readable label shown once the tool has finished. */
  doneLabel: string;
  /** Raw input payload (used for the expanded detail view). */
  input: unknown;
  status: ToolCallStatus;
}

export type HistoryItem =
  | {
      type: "user";
      text: string;
    }
  | {
      type: "assistant";
      /** Built incrementally as text events stream in. */
      text: string;
    }
  | {
      type: "tool_group";
      /** Consecutive tool_start events merge into one group. */
      tools: ToolCallDisplay[];
      status: ToolCallStatus;
    }
  | {
      type: "info";
      text: string;
    }
  | {
      type: "warning";
      text: string;
    }
  | {
      type: "error";
      text: string;
    }
  | {
      type: "debug";
      text: string;
    };

export const isGroupRunning = (status: ToolCallStatus): boolean =>
  status === "Pending" || status === "Executing";
