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
