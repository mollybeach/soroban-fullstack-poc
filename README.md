# Soroban Fullstack POC

A lightweight end-to-end Soroban smart contract proof-of-concept built with Rust, Soroban SDK, React, and Stellar testnet tooling.

This repository is intended to validate the foundational development lifecycle for production-grade Soroban smart contract systems, including:

- Soroban smart contract development
- Rust-based unit testing
- Property-style / fuzz-style testing
- Static analysis and formatting
- Deployment to Stellar testnet
- Frontend wallet and contract interaction
- Event emission for indexing pipelines
- Foundation for observability and security tooling

The project intentionally avoids business-specific logic and focuses purely on validating the technical stack and SDLC workflow. It is suitable as a **reference implementation** for teams building tokenization or factory-style platforms on Stellar: contract patterns, test depth, deploy scripts, wallet integration, and indexer-friendly events are all exercised in one place.

### Documentation map

| Document | Audience | Contents |
|----------|----------|----------|
| [POC workstream ↔ repo](docs/POC_WORKSTREAM_TRACKING.md) | PM / tech lead | What is **Done / Partial / Planned** per workstream, verify commands, demo order |
| [WalletConnect mobile success log](docs/WalletConnect-Mobile-Success-Log.md) | QA / Stellar review | Verified LOBSTR + Freighter WC flows, tx hashes, screenshots, troubleshooting |
| [Contract tests dashboard](frontend/docs/ContractTestsDashboard.md) | Engineering | `/tests` JSON pipeline, 16-test evidence, coverage |
| [Stellar / Soroban libraries](docs/STELLAR_LIBRARIES.md) | Architecture | Library survey and future tooling |
| In-app `/docs` | Operators | How the POC app, wallets, and env vars work |

**Live deployment (example):** [soroban-fullstack-poc.vercel.app](https://soroban-fullstack-poc.vercel.app) — requires `NEXT_PUBLIC_CONTRACT_ID` and WalletConnect project id on the host.

---

# Goals

This POC validates:

- Rust + Soroban contract development workflow
- Local testing and deterministic execution
- Contract deployment to Stellar testnet
- Frontend integration using Stellar SDKs
- Read/write transaction flow
- Event generation for indexing systems
- Foundation for future monitoring, observability, and auditing integrations

---

# Tech Stack

## Smart Contracts

- Rust
- Soroban SDK
- Stellar CLI
- Cargo
- wasm32 target

## Frontend

- Next.js (App Router)
- React
- TypeScript
- `@stellar/stellar-sdk` (JavaScript Stellar SDK, including Soroban RPC)

## Testing & Tooling

- cargo test
- cargo fmt
- cargo clippy
- GNU Make (`Makefile` at repo root)
- property-style tests
- fuzz/invariant testing foundation

## Wallets (current vs future)

- **Implemented:** `@creit-tech/stellar-wallets-kit` — browser extensions **and** **WalletConnect** (Reown) for mobile **Freighter** and **LOBSTR** on testnet. See [docs/WalletConnect-Mobile-Success-Log.md](docs/WalletConnect-Mobile-Success-Log.md).
- **Future:** custody integrations, additional institutional signers, wallet abstraction behind your tokenization API.

## Future extensions

- Firehose / Substreams indexing sink and FE historical API
- OpenZeppelin-style monitoring
- Formal verification / Certora-style analysis (research)
- Production CI on every PR (Makefile targets exist; wire in your pipeline)
- Richer multi-contract “factory” logic (may live in a separate Solidity/Rust repo in your org)

---

# Repository structure

```txt
soroban-fullstack-poc/
│
├── docs/
│   ├── POC_WORKSTREAM_TRACKING.md    # Plan ↔ repo status (deep map)
│   ├── WalletConnect-Mobile-Success-Log.md
│   └── STELLAR_LIBRARIES.md
│
├── contracts/basic-storage/
│   ├── src/lib.rs                    # Contract + events
│   ├── src/test.rs                   # Unit, proptest, invariants
│   ├── tests/integration_contract.rs
│   └── fuzz/                         # libFuzzer harness
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Home: reads, writes, wallet, logs
│   │   ├── tests/                    # Test results dashboard
│   │   ├── bindings/                 # Interface explorer
│   │   ├── docs/                     # In-app documentation
│   │   └── demo/                     # Optional screen recording
│   ├── lib/stellar.ts                # Soroban RPC + tx builders
│   ├── contract-spec/                # Interface JSON + deploy meta
│   ├── public/
│   │   ├── test-results.json         # Exported cargo test (make sync-tests)
│   │   └── coverage-summary.json     # LLVM summary (make coverage)
│   └── components/                   # Header, WalletConnect QA, etc.
│
├── scripts/
│   ├── deploy-testnet.sh
│   ├── export-test-results.mjs
│   └── setup-testnet-identity.sh
│
├── Makefile                          # Single entrypoint for CI, deploy, tests
└── README.md
```

---

# Application routes (frontend)

| Route | Purpose |
|-------|---------|
| `/` | Connect wallet, read all getters, submit writes, transaction log, demo presets |
| `/tests` | Contract test + coverage dashboard (`make sync-tests`) |
| `/tests/unit`, `/tests/integration`, `/tests/proptest`, `/tests/invariant`, `/tests/libfuzzer`, `/tests/coverage`, `/tests/mobilewallet` | Deep-link to a section |
| `/bindings` | Soroban interface JSON / generated bindings explorer |
| `/docs` | Operator-facing explanation of contract, wallets, env |
| `/demo` | Plays `public/demo/recording.mp4` when you need a video-only demo |

`npm run dev` runs **Next.js development mode** (`next dev`): hot reload, verbose errors, default [http://localhost:3000](http://localhost:3000). Production-like behavior: `npm run build` then `npm run start`.

---

# Smart Contract

The Soroban contract exposes small storage setters and getters for **indexer demos** (multiple event shapes on testnet):

| API | Event emitted (single-value `contractevent`) |
|-----|-----------------------------------------------|
| `set(u32)` / `get()` | `ValueSet { value }` |
| `set_signed(i32)` / `get_signed()` | `SignedSet { v }` |
| `set_tag(String)` / `get_tag()` | `TagSet { label }` |
| `set_counter(u64)` / `get_counter()` | `CounterSet { n }` |
| `set_flag(bool)` / `get_flag()` | `FlagSet { on }` |
| `set_i64(i64)` / `get_i64()` | `I64Set { v }` |
| `set_blob(Bytes)` / `get_blob()` | `BlobSet { data }` (same bytes as input, max 64) |
| `set_u128(u128)` / `get_u128()` | `WideU128Set { v }` |
| `set_symbol(String)` / `get_symbol()` | `CodeSet { label }` (same string as input) |
| `set_pointer(Option<Address>)` / `get_pointer()` | `PointerSet { who }` (same option as input) |
| `set_i128(i128)` / `get_i128()` | `WideI128Set { v }` |
| `set_vec_u32(Vec<u32>)` / `get_vec_u32()` | `VecU32Set { items }` (same vec as input) |
| `set_scores(Map<String,u32>)` / `get_scores()` | `ScoresSet { scores }` (same map as input) |
| `set_plain_addr(Address)` / `get_plain_addr()` | `PlainAddrSet { who }` (same address as input) |
| `set_nested(OuterBits)` / `get_nested()` | `NestedSet { outer }` (same struct as input) |
| `set_widget(DemoWidget)` / `get_widget()` | `WidgetSet { w }` (same enum as input) |

**Event payload parity:** for **`BlobSet`**, **`CodeSet`**, **`PointerSet`**, **`VecU32Set`**, **`ScoresSet`**, **`PlainAddrSet`**, **`NestedSet`**, and **`WidgetSet`**, the event body mirrors the **function argument** so listeners can test **invocation == event** the same way you often do on EVM. `BlobSet` is still capped at **64 bytes** so event + storage stay bounded.

After changing the contract (entrypoints, events, or storage layout), **redeploy** wasm, set **`NEXT_PUBLIC_CONTRACT_ID`** to the **new** id, and run **`make contract-bindings`** so the checked-in **`frontend/contract-spec/basic-storage-interface.json`** and **`/bindings`** UI match the wasm you ship. Older contract instances keep their old event shapes forever.

Example (`ValueSet` — same pattern for the other structs):

```rust
#[contractevent(data_format = "single-value")]
#[derive(Clone)]
pub struct ValueSet {
    pub value: u32,
}

// In `set`:
ValueSet { value }.publish(&env);
```

This allows future testing with:

- Firehose
- Substreams
- Ledger-style indexing systems
- Event streaming pipelines

---

# Local Development

## Prerequisites

Install:

- Rust
- Cargo
- Stellar CLI
- Node.js
- pnpm or npm
- GNU Make (optional; wraps the commands below)

---

# Makefile

From the **repository root**, run `make` or `make help` to list targets.

| Target | Command run (summary) |
|--------|------------------------|
| `make help` | Print all targets and short descriptions |
| `make install` | `rustup target add wasm32v1-none` and `npm ci` in `frontend/` |
| `make install-rust-target` | Add the `wasm32v1-none` Rust target for Soroban wasm builds |
| `make install-frontend` | `npm ci` in `frontend/` (clean install from `package-lock.json`) |
| `make fmt` | `cargo fmt` in `contracts/basic-storage/` |
| `make fmt-check` | `cargo fmt -- --check` in `contracts/basic-storage/` |
| `make contract-test` | `cargo test` in `contracts/basic-storage/` (unit + `tests/integration_contract.rs` + proptest/fuzz-style cases) |
| `make contract-integration` | `cargo test --test integration_contract` only |
| `make test-all-contract` / `make test-all` | Run every contract-side test type: full `cargo test` (tee to `contracts/basic-storage/target/.last-full-test.log`) plus libFuzzer smoke when `cargo-fuzz` is installed |
| `make sync-tests` / `make export-test-results` | Runs **`make test-all-contract`**, then parses that log into `frontend/public/test-results.json` for **`/tests`** (avoids a second `cargo test`; also `npm run export-test-results` / `npm run sync-tests` in `frontend/` still run `cargo test` if you invoke the script alone) |
| `make contract-coverage` | `cargo llvm-cov test` (HTML under `target/llvm-cov-html/html/`), then `report --text` (summary in terminal) and `report --lcov` → `target/llvm-cov.lcov` (requires `cargo install cargo-llvm-cov`; first run may install `llvm-tools-preview` via rustup) |
| `make contract-fuzz-smoke` | Short `cargo fuzz run storage_set_get` in `contracts/basic-storage/fuzz` (requires `cargo install cargo-fuzz`) |
| `make clippy` | `cargo clippy --all-targets -- -D warnings` in `contracts/basic-storage/` |
| `make build-contract` | `stellar contract build` when the Stellar CLI is on your `PATH`; otherwise `cargo build --target wasm32v1-none --release` in `contracts/basic-storage/` (install the CLI for deploy and for the official packaged build) |
| `make contract-interface-json` | After `build-contract`, runs `stellar contract info interface --wasm …/basic_storage.wasm --output json-formatted` and writes **`frontend/contract-spec/basic-storage-interface.json`**, plus **`frontend/contract-spec/basic-storage-interface.meta.json`** (`generatedAt` for the **Interface** page) |
| `make contract-bindings` | Runs **`make contract-interface-json`**, then `stellar contract bindings typescript` into **`frontend/lib/basic-storage-bindings/`** (regenerate spec + TS client) |
| `make build-frontend` | `npm run build` in `frontend/`; runs `npm ci` first if `react/cjs` is missing (fixes incomplete installs) |
| `make check` | `fmt-check`, `clippy`, `contract-test`, `build-contract`, `build-frontend` (expects `frontend/node_modules` already) |
| `make ci` | `install-rust-target`, `install-frontend`, then the same steps as `make check` (use from a clean clone) |
| `make clean` | Remove `contracts/basic-storage/target/` and `frontend/.next/`, `out/`, `dist/` |
| `make clean-frontend` | Remove `frontend/node_modules/` (then run `make install-frontend` or `make build-frontend`) |
| `make stellar-identity` | `./scripts/setup-testnet-identity.sh` — create and fund **`soroban-poc-deployer`** on testnet if missing (`NAME=` to pick another alias) |
| `make deploy` | `./scripts/deploy-testnet.sh` — defaults to identity **`soroban-poc-deployer`**; optional `SOURCE_ACCOUNT=` or env **`STELLAR_SOURCE_ACCOUNT`** |
| `make dev-frontend` | `npm run dev` in `frontend/` |

The **`/tests`** Next.js route reads `frontend/public/test-results.json` (and optional `coverage-summary.json`). For how that pipeline works, what the numbers mean, and how success is interpreted, see [frontend/docs/ContractTestsDashboard.md](frontend/docs/ContractTestsDashboard.md).

Typical first-time setup and verification:

```bash
make ci
```

Day-to-day after dependencies are installed:

```bash
make check
```

---

# Install Rust Target

```bash
rustup target add wasm32v1-none
```

---

# Run Smart Contract Tests

```bash
cd contracts/basic-storage

cargo test
```

---

# Formatting

```bash
cargo fmt
```

---

# Static Analysis

```bash
cargo clippy --all-targets -- -D warnings
```

---

# Build Contract

From the contract crate directory:

```bash
cd contracts/basic-storage
stellar contract build
```

Recent **Stellar CLI** releases (for example **v26+**) require **`overflow-checks = true`** under **`[profile.release]`** in the contract `Cargo.toml`; this repo sets that so `stellar contract build` and **`make deploy`** succeed.

**WASM / size:** Release wasm comes from `stellar contract build` (or `cargo build --target wasm32v1-none --release`). For production hardening, follow current Stellar docs on wasm size and cost (optimization flags, avoiding unnecessary deps in the contract crate).

## Contract interface JSON (CLI)

To dump the formatted Soroban contract interface spec for the built wasm (functions, events, UDTs) without regenerating TypeScript bindings:

```bash
# From repo root (path matches make build-contract / stellar contract build output)
stellar contract info interface \
  --wasm contracts/basic-storage/target/wasm32v1-none/release/basic_storage.wasm \
  --output json-formatted
```

Pipe or redirect to a file as needed, or run **`make contract-interface-json`** to write **`frontend/contract-spec/basic-storage-interface.json`** and **`basic-storage-interface.meta.json`** (timestamp for `/bindings`) after `build-contract`. For the full spec plus generated client, use **`make contract-bindings`**.

---

# Deploy to Stellar Testnet

You must have the **[Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)** installed. Deploy calls `stellar contract build` and `stellar contract deploy` (not plain Cargo)

## Source account (identity)

Deploy needs a **funded testnet identity** in the Stellar CLI. This repo defaults to the identity name **`soroban-poc-deployer`**.

**First time only** — create that identity and fund it via friendbot:

```bash
make stellar-identity
```

Equivalent: `./scripts/setup-testnet-identity.sh` (optional name: `./scripts/setup-testnet-identity.sh my-alias` or `make stellar-identity NAME=my-alias`).

Use another identity: `make deploy SOURCE_ACCOUNT=my-alias`, or set **`STELLAR_SOURCE_ACCOUNT`** before calling `./scripts/deploy-testnet.sh`.

## Run deploy

From the repository root:

```bash
make deploy
```

Or `./scripts/deploy-testnet.sh` (first argument is the source identity name if not using the default).

The root **`Makefile`** prepends common install locations to **`PATH`** so **`make deploy`** usually finds Homebrew’s **`stellar`** even when bare **`make`** would not.

## After deploy (env + bindings)

1. Copy the line the script prints: **`CONTRACT_ID=C…`**.
2. Set **`NEXT_PUBLIC_CONTRACT_ID`** in **`frontend/.env.local`** (local dev) and in **Vercel** (or whatever hosts the Next app) so reads/writes hit the new instance.
3. If you changed Rust since the last check-in, run **`make contract-bindings`** from the repo root and commit the updated **`frontend/contract-spec/basic-storage-interface.json`** (and generated **`frontend/lib/basic-storage-bindings/`** if you version that tree). The **Interface** page (`/bindings`) always reflects that checked-in spec, not an arbitrary on-chain id.
4. The deploy script writes **`frontend/contract-spec/poc-contract-deploy.meta.json`** (`contractId` + **`deployedAt`** in UTC). The **home** page shows **Deployed …** when that `contractId` matches **`NEXT_PUBLIC_CONTRACT_ID`**.

---

# Frontend

The frontend is intentionally lightweight and integration-focused.

Goals:

- Connect to Stellar testnet
- Configure deployed contract address
- Read contract state
- Submit write transactions
- Validate SDK and wallet interaction flow
- **`/demo`** page for an optional screen recording (`public/demo/recording.mp4`)

---

# Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Set `NEXT_PUBLIC_CONTRACT_ID` in `frontend/.env.local` (see `frontend/.env.example`). For **WalletConnect** inside Stellar Wallets Kit, set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [Reown Cloud](https://dashboard.reown.com/) and add your dev origin (e.g. `http://localhost:3000`) to the project’s allowed domains.

**Tests dashboard deep links:** `/tests/{section}` scrolls to each test type — e.g. [`/tests/unit`](https://soroban-fullstack-poc.vercel.app/tests/unit), [`/tests/integration`](https://soroban-fullstack-poc.vercel.app/tests/integration), [`/tests/proptest`](https://soroban-fullstack-poc.vercel.app/tests/proptest), [`/tests/invariant`](https://soroban-fullstack-poc.vercel.app/tests/invariant), [`/tests/libfuzzer`](https://soroban-fullstack-poc.vercel.app/tests/libfuzzer), [`/tests/coverage`](https://soroban-fullstack-poc.vercel.app/tests/coverage), [`/tests/mobilewallet`](https://soroban-fullstack-poc.vercel.app/tests/mobilewallet) (WalletConnect mobile QA). See cards on [`/tests`](https://soroban-fullstack-poc.vercel.app/tests) for the full list.

If `next build` fails with **`Cannot find module './cjs/react.production.js'`**, your `node_modules` tree is incomplete. From the repo root run **`make install-frontend`** or **`make build-frontend`** (the Makefile refreshes deps when that file is missing), or remove modules with **`make clean-frontend`** and install again.

---

# Testing Strategy

## Unit Tests

Validate:

- setter/getter correctness
- deterministic state updates
- storage behavior

See `contracts/basic-storage/src/test.rs`.

## Integration-Style Tests

Multi-step flows in a single Soroban `Env` live in `contracts/basic-storage/tests/integration_contract.rs` (separate test binary; run with `make contract-integration` or full `make contract-test`).

## Property-Style Tests

Validate repeated state transitions across multiple values.

Example:

```rust
for value in 0u32..100u32 {
    client.set(&value);
    assert_eq!(client.get(), value);
}
```

## Fuzz and invariants

- **Property / fuzz-style:** `proptest` in `src/test.rs` (`fuzz_set_get_random_u32`, `invariant_last_write_visible_on_get`).
- **LibFuzzer harness:** `contracts/basic-storage/fuzz/` — run `make contract-fuzz-smoke` after `cargo install cargo-fuzz`.

## Coverage

Host-side coverage over `cargo test` (including contract logic exercised in tests):

```bash
make contract-coverage
```

Requires **`cargo install cargo-llvm-cov`**. Open the printed `index.html` for line coverage (what is *not* red is exercised under the current test suite).

## Static analysis

- **`make clippy`** — deny warnings on all targets.
- **`make fmt-check`** — formatting gate.

Optional dependency policy tools (`cargo audit`, `cargo deny`) are listed in [docs/STELLAR_LIBRARIES.md](docs/STELLAR_LIBRARIES.md).

## Future Security Testing

Further extensions (not in this minimal crate) include:

- mutation testing
- formal verification (vendor / Soroban-specific flows)
- richer fuzz targets for auth, upgrade, and cross-contract bugs as the surface grows

---

# Observability & Monitoring

Future integrations may include:

- OpenZeppelin Monitor
- Hypernative
- structured event indexing
- transaction monitoring
- contract alerting

---

# Indexing & Data Pipeline

This repository is structured to support future indexing experimentation with:

- Firehose
- Substreams
- Ledger-style indexing systems
- event streaming architectures

The contract emits structured events specifically to support this future work.

**Frontend + Substreams (no The Graph on Stellar):** this POC app talks **directly** to Soroban RPC for reads/writes. A typical production layout is **Substreams (or Firehose) → your database or API → frontend**, so the browser consumes **your** indexed view of ledger data and events instead of a hosted Graph subgraph. Point the indexing listener at that middle layer, then optionally add FE reads against the same API for historical event rows.

---

# Wallet & SDK integrations

| Layer | Package / doc | Role |
|-------|----------------|------|
| RPC + transactions | `@stellar/stellar-sdk` | Simulate and submit Soroban invocations; read ledger state |
| Connect + sign UI | `@creit-tech/stellar-wallets-kit` | Extension wallets and **WalletConnect** (mobile) |
| WC project | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown Cloud — allowed origins must include your dev and Vercel URLs |
| Evidence | [WalletConnect-Mobile-Success-Log.md](docs/WalletConnect-Mobile-Success-Log.md) | LOBSTR + Freighter verified on testnet with tx links |

**Operator reminders**

1. Mobile wallets must be on **testnet** and the `G…` address must be **funded on testnet** (Friendbot).
2. Scan WalletConnect QR from **inside** Freighter or LOBSTR, not only the phone Camera app.
3. “Connected” means the kit returned an address — always confirm a **write** and an explorer tx hash for demos.

Future: custody, additional custodial signers, and wallet abstraction behind a tokenization service API.

---

# Security Mindset

This repository is designed with a security-first mindset:

- deterministic testing
- clean modular code
- static analysis
- strong typing
- reproducible builds
- event visibility
- observability hooks

The goal is to establish a strong development foundation before introducing production business logic.

---

# Future Expansion

Potential future areas:

- ERC20-equivalent Soroban contracts
- role registries
- permissioning systems
- compliance modules
- tokenization primitives
- frontend orchestration flows
- production CI/CD
- multi-contract deployment systems

---

# Recommended demo flow (5–10 minutes)

1. **`make sync-tests`** (before the meeting) → open **`/tests`** — show **16 passed**, invariants, optional coverage %.
2. **Home** — set or confirm contract id → **Connect** (extension or WalletConnect QR) → **Fill demo values** → one write → open Stellar Expert link from log.
3. **`/bindings`** — show interface matches deployed wasm.
4. **Optional:** **`/tests/mobilewallet`** or [WalletConnect log](docs/WalletConnect-Mobile-Success-Log.md) for mobile evidence without live WC.

---

# Status

Current phase (this repo):

| Area | State |
|------|--------|
| Contract + events | Implemented (`basic-storage`) |
| Test depth (unit, property, invariant, integration, fuzz hook) | Implemented; dashboard export |
| Static analysis + wasm build | Makefile / CI targets |
| Testnet deploy | Scripted (`make deploy`) |
| Frontend reads/writes | Implemented |
| WalletConnect mobile (LOBSTR, Freighter) | Verified — see WC log |
| Substreams / Firehose consumer | Documented architecture only |

---

## POC validation checklist

- [ ] Soroban contract builds locally (`make build-contract`)
- [ ] Unit tests pass (`make contract-test`)
- [ ] Integration tests pass (`tests/integration_contract.rs`)
- [ ] Property / proptest / invariant paths green (`make sync-tests` → `/tests`)
- [ ] Optional: coverage reviewed (`make contract-coverage` → `/tests` coverage card)
- [ ] `make fmt-check` and `make clippy` clean
- [ ] Contract deploys to testnet (`make deploy`)
- [ ] `NEXT_PUBLIC_CONTRACT_ID` set locally and on Vercel
- [ ] Frontend reads contract state (home **Reads**)
- [ ] Frontend submits write (extension or WalletConnect mobile)
- [ ] Explorer shows invoke + event (e.g. `ValueSet`)
- [ ] Optional: WalletConnect mobile re-check per [WC log](docs/WalletConnect-Mobile-Success-Log.md)
