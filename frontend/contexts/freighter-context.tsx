"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

type FreighterContextValue = {
  publicKey: string | null;
  /** Resolves when connected; throws or no-ops with errors surfaced via optional callback in future — for now callers use try/catch if needed. */
  connectWallet: () => Promise<void>;
  disconnect: () => void;
};

const FreighterContext = createContext<FreighterContextValue | null>(null);

export function FreighterProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    const connected = await isConnected();
    if (!connected.isConnected || connected.error) {
      throw new Error(
        connected.error?.message ??
          "Freighter not connected. Install the Freighter browser extension.",
      );
    }
    const access = await requestAccess();
    if (access.error || !access.address) {
      throw new Error(
        access.error?.message ?? "Could not read wallet address",
      );
    }
    setPublicKey(access.address);
  }, []);

  const disconnect = useCallback(() => setPublicKey(null), []);

  const value = useMemo(
    () => ({ publicKey, connectWallet, disconnect }),
    [publicKey, connectWallet, disconnect],
  );

  return (
    <FreighterContext.Provider value={value}>
      {children}
    </FreighterContext.Provider>
  );
}

export function useFreighter(): FreighterContextValue {
  const ctx = useContext(FreighterContext);
  if (!ctx) {
    throw new Error("useFreighter must be used within FreighterProvider");
  }
  return ctx;
}
