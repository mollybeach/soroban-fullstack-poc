"use client";

import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Binary,
  ClipboardCopy,
  Download,
  ExternalLink,
  FileCode,
  Hash,
  Loader2,
  PencilLine,
  RefreshCw,
  ScrollText,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  readContractSnapshot,
  writeStoredU32,
  writeSigned,
  writeTag,
  writeCounter,
  writeFlag,
  writeI64,
  writeBlob,
  writeU128,
  writeSymbol,
  writePointer,
  writeI128Wide,
  utf8ToBytes,
  getConfiguredContractId,
  getOptionalContractId,
  stellarExpertContractUrl,
} from "@/lib/stellar";
import { useWallet } from "@/contexts/wallet-context";
import { formatUnknownError } from "@/lib/format-unknown-error";

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

const btnWrite =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:px-3 sm:text-xs";

/** Getter row: label truncates; value cell scrolls horizontally when long (pointer, i128, …). */
const readGetValueRow =
  "flex min-w-0 w-full max-w-full items-baseline justify-between gap-2";

const readGetValueScroll =
  "min-w-0 flex-1 basis-0 overflow-x-auto overflow-y-hidden whitespace-nowrap py-0.5 pl-2 text-right font-mono text-sm font-semibold tabular-nums leading-snug text-slate-900 [scrollbar-width:thin]";

/**
 * One distinct palette per storage slot so “Get” tiles, “Writes” rows, and hero
 * `<code>` labels for each *Set stay visually aligned.
 */
const SLOT_THEME = {
  u32: {
    docCode: "rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-violet-200/90 border-l-[3px] border-l-violet-600 bg-gradient-to-br from-violet-50/95 via-white to-fuchsia-50/35 px-2 py-1.5 shadow-sm ring-1 ring-violet-100/60",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-violet-900 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-violet-900 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full max-w-full min-w-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-300/50`,
  },
  i32: {
    docCode: "rounded bg-blue-100 px-1.5 py-0.5 text-sm text-blue-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-blue-200/90 border-l-[3px] border-l-blue-600 bg-gradient-to-br from-blue-50/95 via-white to-sky-50/40 px-2 py-1.5 shadow-sm ring-1 ring-blue-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-blue-900 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-blue-900 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full max-w-full min-w-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-blue-600 to-sky-600 shadow-blue-300/45`,
  },
  tag: {
    docCode: "rounded bg-emerald-100 px-1.5 py-0.5 text-sm text-emerald-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-emerald-200/90 border-l-[3px] border-l-emerald-600 bg-gradient-to-br from-emerald-50/95 via-white to-lime-50/35 px-2 py-1.5 shadow-sm ring-1 ring-emerald-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-emerald-900 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-emerald-900 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full min-w-0 max-w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-300/45`,
  },
  u64: {
    docCode: "rounded bg-amber-100 px-1.5 py-0.5 text-sm text-amber-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-amber-200/90 border-l-[3px] border-l-amber-600 bg-gradient-to-br from-amber-50/95 via-white to-yellow-50/35 px-2 py-1.5 shadow-sm ring-1 ring-amber-100/80",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-amber-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-amber-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full max-w-full min-w-0 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-300/50`,
  },
  bool: {
    docCode: "rounded bg-rose-100 px-1.5 py-0.5 text-sm text-rose-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-rose-200/90 border-l-[3px] border-l-rose-600 bg-gradient-to-br from-rose-50/95 via-white to-red-50/30 px-2 py-1.5 shadow-sm ring-1 ring-rose-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-rose-900 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-rose-900 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full max-w-full min-w-0 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-300/45`,
  },
  i64: {
    docCode: "rounded bg-sky-100 px-1.5 py-0.5 text-sm text-sky-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-sky-200/90 border-l-[3px] border-l-sky-600 bg-gradient-to-br from-sky-50/95 via-white to-cyan-50/40 px-2 py-1.5 shadow-sm ring-1 ring-sky-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-sky-900 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-sky-900 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full min-w-0 max-w-full rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-sky-600 to-cyan-600 shadow-sky-300/45`,
  },
  blob: {
    docCode: "rounded bg-fuchsia-100 px-1.5 py-0.5 text-sm text-fuchsia-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-fuchsia-200/90 border-l-[3px] border-l-fuchsia-600 bg-gradient-to-br from-fuchsia-50/90 via-white to-purple-50/35 px-2 py-1.5 shadow-sm ring-1 ring-fuchsia-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-fuchsia-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-fuchsia-200/90 bg-gradient-to-br from-fuchsia-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-fuchsia-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInputWide:
      "w-full min-w-0 max-w-full rounded-lg border border-fuchsia-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-fuchsia-300/45`,
  },
  u128: {
    docCode: "rounded bg-indigo-100 px-1.5 py-0.5 text-sm text-indigo-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-indigo-200/90 border-l-[3px] border-l-indigo-600 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/30 px-2 py-1.5 shadow-sm ring-1 ring-indigo-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-indigo-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-indigo-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full min-w-0 max-w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-300/45`,
  },
  symbol: {
    docCode: "rounded bg-teal-100 px-1.5 py-0.5 text-sm text-teal-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-teal-200/90 border-l-[3px] border-l-teal-600 bg-gradient-to-br from-teal-50/95 via-white to-emerald-50/30 px-2 py-1.5 shadow-sm ring-1 ring-teal-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-teal-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-teal-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full min-w-0 max-w-full rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-300/45`,
  },
  pointer: {
    docCode: "rounded bg-orange-100 px-1.5 py-0.5 text-sm text-orange-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-orange-200/90 border-l-[3px] border-l-orange-600 bg-gradient-to-br from-orange-50/95 via-white to-amber-50/25 px-2 py-1.5 shadow-sm ring-1 ring-orange-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-orange-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-orange-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInputWide:
      "w-full min-w-0 max-w-full rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 font-mono text-xs leading-tight text-slate-900 shadow-inner outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-orange-600 to-amber-600 shadow-orange-300/45`,
  },
  i128: {
    docCode: "rounded bg-pink-100 px-1.5 py-0.5 text-sm text-pink-950",
    readCard:
      "min-w-0 flex flex-col gap-0.5 rounded-lg border border-pink-200/90 border-l-[3px] border-l-pink-600 bg-gradient-to-br from-pink-50/95 via-white to-rose-50/30 px-2 py-1.5 shadow-sm ring-1 ring-pink-100/70",
    readSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-pink-950 sm:text-lg",
    readMetaLabel:
      "min-w-0 max-w-[45%] shrink-0 truncate text-[11px] font-medium leading-snug text-slate-600",
    readMetaValue: readGetValueScroll,
    readMetaValueWide: readGetValueScroll,
    writeForm:
      "min-w-0 flex flex-col gap-1.5 rounded-xl border border-pink-200/90 bg-gradient-to-br from-pink-50/70 to-white px-2.5 py-2 h-full",
    writeSetTitle:
      "text-[1.05rem] font-bold leading-tight tracking-tight text-pink-950 sm:text-lg",
    writeLabel:
      "flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] font-medium leading-snug text-slate-600",
    writeInput:
      "w-full min-w-0 max-w-full rounded-lg border border-pink-200 bg-white px-2.5 py-1.5 text-sm leading-tight text-slate-900 shadow-inner outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 disabled:bg-slate-100 disabled:text-slate-500",
    writeBtn: `${btnWrite} bg-gradient-to-r from-pink-600 to-rose-600 shadow-pink-300/45`,
  },
} as const;

type ReadSlotKey = keyof typeof SLOT_THEME;

function ReadGetSlotPulseWrap({
  pulseGen,
  children,
}: {
  pulseGen: number;
  children: ReactNode;
}) {
  return (
    <div
      key={pulseGen}
      className={
        pulseGen > 0
          ? "flex min-h-0 min-w-0 w-full flex-col gap-0.5 animate-get-slot-updated"
          : "flex min-h-0 min-w-0 w-full flex-col gap-0.5"
      }
    >
      {children}
    </div>
  );
}

/** Matches `contracts/basic-storage/src/test.rs` round-trip examples. */
const DEMO_WRITE_VALUES = {
  u32: "42",
  i32: "-17",
  tag: "hello-events",
  u64: "99",
  flag: "true",
  i64: "-1000000000000",
  blob: "hello-blob",
  u128: "12345678901234567890",
  symbol: "POC",
  pointer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  i128Wide: "-9876543210000000000000000000",
} as const;

export default function HomePage() {
  const {
    publicKey,
    signTransaction,
    connectWallet,
    walletConnectConfigured,
  } = useWallet();
  const [connectWalletError, setConnectWalletError] = useState<string | null>(
    null,
  );
  const [stored, setStored] = useState<number | null>(null);
  const [storedSigned, setStoredSigned] = useState<number | null>(null);
  const [storedTag, setStoredTag] = useState<string | null>(null);
  const [storedCounter, setStoredCounter] = useState<string | null>(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [writeInput, setWriteInput] = useState("0");
  const [signedInput, setSignedInput] = useState("0");
  const [tagInput, setTagInput] = useState("hello");
  const [counterInput, setCounterInput] = useState("0");
  const [flagInput, setFlagInput] = useState("false");
  const [i64Input, setI64Input] = useState("0");
  const [blobInput, setBlobInput] = useState("hello");
  const [u128Input, setU128Input] = useState("0");
  const [symbolInput, setSymbolInput] = useState("POC");
  const [pointerInput, setPointerInput] = useState("");
  const [i128WideInput, setI128WideInput] = useState("0");
  const [storedFlag, setStoredFlag] = useState<boolean | null>(null);
  const [storedI64, setStoredI64] = useState<string | null>(null);
  const [storedBlobB64, setStoredBlobB64] = useState<string | null>(null);
  const [storedU128, setStoredU128] = useState<string | null>(null);
  const [storedSymbol, setStoredSymbol] = useState<string | null>(null);
  const [storedPointer, setStoredPointer] = useState<string | null>(null);
  const [storedI128Wide, setStoredI128Wide] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  /** `null` until first successful read; then matches on-chain WASM. */
  const [hasExtendedApi, setHasExtendedApi] = useState<boolean | null>(null);
  const [hasWideTypesApi, setHasWideTypesApi] = useState<boolean | null>(null);
  const [hasFullTypesApi, setHasFullTypesApi] = useState<boolean | null>(null);
  /** Prevents overlapping submits that reuse the same account sequence (common cause of txBadSeq). */
  const [writePending, setWritePending] = useState(false);
  /** Incremented after a successful write + refresh so the matching Get tile replays a short cue. */
  const [readSlotPulseGen, setReadSlotPulseGen] = useState<
    Record<ReadSlotKey, number>
  >(() =>
    (Object.keys(SLOT_THEME) as ReadSlotKey[]).reduce(
      (acc, k) => {
        acc[k] = 0;
        return acc;
      },
      {} as Record<ReadSlotKey, number>,
    ),
  );
  const writeInFlightRef = useRef(false);
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

  const bumpReadSlotPulse = useCallback((slot: ReadSlotKey) => {
    setReadSlotPulseGen((prev) => ({ ...prev, [slot]: prev[slot] + 1 }));
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

  useEffect(() => {
    if (publicKey) {
      setConnectWalletError(null);
    }
  }, [publicKey]);

  const refresh = useCallback(async () => {
    setLoadingRead(true);
    setStatus(null);
    try {
      const snap = await readContractSnapshot();
      setStored(snap.u32);
      setHasExtendedApi(snap.hasExtendedApi);
      setHasWideTypesApi(snap.hasWideTypesApi);
      setHasFullTypesApi(snap.hasFullTypesApi);
      if (snap.hasExtendedApi) {
        setStoredSigned(snap.signed);
        setStoredTag(snap.tag);
        setStoredCounter(snap.counter!.toString());
        if (snap.hasWideTypesApi) {
          setStoredFlag(snap.flag);
          setStoredI64(snap.i64Val!.toString());
          setStoredBlobB64(snap.blobB64);
          setStoredU128(snap.u128Val!.toString());
          if (snap.hasFullTypesApi) {
            setStoredSymbol(snap.symbolStr);
            setStoredPointer(snap.pointerStr);
            setStoredI128Wide(snap.i128Wide!.toString());
            appendLog(
              "ok",
              `reads → u32=${snap.u32}, i32=${snap.signed}, tag=${JSON.stringify(snap.tag)}, u64=${snap.counter!.toString()}, flag=${snap.flag}, i64=${snap.i64Val!.toString()}, blobB64=${snap.blobB64 ?? ""}, u128=${snap.u128Val!.toString()}, symbol=${JSON.stringify(snap.symbolStr)}, pointer=${snap.pointerStr ?? "null"}, i128Wide=${snap.i128Wide!.toString()}`,
            );
          } else {
            setStoredSymbol(null);
            setStoredPointer(null);
            setStoredI128Wide(null);
            appendLog(
              "ok",
              `reads → u32=${snap.u32}, … u128=${snap.u128Val!.toString()} (wasm has no get_symbol / full schema yet)`,
            );
            appendLog(
              "info",
              "Redeploy wasm to add Symbol, optional Address pointer, and i128.",
            );
          }
        } else {
          setStoredFlag(null);
          setStoredI64(null);
          setStoredBlobB64(null);
          setStoredU128(null);
          setStoredSymbol(null);
          setStoredPointer(null);
          setStoredI128Wide(null);
          appendLog(
            "ok",
            `reads → u32=${snap.u32}, i32=${snap.signed}, tag=${JSON.stringify(snap.tag)}, u64=${snap.counter!.toString()} (wasm has no get_flag / wide types yet)`,
          );
          appendLog(
            "info",
            "Redeploy the latest `basic-storage` wasm to unlock bool, i64, Bytes, and u128 slots.",
          );
        }
      } else {
        setStoredSigned(null);
        setStoredTag(null);
        setStoredCounter(null);
        setStoredFlag(null);
        setStoredI64(null);
        setStoredBlobB64(null);
        setStoredU128(null);
        setStoredSymbol(null);
        setStoredPointer(null);
        setStoredI128Wide(null);
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
      setStoredFlag(null);
      setStoredI64(null);
      setStoredBlobB64(null);
      setStoredU128(null);
      setStoredSymbol(null);
      setStoredPointer(null);
      setStoredI128Wide(null);
      setHasExtendedApi(null);
      setHasWideTypesApi(null);
      setHasFullTypesApi(null);
      const msg = formatUnknownError(e);
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
    if (!el) return;
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    queueMicrotask(scrollToBottom);
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToBottom);
    });
  }, [txLog]);

  useEffect(() => {
    if (!writePending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [writePending]);

  async function requireWallet(): Promise<{
    publicKey: string;
    signTransaction: NonNullable<typeof signTransaction>;
  } | null> {
    if (!publicKey || !signTransaction) {
      const msg =
        "Connect your wallet first (header or banner below), then try the write again.";
      setStatus(msg);
      appendLog("warn", msg);
      return null;
    }
    return { publicKey, signTransaction };
  }

  async function onConnectWalletFromPage() {
    setConnectWalletError(null);
    try {
      await connectWallet();
    } catch (e) {
      setConnectWalletError(formatUnknownError(e));
    }
  }

  const appendBadSeqHintIfNeeded = useCallback(
    (err: unknown) => {
      const msg = formatUnknownError(err);
      if (/txBadSeq|"name":\s*"txBadSeq"/i.test(msg) || /bad\s*seq/i.test(msg)) {
        appendLog(
          "info",
          "txBadSeq: your account’s sequence moved (often from double-clicking submit or another tab/app sending a tx). Wait until the previous transaction confirms, then submit once—do not start a second submit while the wallet approval is still open.",
        );
      }
    },
    [appendLog],
  );

  const copyLogToClipboard = useCallback(async () => {
    const text = txLog
      .map((line) => `[${line.ts}] ${line.message}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      appendLog("info", "Log copied to clipboard.");
    } catch (err) {
      const msg = formatUnknownError(err);
      appendLog("error", `Copy failed: ${msg}`);
    }
  }, [txLog, appendLog]);

  async function onSubmitSet(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    const n = Number(writeInput);
    if (!Number.isFinite(n)) {
      const msg = "Enter a numeric value for set().";
      setStatus(msg);
      appendLog("warn", msg);
      return;
    }
    const value = Math.trunc(n);
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing and submitting…");
    appendLog("info", `set(${value}): awaiting signature in Freighter…`);
    try {
      const sent = await writeStoredU32(value, pk, signTx);
      appendLog(
        "ok",
        `set(${value}) submitted. Result: ${sent.result === null || sent.result === undefined ? "(none — set has no return value)" : String(sent.result)}`,
      );
      await refresh();
      bumpReadSlotPulse("u32");
      setStatus(
        "Submitted. Stored values above were refreshed. (set() returns nothing on chain, so Result is empty.)",
      );
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set(${value}) failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitSigned(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    const n = Number(signedInput);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      appendLog("warn", "Enter an integer for set_signed (i32).");
      return;
    }
    const v = Math.trunc(n);
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_signed…");
    appendLog("info", `set_signed(${v}): awaiting Freighter…`);
    try {
      const sent = await writeSigned(v, pk, signTx);
      appendLog("ok", `set_signed submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("i32");
      setStatus("set_signed submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_signed failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitTag(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_tag…");
    appendLog("info", `set_tag(${JSON.stringify(tagInput)}): awaiting Freighter…`);
    try {
      const sent = await writeTag(tagInput, pk, signTx);
      appendLog("ok", `set_tag submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("tag");
      setStatus("set_tag submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_tag failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitCounter(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    let n: bigint;
    try {
      n = BigInt(counterInput.trim() || "0");
    } catch {
      appendLog("warn", "Enter a whole number for set_counter (u64).");
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_counter…");
    appendLog("info", `set_counter(${n}): awaiting Freighter…`);
    try {
      const sent = await writeCounter(n, pk, signTx);
      appendLog("ok", `set_counter submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("u64");
      setStatus("set_counter submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_counter failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitFlag(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    const t = flagInput.trim().toLowerCase();
    let on: boolean;
    if (t === "true" || t === "1") on = true;
    else if (t === "false" || t === "0") on = false;
    else {
      appendLog("warn", 'Enter "true" or "false" (or 1 / 0) for set_flag.');
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_flag…");
    appendLog("info", `set_flag(${on}): awaiting wallet…`);
    try {
      const sent = await writeFlag(on, pk, signTx);
      appendLog("ok", `set_flag submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("bool");
      setStatus("set_flag submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_flag failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitI64(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    let v: bigint;
    try {
      v = BigInt(i64Input.trim() || "0");
    } catch {
      appendLog("warn", "Enter an integer for set_i64 (i64).");
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_i64…");
    appendLog("info", `set_i64(${v}): awaiting wallet…`);
    try {
      const sent = await writeI64(v, pk, signTx);
      appendLog("ok", `set_i64 submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("i64");
      setStatus("set_i64 submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_i64 failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitBlob(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    const data = utf8ToBytes(blobInput);
    if (data.length > 64) {
      appendLog("warn", "Blob UTF-8 length must be at most 64 bytes.");
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_blob…");
    appendLog("info", `set_blob(${data.length} bytes): awaiting wallet…`);
    try {
      const sent = await writeBlob(data, pk, signTx);
      appendLog("ok", `set_blob submitted. Result: ${String(sent.result)}`);
      await refresh();
      setStatus("set_blob submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_blob failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitU128(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    let v: bigint;
    try {
      v = BigInt(u128Input.trim() || "0");
    } catch {
      appendLog("warn", "Enter a whole decimal number for set_u128 (u128).");
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_u128…");
    appendLog("info", `set_u128(${v}): awaiting wallet…`);
    try {
      const sent = await writeU128(v, pk, signTx);
      appendLog("ok", `set_u128 submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("u128");
      setStatus("set_u128 submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_u128 failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitSymbol(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_symbol…");
    appendLog("info", `set_symbol(${JSON.stringify(symbolInput.trim())}): awaiting wallet…`);
    try {
      const sent = await writeSymbol(symbolInput, pk, signTx);
      appendLog("ok", `set_symbol submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("symbol");
      setStatus("set_symbol submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_symbol failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitPointer(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    const raw = pointerInput.trim();
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_pointer…");
    appendLog("info", `set_pointer(${raw === "" ? "clear" : raw}): awaiting wallet…`);
    try {
      const sent = await writePointer(raw === "" ? null : raw, pk, signTx);
      appendLog("ok", `set_pointer submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("pointer");
      setStatus("set_pointer submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_pointer failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
    }
  }

  async function onSubmitI128Wide(e: FormEvent) {
    e.preventDefault();
    if (writeInFlightRef.current) return;
    const w = await requireWallet();
    if (!w) return;
    const { publicKey: pk, signTransaction: signTx } = w;
    let v: bigint;
    try {
      v = BigInt(i128WideInput.trim() || "0");
    } catch {
      appendLog("warn", "Enter an integer for set_i128 (i128).");
      return;
    }
    writeInFlightRef.current = true;
    setWritePending(true);
    setStatus("Signing set_i128…");
    appendLog("info", `set_i128(${v}): awaiting wallet…`);
    try {
      const sent = await writeI128Wide(v, pk, signTx);
      appendLog("ok", `set_i128 submitted. Result: ${String(sent.result)}`);
      await refresh();
      bumpReadSlotPulse("i128");
      setStatus("set_i128 submitted.");
    } catch (err) {
      const msg = formatUnknownError(err);
      setStatus(msg);
      appendLog("error", `set_i128 failed: ${msg}`);
      appendBadSeqHintIfNeeded(err);
    } finally {
      writeInFlightRef.current = false;
      setWritePending(false);
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

  const walletReady = Boolean(publicKey && signTransaction);

  /** Slots exposed by the deployed WASM (matches which getters / setters are live). */
  const schemaSlotCount = useMemo(() => {
    if (hasExtendedApi == null) return null;
    let n = 1;
    if (hasExtendedApi) n += 3;
    if (hasWideTypesApi) n += 4;
    if (hasFullTypesApi) n += 3;
    return n;
  }, [hasExtendedApi, hasWideTypesApi, hasFullTypesApi]);

  const logMessageColor = (level: LogLevel) => {
    switch (level) {
      case "ok":
        return "text-[#39ff14] drop-shadow-[0_0_12px_rgba(57,255,20,0.55)]";
      case "warn":
        return "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.45)]";
      case "error":
        return "text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.5)]";
      default:
        return "text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.4)]";
    }
  };

  return (
    <div className="space-y-8">
      {writePending ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="tx-overlay-title"
          aria-describedby="tx-overlay-desc"
        >
          <div className="w-full max-w-sm rounded-2xl border border-violet-200/90 bg-white px-6 py-6 shadow-2xl shadow-violet-900/20 ring-1 ring-violet-100">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="tx-overlay-title"
                  className="text-lg font-bold leading-tight text-violet-950"
                >
                  Transaction in progress
                </h2>
                <p
                  id="tx-overlay-desc"
                  className="mt-2 text-sm leading-relaxed text-slate-600"
                >
                  Finish signing and submitting in your wallet. This overlay closes when the
                  request completes or fails.
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Tip: only one write at a time avoids{" "}
                  <code className="rounded bg-slate-100 px-1 font-mono text-[11px] text-slate-800">
                    txBadSeq
                  </code>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {!publicKey ? (
        <div
          className="rounded-3xl border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50/80 p-6 shadow-inner sm:p-8"
          role="region"
          aria-label="Connect wallet"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
                <Wallet className="h-5 w-5 text-violet-600" aria-hidden />
                Connect wallet
              </h2>
              <p className="max-w-xl text-sm text-slate-700 leading-relaxed">
                Opens the Stellar Wallets Kit modal: browser extensions when installed, plus
                WalletConnect when{" "}
                <code className="rounded bg-violet-100 px-1 text-xs">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>{" "}
                is set. Network is Stellar testnet. Reads below still work without a wallet (RPC simulation only).
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => void onConnectWalletFromPage()}
                className={btnAccent}
              >
                <Wallet className="h-4 w-4 shrink-0" aria-hidden />
                Connect wallet
              </button>
              {!walletConnectConfigured ? (
                <p className="max-w-xs text-right text-xs text-slate-500">
                  Optional: set project id in <code className="rounded bg-slate-100 px-1">.env.local</code> to
                  include WalletConnect in the kit list.
                </p>
              ) : null}
            </div>
          </div>
          {connectWalletError ? (
            <p className="mt-4 text-sm text-rose-700">{connectWalletError}</p>
          ) : null}
        </div>
      ) : null}

      {hasExtendedApi === true && hasWideTypesApi === false ? (
        <div
          className="rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          This contract has i32 / string / u64 slots but not the newer{" "}
          <code className="rounded bg-sky-100 px-1">bool</code>,{" "}
          <code className="rounded bg-sky-100 px-1">i64</code>,{" "}
          <code className="rounded bg-sky-100 px-1">Bytes</code>, or{" "}
          <code className="rounded bg-sky-100 px-1">u128</code> storage. Redeploy the current{" "}
          <code className="rounded bg-sky-100 px-1">basic-storage</code> wasm from this repo and update{" "}
          <code className="rounded bg-sky-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code> to enable those reads and writes.
        </div>
      ) : null}

      {hasWideTypesApi === true && hasFullTypesApi === false ? (
        <div
          className="rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950"
          role="status"
        >
          This wasm has the eight wide primitives but not the latest{" "}
          <code className="rounded bg-indigo-100 px-1">Symbol</code>, optional{" "}
          <code className="rounded bg-indigo-100 px-1">Address</code> pointer, or{" "}
          <code className="rounded bg-indigo-100 px-1">i128</code> slots. Redeploy{" "}
          <code className="rounded bg-indigo-100 px-1">basic-storage</code> from this repo and refresh{" "}
          <code className="rounded bg-indigo-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code>.
        </div>
      ) : null}

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

      <div className="grid min-h-0 min-w-0 grid-cols-1 gap-4 md:h-[min(110rem,calc(100dvh-5rem))] md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_minmax(0,2.1fr)] md:gap-4">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-lg shadow-violet-100/50 backdrop-blur-sm">
          <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl">
              Soroban fullstack POC
            </h1>
            <p className="mt-3 leading-relaxed text-slate-600">
              Minimal testnet flow: simulate{" "}
              <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-900">get*</code>, then{" "}
              <strong>connect your wallet</strong> using{" "}
              <strong>Stellar Wallets Kit</strong> (Freighter, xBull, Albedo, LOBSTR, and more on testnet). (
              <code className={SLOT_THEME.u32.docCode}>ValueSet</code>,{" "}
              <code className={SLOT_THEME.i32.docCode}>SignedSet</code>,{" "}
              <code className={SLOT_THEME.tag.docCode}>TagSet</code>,{" "}
              <code className={SLOT_THEME.u64.docCode}>CounterSet</code>,{" "}
              <code className={SLOT_THEME.bool.docCode}>FlagSet</code>,{" "}
              <code className={SLOT_THEME.i64.docCode}>I64Set</code>,{" "}
              <code className={SLOT_THEME.blob.docCode}>BlobSet</code>,{" "}
              <code className={SLOT_THEME.u128.docCode}>WideU128Set</code>,{" "}
              <code className={SLOT_THEME.symbol.docCode}>CodeSet</code>,{" "}
              <code className={SLOT_THEME.pointer.docCode}>PointerSet</code>,{" "}
              <code className={SLOT_THEME.i128.docCode}>WideI128Set</code>
              ). Stored values (this grid, top right) still work without a wallet (RPC simulation only).
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 sm:text-lg">
                <FileCode
                  className="h-5 w-5 shrink-0 text-violet-600 sm:h-6 sm:w-6"
                  aria-hidden
                />
                Contract
              </span>
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
        </div>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-md">
          <div className="shrink-0 border-b border-violet-100/80 p-4 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
                    <Download
                      className="h-5 w-5 shrink-0 text-violet-600"
                      aria-hidden
                    />
                    Get stored values (testnet)
                  </h2>
                  {schemaSlotCount != null ? (
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-900">
                      {schemaSlotCount} type{schemaSlotCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50/80 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      …
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">Refresh after writes or use Refresh read.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  appendLog("info", "Manual refresh: simulating reads…");
                  void refresh();
                }}
                disabled={loadingRead}
                className={`${btnPrimary} w-full shrink-0 sm:mt-0 sm:w-auto`}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loadingRead ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh read
              </button>
            </div>
          </div>
          <ul className="grid min-h-0 flex-1 list-none auto-rows-min grid-cols-1 gap-2 overflow-y-auto p-3 md:grid-cols-3 md:gap-2 md:p-4">
            <li className={SLOT_THEME.u32.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.u32}>
                <p className={SLOT_THEME.u32.readSetTitle}>Value Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.u32.readMetaLabel}>
                    u32 <span className="font-normal">· get()</span>
                  </span>
                  <span className={SLOT_THEME.u32.readMetaValue}>{readDisplay(stored)}</span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.i32.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.i32}>
                <p className={SLOT_THEME.i32.readSetTitle}>Signed Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.i32.readMetaLabel}>
                    i32 <span className="font-normal">· get_signed()</span>
                  </span>
                  <span className={SLOT_THEME.i32.readMetaValue}>{readDisplay(storedSigned)}</span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.tag.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.tag}>
                <p className={SLOT_THEME.tag.readSetTitle}>Tag Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.tag.readMetaLabel}>
                    tag <span className="font-normal">· get_tag()</span>
                  </span>
                  <span className={SLOT_THEME.tag.readMetaValueWide}>
                    {loadingRead ? "…" : storedTag === null ? "—" : storedTag}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.u64.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.u64}>
                <p className={SLOT_THEME.u64.readSetTitle}>Counter Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.u64.readMetaLabel}>
                    u64 <span className="font-normal">· get_counter()</span>
                  </span>
                  <span className={SLOT_THEME.u64.readMetaValue}>{readDisplay(storedCounter)}</span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.bool.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.bool}>
                <p className={SLOT_THEME.bool.readSetTitle}>Flag Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.bool.readMetaLabel}>
                    bool <span className="font-normal">· get_flag()</span>
                  </span>
                  <span className={SLOT_THEME.bool.readMetaValue}>
                    {loadingRead
                      ? "…"
                      : hasWideTypesApi !== true
                        ? "—"
                        : storedFlag === null
                          ? "—"
                          : storedFlag
                            ? "true"
                            : "false"}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.i64.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.i64}>
                <p className={SLOT_THEME.i64.readSetTitle}>I64 Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.i64.readMetaLabel}>
                    i64 <span className="font-normal">· get_i64()</span>
                  </span>
                  <span className={SLOT_THEME.i64.readMetaValue}>
                    {loadingRead ? "…" : hasWideTypesApi !== true ? "—" : readDisplay(storedI64)}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.blob.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.blob}>
                <p className={SLOT_THEME.blob.readSetTitle}>Blob Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.blob.readMetaLabel}>
                    blob b64 <span className="font-normal">· get_blob()</span>
                  </span>
                  <span className={SLOT_THEME.blob.readMetaValueWide}>
                    {loadingRead ? "…" : hasWideTypesApi !== true ? "—" : readDisplay(storedBlobB64)}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.u128.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.u128}>
                <p className={SLOT_THEME.u128.readSetTitle}>Wide U128 Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.u128.readMetaLabel}>
                    u128 <span className="font-normal">· get_u128()</span>
                  </span>
                  <span className={SLOT_THEME.u128.readMetaValue}>
                    {loadingRead ? "…" : hasWideTypesApi !== true ? "—" : readDisplay(storedU128)}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.symbol.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.symbol}>
                <p className={SLOT_THEME.symbol.readSetTitle}>Code Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.symbol.readMetaLabel}>
                    Symbol <span className="font-normal">· get_symbol()</span>
                  </span>
                  <span className={SLOT_THEME.symbol.readMetaValue}>
                    {loadingRead ? "…" : hasFullTypesApi !== true ? "—" : readDisplay(storedSymbol)}
                  </span>
                </div>
                {hasFullTypesApi === true ? (
                  <p className="mt-0.5 text-[9px] leading-tight text-teal-700/95">
                    Default <code className="rounded bg-teal-100/90 px-0.5 py-px font-mono text-[9px] text-teal-900">_</code>{" "}
                    before first set.
                  </p>
                ) : null}
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.pointer.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.pointer}>
                <p className={SLOT_THEME.pointer.readSetTitle}>Pointer Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.pointer.readMetaLabel}>
                    pointer <span className="font-normal">· get_pointer()</span>
                  </span>
                  <span className={SLOT_THEME.pointer.readMetaValueWide}>
                    {loadingRead ? "…" : hasFullTypesApi !== true ? "—" : readDisplay(storedPointer)}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
            <li className={SLOT_THEME.i128.readCard}>
              <ReadGetSlotPulseWrap pulseGen={readSlotPulseGen.i128}>
                <p className={SLOT_THEME.i128.readSetTitle}>Wide I128 Get</p>
                <div className={readGetValueRow}>
                  <span className={SLOT_THEME.i128.readMetaLabel}>
                    i128 <span className="font-normal">· get_i128()</span>
                  </span>
                  <span className={SLOT_THEME.i128.readMetaValue}>
                    {loadingRead ? "…" : hasFullTypesApi !== true ? "—" : readDisplay(storedI128Wide)}
                  </span>
                </div>
              </ReadGetSlotPulseWrap>
            </li>
          </ul>
      </section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white/90 shadow-md">
        <div className="shrink-0 border-b border-violet-100/80 px-4 pb-4 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
                  <PencilLine className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
                  Writes (testnet)
                </h2>
                {schemaSlotCount != null ? (
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-900">
                    {schemaSlotCount} type{schemaSlotCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50/80 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    …
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-snug text-slate-500">
                {walletReady ? (
                  <>
                    Same three-column slot order as Get stored values (read grid above). Submit one write at a time and
                    approve once in your wallet; a second submit while another is in flight often causes{" "}
                    <code className="rounded bg-slate-100 px-1 text-[10px] text-slate-800">txBadSeq</code>.
                  </>
                ) : (
                  <>
                    Connect your wallet above to enable writes. Until then, submit buttons stay disabled.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className={`${btnPrimary} w-full shrink-0 sm:mt-0 sm:w-auto`}
              disabled={writePending}
              onClick={() => {
              setWriteInput(DEMO_WRITE_VALUES.u32);
              setSignedInput(DEMO_WRITE_VALUES.i32);
              setTagInput(DEMO_WRITE_VALUES.tag);
              setCounterInput(DEMO_WRITE_VALUES.u64);
              setFlagInput(DEMO_WRITE_VALUES.flag);
              setI64Input(DEMO_WRITE_VALUES.i64);
              setBlobInput(DEMO_WRITE_VALUES.blob);
              setU128Input(DEMO_WRITE_VALUES.u128);
              setSymbolInput(DEMO_WRITE_VALUES.symbol);
              setPointerInput(DEMO_WRITE_VALUES.pointer);
              setI128WideInput(DEMO_WRITE_VALUES.i128Wide);
              setStatus(null);
              appendLog(
                "info",
                `Filled demo inputs: u32=${DEMO_WRITE_VALUES.u32}, i32=${DEMO_WRITE_VALUES.i32}, tag=${JSON.stringify(DEMO_WRITE_VALUES.tag)}, u64=${DEMO_WRITE_VALUES.u64}, flag=${DEMO_WRITE_VALUES.flag}, i64=${DEMO_WRITE_VALUES.i64}, blob=${JSON.stringify(DEMO_WRITE_VALUES.blob)}, u128=${DEMO_WRITE_VALUES.u128}, symbol=${DEMO_WRITE_VALUES.symbol}, pointer=${DEMO_WRITE_VALUES.pointer}, i128Wide=${DEMO_WRITE_VALUES.i128Wide}`,
              );
            }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Fill demo values
          </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-1 md:px-4 md:pb-4 md:pt-2">
          <div className="grid min-h-0 auto-rows-min grid-cols-1 gap-2 md:grid-cols-3 md:gap-2">
          <form
            onSubmit={(ev) => void onSubmitSet(ev)}
            className={SLOT_THEME.u32.writeForm}
          >
            <p className={SLOT_THEME.u32.writeSetTitle}>Value Set</p>
            <label className={SLOT_THEME.u32.writeLabel}>
              New value (u32)
              <input
                className={SLOT_THEME.u32.writeInput}
                value={writeInput}
                onChange={(ev) => setWriteInput(ev.target.value)}
                inputMode="numeric"
                disabled={writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={writePending || !walletReady}
              className={SLOT_THEME.u32.writeBtn}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitSigned(ev)}
            className={SLOT_THEME.i32.writeForm}
          >
            <p className={SLOT_THEME.i32.writeSetTitle}>Signed Set</p>
            <label className={SLOT_THEME.i32.writeLabel}>
              Signed (i32)
              <input
                className={SLOT_THEME.i32.writeInput}
                value={signedInput}
                onChange={(ev) => setSignedInput(ev.target.value)}
                inputMode="numeric"
                disabled={hasExtendedApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true || writePending || !walletReady}
              className={SLOT_THEME.i32.writeBtn}
            >
              <Binary className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_signed()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitTag(ev)}
            className={SLOT_THEME.tag.writeForm}
          >
            <p className={SLOT_THEME.tag.writeSetTitle}>Tag Set</p>
            <label className={SLOT_THEME.tag.writeLabel}>
              Tag (string)
              <input
                className={SLOT_THEME.tag.writeInput}
                value={tagInput}
                onChange={(ev) => setTagInput(ev.target.value)}
                maxLength={200}
                disabled={hasExtendedApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true || writePending || !walletReady}
              className={SLOT_THEME.tag.writeBtn}
            >
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_tag()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitCounter(ev)}
            className={SLOT_THEME.u64.writeForm}
          >
            <p className={SLOT_THEME.u64.writeSetTitle}>Counter Set</p>
            <label className={SLOT_THEME.u64.writeLabel}>
              Counter (u64)
              <input
                className={SLOT_THEME.u64.writeInput}
                value={counterInput}
                onChange={(ev) => setCounterInput(ev.target.value)}
                inputMode="numeric"
                disabled={hasExtendedApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasExtendedApi !== true || writePending || !walletReady}
              className={SLOT_THEME.u64.writeBtn}
            >
              <ScrollText className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_counter()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitFlag(ev)}
            className={SLOT_THEME.bool.writeForm}
          >
            <p className={SLOT_THEME.bool.writeSetTitle}>Flag Set</p>
            <label className={SLOT_THEME.bool.writeLabel}>
              Flag (bool: true / false / 1 / 0)
              <input
                className={SLOT_THEME.bool.writeInput}
                value={flagInput}
                onChange={(ev) => setFlagInput(ev.target.value)}
                disabled={hasWideTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasWideTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.bool.writeBtn}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_flag()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitI64(ev)}
            className={SLOT_THEME.i64.writeForm}
          >
            <p className={SLOT_THEME.i64.writeSetTitle}>I64 Set</p>
            <label className={SLOT_THEME.i64.writeLabel}>
              Wide signed (i64)
              <input
                className={SLOT_THEME.i64.writeInput}
                value={i64Input}
                onChange={(ev) => setI64Input(ev.target.value)}
                inputMode="numeric"
                disabled={hasWideTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasWideTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.i64.writeBtn}
            >
              <Binary className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_i64()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitBlob(ev)}
            className={SLOT_THEME.blob.writeForm}
          >
            <p className={SLOT_THEME.blob.writeSetTitle}>Blob Set</p>
            <label className={SLOT_THEME.blob.writeLabel}>
              Blob (UTF-8, max 64 bytes)
              <input
                className={SLOT_THEME.blob.writeInputWide}
                value={blobInput}
                onChange={(ev) => setBlobInput(ev.target.value)}
                disabled={hasWideTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasWideTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.blob.writeBtn}
            >
              <FileCode className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_blob()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitU128(ev)}
            className={SLOT_THEME.u128.writeForm}
          >
            <p className={SLOT_THEME.u128.writeSetTitle}>Wide U128 Set</p>
            <label className={SLOT_THEME.u128.writeLabel}>
              Wide unsigned (u128, decimal)
              <input
                className={SLOT_THEME.u128.writeInput}
                value={u128Input}
                onChange={(ev) => setU128Input(ev.target.value)}
                inputMode="numeric"
                disabled={hasWideTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasWideTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.u128.writeBtn}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_u128()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitSymbol(ev)}
            className={SLOT_THEME.symbol.writeForm}
          >
            <p className={SLOT_THEME.symbol.writeSetTitle}>Code Set</p>
            <label className={SLOT_THEME.symbol.writeLabel}>
              Symbol (1–32 chars, ASCII)
              <input
                className={SLOT_THEME.symbol.writeInput}
                value={symbolInput}
                onChange={(ev) => setSymbolInput(ev.target.value)}
                maxLength={32}
                disabled={hasFullTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasFullTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.symbol.writeBtn}
            >
              <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_symbol()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitPointer(ev)}
            className={SLOT_THEME.pointer.writeForm}
          >
            <p className={SLOT_THEME.pointer.writeSetTitle}>Pointer Set</p>
            <label className={SLOT_THEME.pointer.writeLabel}>
              Pointer (G… / C… strkey, empty = clear)
              <input
                className={SLOT_THEME.pointer.writeInputWide}
                value={pointerInput}
                onChange={(ev) => setPointerInput(ev.target.value)}
                placeholder="Empty to clear stored pointer"
                disabled={hasFullTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasFullTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.pointer.writeBtn}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_pointer()
            </button>
          </form>
          <form
            onSubmit={(ev) => void onSubmitI128Wide(ev)}
            className={SLOT_THEME.i128.writeForm}
          >
            <p className={SLOT_THEME.i128.writeSetTitle}>Wide I128 Set</p>
            <label className={SLOT_THEME.i128.writeLabel}>
              Wide signed (i128, decimal)
              <input
                className={SLOT_THEME.i128.writeInput}
                value={i128WideInput}
                onChange={(ev) => setI128WideInput(ev.target.value)}
                inputMode="numeric"
                disabled={hasFullTypesApi !== true || writePending || !walletReady}
              />
            </label>
            <button
              type="submit"
              disabled={hasFullTypesApi !== true || writePending || !walletReady}
              className={SLOT_THEME.i128.writeBtn}
            >
              <Binary className="h-3.5 w-3.5 shrink-0" aria-hidden />
              set_i128()
            </button>
          </form>
          </div>
        </div>
      </section>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-slate-100 shadow-xl">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-950/80 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
            <ScrollText className="h-4 w-4 text-violet-300" aria-hidden />
            Transaction log
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyLogToClipboard()}
              disabled={txLog.length === 0}
              title={txLog.length === 0 ? "Log is empty" : "Copy all lines to clipboard"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-40"
            >
              <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
              Copy log
            </button>
            <button
              type="button"
              onClick={() => setTxLog([])}
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Clear log
            </button>
          </div>
        </div>
        <div
          ref={logPanelRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed sm:px-5 sm:text-sm"
          role="log"
          aria-label="Transaction log"
        >
          {txLog.length === 0 ? (
            <p className="text-slate-400">
              Read and write actions append entries here with timestamps.
            </p>
          ) : (
            txLog.map((line) => (
              <p key={line.id} className="mb-1.5 last:mb-0">
                <span className="tabular-nums text-slate-500">[{line.ts}]</span>{" "}
                <span className={logMessageColor(line.level)}>{line.message}</span>
              </p>
            ))
          )}
        </div>
      </div>
      </div>

      {status ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
