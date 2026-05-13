import type { WalletConnectProviderInstance } from "./walletconnect-instance-type";
import type { AppKit } from "@reown/appkit/core";

export const STELLAR_TESTNET_CHAIN = "stellar:testnet" as const;

const STELLAR_METHODS = [
  "stellar_signXDR",
  "stellar_signAndSubmitXDR",
  "stellar_signMessage",
  "stellar_signAuthEntry",
] as const;

export function getWalletConnectProjectId(): string | null {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  return id || null;
}

type WcClients = { provider: WalletConnectProviderInstance; modal: AppKit };

let initPromise: Promise<WcClients> | null = null;

/**
 * Lazy-init WalletConnect + AppKit modal (browser only). Freighter/Stellar docs:
 * Stellar chain id `stellar:testnet`, method `stellar_signXDR`.
 */
export async function getWalletConnectClients(): Promise<WcClients | null> {
  const projectId = getWalletConnectProjectId();
  if (!projectId || typeof window === "undefined") {
    return null;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const [{ UniversalProvider }, { createAppKit }, { mainnet }] =
        await Promise.all([
          import("@walletconnect/universal-provider"),
          import("@reown/appkit/core"),
          import("@reown/appkit/networks"),
        ]);
      const origin = window.location.origin;
      const provider = await UniversalProvider.init({
        projectId,
        metadata: {
          name: "Soroban Fullstack POC",
          description: "Stellar testnet Soroban read/write demo",
          url: origin,
          icons: [`${origin}/favicon.ico`],
        },
      });
      const modal = createAppKit({
        projectId,
        networks: [mainnet],
        universalProvider: provider,
        manualWCControl: true,
      });
      return { provider, modal };
    })();
  }
  return initPromise;
}

export function parseStellarTestnetAccount(
  session: { namespaces?: Record<string, { accounts?: string[] }> } | null,
): string | null {
  const accounts = session?.namespaces?.stellar?.accounts;
  if (!accounts?.length) return null;
  for (const a of accounts) {
    if (a.startsWith(`${STELLAR_TESTNET_CHAIN}:`)) {
      const pk = a.split(":")[2];
      if (pk?.startsWith("G")) return pk;
    }
  }
  return null;
}

export async function connectWalletConnectSession(): Promise<{
  provider: WalletConnectProviderInstance;
  publicKey: string;
}> {
  const clients = await getWalletConnectClients();
  if (!clients) {
    throw new Error(
      "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (see frontend/.env.example).",
    );
  }
  const { provider, modal } = clients;
  await modal.open();
  try {
    const session = await provider.connect({
      namespaces: {
        stellar: {
          methods: [...STELLAR_METHODS],
          chains: [STELLAR_TESTNET_CHAIN],
          events: ["accountsChanged"],
        },
      },
    });
    if (!session) {
      throw new Error("WalletConnect session was not established");
    }
    const methods = session.namespaces.stellar?.methods ?? [];
    if (!methods.includes("stellar_signXDR")) {
      throw new Error("Connected wallet does not support stellar_signXDR");
    }
    const publicKey = parseStellarTestnetAccount(session);
    if (!publicKey) {
      throw new Error(
        "No stellar:testnet account in session. Switch the wallet to Stellar testnet and try again.",
      );
    }
    return { provider, publicKey };
  } finally {
    await modal.close();
  }
}

export async function disconnectWalletConnect(
  provider: WalletConnectProviderInstance | null,
): Promise<void> {
  if (!provider) return;
  try {
    await provider.disconnect();
  } catch {
    // ignore — session may already be gone
  }
}
