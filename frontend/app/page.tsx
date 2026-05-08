"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Binary,
  ExternalLink,
  Hash,
  PencilLine,
  RefreshCw,
  ScrollText,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import {
  readContractSnapshot,
  writeStoredU32,
  writeSigned,
  writeTag,
  writeCounter,
  getConfiguredContractId,
  getOptionalContractId,
  stellarExpertContractUrl,
} from "@/lib/stellar";
import { useFreighter } from "@/contexts/freighter-context";

type LogLevel = "info" | "warn" | "ok" | "error";

type LogLine = {
  id: number;
  ts: string;
  level: LogLevel;
  message: string;
};

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const btnAccent =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-200/60 transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const inputClass =
  "w-full max-w-[12rem] rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100 disabled:text-slate-500";

/** Matches `contracts/basic-storage/src/test.rs` round-trip examples. */
const DEMO_WRITE_VALUES = {
  u32: "42",
  i32: "-17",
  tag: "hello-events",
  u64: "99",
} as const;

export default function HomePage() {
  const { publicKey } = useFreighter();
  const [stored, setStored] = useState<number | null>(null);
  const [storedSigned, setStoredSigned] = useState<number | null>(null);
  const [storedTag, setStoredTag] = useState<string | null>(null);
  const [storedCounter, setStoredCounter] = useState<string | null>(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [writeInput, setWriteInput] = useState("0");
  const [signedInput, setSignedInput] = useState("0");
  const [tagInput, setTagInput] = useState("hello");
  const [counterInput, setCounterInput] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  /** `null` until first successful read; then matches on-chain WASM. */
  const [hasExtendedApi, setHasExtendedApi] = useState<boolean | null>(null);
  const [txLog, setTxLog] = useState<LogLine[]>([]);
  const logIdRef = useRef(0);
  const logPanelRef = useRef<HTMLDivElement>(null);
  const loggedPkRef = useRef<string | null>(null);

  const appendLog = useCallback((level: LogLevel, message: string) => {
    const id = ++logIdRef.current;
    const ts = new Date().toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTxLog((prev) =>
      [...prev, { id, ts, level, message }].slice(-100),
    );
  }, []);

  useEffect(() => {
    if (publicKey && publicKey !== loggedPkRef.current) {
      appendLog("ok", `Wallet connected: ${publicKey}`);
      loggedPkRef.current = publicKey;
    }
    if (!publicKey && loggedPkRef.current) {
      appendLog("info", "Wallet disconnected.");
      loggedPkRef.current = null;
    }
  }, [publicKey, appendLog]);

  const refresh = useCallback(async () => {
    setLoadingRead(true);
    setStatus(null);
    try {
      const snap = await readContractSnapshot();
      setStored(snap.u32);
      setHasExtendedApi(snap.hasExtendedApi);
      if (snap.hasExtendedApi) {
        setStoredSigned(snap.signed);
        setStoredTag(snap.tag);
        setStoredCounter(snap.counter!.toString());
        appendLog(
          "ok",
          `reads → u32=${snap.u32}, i32=${snap.signed}, tag=${JSON.stringify(snap.tag)}, u64=${snap.counter!.toString()}`,
        );
      } else {
        setStoredSigned(null);
        setStoredTag(null);
        setStoredCounter(null);
        appendLog(
          "ok",
          `get() → u32=${snap.u32} (on-chain WASM has no get_signed/get_tag/get_counter for this id)`,
        );
        appendLog(
          "info",
          "Redeploy the latest `basic-storage` contract and point NEXT_PUBLIC_CONTRACT_ID at the new C… address to enable extended reads and writes.",
        );
      }
    } catch (e) {
      setStored(null);
      setStoredSigned(null);
      setStoredTag(null);
      setStoredCounter(null);
      setHasExtendedApi(null);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      appendLog("error", `read failed: ${msg}`);
    } finally {
      setLoadingRead(false);
    }
  }, [appendLog]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const el = logPanelRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [txLog]);

  async function requireWallet(): Promise<string | null> {
    if (!publicKey) {
      const msg = "Connect Freighter first (top right) to submit a write transaction.";
      setStatus(msg);
      appendLog("warn", msg);
      return null;
    }
    return publicKey;
  }

  async function onSubmitSet(e: FormEvent) {
    e.preventDefault();
    const pk = await requireWallet();
    if (!pk) return;
    const n = Number(writeInput);
    if (!Number.isFinite(n)) {
      const msg = "Enter a numeric value for set().";
      setStatus(msg);
      appendLog("warn", msg);
      return;
    }
    const value = Math.trunc(n);
    setStatus("Signing and submitting…");
    appendLog("info", `set(${value}): awaiting signature in Freighter…`);
    try {
      const sent = await writeStoredU32(value, pk);
      appendLog(
        "ok",
        `set(${value}) submitted. Result: ${String(sent.result)}`,
      );
      await refresh();
      setStatus(
        `Submitted. Result: ${String(sent.result)}. Stored values above were refreshed.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg);
      appendLog("error", `set(${value}) failed: ${msg}`);
    }
  }

  async function onSubmitSigned(e: FormEvent) {
    e.preventDefault();
    const pk = await requireWallet();
    if (!pk) return;
    const n = Number(signedInput);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      appendLog("warn", "Enter an integer for set_signed (i32).");
      return;
    }
    const v = Math.trunc(n);
    setStatus("Signing set_signed…");
    appendLog("info", `set_signed(${v}): awaiting Freighter…`);
    try {
      const sent = await writeSigned(v, pk);
      appendLog("ok", `set_signed submitted. Result: ${String(sent.result)}`);
      await refresh();
      setStatus("set_signed submitted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg);
      appendLog("error", `set_signed failed: ${msg}`);
    }
  }

  async function onSubmitTag(e: FormEvent) {
    e.preventDefault();
    const pk = await requireWallet();
    if (!pk) return;
    setStatus("Signing set_tag…");
    appendLog("info", `set_tag(${JSON.stringify(tagInput)}): awaiting Freighter…`);
    try {
      const sent = await writeTag(tagInput, pk);
      appendLog("ok", `set_tag submitted. Result: ${String(sent.result)}`);
      await refresh();
      setStatus("set_tag submitted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg);
      appendLog("error", `set_tag failed: ${msg}`);
    }
  }

  async function onSubmitCounter(e: FormEvent) {
    e.preventDefault();
    const pk = await requireWallet();
    if (!pk) return;
    let n: bigint;
    try {
      n = BigInt(counterInput.trim() || "0");
    } catch {
      appendLog("warn", "Enter a whole number for set_counter (u64).");
      return;
    }
    setStatus("Signing set_counter…");
    appendLog("info", `set_counter(${n}): awaiting Freighter…`);
    try {
      const sent = await writeCounter(n, pk);
      appendLog("ok", `set_counter submitted. Result: ${String(sent.result)}`);
      await refresh();
      setStatus("set_counter submitted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg);
      appendLog("error", `set_counter failed: ${msg}`);
    }
  }

  let contractPreview: string;
  try {
    contractPreview = getConfiguredContractId();
  } catch {
    contractPreview = "(not configured)";
  }

  const optionalId = getOptionalContractId();
  const explorerUrl = optionalId
    ? stellarExpertContractUrl(optionalId)
    : null;

  const readDisplay = (v: string | number | null) =>
    loadingRead ? "…" : v === null ? "—" : String(v);

  const logColor = (level: LogLevel) => {
    switch (level) {
      case "ok":
        return "text-emerald-800";
      case "warn":
        return "text-amber-800";
      case "error":
        return "text-rose-700";
      default:
        return "text-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-lg shadow-violet-100/50 backdrop-blur-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl">
          Soroban fullstack POC
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Minimal testnet flow: simulate <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-900">get*</code>, submit writes via
          Freighter. Each write emits a contract event (
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm">ValueSet</code>,{" "}
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm">SignedSet</code>,{" "}
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm">TagSet</code>,{" "}
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm">CounterSet</code>
          ).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Contract</span>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1.5 font-mono text-xs text-violet-900 transition hover:border-violet-300 hover:bg-violet-100"
            >
              <span className="truncate">{optionalId}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-violet-600 group-hover:text-violet-800" aria-hidden />
            </a>
          ) : (
            <code className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              {contractPreview}
            </code>
          )}
        </div>
      </div>

      {hasExtendedApi === false ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          This contract address only exposes the original{" "}
          <code className="rounded bg-amber-100 px-1">get</code> /{" "}
          <code className="rounded bg-amber-100 px-1">set</code> (u32). Redeploy the current{" "}
          <code className="rounded bg-amber-100 px-1">basic-storage</code> wasm from this repo, then set{" "}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code> to the new{" "}
          <code className="rounded bg-amber-100 px-1">C…</code> id so{" "}
          <code className="rounded bg-amber-100 px-1">SignedSet</code>,{" "}
          <code className="rounded bg-amber-100 px-1">TagSet</code>, and{" "}
          <code className="rounded bg-amber-100 px-1">CounterSet</code> calls work.
        </div>
      ) : null}

      <div className="grid gap-4 rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-md sm:grid-cols-2 sm:p-8">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            Stored values
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            <li>
              <span className="font-medium text-slate-500">u32 (get)</span>{" "}
              <span className="font-mono">{readDisplay(stored)}</span>
            </li>
            <li>
              <span className="font-medium text-slate-500">i32 (get_signed)</span>{" "}
              <span className="font-mono">{readDisplay(storedSigned)}</span>
            </li>
            <li>
              <span className="font-medium text-slate-500">tag (get_tag)</span>{" "}
              <span className="font-mono">
                {loadingRead ? "…" : storedTag === null ? "—" : storedTag}
              </span>
            </li>
            <li>
              <span className="font-medium text-slate-500">u64 (get_counter)</span>{" "}
              <span className="font-mono">{readDisplay(storedCounter)}</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-center">
          <button
            type="button"
            onClick={() => {
              appendLog("info", "Manual refresh: simulating reads…");
              void refresh();
            }}
            disabled={loadingRead}
            className={btnPrimary}
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingRead ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh read
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-md sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
            <PencilLine className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
            Writes (testnet)
          </h2>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setWriteInput(DEMO_WRITE_VALUES.u32);
              setSignedInput(DEMO_WRITE_VALUES.i32);
              setTagInput(DEMO_WRITE_VALUES.tag);
              setCounterInput(DEMO_WRITE_VALUES.u64);
              setStatus(null);
              appendLog(
                "info",
                `Filled demo inputs: u32=${DEMO_WRITE_VALUES.u32}, i32=${DEMO_WRITE_VALUES.i32}, tag=${JSON.stringify(DEMO_WRITE_VALUES.tag)}, u64=${DEMO_WRITE_VALUES.u64}`,
              );
            }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Fill demo values
          </button>
        </div>
        <div className="mt-6 space-y-5">
          <form
            onSubmit={(ev) => void onSubmitSet(ev)}
            className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-end sm:flex-wrap"
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700">
              New value (u32)
              <input
                className={inputClass}
                value={writeInput}
                onChange={(ev) => setWriteInput(ev.target.value)}
                inputMode="numeric"
              />
            </label>
            <button type="submit" className={btnAccent}>
              <Hash className="h-4 w-4" aria-hidden />
              set() — ValueSet
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitSigned(ev)}
            className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-end sm:flex-wrap"
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700">
              Signed (i32)
              <input
                className={inputClass}
                value={signedInput}
                onChange={(ev) => setSignedInput(ev.target.value)}
                inputMode="numeric"
                disabled={hasExtendedApi !== true}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true}
              className={btnAccent}
            >
              <Binary className="h-4 w-4" aria-hidden />
              set_signed() — SignedSet
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitTag(ev)}
            className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-end sm:flex-wrap"
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700">
              Tag (string)
              <input
                className={`${inputClass} max-w-full sm:max-w-[20rem]`}
                value={tagInput}
                onChange={(ev) => setTagInput(ev.target.value)}
                maxLength={200}
                disabled={hasExtendedApi !== true}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true}
              className={btnAccent}
            >
              <Tag className="h-4 w-4" aria-hidden />
              set_tag() — TagSet
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitCounter(ev)}
            className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-end sm:flex-wrap"
          >
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700">
              Counter (u64)
              <input
                className={inputClass}
                value={counterInput}
                onChange={(ev) => setCounterInput(ev.target.value)}
                inputMode="numeric"
                disabled={hasExtendedApi !== true}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true}
              className={btnAccent}
            >
              <ScrollText className="h-4 w-4" aria-hidden />
              set_counter() — CounterSet
            </button>
          </form>
        </div>
      </section>

      {status ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {status}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-slate-100 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-950/80 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
            <ScrollText className="h-4 w-4 text-violet-300" aria-hidden />
            Transaction log
          </h2>
          <button
            type="button"
            onClick={() => setTxLog([])}
            className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Clear log
          </button>
        </div>
        <div
          ref={logPanelRef}
          className="max-h-64 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed sm:max-h-80 sm:px-5 sm:text-sm"
          role="log"
          aria-label="Transaction log"
        >
          {txLog.length === 0 ? (
            <p className="text-slate-500">
              Read and write actions append entries here with timestamps.
            </p>
          ) : (
            txLog.map((line) => (
              <p key={line.id} className={logColor(line.level)}>
                [{line.ts}] {line.message}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
