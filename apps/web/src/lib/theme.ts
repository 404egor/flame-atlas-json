/**
 * Light and dark theme.
 *
 * The theme is the `data-theme` attribute on <html>. A saved choice wins;
 * without one the site follows the operating system. THEME_INIT_SCRIPT runs in
 * <head> before the first paint, so the page never flashes the wrong theme.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_ATTRIBUTE = "data-theme";

/** Inline script for <head>. Keep it in step with resolveTheme() below. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t)}catch(e){}})()`;

/** Browser only. The saved choice, or the operating-system preference. */
export function resolveTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be blocked; fall through to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Browser only. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

/** Browser only. Applies the theme and remembers it for the next visit. */
export function saveTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still applies for this visit.
  }
}

/** Browser only. The theme currently on the page. */
export function currentTheme(): Theme {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "dark" ? "dark" : "light";
}
