/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Self-contained implementation of the theme manager getter singleton. Drops
 * the `@google/gemini-cli-core` dependency and the `tinygradient`/`tinycolor2`
 * color-interpolation machinery (a small inline hex-lerp replaces them); the
 * full ported theme-manager (custom themes, 19 builtins, background
 * interpolation) lands in Phase 3. Public API mirrors gemini-cli so ported
 * components are source-compatible.
 */

export type ThemeType = "light" | "dark" | "ansi" | "custom";

export interface ColorsTheme {
  type: ThemeType;
  Background: string;
  Foreground: string;
  LightBlue: string;
  AccentBlue: string;
  AccentPurple: string;
  AccentCyan: string;
  AccentGreen: string;
  AccentYellow: string;
  AccentRed: string;
  DiffAdded: string;
  DiffRemoved: string;
  Comment: string;
  Gray: string;
  DarkGray: string;
  InputBackground?: string;
  MessageBackground?: string;
  FocusBackground?: string;
  FocusColor?: string;
  GradientColors?: string[];
}

export interface SemanticColors {
  text: {
    primary: string;
    secondary: string;
    link: string;
    accent: string;
    response: string;
  };
  background: {
    primary: string;
    message: string;
    input: string;
    focus: string;
    diff: { added: string; removed: string };
  };
  border: { default: string };
  ui: {
    comment: string;
    symbol: string;
    active: string;
    dark: string;
    focus: string;
    gradient?: string[];
  };
  status: { error: string; success: string; warning: string };
}

const defaultDark: ColorsTheme = {
  type: "dark",
  Background: "#000000",
  Foreground: "#FFFFFF",
  LightBlue: "#AFD7D7",
  AccentBlue: "#87AFFF",
  AccentPurple: "#D7AFFF",
  AccentCyan: "#87D7D7",
  AccentGreen: "#D7FFD7",
  AccentYellow: "#FFFFAF",
  AccentRed: "#FF87AF",
  DiffAdded: "#005F00",
  DiffRemoved: "#5F0000",
  Comment: "#AFAFAF",
  Gray: "#AFAFAF",
  DarkGray: "#878787",
  InputBackground: "#5F5F5F",
  MessageBackground: "#5F5F5F",
  FocusBackground: "#005F00",
  GradientColors: ["#4796E4", "#847ACE", "#C3677F"],
};

const defaultLight: ColorsTheme = {
  type: "light",
  Background: "#FFFFFF",
  Foreground: "#000000",
  LightBlue: "#005FAF",
  AccentBlue: "#005FAF",
  AccentPurple: "#5F00FF",
  AccentCyan: "#005F87",
  AccentGreen: "#005F00",
  AccentYellow: "#875F00",
  AccentRed: "#AF0000",
  DiffAdded: "#D7FFD7",
  DiffRemoved: "#FFD7D7",
  Comment: "#008700",
  Gray: "#5F5F5F",
  DarkGray: "#5F5F5F",
  InputBackground: "#E4E4E4",
  MessageBackground: "#FAFAFA",
  FocusBackground: "#D7FFD7",
  GradientColors: ["#4796E4", "#847ACE", "#C3677F"],
};

const ansiTheme: ColorsTheme = {
  type: "ansi",
  Background: "black",
  Foreground: "",
  LightBlue: "blue",
  AccentBlue: "blue",
  AccentPurple: "magenta",
  AccentCyan: "cyan",
  AccentGreen: "green",
  AccentYellow: "yellow",
  AccentRed: "red",
  DiffAdded: "green",
  DiffRemoved: "red",
  Comment: "gray",
  Gray: "gray",
  DarkGray: "gray",
  InputBackground: "black",
  MessageBackground: "black",
  FocusBackground: "black",
};

export interface Theme {
  name: string;
  type: ThemeType;
  colors: ColorsTheme;
}

const DEFAULT_THEME: Theme = { name: "Default Dark", type: "dark", colors: defaultDark };

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/iu.exec(hex.trim());
  if (!m) {
    return null;
  }
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  if (factor <= 0 || !color1) return color1;
  if (factor >= 1 || !color2) return color2;
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;
  return rgbToHex([
    c1[0] + (c2[0] - c1[0]) * factor,
    c1[1] + (c2[1] - c1[1]) * factor,
    c1[2] + (c2[2] - c1[2]) * factor,
  ]);
}

function buildSemanticColors(colors: ColorsTheme): SemanticColors {
  return {
    text: {
      primary: colors.Foreground,
      secondary: colors.Gray,
      link: colors.AccentBlue,
      accent: colors.AccentPurple,
      response: colors.Foreground,
    },
    background: {
      primary: colors.Background,
      message: colors.MessageBackground ?? colors.Background,
      input: colors.InputBackground ?? colors.Background,
      focus: colors.FocusBackground ?? colors.AccentGreen,
      diff: { added: colors.DiffAdded, removed: colors.DiffRemoved },
    },
    border: { default: colors.DarkGray },
    ui: {
      comment: colors.Gray,
      symbol: colors.AccentCyan,
      active: colors.AccentBlue,
      dark: colors.DarkGray,
      focus: colors.FocusColor ?? colors.AccentGreen,
      gradient: colors.GradientColors,
    },
    status: {
      error: colors.AccentRed,
      success: colors.AccentGreen,
      warning: colors.AccentYellow,
    },
  };
}

class ThemeManager {
  private readonly availableThemes: Theme[];
  private activeTheme: Theme;
  private terminalBackground: string | undefined;
  private customThemes: Map<string, Theme> = new Map();

  constructor() {
    this.availableThemes = [
      DEFAULT_THEME,
      { name: "Default Light", type: "light", colors: defaultLight },
      { name: "ANSI", type: "ansi", colors: ansiTheme },
    ];
    this.activeTheme = DEFAULT_THEME;
  }

  setTerminalBackground(color: string | undefined): void {
    this.terminalBackground = color;
  }

  getTerminalBackground(): string | undefined {
    return this.terminalBackground;
  }

  setActiveTheme(themeName: string | undefined): boolean {
    if (!themeName || themeName === DEFAULT_THEME.name) {
      this.activeTheme = DEFAULT_THEME;
      return true;
    }
    const theme =
      this.availableThemes.find((t) => t.name === themeName) ??
      this.customThemes.get(themeName);
    if (!theme) {
      return false;
    }
    this.activeTheme = theme;
    return true;
  }

  registerCustomTheme(
    name: string,
    colors: Partial<ColorsTheme> & { type?: ThemeType },
  ): void {
    const merged: ColorsTheme = {
      ...defaultDark,
      ...colors,
      type: colors.type ?? "custom",
    };
    this.customThemes.set(name, { name, type: merged.type, colors: merged });
  }

  getActiveTheme(): Theme {
    return this.activeTheme;
  }

  getColors(): ColorsTheme {
    const colors = this.activeTheme.colors;
    if (!this.terminalBackground) {
      return colors;
    }
    return {
      ...colors,
      Background: this.terminalBackground,
      DarkGray: interpolateColor(this.terminalBackground, colors.Gray, 0.4),
      InputBackground: interpolateColor(this.terminalBackground, colors.Gray, 0.25),
      MessageBackground: interpolateColor(this.terminalBackground, colors.Gray, 0.15),
    };
  }

  getSemanticColors(): SemanticColors {
    return buildSemanticColors(this.getColors());
  }

  getAvailableThemes(): { name: string; type: ThemeType; isCustom?: boolean }[] {
    return [
      ...this.availableThemes.map((t) => ({ name: t.name, type: t.type })),
      ...Array.from(this.customThemes.values()).map((t) => ({
        name: t.name,
        type: t.type,
        isCustom: true,
      })),
    ];
  }
}

export const themeManager = new ThemeManager();
