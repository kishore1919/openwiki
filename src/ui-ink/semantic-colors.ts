/**
 * @license
 * Ported from Google gemini-cli (Apache-2.0). See NOTICE in repo root.
 *
 * Semantic-color getter singleton. Wraps `themeManager.getSemanticColors()`
 * so components can read role-based colors (status.error, ui.symbol, ...)
 * instead of raw palette values.
 */

import { themeManager, type SemanticColors as SemanticColorsShape } from "./themes/theme-manager.js";

export const SemanticColors: SemanticColorsShape = {
  get text() {
    return themeManager.getSemanticColors().text;
  },
  get background() {
    return themeManager.getSemanticColors().background;
  },
  get border() {
    return themeManager.getSemanticColors().border;
  },
  get ui() {
    return themeManager.getSemanticColors().ui;
  },
  get status() {
    return themeManager.getSemanticColors().status;
  },
};
