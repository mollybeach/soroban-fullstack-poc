# Internal POC plan ↔ this repository

This file maps common **tech POC** workstream items (contract, tests, frontend, indexing, wallets, tooling) to what exists **in this repo**, how to **verify** it, and what is **explicitly out of scope** or follow-on. It avoids business-specific naming; align row IDs with your internal tracker (Jira, ADO, etc.) as needed.

**Companion docs**

| Doc | Use when |
|-----|----------|
| [README.md](../README.md) | End-to-end setup, Makefile, deploy, contract API table |
| [STELLAR_LIBRARIES.md](./STELLAR_LIBRARIES.md) | Library choices and future tooling |
| [WalletConnect-Mobile-Success-Log.md](./WalletConnect-Mobile-Success-Log.md) | Verified mobile WC flows (LOBSTR + Freighter) |
| [frontend/docs/ContractTestsDashboard.md](../frontend/docs/ContractTestsDashboard.md) | `/tests` JSON pipeline and success criteria |
| [RecentWork-SorobanPOC-May2026.md](./RecentWork-SorobanPOC-May2026.md) | Recent work summary (if maintained on your branch) |

---

## How to read the status columns

| Status | Meaning |
|--------|---------|
| **Done** | Implemented in-repo; reproducible with documented commands |
| **Partial** | Scaffold, subset, or manual-only verification |
| **Planned** | Documented target; not in this crate yet |
| **N/A** | Not applicable to `basic-storage` (by design) |

---

## 1. Contract and offline development

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| Soroban contract with getter / setter | **Done** | `contracts/basic-storage/src/lib.rs` — primary `get` / `set` on persistent `Value` key | `make contract-test`; home page read/write |
| Extended storage + getters (signed, counter, tag, maps, …) | **Done** | Same file — 16+ entrypoint families for indexer / binding demos | `/bindings`, home **Writes** panel |
| Events for indexers | **Done** | `#[contractevent(data_format = "single-value")]` per family (`ValueSet`, `SignedSet`, `TagSet`, …) | Stellar Expert tx detail after write; see README event table |
| Event payload mirrors args (selected types) | **Done** | NatSpec in `lib.rs` — blob/code/pointer/vec/map/nested/widget parity | Compare invoke args vs event body on explorer |
| Deploy to public testnet | **Done** | `scripts/deploy-testnet.sh`, `make deploy`, `make stellar-identity` | `CONTRACT_ID=C…` printed; `poc-contract-deploy.meta.json` updated |
| Contract spec in repo | **Done** | `frontend/contract-spec/basic-storage-interface.json` | `make contract-interface-json` after `build-contract` |
| TypeScript bindings | **Done** | `make contract-bindings` → `frontend/lib/basic-storage-bindings/` | `/bindings` explorer |
| Auth / upgrade / multi-contract | **N/A** | Intentionally omitted in minimal POC | Future factory / tokenization contracts |

**Notes**

- After any contract change: **`make deploy`** → update **`NEXT_PUBLIC_CONTRACT_ID`** → **`make contract-bindings`** → commit spec if your process requires it.
- Old contract instances on testnet keep their old ABI/events forever; demos must use the **current** `C…` id in env.

---

## 2. Testing stack (unit, property, fuzz, invariants, integration)

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| Unit tests (getter / setter / edges) | **Done** | `contracts/basic-storage/src/test.rs` | `make contract-test` |
| Deterministic property sweep (0..100) | **Done** | `property_set_get_roundtrip_for_many_values` | `/tests` → Property; `test-results.json` |
| Randomized property (Proptest) | **Done** | `fuzz_set_get_random_u32` | `/tests/proptest` |
| Invariant (last-write wins per slot) | **Done** | `invariant_*` on primary, signed, counter | `/tests/invariant` |
| Cross-slot isolation invariants | **Done** | `invariant_primary_unchanged_under_signed_only_writes`, etc. | Same |
| Integration binary (multi-step client) | **Done** | `contracts/basic-storage/tests/integration_contract.rs` | `make contract-integration` |
| LibFuzzer harness | **Done** | `contracts/basic-storage/fuzz/fuzz_targets/storage_set_get.rs` | `make contract-fuzz-smoke` (optional; needs `cargo-fuzz` + nightly on macOS) |
| Tests dashboard + export | **Done** | `frontend/app/tests/page.tsx`, `scripts/export-test-results.mjs`, `public/test-results.json` | `make sync-tests`; reload `/tests` |
| Formal verification | **Planned** | Pointers in README / STELLAR_LIBRARIES | Vendor / Soroban-specific flows |
| Mutation testing | **Planned** | Not in repo | Research item |

**Evidence snapshot (committed JSON)**

- `test-results.json`: **16 passed**, **0 failed** (14 library + 2 integration) when last exported.
- `coverage-summary.json`: ~**98%** lines, ~**89%** functions on instrumented crate (branch summary often empty in JSON — see dashboard copy).

**What tests do *not* prove**

- Full security of a production tokenization platform.
- Wallet or RPC correctness (covered by manual WC log + FE QA).
- Every future factory contract surface (only `basic-storage` today).

---

## 3. Static analysis, formatting, and WASM

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| `rustfmt` | **Done** | `make fmt`, `make fmt-check` | CI / `make check` |
| Clippy deny warnings | **Done** | `make clippy` (`-D warnings`) | `make check` |
| Release wasm / overflow checks | **Done** | `stellar contract build`; `[profile.release] overflow-checks = true` in `Cargo.toml` | `make build-contract`, `make deploy` |
| LLVM coverage (host) | **Done** | `make contract-coverage` / `make coverage` | HTML under `target/llvm-cov-html/html/`; `/tests` coverage card |
| `cargo audit` / `cargo deny` | **Planned** | Listed in STELLAR_LIBRARIES | Optional CI add-on |

---

## 4. Frontend POC (testnet reads, writes, wallets)

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| Next.js App Router UI | **Done** | `frontend/app/` | `make dev-frontend` → `http://localhost:3000` |
| Soroban RPC reads | **Done** | `frontend/lib/stellar.ts` | Home **Reads** after `NEXT_PUBLIC_CONTRACT_ID` set |
| Soroban writes (simulate + submit) | **Done** | Same | Connect wallet → write panel → explorer link |
| Contract id configuration | **Done** | `NEXT_PUBLIC_CONTRACT_ID`, `.env.example` | Mismatch shows clear UI state |
| Deploy metadata on home | **Done** | `frontend/contract-spec/poc-contract-deploy.meta.json` | “Deployed …” when id matches env |
| Demo value presets | **Done** | `frontend/app/page.tsx` — rotating presets | **Fill demo values** button |
| In-app technical docs | **Done** | `frontend/app/docs/page.tsx` | `/docs` |
| Interface / bindings explorer | **Done** | `frontend/app/bindings/` | `/bindings` |
| Tests dashboard | **Done** | `frontend/app/tests/` | `/tests` and section deep links |
| Browser extension wallets (Freighter, etc.) | **Done** | `@creit-tech/stellar-wallets-kit` | Connect on desktop |
| **WalletConnect (mobile)** | **Done** | Stellar Wallets Kit + `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (Reown) | [WalletConnect-Mobile-Success-Log.md](./WalletConnect-Mobile-Success-Log.md); `/tests/mobilewallet` |
| Screen recording fallback | **Partial** | `frontend/app/demo/page.tsx`, `public/demo/recording.mp4` | Add video asset for offline demo |
| Substreams-backed historical reads in FE | **Planned** | Architecture in README § Indexing | No sink in-repo |

**Environment (frontend)**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONTRACT_ID` | Target `C…` on testnet |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown / WalletConnect project id |
| (optional) RPC overrides | If added in `stellar.ts` — check `.env.example` |

---

## 5. Indexing: events, Firehose / Substreams, and the FE

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| Structured contract events | **Done** | All successful mutating calls publish `*Set` events (see README table) | Explorer “raised event” on tx |
| Multiple event shapes (indexer QA) | **Done** | Distinct event structs per API family | Indexer prototype can subscribe per topic |
| FE reads ledger directly (no subgraph) | **Done** | Soroban RPC via stellar-sdk | No The Graph on Stellar |
| Substreams module in-repo | **Planned** | README describes **Substreams → your API → FE** | Build pipeline separately |
| Firehose consumer | **Planned** | Same | Same |

**Recommended production shape (documented, not coded here)**

```text
Soroban contract events
    → Substreams (or Firehose) module
    → Your database / API
    → Frontend historical views + ops dashboards
```

The POC home page proves **write + event emission**; a separate workstream proves **ingestion at scale**.

---

## 6. Fuzz categories (auth, replay, upgrades, economic, …)

This crate is **storage-only** with **no authorization**, **no upgrade hook**, and **no cross-contract calls**. Many enterprise fuzz checklists still apply to **future** contracts; this repo shows **where hooks live today**.

| Category | Status | Where demonstrated | Expand when |
|----------|--------|-------------------|-------------|
| Storage round-trip | **Done** | Unit + property + `fuzz/storage_set_get` | — |
| Last-write semantics | **Done** | Invariants + integration | — |
| Cross-slot isolation | **Done** | Invariants in `test.rs` | Multi-key factory items |
| Random input stress | **Done** | Proptest + libFuzzer | — |
| Authorization bypass | **N/A** | — | Factory / RBAC contracts |
| Replay / ordering | **N/A** | — | Multi-tx workflows |
| Upgrade safety | **N/A** | — | Admin migration contracts |
| Economic / fee griefing | **Partial** | Manual testnet fees in WC log | Load testing |

---

## 7. Tooling, CI, and operator entrypoints

| Plan theme | Status | In this repo | How to verify |
|------------|--------|--------------|---------------|
| Makefile orchestration | **Done** | Root `Makefile` | `make help` |
| One-shot CI gate | **Done** | `make ci`, `make ci-coverage` | Clean clone |
| Test export for stakeholders | **Done** | `make sync-tests` | `frontend/public/test-results.json` |
| Deploy + identity scripts | **Done** | `scripts/deploy-testnet.sh`, `setup-testnet-identity.sh` | `make deploy` |
| Stellar library survey | **Done** | `docs/STELLAR_LIBRARIES.md` | Reference |
| macOS file-access helper (DemoForge etc.) | **Partial** | `make macos-contract-source-help` | Optional dev convenience |

---

## 8. Suggested demo order (internal review / Stellar)

1. **`/tests`** — 16 green, coverage, invariant story (2 min).
2. **Home** — connect wallet (extension or WC), **Fill demo values**, one write, Stellar Expert link (3 min).
3. **`/bindings`** — contract interface alignment (1 min).
4. **WalletConnect mobile** — follow [WalletConnect-Mobile-Success-Log.md](./WalletConnect-Mobile-Success-Log.md) or `/tests/mobilewallet` (5 min if live).

---

## 9. Gap list (honest “not in this repo yet”)

- Substreams / Firehose sink and FE historical API.
- Formal verification and mutation testing on Soroban.
- Factory / attestation / tokenization **business** contracts (may live in a separate `factorycontracts` tree in your org).
- Production CI on every PR (Makefile supports it; wire in your pipeline).
- Mainnet deployment and custody integrations.

---

*Last updated: align with README and WalletConnect log when you add tests, wallets, or contract entrypoints.*
