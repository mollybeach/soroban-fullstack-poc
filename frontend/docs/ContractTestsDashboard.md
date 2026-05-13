# Contract tests dashboard (`/tests`) — behavior, data, and how we judge success

This document explains the Next.js route implemented in [`app/tests/page.tsx`](../app/tests/page.tsx): what it displays, where the numbers come from, how that relates to the Soroban `basic-storage` contract tests, and why the current setup counts as a successful POC for **visibility** and **multi-layer verification**, not as a substitute for a full security program.

## What the page is

The `/tests` page is a **read-only dashboard**. It does not run `cargo test` in the browser. On load it:

1. Fetches [`public/test-results.json`](../public/test-results.json) with `cache: "no-store"` so a reload after `make sync-tests` shows fresh results.
2. Optionally fetches [`public/coverage-summary.json`](../public/coverage-summary.json) for LLVM line/function (and branch when present) totals plus a per-file table.

If `test-results.json` is missing or the fetch fails, the UI keeps working by applying an in-code **`FALLBACK`** payload (same shape as the real file: 16 passed, 0 failed, two suites, empty per-test rows). The page then shows an amber **note** explaining that placeholders are shown and naming the Make targets that regenerate the JSON.

So **success of the UI** is: it never hard-crashes; it degrades gracefully; it explains how to refresh data.

## How results get onto disk (the honest pipeline)

End-to-end, “green dashboard” means three different layers can succeed independently:

| Layer | Mechanism | What “success” means |
|-------|-----------|----------------------|
| **Rust tests** | `make test-all-contract` (alias `make test-all`) runs `cargo test` in `contracts/basic-storage`, tees output to `contracts/basic-storage/target/.last-full-test.log`, records exit code | Exit code 0: all library and integration tests passed. |
| **Optional libFuzzer smoke** | Same Makefile target, after `cargo test`, may run `cargo +nightly fuzz run storage_set_get …` if `cargo-fuzz` and nightly exist | Failure prints a warning but does **not** fail the Make target; `cargo test` remains the hard gate. |
| **JSON export** | `make sync-tests` runs `test-all-contract` then `node scripts/export-test-results.mjs` with env vars pointing at the saved log so tests are **not** run twice | Writes `frontend/public/test-results.json` matching schema version 2, including per-test rows and human `detail` strings. |

Coverage is separate: `make coverage` (alias for contract LLVM coverage) runs `cargo llvm-cov`, then `scripts/export-coverage-summary.mjs` to write `frontend/public/coverage-summary.json`. The tests page does not require coverage to mark cargo tests green.

The export script [`scripts/export-test-results.mjs`](../../scripts/export-test-results.mjs) is the **source of truth** for category copy and for the long-form descriptions of each named test (`TEST_DETAILS` map). The React page’s `DEFAULT_CATEGORIES` and `FALLBACK` are aligned with that script but can drift if only one side is edited.

## What is being tested (contract scope)

Everything on the dashboard today refers to **`contracts/basic-storage`**: a small Soroban contract used to demonstrate **several test styles** in one crate:

- **Unit tests** (`src/test.rs`): isolated `Env`, deterministic `set`/`get`, boundaries (`u32::MAX`), auxiliary slots (`set_signed`, `set_counter`, `set_tag` / `get_tag`), and sequential overwrite semantics.
- **Deterministic property sweep**: a loop over many values (0..100) asserting `set` then `get` agreement without randomness.
- **Proptest** (`fuzz_set_get_random_u32`): many random `u32` values per run; shrinking on failure.
- **Invariant tests** (still `cargo test`, using Proptest): last-write wins on the primary slot, the same for signed and counter slots, and **cross-slot isolation** (writes confined to one slot must not disturb another).
- **Integration tests** (`tests/integration_contract.rs`): separate binary, multi-step sequences and fixed sequences mirroring “last write wins” expectations.

**libFuzzer** appears on the page under “external runs”: it is documented with path, Make target, and example CLI, but the export script’s note states it is **not** executed by the export pipeline. Byte-level fuzzing is an additional harness in `contracts/basic-storage/fuzz/`; treating it as “external” avoids conflating `cargo test` counts with fuzz iteration counts.

## How successful the tests have been (evidence from committed artifacts)

The checked-in `test-results.json` (snapshot dated **2026-05-08** in this repo) reports:

- **`success`: true** — aggregate gate used by the badge (“All green” vs “Failures”).
- **Summary: 16 passed, 0 failed, 0 ignored** — every `cargo test` case that the exporter maps into JSON passed on that run.
- **Library suite**: 14 passed, `ok: true`, including 6 unit-style rows, 1 property sweep, 1 Proptest random row, 5 invariant rows, and a short sanitized **tail** of the real `cargo test` output (proof the parser saw a successful run).
- **Integration suite**: 2 passed, `ok: true`, with both integration cases documented in the per-test table.

That is a **clean, repeatable** outcome for this POC: the contract behaves consistently with its stated invariants on the exercised paths, and the integration binary agrees with the library tests on sequencing semantics.

The checked-in `coverage-summary.json` from the same period shows **~98% line** and **~89% function** coverage on the instrumented crate (with **branch** totals empty in the summary JSON, which the UI explains is common for Rust/`cargo-llvm-cov` aggregates). The page tells readers to use the HTML report from `make coverage` for line-level drill-down when branch percentages are not meaningful in the JSON.

### What this success does *not* imply

- It does **not** prove absence of bugs in uninstrumented paths, in the Soroban host, or in production deployment configs.
- **libFuzzer** success is environment-dependent; the dashboard lists it but does not assert its last run in JSON.
- The **detail** text for each test is **curated** in `export-test-results.mjs`; new Rust tests do not automatically get rich descriptions until someone adds a `TEST_DETAILS` entry (or extends the exporter).

## Why the page is structured this way (design rationale)

1. **Demos and stakeholders** — A static JSON file in `public/` is trivial to serve in dev and preview; no server-side secret or CI token is required to view results after a local or CI `make sync-tests`.
2. **Single gate, no double test** — Make pipes `cargo test` once, then the Node script parses the log. That keeps CI time predictable and avoids “tests passed in CI but export used stale log” if you only use the documented targets.
3. **Separation of concerns** — `cargo test` proves functional correctness; **LLVM coverage** proves instrumentation reach; **fuzz** is called out separately so people do not confuse randomized harness iterations with counted Rust test cases.
4. **Schema version 2** — Per-test rows (`tests` array on each suite) let the UI show badges by **kind** (unit, integration, property, proptest_random, invariant). Older exports without rows still render suite totals but show a dashed hint to re-run `make sync-tests`.

## Operational checklist

| Goal | Command |
|------|---------|
| Refresh dashboard JSON after changing Rust tests | `make sync-tests` from repo root, then reload `/tests` |
| Run tests only (no JSON) | `make test-all-contract` or `make test-all` |
| Refresh coverage card | `make coverage`, then reload `/tests` |
| Full CI-style gate (per root Makefile) | `make ci` or `make ci-coverage` |

## Related files

| File | Role |
|------|------|
| [`app/tests/page.tsx`](../app/tests/page.tsx) | Client UI, types, `FALLBACK`, fetch + normalization |
| [`public/test-results.json`](../public/test-results.json) | Machine-readable last run (committed or generated) |
| [`public/coverage-summary.json`](../public/coverage-summary.json) | LLVM coverage summary for the page |
| [`../../scripts/export-test-results.mjs`](../../scripts/export-test-results.mjs) | Parses cargo output, writes JSON, owns `TEST_DETAILS` |
| [`../../scripts/export-coverage-summary.mjs`](../../scripts/export-coverage-summary.mjs) | Reduces LLVM JSON for the frontend |
| [`../../contracts/basic-storage/src/test.rs`](../../contracts/basic-storage/src/test.rs) | Library tests and property/invariant tests |
| [`../../contracts/basic-storage/tests/integration_contract.rs`](../../contracts/basic-storage/tests/integration_contract.rs) | Integration binary tests |
| [`../../Makefile`](../../Makefile) | `test-all-contract`, `sync-tests`, `coverage` |

If you extend the contract with new tests, update the export script’s mappings (and optionally the page’s `FALLBACK` totals) so the dashboard remains an accurate narrative of what ran and what it was meant to prove.

For a **meeting-ready spoken script** (what you did, learned, and how successful the testing was), see [MeetingScriptContractTestsDashboard.md](./MeetingScriptContractTestsDashboard.md).
