"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import type { WalletConnectProviderInstance } from "@/lib/walletconnect-instance-type";
import {
  connectWalletConnectSession,
  disconnectWalletConnect,
  getWalletConnectClients,
  getWalletConnectProjectId,
  parseStellarTestnetAccount,
} from "@/lib/stellar-walletconnect";
import {
  createFreighterSigner,
  createWalletConnectSigner,
} from "@/lib/wallet-signers";
import type { SorobanTransactionSigner } from "@/lib/wallet-types";

export type WalletMode = "freighter" | "walletconnect";

type WalletContextValue = {
  publicKey: string | null;
  walletMode: WalletMode | null;
  /** Present when connected; pass into Soroban write helpers in `lib/stellar.ts`. */
  signTransaction: SorobanTransactionSigner | null;
  walletConnectConfigured: boolean;
  connectFreighter: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode | null>(null);
  const [wcProvider, setWcProvider] = useState<WalletConnectProviderInstance | null>(null);
  const wcProviderRef = useRef<WalletConnectProviderInstance | null>(null);
  wcProviderRef.current = wcProvider;
  /** True after an explicit connect; blocks async WC session restore from overwriting the user. */
  const userPickedWalletRef = useRef(false);

  const walletConnectConfigured = Boolean(getWalletConnectProjectId());

  const signTransaction = useMemo<SorobanTransactionSigner | null>(() => {
    if (!publicKey) return null;
    if (walletMode === "freighter") {
      return createFreighterSigner(publicKey);
    }
    if (walletMode === "walletconnect" && wcProvider) {
      return createWalletConnectSigner(wcProvider, publicKey);
    }
    return null;
  }, [publicKey, walletMode, wcProvider]);

  const connectFreighter = useCallback(async () => {
    userPickedWalletRef.current = true;
    const connected = await isConnected();
    if (!connected.isConnected || connected.error) {
      throw new Error(
        connected.error?.message ??
          "Wallet unavailable. Install the Freighter browser extension and allow this site.",
      );
    }
    const access = await requestAccess();
    if (access.error || !access.address) {
      throw new Error(
        access.error?.message ?? "Could not read wallet address",
      );
    }
    await disconnectWalletConnect(wcProviderRef.current);
    setWcProvider(null);
    setPublicKey(access.address);
    setWalletMode("freighter");
  }, []);

  const connectWalletConnect = useCallback(async () => {
    userPickedWalletRef.current = true;
    const { provider, publicKey: pk } = await connectWalletConnectSession();
    setWcProvider(provider);
    setPublicKey(pk);
    setWalletMode("walletconnect");
  }, []);

  const disconnect = useCallback(async () => {
    userPickedWalletRef.current = false;
    await disconnectWalletConnect(wcProviderRef.current);
    setWcProvider(null);
    setPublicKey(null);
    setWalletMode(null);
  }, []);

  /** Restore WalletConnect session after refresh (IndexedDB persistence). */
  useEffect(() => {
    if (typeof window === "undefined" || !walletConnectConfigured) return;
    let cancelled = false;
    void (async () => {
      try {
        const clients = await getWalletConnectClients();
        if (!clients || cancelled) return;
        const { provider } = clients;
        const pk = parseStellarTestnetAccount(provider.session ?? null);
        if (pk && !cancelled && !userPickedWalletRef.current) {
          setWcProvider(provider);
          setPublicKey(pk);
          setWalletMode("walletconnect");
        }
      } catch {
        // ignore failed restore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletConnectConfigured]);

  useEffect(() => {
    const p = wcProvider;
    if (!p) return;
    const clear = () => {
      setWcProvider(null);
      setPublicKey(null);
      setWalletMode(null);
    };
    p.on("session_delete", clear);
    p.on("session_expire", clear);
    return () => {
      p.off("session_delete", clear);
      p.off("session_expire", clear);
    };
  }, [wcProvider]);

  const value = useMemo<WalletContextValue>(
    () => ({
      publicKey,
      walletMode,
      signTransaction,
      walletConnectConfigured,
      connectFreighter,
      connectWalletConnect,
      disconnect,
    }),
    [
      publicKey,
      walletMode,
      signTransaction,
      walletConnectConfigured,
      connectFreighter,
      connectWalletConnect,
      disconnect,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}

/** @deprecated Use `useWallet` — alias kept for incremental refactors. */
export const useFreighter = useWallet;
