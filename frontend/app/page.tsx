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
  writeStoredU32,
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
  const [loadingRead, setLoadingRead] = useState(false);
  const [writeInput, setWriteInput] = useState("0");
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
      const v = await readStoredU32();
      setStored(v);
      appendLog("ok", `get() → stored u32 = ${v}`);
    } catch (e) {
      setStored(null);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      appendLog("error", `get() failed: ${msg}`);
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

  async function onSubmitSet(e: FormEvent) {
    e.preventDefault();
    if (!publicKey) {
      const msg = "Connect Freighter first to submit a write transaction.";
      setStatus(msg);
      appendLog("warn", msg);
      return;
    }
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
      const sent = await writeStoredU32(value, publicKey);
      appendLog(
        "ok",
        `set(${value}) submitted. Contract return value: ${String(sent.result)}`,
      );
      // `refresh()` clears status at start — set success only after read catches up.
      await refresh();
      setStatus(
        `Submitted. Result: ${String(sent.result)}. Stored value above was refreshed.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg);
      appendLog("error", `set(${value}) failed: ${msg}`);
    }
  }

  let contractPreview: string;
  try {
    contractPreview = getConfiguredContractId();
  } catch {
    contractPreview = "(not configured)";
  }

  return (
    <main>
      <h1>Soroban fullstack POC</h1>
      <p>
        Minimal testnet flow: simulate <code>get</code>, submit{" "}
        <code>set</code> via Freighter.
      </p>
      <p>
        <strong>Contract:</strong> <code>{contractPreview}</code>
      </p>
      <p>
        <strong>Stored value (get):</strong>{" "}
        {loadingRead ? "…" : stored === null ? "—" : String(stored)}
      </p>
      <p>
        <button
          type="button"
          onClick={() => {
            appendLog("info", "Manual refresh: simulating get()…");
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
      <form onSubmit={(ev) => void onSubmitSet(ev)}>
        <label>
          New value (u32){" "}
          <input
            value={writeInput}
            onChange={(ev) => setWriteInput(ev.target.value)}
            inputMode="numeric"
          />
        </label>{" "}
        <button type="submit">set() via Freighter</button>
      </form>
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
