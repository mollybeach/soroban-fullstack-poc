# Immediate POC deliverables — repo map

This document maps stakeholder checklist items to concrete paths, commands, and notes. Scope stays **generic** (no DTCC naming, no production factory logic).

| # | Deliverable | Where / how | Status |
|---|-------------|-------------|--------|
| 1 | Soroban getter/setter contract | `contracts/basic-storage/` — counter, tag, signed value, events | Done |
| 2 | Unit tests (deterministic, `cargo test`) | `contracts/basic-storage/src/test.rs`, `tests/integration_contract.rs` | Done |
| 3 | Coverage % + proof | `make coverage` → HTML `contracts/basic-storage/target/llvm-cov-html/html/`, LCOV, `frontend/public/coverage-summary.json`; `/tests` UI | Done |
| 4 | Fuzz / property | `cargo fuzz` in `contracts/basic-storage/fuzz/`; `proptest` in `src/test.rs`; `make fuzz` | Done |
| 5 | Invariant test | e.g. `invariant_last_write_visible_on_get` in `src/test.rs` | Done |
| 6 | Linter | `make lint` → `cargo clippy -- -D warnings` | Done |
| 7 | Formatter | `make format` / `make fmt` → `cargo fmt` | Done |
| 8 | Makefile / CI-style | `Makefile` targets; GitHub Actions `.github/workflows/ci.yml` (`verify`: `make ci`; `coverage`: `make contract-coverage` + artifacts) | Done |
| 9 | Frontend POC | `frontend/` — Next.js, Stellar SDK, testnet RPC | Done |
| 10 | Wallet (Freighter POC) | Freighter connect + sign in app (e.g. main flow pages) | Done |
| 11 | Transaction lifecycle | Build → sign → send; Soroban `invokeContract` path | Done |
| 12 | Event emission | Contract publishes events on writes (indexing-friendly) | Done |
| 13 | Deployment script | `scripts/deploy-testnet.sh`, `make deploy`, `make stellar-identity` | Done |
| 14 | Collaborate with peers | Process — align on Makefile / contract ABI | Ongoing |
| 15 | Advanced testing concepts | This repo demonstrates fuzz, property, invariant; **mutation / formal** = research (below) | Partial |
| 16 | Tooling evaluation | Clippy, fmt, llvm-cov, cargo-fuzz, proptest — document gaps for org approval | Ongoing |
| 17 | Stay generic / non-DTCC | Naming and logic kept neutral | Done |
| 18–20 | Future Stellar / Factory / Neptune | Out of POC code; architecture learning is external | N/A here |
| 21 | Production-grade expectations | Patterns here are foundational; hardening is follow-on | Direction |

## Commands (repeatable)

From repository root:

| Command | Purpose |
|---------|---------|
| `make test` | Contract unit + integration tests |
| `make coverage` | LLVM coverage HTML + LCOV + `coverage-summary.json` |
| `make lint` | Clippy with warnings denied |
| `make format` | `cargo fmt` |
| `make fuzz` | Short libFuzzer smoke (`cargo-fuzz` required) |
| `make build` | `build-contract` + `build-frontend` |
| `make ci` | Install targets + deps, fmt check, clippy, tests, WASM + Next build |
| `make ci-coverage` | Same as `make ci` plus `make coverage` (needs `cargo-llvm-cov`) |

Frontend test snapshot for `/tests`:

- `make test-all-contract` (alias: `make test-all`) — full `cargo test` + optional libFuzzer smoke; log under `contracts/basic-storage/target/`
- `make sync-tests` (alias: `make export-test-results`) — runs `test-all-contract` then parses the teed log into `frontend/public/test-results.json`

## Research backlog (not automated in CI)

- **Mutation testing** (e.g. `cargo-mutants`) — feasibility vs Soroban/WASM build; needs org sign-off.
- **Formal verification** — Stellar/Soroban ecosystem tools evolving; spike separate from this POC.
- **Differential testing** — compare reference impl vs contract; future if second implementation exists.
- **WalletConnect / institutional wallets** — Freighter proves signing; abstraction can grow later.
- **Firehose / Substreams** — events emitted; pipeline wiring is infrastructure follow-on.

## Dependencies for optional targets

- **Coverage:** `cargo install cargo-llvm-cov` and `rustup component add llvm-tools-preview` (toolchain-dependent).
- **Fuzz:** `cargo install cargo-fuzz` and LLVM dev libs per [cargo-fuzz book](https://rust-fuzz.github.io/book/cargo-fuzz/setup.html).
