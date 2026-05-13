import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import {
  WalletConnectModule,
  WalletConnectTargetChain,
} from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";
import { KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";
import type { SorobanTransactionSigner } from "./wallet-types";
import { swkitPocTheme } from "./swkit-poc-theme";

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

let initPromise: Promise<void> | null = null;

/**
 * One-time browser init: Stellar Wallets Kit with default extension + bridge wallets,
 * plus WalletConnect when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set.
 */
export async function ensureStellarWalletsKit(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initPromise) {
    await initPromise;
    return;
  }
  initPromise = (async () => {
    const modules = [...defaultModules()];
    const projectId = getWalletConnectProjectId();
    if (projectId) {
      const origin = window.location.origin;
      modules.push(
        new WalletConnectModule({
          projectId,
          metadata: {
            name: "Soroban Fullstack POC",
            description: "Stellar testnet Soroban read/write demo",
            url: origin,
            icons: [`${origin}/favicon.ico`],
          },
          allowedChains: [WalletConnectTargetChain.TESTNET],
          /** Quiets WalletConnect / Reown restore noise in the browser devtools console. */
          signClientOptions: {
            logger: "silent",
          } as Record<string, unknown>,
        }),
      );
    }
    StellarWalletsKit.init({
      modules,
      network: Networks.TESTNET,
      theme: swkitPocTheme,
    });
  })();
  await initPromise;
}

/** Opens the kit auth modal; user picks Freighter, xBull, WalletConnect, etc. */
export async function openStellarWalletsKitAuth(): Promise<{ address: string }> {
  await ensureStellarWalletsKit();
  return StellarWalletsKit.authModal();
}

export async function disconnectStellarWalletsKit(): Promise<void> {
  await ensureStellarWalletsKit();
  await StellarWalletsKit.disconnect();
}

export function createStellarWalletsKitSigner(
  publicKey: string,
): SorobanTransactionSigner {
  return async (xdr, opts) => {
    await ensureStellarWalletsKit();
    return StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? Networks.TESTNET,
      address: opts?.address ?? publicKey,
    });
  };
}

export { KitEventType, StellarWalletsKit };
