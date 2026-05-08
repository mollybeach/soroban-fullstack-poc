# Internal POC plan ↔ this repository

This file maps common **tech POC** workstream items (contract, tests, frontend, indexing, wallets, tooling) to what exists **in this repo** versus what is **documented as a follow-on**. It avoids business-specific naming; align task IDs with your internal tracker as needed.

## Contract and offline development

| Plan theme | In this repo |
|------------|----------------|
| Soroban contract with getter / setter | `contracts/basic-storage/src/lib.rs` — `get`, `set`, persistent storage |
| Events for indexers | `ValueSet` contract event on every successful `set` |
| Deploy to public testnet | `scripts/deploy-testnet.sh`, `make deploy` |

## Testing stack (unit, property, fuzz, invariants)

| Plan theme | In this repo |
|------------|----------------|
| Unit tests (getter / setter / edges) | `contracts/basic-storage/src/test.rs` |
| Property / invariant tests | `proptest` cases in `src/test.rs` |
| LibFuzzer harness | `contracts/basic-storage/fuzz/` — `storage_set_get` |
| Integration-style flow (multi-step client against one contract) | `contracts/basic-storage/tests/integration_contract.rs` |

Formal verification and mutation testing are **not** implemented here; see `README.md` and `STELLAR_LIBRARIES.md` for pointers.

## Static analysis and WASM

| Plan theme | In this repo |
|------------|----------------|
| Lint / static analysis | `make clippy` (`-D warnings`), `make fmt-check` |
| Release wasm | `make build-contract` / `stellar contract build`; `overflow-checks` in `Cargo.toml` |
| Optional coverage report | `make contract-coverage` (requires `cargo install cargo-llvm-cov`) |

## Frontend POC (testnet)

| Plan theme | In this repo |
|------------|----------------|
| FE against contracts on testnet | Next.js app in `frontend/` + `NEXT_PUBLIC_CONTRACT_ID` |
| Wallet signing for writes | Freighter via `@stellar/freighter-api` |
| WalletConnect / custodial wallets | Not wired; documented as production extension in `README.md` |

## Indexing: Firehose / Substreams and the FE

| Plan theme | In this repo |
|------------|----------------|
| Contract emits indexable events | `set` → `ValueSet` |
| FE consuming Substreams-backed data | No Substreams sink in-repo; **recommended shape**: Substreams → store/API → FE reads HTTP/GraphQL **you** own (not The Graph on Stellar). See `README.md` § Indexing |

## Fuzz “categories” (authorization, replay, upgrades, …)

This minimal storage contract does not implement auth, upgrades, or multi-contract state; many checklist categories apply to **richer** contracts. The repo demonstrates **where** fuzz and invariants plug in (`fuzz/`, `proptest`); expand harnesses as the surface area grows.

## Tooling analysis

| Plan theme | In this repo |
|------------|----------------|
| Stellar library list | `docs/STELLAR_LIBRARIES.md` |
| Makefile entrypoints | Root `Makefile` |
