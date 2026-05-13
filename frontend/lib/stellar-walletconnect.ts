import type { AppKitNetwork } from "@reown/appkit-common";
import type { WalletConnectProviderInstance } from "./walletconnect-instance-type";
import type { AppKit } from "@reown/appkit/core";

export const STELLAR_TESTNET_CHAIN = "stellar:testnet" as const;

function dedupeWalletConnectIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

/** Freighter mobile — WalletConnect Explorer. */
const FREIGHTER_WALLET_CONNECT_ID =
  "997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380";

/**
 * Every WalletConnect Explorer wallet that lists `stellar:testnet` in `chains`
 * (full registry for that filter — 9 entries as of 2026-05).
 */
const WC_STELLAR_TESTNET_REGISTRY_IDS = [
  FREIGHTER_WALLET_CONNECT_ID,
  "28b60a29a8ffd15f52a33cc0d0ee4f8b1cd234b68f554195a823bf16a40cab29", // SOC Wallet
  "7ef48bf6722bd9694ab35f1fa9f8239ef1d44dc721c6950b9afe2468a77aad5a", // Kotai Wallet
  "297bf3864322ce81262df9a40b9a0fdcb504e737ad900bfe8ef47710729456ce", // ECOIN Wallet
  "259d07628a06aee49007266630381867688fbe96c331adc1b285aa7995380815", // Panaroma Wallet
  "45aa096282002911a77c9e1dba16dade905960e6386e681c2f8d7966f4e475b1", // Cryptokara
  "ec1fddec78ac2ae4d3c2e1215740399885381819c91a4254006177df0e86688d", // Ukey Wallet
  "82e648053152b18d863d85a467c0ba20bde86e892eb6189e47e260bb78c1e653", // Anchorage Digital
  "a5f729636bd307a509e8814d8553d224550e4c35fee2b4e2f71bb1ade63ee4a9", // GK8
] as const;

/**
 * Wallets commonly bundled in [Stellar Wallets Kit](https://stellarwalletskit.dev/wallets/supported-wallets.html)
 * that have a WalletConnect Explorer listing. Albedo, xBull, Hana, and Rabet are not registered for
 * `stellar:testnet` on WC — use the browser Freighter path or a custom kit integration for those.
 */
const WC_KIT_AND_ECOSYSTEM_IDS = [
  "76a3d548a08cf402f5c7d021f24fd2881d767084b387a5325df88bc3d4b6f21b", // LOBSTR Wallet (WC lists stellar:pubnet)
  "fbea6f68df4e6ce163c144df86da89f24cb244f19b53903e26aea9ab7de6393c", // Klever Wallet
  "1aedbcfc1f31aade56ca34c38b0a1607b41cccfa3de93c946ef3b4ba2dfab11c", // OneKey
  "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662", // Bitget Wallet
  "21c3a371f72f0057186082edb2ddd43566f7e908508ac3e85373c6d1966ed614", // Bitget Wallet Lite
  "6b0182d679b72eb2733dec38d9dee70551cc16a6ce5e7a7f4155ffb6f493c521", // Trezor Suite
  "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927", // Ledger Wallet
] as const;

/** MetaMask — EVM-first; only useful here if the build exposes Stellar over WC. */
const METAMASK_WALLET_CONNECT_ID =
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96";
/** Coinbase Wallet — same caveat as MetaMask. */
const COINBASE_WALLET_CONNECT_ID =
  "d0ca99ff52b99abc48743dad0f7fc891e041be73574f7fac4afe5d4bb83845c8";

/** Featured row order: Stellar + kit-adjacent, then remaining testnet-only entries. */
const WALLET_CONNECT_FEATURED_IDS = dedupeWalletConnectIds([
  FREIGHTER_WALLET_CONNECT_ID,
  "76a3d548a08cf402f5c7d021f24fd2881d767084b387a5325df88bc3d4b6f21b", // LOBSTR
  METAMASK_WALLET_CONNECT_ID,
  COINBASE_WALLET_CONNECT_ID,
  "fbea6f68df4e6ce163c144df86da89f24cb244f19b53903e26aea9ab7de6393c", // Klever
  "1aedbcfc1f31aade56ca34c38b0a1607b41cccfa3de93c946ef3b4ba2dfab11c", // OneKey
  "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662", // Bitget
  "6b0182d679b72eb2733dec38d9dee70551cc16a6ce5e7a7f4155ffb6f493c521", // Trezor Suite
  "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927", // Ledger Wallet
  ...WC_STELLAR_TESTNET_REGISTRY_IDS.filter((id) => id !== FREIGHTER_WALLET_CONNECT_ID),
  "21c3a371f72f0057186082edb2ddd43566f7e908508ac3e85373c6d1966ed614", // Bitget Lite
]);

const STELLAR_TESTNET_NETWORK = {
  id: "testnet",
  name: "Stellar Testnet",
  chainNamespace: "stellar",
  caipNetworkId: "stellar:testnet",
  nativeCurrency: {
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
  },
  rpcUrls: {
    default: {
      http: ["https://soroban-testnet.stellar.org"],
    },
  },
} as unknown as AppKitNetwork;

/**
 * Pubnet is included so Reown’s explorer + client filters keep wallets that only list
 * `stellar:pubnet` (e.g. LOBSTR). The WalletConnect session still targets **testnet** via
 * `provider.connect({ namespaces: { stellar: { chains: ["stellar:testnet"] }}})`.
 */
const STELLAR_PUBNET_NETWORK = {
  id: "pubnet",
  name: "Stellar Mainnet",
  chainNamespace: "stellar",
  caipNetworkId: "stellar:pubnet",
  nativeCurrency: {
    name: "Stellar Lumens",
    symbol: "XLM",
    decimals: 7,
  },
  rpcUrls: {
    default: {
      http: ["https://horizon.stellar.org"],
    },
  },
} as unknown as AppKitNetwork;

const STELLAR_METHODS = [
  "stellar_signXDR",
  "stellar_signAndSubmitXDR",
  "stellar_signMessage",
  "stellar_signAuthEntry",
] as const;

/**
 * Reown's `ModalController` sends "mobile" clients straight to `AllWallets` (generic catalog)
 * when `manualWCControl` is on. `CoreHelperUtil.isMobile()` is true for coarse pointers **or**
 * mobile UA — so touch laptops/tablets often never see the basic modal with your featured list.
 * Treating sufficiently wide viewports as non-mobile matches "desktop first" by window size.
 */
const WALLETCONNECT_DESKTOP_MODAL_MIN_WIDTH_PX = 768;

function prefersWalletConnectDesktopModalLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(
    `(min-width: ${WALLETCONNECT_DESKTOP_MODAL_MIN_WIDTH_PX}px)`,
  ).matches;
}

/** Opens AppKit while temporarily relaxing `isMobile()` on wide screens (see constant above). */
async function openAppKitModalPreferringWideLayout(modal: AppKit): Promise<void> {
  const { CoreHelperUtil } = await import("@reown/appkit-controllers");
  const origIsMobile = CoreHelperUtil.isMobile.bind(CoreHelperUtil);
  CoreHelperUtil.isMobile = () => {
    if (prefersWalletConnectDesktopModalLayout()) return false;
    return origIsMobile();
  };
  try {
    await modal.open();
  } finally {
    CoreHelperUtil.isMobile = origIsMobile;
  }
}

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
        // Stellar must be in `networks` so AppKit registers the `stellar` namespace for WC URI + wallet list.
        // Pubnet widens explorer chain filters so pubnet-only WC listings still appear while default stays testnet.
        // Ethereum mainnet satisfies Reown’s multi-network tuple requirement.
        networks: [STELLAR_TESTNET_NETWORK, STELLAR_PUBNET_NETWORK, mainnet],
        defaultNetwork: STELLAR_TESTNET_NETWORK,
        featuredWalletIds: [...WALLET_CONNECT_FEATURED_IDS],
        // Omit `includeWalletIds`: with Stellar CAIP chains the explorer often returns **0**
        // hits when intersecting a long fixed include list + chain filter — the modal then
        // shows “0” and an empty search. Featured list still pins Freighter / LOBSTR / etc.
        metadata: {
          name: "Soroban Fullstack POC",
          description: "Stellar testnet Soroban read/write demo",
          url: origin,
          icons: [`${origin}/favicon.ico`],
        },
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

function subscribeWalletConnectDisplayUri(
  provider: WalletConnectProviderInstance,
  onUri: (uri: string) => void,
): () => void {
  const handler = (uri: string) => {
    if (typeof uri === "string" && uri.length > 0) onUri(uri);
  };
  provider.on("display_uri", handler);
  return () => {
    provider.removeListener("display_uri", handler);
  };
}

/**
 * Pushes the live pairing URI into AppKit until a session exists. The `display_uri`
 * event can race the modal paint in some builds; polling `provider.uri` matches what
 * WC’s SignClient already assigned.
 */
function syncProviderUriToAppKit(
  provider: WalletConnectProviderInstance,
  setUri: (uri: string) => void,
): () => void {
  const tick = () => {
    const u = provider.uri;
    if (typeof u === "string" && u.length > 0) setUri(u);
  };
  tick();
  const id = window.setInterval(tick, 120);
  return () => window.clearInterval(id);
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
  const { ConnectionController } = await import("@reown/appkit-controllers");
  const pushUri = (uri: string) => {
    ConnectionController.setUri(uri);
  };
  const unsubDisplayUri = subscribeWalletConnectDisplayUri(provider, pushUri);
  const stopUriPoll = syncProviderUriToAppKit(provider, pushUri);
  if (provider.uri) {
    ConnectionController.setUri(provider.uri);
  }
  const sessionPromise = provider.connect({
    namespaces: {
      stellar: {
        methods: [...STELLAR_METHODS],
        chains: [STELLAR_TESTNET_CHAIN],
        events: ["accountsChanged"],
      },
    },
  });
  try {
    await openAppKitModalPreferringWideLayout(modal);
    const { RouterController } = await import("@reown/appkit-controllers");
    // Desktop would otherwise open the QR-first basic view; show the wallet grid first.
    RouterController.reset("AllWallets");
    const session = await sessionPromise;
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
    stopUriPoll();
    unsubDisplayUri();
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
