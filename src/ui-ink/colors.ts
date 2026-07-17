/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Central color getter singleton. Every ported component reads `Colors.X`
 * through this object so a single active theme drives the whole TUI.
 */

import { themeManager, type ColorsTheme } from "./themes/theme-manager.js";

export const Colors: ColorsTheme = {
  get type() {
    return themeManager.getActiveTheme().colors.type;
  },
  get Background() {
    return themeManager.getColors().Background;
  },
  get Foreground() {
    return themeManager.getActiveTheme().colors.Foreground;
  },
  get LightBlue() {
    return themeManager.getActiveTheme().colors.LightBlue;
  },
  get AccentBlue() {
    return themeManager.getActiveTheme().colors.AccentBlue;
  },
  get AccentPurple() {
    return themeManager.getActiveTheme().colors.AccentPurple;
  },
  get AccentCyan() {
    return themeManager.getActiveTheme().colors.AccentCyan;
  },
  get AccentGreen() {
    return themeManager.getActiveTheme().colors.AccentGreen;
  },
  get AccentYellow() {
    return themeManager.getActiveTheme().colors.AccentYellow;
  },
  get AccentRed() {
    return themeManager.getActiveTheme().colors.AccentRed;
  },
  get DiffAdded() {
    return themeManager.getActiveTheme().colors.DiffAdded;
  },
  get DiffRemoved() {
    return themeManager.getActiveTheme().colors.DiffRemoved;
  },
  get Comment() {
    return themeManager.getActiveTheme().colors.Comment;
  },
  get Gray() {
    return themeManager.getActiveTheme().colors.Gray;
  },
  get DarkGray() {
    return themeManager.getColors().DarkGray;
  },
  get InputBackground() {
    return themeManager.getColors().InputBackground ?? themeManager.getColors().Background;
  },
  get MessageBackground() {
    return themeManager.getColors().MessageBackground ?? themeManager.getColors().Background;
  },
  get GradientColors() {
    return themeManager.getActiveTheme().colors.GradientColors;
  },
};
