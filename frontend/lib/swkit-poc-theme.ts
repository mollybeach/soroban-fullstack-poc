import type { SwkAppTheme } from "@creit-tech/stellar-wallets-kit/types";
import { SwkAppLightTheme } from "@creit-tech/stellar-wallets-kit/types";

/**
 * Pastel violet shell aligned with the POC header / CTAs: light surfaces, soft
 * borders, puffier shadow, and rounder corners than the stock kit themes.
 */
export const swkitPocTheme: SwkAppTheme = {
  ...SwkAppLightTheme,
  background: "#fdfcff",
  "background-secondary": "#f3edff",
  "foreground-strong": "#4c1d95",
  foreground: "#312e81",
  "foreground-secondary": "#64748b",
  primary: "#8b5cf6",
  "primary-foreground": "#ffffff",
  border: "rgba(139, 92, 246, 0.28)",
  shadow:
    "0 28px 56px -16px rgba(91, 33, 182, 0.22), 0 14px 28px -10px rgba(139, 92, 246, 0.14)",
  "border-radius": "1.125rem",
  "font-family":
    'ui-rounded, system-ui, "Segoe UI", "Apple Color Emoji", sans-serif',
};
