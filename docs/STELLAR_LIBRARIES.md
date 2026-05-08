# Stellar / Soroban library and tool reference

Curated list for full-stack and contract work. Versions drift; pin in `package.json` / `Cargo.toml` / installer docs when you lock a release.

## Rust (on-chain Soroban)

| Package / tool | Role |
|----------------|------|
| [`soroban-sdk`](https://crates.io/crates/soroban-sdk) | Contract implementation, storage, auth, events, `testutils` for local `Env` tests |
| `stellar-cli` (`stellar`) | Build, deploy, simulate, invoke contracts; identity and network profiles |
| `cargo` + `rustup` | Build graph; `wasm32v1-none` target for release wasm |
| `cargo fmt` / `cargo clippy` | Formatting and static analysis (deny warnings in CI) |
| `cargo llvm-cov` ([`cargo-llvm-cov`](https://github.com/taiki-e/cargo-llvm-cov)) | Line coverage over `cargo test` (host-side contract tests) |
| `cargo fuzz` + `libfuzzer-sys` | Coverage-guided fuzzing of harnesses that drive the contract in `Env` |
| `proptest` | Property and invariant-style tests inside `cargo test` |

## JavaScript / TypeScript (clients and dapps)

| Package | Role |
|---------|------|
| [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) | Horizon, RPC, Soroban `Client`, transactions, signing hooks |
| [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) | Freighter extension: connect, sign Soroban txs |
| WalletConnect stacks | Broader wallet reach (pair with a Stellar-capable wallet and signing adapter when required) |

## Indexing and data plane

| Component | Role |
|-----------|------|
| [Firehose](https://docs.streamingfast.io/) / [Substreams](https://docs.substreams.dev/) | High-throughput historical + streaming ledger processing |
| Soroban host events / contract events | Decoded from transaction meta for indexers |
| GraphQL indexers (e.g. custom) | Optional; this POC assumes Substreams-style pipelines instead of The Graph for Stellar |

## Operations and security (typical production adds)

| Tool | Role |
|------|------|
| `cargo audit` / `cargo deny` | Dependency vulnerability and license policy |
| Formal methods (e.g. vendor Soroban / Certora flows) | Specification-level guarantees where the stack supports it |
