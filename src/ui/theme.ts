/**
 * Central theme for the OpenWiki terminal UI.
 *
 * All presentational colors, gradients, and glyphs live here so the interactive
 * chat (`cli.tsx`) and the onboarding flow (`credentials.tsx`) share one visual
 * language. Prefer importing tokens from here over hardcoding color strings.
 *
 * Palette: a Gemini-CLI-inspired blue -> purple accent on a neutral base.
 */

export const theme = {
  /** Primary accent — used for the wordmark, prompts, and active selections. */
  accent: "#4796e4",
  /** Secondary accent — the purple end of the brand gradient. */
  accentAlt: "#a855f7",
  /** Informational highlight (labels, headings). */
  info: "cyanBright",
  /** Success / completed state. */
  success: "green",
  /** In-progress / attention state. */
  warning: "yellow",
  /** Failure state. */
  error: "red",
  /** De-emphasized text (hints, metadata, dimmed args). */
  muted: "gray",
  /** Box borders. */
  border: "gray",
} as const;

/** Blue -> purple gradient applied character-by-character to the wordmark. */
export const brandGradient = [
  "#4796e4",
  "#5b86e8",
  "#7176e6",
  "#8a68e0",
  "#a058d6",
  "#b84fcf",
  "#c084fc",
] as const;

/** Glyphs used across run logs, menus, and status lines. */
export const glyph = {
  brand: "✦",
  userPrompt: "›",
  assistantPrompt: "❯",
  bullet: "•",
  toolPending: "○",
  toolDone: "✔",
  toolError: "✖",
  selected: "❯",
  dividerCross: "·",
} as const;

/** Braille spinner frames for the "working" indicator. */
export const spinnerFrames = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
] as const;

export function spinnerFrame(frame: number): string {
  return spinnerFrames[frame % spinnerFrames.length] ?? spinnerFrames[0];
}
