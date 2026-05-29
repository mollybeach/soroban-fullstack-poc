import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { WalletConnectModule } from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";
import { KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";
import type { SorobanTransactionSigner } from "./wallet-types";
import {
  buildWalletConnectModuleOptions,
  WALLET_CONNECT_PRODUCT_ID,
} from "./wallet-kit-config";
import { swkitPocTheme } from "./swkit-poc-theme";
import {
  getWalletConnectProjectId,
  isStaleWalletConnectSessionError,
  isSwkAuthModalDismissed,
  SWK_LOCAL_STORAGE_KEYS,
  type WcSessionPath,
} from "./wallet-kit-utils";

export {
  getWalletConnectProjectId,
  isStaleWalletConnectSessionError,
  isSwkAuthModalDismissed,
};

const STALE_WC_SESSION_MESSAGE =
  "WalletConnect session expired (phone disconnected or session closed). Click Connect wallet and scan the QR again in Freighter or LOBSTR.";

let initPromise: Promise<void> | null = null;
let walletConnectModule: WalletConnectModule | null = null;

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
      walletConnectModule = new WalletConnectModule(
        buildWalletConnectModuleOptions(projectId, window.location.origin),
      );
      modules.push(walletConnectModule);
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

function readWcSessionPaths(): WcSessionPath[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SWK_LOCAL_STORAGE_KEYS.wcSessionPaths);
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is WcSessionPath =>
        !!p &&
        typeof p === "object" &&
        typeof (p as WcSessionPath).publicKey === "string" &&
        typeof (p as WcSessionPath).topic === "string",
    );
  } catch {
    return [];
  }
}

async function waitForWalletConnectSignClient(
  module: WalletConnectModule,
  timeoutMs = 8000,
): Promise<WalletConnectModule["signClient"] | null> {
  const start = Date.now();
  while (!module.signClient && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return module.signClient ?? null;
}

/**
 * Drop a cached WalletConnect “connected” state when the relay no longer has the session
 * (common after phone sleep, wallet disconnect, or stale `localStorage` topics).
 */
export async function validateWalletConnectSessionIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SWK_LOCAL_STORAGE_KEYS.selectedModuleId) !== WALLET_CONNECT_PRODUCT_ID) {
    return;
  }
  if (!walletConnectModule) return;

  const activeAddr = localStorage.getItem(SWK_LOCAL_STORAGE_KEYS.activeAddress);
  if (!activeAddr) return;

  const client = await waitForWalletConnectSignClient(walletConnectModule);
  if (!client) {
    await disconnectStellarWalletsKit();
    return;
  }

  const pathForAddr = readWcSessionPaths().find((p) => p.publicKey === activeAddr);
  if (!pathForAddr) {
    await disconnectStellarWalletsKit();
    return;
  }

  let liveTopics: Set<string>;
  try {
    const sessions = await walletConnectModule.getSessions();
    liveTopics = new Set(sessions.map((s) => s.topic));
  } catch {
    await disconnectStellarWalletsKit();
    return;
  }

  if (!liveTopics.has(pathForAddr.topic)) {
    await disconnectStellarWalletsKit();
  }
}

export function createStellarWalletsKitSigner(
  publicKey: string,
): SorobanTransactionSigner {
  return async (xdr, opts) => {
    await ensureStellarWalletsKit();
    try {
      return await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase ?? Networks.TESTNET,
        address: opts?.address ?? publicKey,
      });
    } catch (err) {
      if (isStaleWalletConnectSessionError(err)) {
        await disconnectStellarWalletsKit();
        throw new Error(STALE_WC_SESSION_MESSAGE);
      }
      throw err;
    }
  };
}

export { KitEventType, StellarWalletsKit };
