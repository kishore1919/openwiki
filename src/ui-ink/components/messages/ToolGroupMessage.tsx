/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Renders a grouped tool action. Mirrors OpenWiki's existing collapse-on-done
 * behavior: while the group is running, the per-action entry list is shown;
 * once done it collapses to a one-line summary. Labels come from the
 * ported path-aware `createToolDisplay` logic.
 */

import { Box, Text } from "ink";
import { Colors } from "../../colors.js";
import { isGroupRunning, type ToolCallDisplay, type ToolCallStatus } from "../../ui/types.js";

const STATUS_GLYPH: Record<ToolCallStatus, string> = {
  Pending: "◌",
  Executing: "◌",
  Success: "✔",
  Error: "✖",
};

const STATUS_COLOR: Record<ToolCallStatus, string> = {
  Pending: Colors.Comment,
  Executing: Colors.AccentCyan,
  Success: Colors.AccentGreen,
  Error: Colors.AccentRed,
};

export function ToolGroupMessage({
  tools,
  status,
}: {
  tools: ToolCallDisplay[];
  status: ToolCallStatus;
}) {
  const running = isGroupRunning(status);

  if (running) {
    return (
      <Box flexDirection="column">
        {tools.map((tool) => (
          <Box key={tool.id}>
            <Text color={STATUS_COLOR[tool.status]}>
              {STATUS_GLYPH[tool.status]}{" "}
            </Text>
            <Text color={Colors.Gray} wrap="wrap">
              {tool.label}
            </Text>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Text color={STATUS_COLOR[status]}>{STATUS_GLYPH[status]} </Text>
      <Text color={Colors.Gray} wrap="wrap">
        {summarize(tools, status)}
      </Text>
    </Box>
  );
}

function summarize(tools: ToolCallDisplay[], status: ToolCallStatus): string {
  if (tools.length === 1) {
    return tools[0].doneLabel;
  }
  const total = tools.length;
  const errors = tools.filter((t) => t.status === "Error").length;
  if (errors > 0) {
    return `Ran ${total} actions with ${errors} failure${errors === 1 ? "" : "s"}`;
  }
  if (status === "Error") {
    return `Ran ${total} actions with failures`;
  }
  return `Ran ${total} actions`;
}
