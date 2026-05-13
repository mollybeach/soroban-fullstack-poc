"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createStellarWalletsKitSigner,
  disconnectStellarWalletsKit,
  ensureStellarWalletsKit,
  getWalletConnectProjectId,
  isSwkAuthModalDismissed,
  KitEventType,
  openStellarWalletsKitAuth,
  StellarWalletsKit,
} from "@/lib/stellar-wallets-kit-client";
import type { SorobanTransactionSigner } from "@/lib/wallet-types";

export type WalletMode = "stellar-wallets-kit";

type WalletContextValue = {
  publicKey: string | null;
  walletMode: WalletMode | null;
  /** Present when connected; pass into Soroban write helpers in `lib/stellar.ts`. */
  signTransaction: SorobanTransactionSigner | null;
  /** True when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set (WalletConnect appears in the kit list). */
  walletConnectConfigured: boolean;
  /** Opens Stellar Wallets Kit (extensions + WalletConnect in one modal). */
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletMode, setWalletMode] = useState<WalletMode | null>(null);

  const walletConnectConfigured = Boolean(getWalletConnectProjectId());

  const signTransaction = useMemo<SorobanTransactionSigner | null>(() => {
    if (!publicKey) return null;
    return createStellarWalletsKitSigner(publicKey);
  }, [publicKey]);

  const connectWallet = useCallback(async () => {
    try {
      const { address } = await openStellarWalletsKitAuth();
      setPublicKey(address);
      setWalletMode("stellar-wallets-kit");
    } catch (e) {
      if (isSwkAuthModalDismissed(e)) return;
      throw e;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectStellarWalletsKit();
    setPublicKey(null);
    setWalletMode(null);
  }, []);

  /** Restore address after refresh when the kit still has a session. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let unState: (() => void) | undefined;
    let unDisc: (() => void) | undefined;
    let cancelled = false;

    void ensureStellarWalletsKit().then(async () => {
      if (cancelled) return;
      try {
        const { address } = await StellarWalletsKit.getAddress();
        if (address && !cancelled) {
          setPublicKey(address);
          setWalletMode("stellar-wallets-kit");
        }
      } catch {
        // not connected yet
      }
      if (cancelled) return;
      unState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (ev) => {
        const a = ev.payload.address;
        setPublicKey(a ?? null);
        setWalletMode(a ? "stellar-wallets-kit" : null);
      });
      unDisc = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        setPublicKey(null);
        setWalletMode(null);
      });
    });

    return () => {
      cancelled = true;
      unState?.();
      unDisc?.();
    };
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      publicKey,
      walletMode,
      signTransaction,
      walletConnectConfigured,
      connectWallet,
      disconnect,
    }),
    [
      publicKey,
      walletMode,
      signTransaction,
      walletConnectConfigured,
      connectWallet,
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
