/**
 * Turn caught values into UI-safe strings. Wallets and SDKs often reject with
 * plain objects; `String(that)` becomes "[object Object]".
 */
export function formatUnknownError(error: unknown): string {
  if (error == null) return "Unknown error";
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  if (error instanceof Error) {
    return error.message || error.name || "Error";
  }
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    for (const key of ["message", "reason", "error", "description"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    try {
      const s = JSON.stringify(error);
      if (s !== "{}" && s !== "null") {
        return s.length > 400 ? `${s.slice(0, 400)}…` : s;
      }
    } catch {
      /* ignore */
    }
  }
  return "Something went wrong. Try again or pick another wallet.";
}
