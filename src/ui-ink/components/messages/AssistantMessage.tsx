/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Renders an assistant message. Markdown rendering (Phase 3) replaces the
 * plain-text output used in Milestone 1.
 */

import { MarkdownDisplay } from "../MarkdownDisplay.js";

export function AssistantMessage({ text }: { text: string }) {
  return <MarkdownDisplay text={text} />;
}
