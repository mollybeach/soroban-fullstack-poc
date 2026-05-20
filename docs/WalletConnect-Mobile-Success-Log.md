# WalletConnect mobile — successful connection & writes log

This document records a **verified end-to-end WalletConnect pairing** and **signed Soroban writes** from **Freighter mobile** to the **Soroban Fullstack POC** on **Stellar testnet**.

**Live app:** [soroban-fullstack-poc.vercel.app](https://soroban-fullstack-poc.vercel.app)  
**Network:** `stellar:testnet` via Stellar Wallets Kit + Reown WalletConnect.

---

## Connected wallet

| Field | Value |
|--------|--------|
| **Public key** | `GBOE2WOJGWZATO2PXEBF7R74T5QOE7XFGNL55I4AIWEESWNC347YYNRI` |
| **Wallet app** | Freighter (mobile) |
| **Connection** | WalletConnect — scan QR from desktop modal |
| **dApp** | Soroban Fullstack POC / `soroban-fullstack-poc.vercel.app` |
| **Contract (explorer filter)** | `CBGX…6O2R` — full **C…** id on [Stellar Expert contract page](https://stellar.expert/explorer/testnet/contract) when you click the contract chip in the UI |

**Account (testnet):**  
https://stellar.expert/explorer/testnet/account/GBOE2WOJGWZATO2PXEBF7R74T5QOE7XFGNL55I4AIWEESWNC347YYNRI

---

## How to get the transaction link (Stellar Expert)

On the screen with **Filters → `CBGX…6O2R`** and the table **Transaction | Date**:

1. **Click the transaction row** itself — the line that says  
   `GBOE…YNRI invoked contract CBGX…6O2R set(42 u32)`  
   (or the **date** on the right, e.g. `2026-05-20 15:00:38 UTC`).
2. Stellar Expert opens the **transaction detail** page.
3. **Copy the URL** from the browser address bar. It will look like:

   ```text
   https://stellar.expert/explorer/testnet/tx/<64-character-hex-hash>
   ```

4. That URL is your **transaction link** for docs, PRs, or Teams.

**Other ways to get the same link:**

| Where | Action |
|--------|--------|
| **Account page** | Open your `G…` account → **Transactions** → click the row → copy URL |
| **Contract page** | Open the **C…** contract → activity list → click the invoke row → copy URL |
| **Home app log** | After a write, copy hash from the POC **Transaction log** if shown, then open `https://stellar.expert/explorer/testnet/tx/<hash>` |
| **Horizon (API)** | `https://horizon-testnet.stellar.org/transactions/<hash>` (same hash, different UI) |

The **filter chip** (`CBGX…6O2R`) only narrows the list; it is **not** the transaction link. You need one click into a **specific transaction**.

---

## Transaction log (verified writes)

| # | Date (UTC) | Method | Tx hash | Transaction link | Result |
|---|------------|--------|---------|------------------|--------|
| 1 | 2026-05-20 15:00:03 | `set(0 u32)` | `2833e7300a51d2ec713b0e411fa6f2854537b8161d0afaab53fe007e109eac2f` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/2833e7300a51d2ec713b0e411fa6f2854537b8161d0afaab53fe007e109eac2f) · [Horizon](https://horizon-testnet.stellar.org/transactions/2833e7300a51d2ec713b0e411fa6f2854537b8161d0afaab53fe007e109eac2f) | Success — `Value` → 0, `ValueSet` event |
| 2 | 2026-05-20 15:00:38 | `set(42 u32)` | `a9a96caf69334fb937b4ce144d03a0996749d896a4acdd7b95b32eaf8c82f29b` | [Stellar Expert](https://stellar.expert/explorer/testnet/tx/a9a96caf69334fb937b4ce144d03a0996749d896a4acdd7b95b32eaf8c82f29b) · [Horizon](https://horizon-testnet.stellar.org/transactions/a9a96caf69334fb937b4ce144d03a0996749d896a4acdd7b95b32eaf8c82f29b) | Success — `Value` → 42, `ValueSet` event |

### On-chain detail (`set(42 u32)` — tx #2)

From Stellar Expert transaction view (matches your paste):

```text
Invoked contract CBGX…6O2R set(42 u32)
Contract CBGX…6O2R raised event ["value_set" sym] with data 42 u32
Contract CBGX…6O2R updated persistent data ["Value" sym] = 42 u32
```

Fee summary (from explorer): refundable 411, non-refundable 6,715 stroops; 1 emitted event (84B).

---

## Screenshots

### WalletConnect pairing

#### Scan QR (Freighter mobile)

![Scan WalletConnect QR](../frontend/public/scanningwalletconnectonphone.jpg)

Web: `/scanningwalletconnectonphone.jpg`

#### Connection success

![Connection success](../frontend/public/successfulSorobanfullstackpocconnectiononphone.jpg)

Web: `/successfulSorobanfullstackpocconnectiononphone.jpg`

### Mobile sign flow (`set()` write)

#### Confirm transaction (Test Net, fee ~0.006 XLM)

![Confirm set() on mobile](../frontend/public/mobilescreenshotyoucanseetransactionset()withmobilewallet.PNG)

Web: `/mobilescreenshotyoucanseetransactionset()withmobilewallet.PNG`

#### Transaction successfully signed

![Signed on mobile](../frontend/public/transactionsuccessfullysignmobiledwallet.PNG)

Web: `/transactionsuccessfullysignmobiledwallet.PNG`

### Desktop block explorer (contract interactions)

![Stellar Expert — GBOE…YNRI invoked set() on contract CBGX…6O2R](../frontend/public/blockexploererondesktopyoucanseethatthemobilewallettransactionyaddressucessfullyinvolkedset()ontheblockexploreryoucanseethistranasctioncontractinteraction.png)

Web: `/blockexploererondesktopyoucanseethatthemobilewallettransactionyaddressucessfullyinvolkedset()ontheblockexploreryoucanseethistranasctioncontractinteraction.png`

---

## Checklist

| Step | Status |
|------|--------|
| WalletConnect QR scan inside Freighter | ✅ |
| dApp connected on phone | ✅ |
| Mobile confirm `set()` on testnet | ✅ |
| Mobile “Transaction successfully signed!” | ✅ |
| Explorer shows `GBOE…YNRI` → `set(0)` and `set(42)` on contract | ✅ |
| Transaction links captured in table above | ✅ |

---

## App transaction log (optional paste)

```text
<!-- Paste lines from the POC home Transaction log after future writes -->

```

---

## Related docs

- In-app: `/docs` → **WalletConnect mobile (verified)**  
- `docs/Meeting-Talking-Points-May-19-2026.md`  
- `docs/RecentWork-SorobanPOC-May2026.md`  
- `README.md`

---

*Last updated: 2026-05-20 — connection + `set(0)` / `set(42)` writes verified on testnet.*
