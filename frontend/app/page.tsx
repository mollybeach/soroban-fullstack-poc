"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import {
  readStoredU32,
  writeStoredU32,
  getConfiguredContractId,
} from "@/lib/stellar";

export default function HomePage() {
  const [stored, setStored] = useState<number | null>(null);
  const [loadingRead, setLoadingRead] = useState(false);
  const [writeInput, setWriteInput] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingRead(true);
    setStatus(null);
    try {
      const v = await readStoredU32();
      setStored(v);
    } catch (e) {
      setStored(null);
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingRead(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function connectWallet() {
    setStatus(null);
    const connected = await isConnected();
    if (!connected.isConnected || connected.error) {
      setStatus(
        connected.error?.message ??
          "Freighter not connected. Install the Freighter browser extension.",
      );
      return;
    }
    const access = await requestAccess();
    if (access.error || !access.address) {
      setStatus(access.error?.message ?? "Could not read wallet address");
      return;
    }
    setPublicKey(access.address);
  }

  async function onSubmitSet(e: FormEvent) {
    e.preventDefault();
    if (!publicKey) {
      setStatus("Connect Freighter first to submit a write transaction.");
      return;
    }
    const n = Number(writeInput);
    if (!Number.isFinite(n)) {
      setStatus("Enter a numeric value for set().");
      return;
    }
    setStatus("Signing and submitting…");
    try {
      const sent = await writeStoredU32(Math.trunc(n), publicKey);
      setStatus(`Submitted. Result: ${String(sent.result)}`);
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
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
        <button type="button" onClick={() => void refresh()}>
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
    </main>
  );
}
