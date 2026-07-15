/**
 * Approximate context-window sizes (in tokens) for the models OpenWiki can talk
 * to, used only to render a "context used" indicator in the footer.
 *
 * These are best-effort and matched by substring against the model id, since
 * providers expose many aliases. When nothing matches we fall back to a
 * conservative default so the indicator still renders something sensible.
 */

const DEFAULT_CONTEXT_WINDOW = 128_000;

// Ordered longest/most-specific first; first substring match wins.
const CONTEXT_WINDOWS: ReadonlyArray<readonly [string, number]> = [
  ["gpt-5", 400_000],
  ["gpt-4.1", 1_047_576],
  ["gpt-4o", 128_000],
  ["o3", 200_000],
  ["o4", 200_000],
  ["claude", 200_000],
  ["sonnet", 200_000],
  ["opus", 200_000],
  ["haiku", 200_000],
  ["gemini-1.5", 1_048_576],
  ["gemini", 1_048_576],
  ["llama", 128_000],
  ["nemotron", 128_000],
  ["qwen", 128_000],
  ["deepseek", 128_000],
  ["mistral", 128_000],
  ["mixtral", 32_768],
];

export function getModelContextWindow(modelId: string | null): number {
  if (!modelId) {
    return DEFAULT_CONTEXT_WINDOW;
  }

  const normalized = modelId.toLowerCase();

  for (const [needle, window] of CONTEXT_WINDOWS) {
    if (normalized.includes(needle)) {
      return window;
    }
  }

  return DEFAULT_CONTEXT_WINDOW;
}

/** Formats a token count compactly, e.g. 12_300 -> "12.3k". */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1_000) {
    return String(tokens);
  }

  if (tokens < 1_000_000) {
    return `${(tokens / 1_000).toFixed(tokens < 10_000 ? 1 : 0)}k`;
  }

  return `${(tokens / 1_000_000).toFixed(1)}M`;
}
