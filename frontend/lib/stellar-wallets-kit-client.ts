import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { WalletConnectModule } from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";
import { KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";
import type { SorobanTransactionSigner } from "./wallet-types";
import { buildWalletConnectModuleOptions } from "./wallet-kit-config";
import { swkitPocTheme } from "./swkit-poc-theme";
import {
  getWalletConnectProjectId,
  isSwkAuthModalDismissed,
} from "./wallet-kit-utils";

export { getWalletConnectProjectId, isSwkAuthModalDismissed };

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
      modules.push(
        new WalletConnectModule(
          buildWalletConnectModuleOptions(projectId, window.location.origin),
        ),
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
