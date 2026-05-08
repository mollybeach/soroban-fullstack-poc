"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import {
  readStoredU32,
  readSigned,
  readTag,
  readCounter,
  writeStoredU32,
  writeSigned,
  writeTag,
  writeCounter,
  getConfiguredContractId,
} from "@/lib/stellar";

type LogLevel = "info" | "warn" | "ok" | "error";

type LogLine = {
  id: number;
  ts: string;
  level: LogLevel;
  message: string;
};

export default function HomePage() {
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
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [txLog, setTxLog] = useState<LogLine[]>([]);
  const logIdRef = useRef(0);
  const logPanelRef = useRef<HTMLDivElement>(null);

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

  const refresh = useCallback(async () => {
    setLoadingRead(true);
    setStatus(null);
    try {
      const [v, s, t, c] = await Promise.all([
        readStoredU32(),
        readSigned(),
        readTag(),
        readCounter(),
      ]);
      setStored(v);
      setStoredSigned(s);
      setStoredTag(t);
      setStoredCounter(c.toString());
      appendLog(
        "ok",
        `reads → u32=${v}, i32=${s}, tag=${JSON.stringify(t)}, u64=${c.toString()}`,
      );
    } catch (e) {
      setStored(null);
      setStoredSigned(null);
      setStoredTag(null);
      setStoredCounter(null);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      appendLog("error", `read failed: ${msg}`);
      appendLog(
        "warn",
        "If the contract predates set_signed/set_tag/set_counter, redeploy wasm and update NEXT_PUBLIC_CONTRACT_ID.",
      );
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

  async function connectWallet() {
    setStatus(null);
    appendLog("info", "Connect Freighter: checking extension…");
    const connected = await isConnected();
    if (!connected.isConnected || connected.error) {
      const msg =
        connected.error?.message ??
        "Freighter not connected. Install the Freighter browser extension.";
      setStatus(msg);
      appendLog("error", msg);
      return;
    }
    const access = await requestAccess();
    if (access.error || !access.address) {
      const msg = access.error?.message ?? "Could not read wallet address";
      setStatus(msg);
      appendLog("error", msg);
      return;
    }
    setPublicKey(access.address);
    appendLog("ok", `Wallet connected: ${access.address}`);
  }

  async function requireWallet(): Promise<string | null> {
    if (!publicKey) {
      const msg = "Connect Freighter first to submit a write transaction.";
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

  const readDisplay = (v: string | number | null) =>
    loadingRead ? "…" : v === null ? "—" : String(v);

  return (
    <main>
      <h1>Soroban fullstack POC</h1>
      <p>
        Minimal testnet flow: simulate <code>get*</code>, submit writes via
        Freighter. Each write emits a contract event (
        <code>ValueSet</code>, <code>SignedSet</code>, <code>TagSet</code>,{" "}
        <code>CounterSet</code>).
      </p>
      <p>
        <strong>Contract:</strong> <code>{contractPreview}</code>
      </p>
      <p>
        <strong>Stored u32 (get):</strong> {readDisplay(stored)}
        <br />
        <strong>Stored i32 (get_signed):</strong> {readDisplay(storedSigned)}
        <br />
        <strong>Stored tag (get_tag):</strong>{" "}
        {loadingRead ? "…" : storedTag === null ? "—" : storedTag}
        <br />
        <strong>Stored u64 (get_counter):</strong>{" "}
        {readDisplay(storedCounter)}
      </p>
      <p>
        <button
          type="button"
          onClick={() => {
            appendLog("info", "Manual refresh: simulating reads…");
            void refresh();
          }}
        >
          Refresh read
        </button>
      </p>
      <hr />
      <p>
        <button type="button" onClick={() => void connectWallet()}>
          Connect Freighter
        </button>
        {publicKey ? (
          <span style={{ marginLeft: "0.75rem", fontSize: "0.85rem" }}>
            <code>
              {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
            </code>
          </span>
        ) : null}
      </p>

      <section className="write-section">
        <h2 className="write-section-title">Writes (testnet)</h2>
        <form onSubmit={(ev) => void onSubmitSet(ev)} className="write-form">
          <label>
            New value (u32){" "}
            <input
              value={writeInput}
              onChange={(ev) => setWriteInput(ev.target.value)}
              inputMode="numeric"
            />
          </label>{" "}
          <button type="submit">set() — ValueSet</button>
        </form>
        <form
          onSubmit={(ev) => void onSubmitSigned(ev)}
          className="write-form"
        >
          <label>
            Signed (i32){" "}
            <input
              value={signedInput}
              onChange={(ev) => setSignedInput(ev.target.value)}
              inputMode="numeric"
            />
          </label>{" "}
          <button type="submit">set_signed() — SignedSet</button>
        </form>
        <form onSubmit={(ev) => void onSubmitTag(ev)} className="write-form">
          <label>
            Tag (string){" "}
            <input
              value={tagInput}
              onChange={(ev) => setTagInput(ev.target.value)}
              maxLength={200}
              style={{ maxWidth: "16rem" }}
            />
          </label>{" "}
          <button type="submit">set_tag() — TagSet</button>
        </form>
        <form
          onSubmit={(ev) => void onSubmitCounter(ev)}
          className="write-form"
        >
          <label>
            Counter (u64){" "}
            <input
              value={counterInput}
              onChange={(ev) => setCounterInput(ev.target.value)}
              inputMode="numeric"
            />
          </label>{" "}
          <button type="submit">set_counter() — CounterSet</button>
        </form>
      </section>

      {status ? (
        <p role="status" style={{ color: "#b45309" }}>
          {status}
        </p>
      ) : null}

      <div className="tx-log">
        <h2>Transaction log</h2>
        <div className="tx-log-toolbar">
          <button type="button" onClick={() => setTxLog([])}>
            Clear log
          </button>
        </div>
        <div
          ref={logPanelRef}
          className="tx-log-panel"
          role="log"
          aria-label="Transaction log"
        >
          {txLog.length === 0 ? (
            <p className="tx-log-empty">
              Read and write actions append entries here with timestamps.
            </p>
          ) : (
            txLog.map((line) => (
              <p
                key={line.id}
                className={`tx-log-line tx-log-line--${line.level}`}
              >
                [{line.ts}] {line.message}
              </p>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
