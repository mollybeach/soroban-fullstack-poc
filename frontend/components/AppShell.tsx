"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/contexts/wallet-context";
import { SiteHeader } from "@/components/SiteHeader";
import { WalletConnectModalTabs } from "@/components/WalletConnectModalTabs";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <WalletConnectModalTabs />
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-violet-50 via-white to-fuchsia-50/80 text-slate-900">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </WalletProvider>
  );
}
