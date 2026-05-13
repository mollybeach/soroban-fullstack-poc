"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CirclePlay,
  FlaskConical,
  LogOut,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { formatUnknownError } from "@/lib/format-unknown-error";

function truncateMiddle(s: string, start = 6, end = 4) {
  if (s.length <= start + end + 1) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

export function SiteHeader() {
  const { publicKey, connectWallet, disconnect } = useWallet();
  const [connectError, setConnectError] = useState<string | null>(null);

  async function onConnect() {
    setConnectError(null);
    try {
      await connectWallet();
    } catch (e) {
      setConnectError(formatUnknownError(e));
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 pb-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:pb-0 sm:pt-0 sm:h-14">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:justify-start sm:gap-8">
          <Link
            href="/"
            className="shrink-0 text-sm font-bold tracking-tight text-violet-900 sm:text-base"
          >
            Soroban POC
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-slate-600 sm:ml-0">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 transition hover:bg-violet-100 hover:text-violet-900"
            >
              Home
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-violet-100 hover:text-violet-900"
            >
              <CirclePlay className="h-4 w-4" aria-hidden />
              Demo
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-violet-100 hover:text-violet-900"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Docs
            </Link>
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-violet-100 hover:text-violet-900"
            >
              <FlaskConical className="h-4 w-4" aria-hidden />
              Tests
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
          <div className="flex items-center justify-end gap-2">
            {publicKey ? (
              <>
                <span
                  className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 sm:inline"
                  title="Connected via Stellar Wallets Kit"
                >
                  Stellar
                </span>
                <span
                  className="max-w-[12rem] truncate rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-xs text-violet-900 sm:max-w-[14rem]"
                  title={publicKey}
                >
                  {truncateMiddle(publicKey)}
                </span>
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title="Disconnect"
                  aria-label="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void onConnect()}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-400 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-300/50 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-400/40 active:scale-[0.98]"
              >
                <Wallet className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Connect wallet</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}
          </div>
          {connectError ? (
            <p className="max-w-full text-right text-xs text-rose-600 sm:max-w-xs">
              {connectError}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
