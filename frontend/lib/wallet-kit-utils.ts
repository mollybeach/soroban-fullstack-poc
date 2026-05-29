/** Keys used by `@creit-tech/stellar-wallets-kit` in `localStorage`. */
export const SWK_LOCAL_STORAGE_KEYS = {
  activeAddress: "@StellarWalletsKit/activeAddress",
  selectedModuleId: "@StellarWalletsKit/selectedModuleId",
  wcSessionPaths: "@StellarWalletsKit/wcSessionPaths",
} as const;

export type WcSessionPath = { publicKey: string; topic: string };

/** WalletConnect relay dropped the session while the dApp still had a cached address. */
export function isStaleWalletConnectSessionError(error: unknown): boolean {
  const msg = walletErrorText(error).toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("recently deleted") ||
    msg.includes("no walletconnect session") ||
    (msg.includes("session") && msg.includes("missing or invalid")) ||
    (msg.includes("session") && msg.includes("expired"))
  );
}

function walletErrorText(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const o = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof o.message === "string") return o.message;
    if (typeof o.error?.message === "string") return o.error.message;
  }
  return "";
}

/** Kit rejects with this when the user dismisses the auth modal (not a failure). */
export function isSwkAuthModalDismissed(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof message !== "string") return false;
  const m = message.trim().toLowerCase();
  const isCloseCopy =
    m === "the user closed the modal." || m.includes("closed the modal");
  return code === -1 && isCloseCopy;
}

export function getWalletConnectProjectId(): string | null {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  return id || null;
}
