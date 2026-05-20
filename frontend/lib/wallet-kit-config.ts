import { WalletConnectTargetChain } from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";

/**
 * Stellar Wallets Kit module catalog for this POC (aligned with `@creit-tech/stellar-wallets-kit`
 * `defaultModules()` in v2.2.0 + optional `WalletConnectModule`).
 */

export const WALLET_CONNECT_PRODUCT_ID = "wallet_connect" as const;

/** Wallets returned by `defaultModules()` — order matches the kit's `utils.js`. */
export const SWK_DEFAULT_WALLET_MODULES = [
  { id: "albedo", name: "Albedo" },
  { id: "freighter", name: "Freighter" },
  { id: "fordefi", name: "Fordefi" },
  { id: "rabet", name: "Rabet" },
  { id: "xbull", name: "xBull" },
  { id: "lobstr", name: "LOBSTR" },
  { id: "hana", name: "Hana Wallet" },
  { id: "klever", name: "Klever Wallet" },
  { id: "onekey", name: "OneKey Wallet" },
  { id: "bitget", name: "Bitget Wallet" },
  { id: "cactuslink", name: "Cactus Link" },
] as const;

export const WALLET_CONNECT_MODULE = {
  id: WALLET_CONNECT_PRODUCT_ID,
  name: "WalletConnect",
} as const;

/** Chain id passed to `WalletConnectModule` (`WalletConnectTargetChain.TESTNET`). */
export const POC_WALLET_CONNECT_CHAIN = "stellar:testnet" as const;

export type PocWalletModule = (typeof SWK_DEFAULT_WALLET_MODULES)[number] | typeof WALLET_CONNECT_MODULE;

/** Product ids shown in the kit auth modal for this app configuration. */
export function resolvePocWalletPickerIds(projectId: string | null | undefined): string[] {
  const ids: string[] = SWK_DEFAULT_WALLET_MODULES.map((m) => m.id);
  if (projectId?.trim()) {
    ids.push(WALLET_CONNECT_PRODUCT_ID);
  }
  return ids;
}

export function findPocWalletById(id: string): PocWalletModule | undefined {
  const base = SWK_DEFAULT_WALLET_MODULES.find((m) => m.id === id);
  if (base) return base;
  if (id === WALLET_CONNECT_PRODUCT_ID) return WALLET_CONNECT_MODULE;
  return undefined;
}

export type WalletConnectModuleOptions = {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  allowedChains: WalletConnectTargetChain[];
  signClientOptions: { logger: "silent" };
};

/** Options passed to `new WalletConnectModule({ ... })` in the browser client. */
export function buildWalletConnectModuleOptions(
  projectId: string,
  origin: string,
): WalletConnectModuleOptions {
  const trimmed = projectId.trim();
  if (!trimmed) {
    throw new Error("WalletConnect projectId is required");
  }
  const baseOrigin = origin.replace(/\/$/, "");
  return {
    projectId: trimmed,
    metadata: {
      name: "Soroban Fullstack POC",
      description: "Stellar testnet Soroban read/write demo",
      url: baseOrigin,
      icons: [`${baseOrigin}/favicon.ico`],
    },
    allowedChains: [WalletConnectTargetChain.TESTNET],
    signClientOptions: { logger: "silent" },
  };
}
