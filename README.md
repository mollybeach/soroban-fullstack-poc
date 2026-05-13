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

The project intentionally avoids business-specific logic and focuses purely on validating the technical stack and SDLC workflow.

**Extra docs:** [POC deliverables checklist ↔ repo](docs/POC_DELIVERABLES.md) · [Stellar / Soroban libraries](docs/STELLAR_LIBRARIES.md) · [POC workstream ↔ repo map](docs/POC_WORKSTREAM_TRACKING.md).

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

## Future Extensions

- Firehose/Substreams indexing
- OpenZeppelin monitoring
- Certora analysis
- Runtime verification
- Wallet integrations
- CI/CD pipelines

---

# Repository Structure

```txt
soroban-fullstack-poc/
│
├── docs/
│   ├── STELLAR_LIBRARIES.md
│   └── POC_WORKSTREAM_TRACKING.md
│
├── contracts/
│   └── basic-storage/
│       ├── Cargo.toml
│       ├── fuzz/
│       ├── tests/
│       │   └── integration_contract.rs
│       └── src/
│           ├── lib.rs
│           └── test.rs
│
├── frontend/
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── demo/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── SiteHeader.tsx
│   ├── public/demo/
│   └── lib/
│       └── stellar.ts
│
├── scripts/
│   ├── deploy-testnet.sh
│   └── setup-testnet-identity.sh
│
├── Makefile
└── README.md
```

---

# Smart Contract

The Soroban contract exposes small storage setters and getters for **indexer demos** (multiple event shapes on testnet):

| API | Event emitted (single-value `contractevent`) |
|-----|-----------------------------------------------|
| `set(u32)` / `get()` | `ValueSet { value }` |
| `set_signed(i32)` / `get_signed()` | `SignedSet { v }` |
| `set_tag(String)` / `get_tag()` | `TagSet { label }` |
| `set_counter(u64)` / `get_counter()` | `CounterSet { n }` |

After changing the contract, **redeploy** wasm and set **`NEXT_PUBLIC_CONTRACT_ID`** again; older deployments will not expose the new entrypoints.

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

---

# Deploy to Stellar Testnet

You must have the **[Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)** installed. Deploy calls `stellar contract build` and `stellar contract deploy` (not plain Cargo).

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

Set `NEXT_PUBLIC_CONTRACT_ID` in `frontend/.env.local` (see `frontend/.env.example`). For **WalletConnect** (Reown / mobile wallets), also set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [Reown Cloud](https://dashboard.reown.com/).

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

# Wallet & SDK Integrations

Current focus:

- `@stellar/stellar-sdk` (Soroban RPC and transactions)
- `@stellar/freighter-api` for browser signing on testnet

Future exploration:

- **WalletConnect** (and other wallets) once a Stellar-capable signer is chosen for your stack
- Blockdaemon wallet support
- institutional custody integrations
- wallet abstraction layers

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

# Status

Current phase:

- foundational SDLC validation
- tooling evaluation
- frontend integration validation
- deployment workflow validation
- indexing/event pipeline validation

---

## POC Validation Checklist

- [ ] Soroban contract builds locally
- [ ] Unit tests pass
- [ ] Integration tests pass (`tests/integration_contract.rs`)
- [ ] Property-style / proptest and fuzz harness paths exercised (`make contract-test`; optional `make contract-fuzz-smoke`)
- [ ] Optional: coverage report reviewed (`make contract-coverage`)
- [ ] Formatting enforced with cargo fmt
- [ ] Linting enforced with cargo clippy
- [ ] Contract deploys to Stellar testnet
- [ ] Contract can be invoked from CLI
- [ ] React frontend can read contract state
- [ ] React frontend can submit write transaction
- [ ] Contract emits event usable for Firehose/Substreams indexing
