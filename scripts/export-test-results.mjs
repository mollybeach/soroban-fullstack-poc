#!/usr/bin/env node
/**
 * Writes frontend/public/test-results.json for /tests by parsing `cargo test` output.
 *
 * By default runs `cargo test 2>&1` in contracts/basic-storage. When Make runs
 * `make sync-tests`, it sets CONTRACT_TEST_LOG_PATH (+ optional CONTRACT_TEST_LOG_EXIT)
 * to reuse the log from `make test-all-contract` so tests are not executed twice.
 *
 * Usage (repo root): node scripts/export-test-results.mjs
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function sanitizeTail(text) {
  const lines = text.split("\n").slice(-5);
  return lines
    .join("\n")
    .replace(/\/var\/folders\/[^)\s]+\//g, "…/")
    .trim();
}

const repoRoot = join(__dirname, "..");
const contractDir = join(repoRoot, "contracts", "basic-storage");
const FRONTEND_DIR = join(repoRoot, "frontend");
const outPath = join(FRONTEND_DIR, "public", "test-results.json");
const envLocalPath = join(FRONTEND_DIR, ".env.local");

/** `NEXT_PUBLIC_CONTRACT_ID` from `frontend/.env.local` when present (for /tests context). */
function readNextPublicContractIdFromEnvLocal() {
  if (!existsSync(envLocalPath)) return null;
  const text = readFileSync(envLocalPath, "utf8");
  const m = text.match(/^\s*NEXT_PUBLIC_CONTRACT_ID\s*=\s*(\S+)/m);
  if (!m) return null;
  const id = m[1].trim().replace(/^["']|["']$/g, "");
  return id.length > 0 ? id : null;
}

/** Human-readable detail per test (key = full cargo test name, e.g. test::foo or integration_bar). */
const TEST_DETAILS = {
  "test::get_returns_zero_before_first_set":
    "Fresh contract: `get()` returns 0 before any `set` (default storage).",
  "test::set_then_get_roundtrip_known_value":
    "Writes 42 via `set`, reads back with `get` — basic round-trip.",
  "test::set_max_u32_get_roundtrip":
    "Boundary: stores and reads `u32::MAX` through the primary slot.",
  "test::sequential_sets_overwrite_previous_value":
    "Two writes in order; final `get` matches the last written value.",
  "test::set_signed_get_roundtrip":
    "Signed i32 path: `set_signed` / `get_signed` round-trip (−17).",
  "test::set_tag_get_roundtrip":
    "String storage + events path: `set_tag` / `get_tag` with Soroban `String`.",
  "test::set_counter_get_roundtrip":
    "u64 counter path: `set_counter` / `get_counter`.",
  "test::property_set_get_roundtrip_for_many_values":
    "Deterministic sweep: for each value in 0..100, `set` then `get` must match (property-style, fixed cases).",
  "test::fuzz_set_get_random_u32":
    "Proptest: 256 random `u32` values; each case `set`/`get` must agree (randomized property).",
  "test::invariant_last_write_visible_on_get":
    "Invariant: after a non-empty sequence of random `set`s, `get()` equals the last written value (Proptest, vec length 1–39).",
  "test::invariant_signed_last_write_visible_on_get_signed":
    "Invariant: random `i32` sequence via `set_signed`; `get_signed()` always equals the last written signed value (Proptest).",
  "test::invariant_counter_last_write_visible_on_get_counter":
    "Invariant: random `u64` sequence via `set_counter`; `get_counter()` always equals the last counter write (Proptest).",
  "test::invariant_primary_unchanged_under_signed_only_writes":
    "Cross-slot: fix primary with `set(anchor)`, then only `set_signed` updates; `get()` stays `anchor` while `get_signed()` follows last-write wins (Proptest).",
  "test::invariant_signed_unchanged_under_primary_only_writes":
    "Cross-slot: fix signed with `set_signed(anchor)`, then only `set` on primary; `get_signed()` stays `anchor` while `get()` follows last-write wins (Proptest).",
  "integration_alternating_writes_read_as_last_value":
    "Integration binary: alternating `set` steps; `get` always reflects the latest write.",
  "integration_sequence_matches_property_last_write_wins":
    "Integration binary: fixed sequence [7,14,21,42]; after each step `get` equals the value just set.",
  "integration_multi_slot_roundtrip_and_isolation":
    "Integration: writes u32, i32, bool, i64, u128, i128, Bytes, Symbol, Option<Address>, Vec<u32>, Map, plain Address, nested struct, enum; reads all back; then checks u32 update does not clobber i32 / i128.",
  "test::set_flag_get_roundtrip": "`set_flag` / `get_flag` round-trip.",
  "test::set_i64_get_roundtrip": "`set_i64` / `get_i64` round-trip.",
  "test::set_blob_get_roundtrip": "`set_blob` / `get_blob` with short `Bytes` payload.",
  "test::set_u128_get_roundtrip": "`set_u128` / `get_u128` wide integer round-trip.",
  "test::set_symbol_get_roundtrip": "`set_symbol(String)` / `get_symbol` as `Symbol` round-trip.",
  "test::set_pointer_get_roundtrip": "`set_pointer(Option<Address>)` / `get_pointer` (Some + None paths).",
  "test::set_i128_get_roundtrip": "`set_i128` / `get_i128` including min/max-style values.",
  "test::set_vec_u32_get_roundtrip":
    "`set_vec_u32` / `get_vec_u32` with a short `Vec<u32>` (Soroban collection round-trip).",
  "test::set_scores_get_roundtrip":
    "`set_scores` / `get_scores` with a small `Map<String, u32>` (string keys + u32 values).",
  "test::set_plain_addr_get_roundtrip":
    "Non-optional `Address`: default burned strkey before set; `set_plain_addr` / `get_plain_addr` with the contract id.",
  "test::set_nested_get_roundtrip":
    "Nested `#[contracttype]` struct: `OuterBits` with `InnerBits` + `stamp` via `set_nested` / `get_nested`.",
  "test::set_widget_get_roundtrip":
    "User `#[contracttype]` enum: `DemoWidget` Off / On / Pair arms via `set_widget` / `get_widget`.",
  "test::invariant_flag_last_write_visible_on_get_flag":
    "Proptest: random bool sequence on `set_flag`; `get_flag` equals last write.",
  "test::invariant_i64_last_write_visible":
    "Proptest: random `i64` sequence; `get_i64` equals last write.",
  "test::invariant_u128_last_write_visible":
    "Proptest: random `u128` sequence; `get_u128` equals last write.",
  "test::invariant_i128_last_write_visible":
    "Proptest: random `i128` sequence; `get_i128` equals last write.",
  "test::invariant_blob_last_write_visible":
    "Proptest: bounded random `Bytes` chunks; `get_blob` equals last write.",
  "test::invariant_symbol_last_write_visible":
    "Proptest: ASCII label sequence via `set_symbol`; `get_symbol` matches last `Symbol`.",
  "test::invariant_pointer_optional_last_write_matches_sequence":
    "Proptest: alternating Some/None `set_pointer`; final `get_pointer` matches last op.",
  "test::invariant_primary_unchanged_under_u128_only_writes":
    "Cross-slot: anchor `u32`, then only `set_u128`; primary unchanged, u128 last-write wins.",
  "test::invariant_i128_wide_unchanged_under_flag_only_writes":
    "Cross-slot: anchor `i128`, then only `set_flag`; wide int unchanged, flag last-write wins.",
};

const CATEGORIES = [
  {
    id: "unit",
    title: "Unit tests",
    tool: "cargo test --lib",
    description:
      "Isolated Soroban `Env` per test; exercises getters/setters and edge values without randomness.",
  },
  {
    id: "integration",
    title: "Integration tests",
    tool: "cargo test --test integration_contract",
    description:
      "Separate test crate binary; longer multi-step flows against the same contract client pattern.",
  },
  {
    id: "property",
    title: "Deterministic property sweep",
    tool: "cargo test (embedded loop)",
    description:
      "Structured many-case check (here: 0..100) proving set/get agreement without a random seed.",
  },
  {
    id: "proptest_random",
    title: "Randomized property (Proptest)",
    tool: "cargo test + proptest",
    description:
      "Random `u32` inputs each run; shrinks on failure. Demonstrates property-style testing on Soroban.",
  },
  {
    id: "invariant",
    title: "Invariant tests",
    tool: "cargo test + proptest",
    description:
      "State consistency: last-write wins per slot, plus cross-slot isolation (writes to one key must not clobber another).",
  },
  {
    id: "libfuzzer",
    title: "libFuzzer (cargo-fuzz)",
    tool: "cargo fuzz run storage_set_get",
    description:
      "Byte-oriented fuzzing of `set`/`get` in a dedicated harness — not part of `cargo test`. Run `make fuzz` for a smoke run.",
  },
  {
    id: "llvm_coverage",
    title: "LLVM coverage",
    tool: "cargo llvm-cov",
    description:
      "Line/function instrumentation and HTML/LCOV reports. Shown on this page when `coverage-summary.json` is present.",
  },
  {
    id: "frontend_wallet",
    title: "Frontend wallet (Vitest)",
    tool: "vitest run",
    description:
      "Stellar Wallets Kit + WalletConnect config: env gating, module catalog (all default wallets), and QR/Reown options. Does not connect real wallets.",
  },
];

/** Human-readable rows for Vitest cases on /tests (key = fullName). */
const FRONTEND_TEST_DETAILS = {
  "catalog includes albedo (Albedo)":
    "POC catalog matches Stellar Wallets Kit `defaultModules()` entry for Albedo.",
  "catalog includes freighter (Freighter)": "Catalog includes Freighter (SEP-43 extension).",
  "catalog includes fordefi (Fordefi)": "Catalog includes Fordefi module id.",
  "catalog includes rabet (Rabet)": "Catalog includes Rabet module id.",
  "catalog includes xbull (xBull)": "Catalog includes xBull module id.",
  "catalog includes lobstr (LOBSTR)": "Catalog includes LOBSTR module id.",
  "catalog includes hana (Hana Wallet)": "Catalog includes Hana Wallet module id.",
  "catalog includes klever (Klever Wallet)": "Catalog includes Klever Wallet module id.",
  "catalog includes onekey (OneKey Wallet)": "Catalog includes OneKey Wallet module id.",
  "catalog includes bitget (Bitget Wallet)": "Catalog includes Bitget Wallet module id.",
  "catalog includes cactuslink (Cactus Link)": "Catalog includes Cactus Link module id.",
  "lists every wallet from defaultModules() (11 extension/hot wallets)":
    "Ensures the POC catalog tracks all 11 wallets shipped in `defaultModules()` for kit v2.2.x.",
  "uses unique product ids across the full picker list":
    "No duplicate module ids when WalletConnect is enabled.",
  "omits wallet_connect when project id is missing":
    "`resolvePocWalletPickerIds` excludes WalletConnect without `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.",
  "appends wallet_connect when project id is set":
    "WalletConnect appears last in the picker when a Reown project id is configured.",
  "includes all default wallets plus WalletConnect when env is configured":
    "Skips unless `.env.local` has a project id; validates live env matches catalog.",
  "builds testnet metadata and silent logger for QR / Reown modal":
    "`buildWalletConnectModuleOptions`: `stellar:testnet`, metadata, favicon icon URL, silent WC logger.",
  "rejects empty project id": "WalletConnect module options throw if project id is blank.",
  "returns null when unset": "`getWalletConnectProjectId` when env var missing or empty.",
  "returns null for whitespace-only": "Whitespace-only `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` treated as unset.",
  "returns trimmed project id": "Trims Reown project id from env.",
  "returns false for non-objects": "`isSwkAuthModalDismissed` ignores non-error values.",
  "returns false when code is not -1": "Modal dismiss detection requires kit error code -1.",
  "returns true for kit dismiss shape": "User closing SWK modal is not surfaced as app error.",
  "returns false for real errors with different copy": "Network errors are not treated as dismiss.",
};

function readNextPublicWalletConnectProjectIdFromEnvLocal() {
  if (!existsSync(envLocalPath)) return null;
  const text = readFileSync(envLocalPath, "utf8");
  const m = text.match(/^\s*NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\s*=\s*(\S+)/m);
  if (!m) return null;
  const id = m[1].trim().replace(/^["']|["']$/g, "");
  return id.length > 0 ? id : null;
}

/**
 * @returns {{ code: number; report: import('vitest').JsonOutput | null; out: string }}
 */
function runFrontendVitest() {
  const vitestOut = join(FRONTEND_DIR, "target", "vitest-results.json");
  mkdirSync(join(FRONTEND_DIR, "target"), { recursive: true });
  const cmd =
    "npx vitest run --reporter=json --outputFile=target/vitest-results.json 2>&1";
  try {
    const out = execSync(cmd, {
      cwd: FRONTEND_DIR,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      shell: "/bin/bash",
    });
    const report = existsSync(vitestOut) ? JSON.parse(readFileSync(vitestOut, "utf8")) : null;
    return { code: 0, report, out };
  } catch (e) {
    const status = typeof e.status === "number" ? e.status : 1;
    const out =
      (typeof e.stdout === "string" ? e.stdout : e.stdout?.toString?.() ?? "") +
      (typeof e.stderr === "string" ? e.stderr : e.stderr?.toString?.() ?? "");
    let report = null;
    if (existsSync(vitestOut)) {
      try {
        report = JSON.parse(readFileSync(vitestOut, "utf8"));
      } catch {
        report = null;
      }
    }
    return { code: status, report, out };
  }
}

function buildFrontendWalletSuite(vitestRun) {
  const report = vitestRun.report;
  const tests = [];
  let passed = 0;
  let failed = 0;

  if (report?.testResults) {
    for (const file of report.testResults) {
      for (const ar of file.assertionResults ?? []) {
        const outcome =
          ar.status === "passed" ? "passed" : ar.status === "skipped" ? "ignored" : "failed";
        if (outcome === "passed") passed += 1;
        else if (outcome === "failed") failed += 1;
        const shortName = ar.title;
        const detail =
          FRONTEND_TEST_DETAILS[shortName] ??
          FRONTEND_TEST_DETAILS[ar.fullName] ??
          "Vitest wallet / WalletConnect helper test.";
        tests.push({
          id: `frontend-wallet:${ar.fullName}`,
          name: ar.fullName,
          shortName,
          kind: "frontend_wallet",
          kindLabel: "Frontend wallet",
          outcome,
          detail,
        });
      }
    }
  }

  const wcProjectId = readNextPublicWalletConnectProjectIdFromEnvLocal();
  const ok = vitestRun.code === 0 && failed === 0 && passed > 0;

  return {
    id: "frontend-wallet",
    name: "Frontend wallet tests (Vitest)",
    path: "frontend/lib/wallet-kit-config.test.ts, wallet-kit-utils, stellar-wallets-kit-client",
    description: `Vitest: Stellar Wallets Kit module catalog (11 default wallets + optional WalletConnect), env gating, and WalletConnect QR/Reown options. WalletConnect in .env.local: ${wcProjectId ? "configured" : "not set"}.`,
    passed,
    failed,
    ok,
    tail: sanitizeTail(vitestRun.out),
    tests,
  };
}

/**
 * Run `cargo test` with stderr merged into stdout (same order as `cargo test 2>&1` in a shell).
 */
function runCargoTest(args) {
  const extra = args.length ? ` ${args.join(" ")}` : "";
  const cmd = `cargo test${extra} 2>&1`;
  try {
    const out = execSync(cmd, {
      cwd: contractDir,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      shell: "/bin/bash",
    });
    return { code: 0, out };
  } catch (e) {
    const status = typeof e.status === "number" ? e.status : 1;
    const out =
      (typeof e.stdout === "string" ? e.stdout : e.stdout?.toString?.() ?? "") +
      (typeof e.stderr === "string" ? e.stderr : e.stderr?.toString?.() ?? "");
    return { code: status, out };
  }
}

/**
 * Prefer tee'd log from `make test-all-contract` when env is set; else run cargo test here.
 * @returns {{ code: number; out: string }}
 */
function obtainFullTestOutput() {
  const logPath = process.env.CONTRACT_TEST_LOG_PATH;
  const exitPath = process.env.CONTRACT_TEST_LOG_EXIT;
  if (logPath && existsSync(logPath)) {
    const out = readFileSync(logPath, "utf8");
    let code = 0;
    if (exitPath && existsSync(exitPath)) {
      const raw = String(readFileSync(exitPath, "utf8")).trim();
      const n = Number(raw);
      code = Number.isFinite(n) ? n : 1;
    }
    return { code, out };
  }
  return runCargoTest([]);
}

/** Lib section: from `Running unittests src/lib.rs` through just before the integration binary header. */
function extractLibBlock(full) {
  const a = full.indexOf("Running unittests src/lib.rs");
  if (a < 0) return null;
  const b = full.indexOf("Running tests/integration_contract.rs", a);
  if (b < 0) return full.slice(a);
  return full.slice(a, b);
}

/** Integration section: from integration `Running …` through just before doc-tests. */
function extractIntegrationBlock(full) {
  const a = full.indexOf("Running tests/integration_contract.rs");
  if (a < 0) return null;
  const b = full.indexOf("   Doc-tests", a);
  if (b < 0) return full.slice(a);
  return full.slice(a, b);
}

function parseTestResultLine(text) {
  const lines = text.split("\n").filter((l) => l.startsWith("test result:"));
  const line = lines[lines.length - 1] ?? "";
  const ok = line.includes("test result: ok.");
  const passedM = line.match(/(\d+) passed/);
  const failedM = line.match(/(\d+) failed/);
  const ignoredM = line.match(/(\d+) ignored/);
  return {
    ok,
    passed: passedM ? Number(passedM[1]) : 0,
    failed: failedM ? Number(failedM[1]) : 0,
    ignored: ignoredM ? Number(ignoredM[1]) : 0,
    raw: line.trim(),
  };
}

/**
 * @param {string} suiteId
 * @param {string} fullName
 * @returns {{ kind: string; kindLabel: string }}
 */
function classifyTest(suiteId, fullName) {
  if (suiteId === "integration") {
    return { kind: "integration", kindLabel: "Integration" };
  }
  if (fullName.includes("invariant_")) {
    return { kind: "invariant", kindLabel: "Invariant" };
  }
  if (fullName === "test::property_set_get_roundtrip_for_many_values") {
    return { kind: "property", kindLabel: "Property (sweep)" };
  }
  if (fullName === "test::fuzz_set_get_random_u32") {
    return { kind: "proptest_random", kindLabel: "Proptest (random)" };
  }
  return { kind: "unit", kindLabel: "Unit" };
}

/**
 * @param {string} output
 * @returns {{ name: string; outcome: string }[]}
 */
function parsePerTestLines(output) {
  const rows = [];
  const re = /^test\s+(.+?)\s+\.\.\.\s+(ok|FAILED|ignored)\s*$/gm;
  let m;
  while ((m = re.exec(output)) !== null) {
    const name = m[1].trim();
    if (name === "result:" || name.startsWith("result")) continue;
    rows.push({ name, outcome: m[2] === "ok" ? "passed" : m[2] === "ignored" ? "ignored" : "failed" });
  }
  return rows;
}

function buildSuiteTests(suiteId, output) {
  const parsed = parsePerTestLines(output);
  return parsed.map(({ name, outcome }) => {
    const { kind, kindLabel } = classifyTest(suiteId, name);
    const detail = TEST_DETAILS[name] ?? "—";
    const shortName = name.includes("::") ? name.split("::").pop() : name;
    return {
      id: `${suiteId}:${name}`,
      name,
      shortName,
      kind,
      kindLabel,
      outcome,
      detail,
    };
  });
}

const full = obtainFullTestOutput();

const libBlock = extractLibBlock(full.out) ?? "";
const intBlock = extractIntegrationBlock(full.out) ?? "";

const libR = parseTestResultLine(libBlock);
const intR = parseTestResultLine(intBlock);

const libTests = buildSuiteTests("lib", libBlock);
const integrationTests = buildSuiteTests("integration", intBlock);

const skipFrontend = process.env.SKIP_FRONTEND_TESTS === "1";
const vitestRun = skipFrontend ? { code: 0, report: null, out: "" } : runFrontendVitest();
const frontendSuite = skipFrontend ? null : buildFrontendWalletSuite(vitestRun);

const frontendOk = skipFrontend || (frontendSuite?.ok ?? false);
const overallOk =
  full.code === 0 &&
  libBlock.length > 0 &&
  intBlock.length > 0 &&
  libR.ok &&
  intR.ok &&
  frontendOk &&
  (skipFrontend || vitestRun.code === 0);
const totalPassed = libR.passed + intR.passed + (frontendSuite?.passed ?? 0);
const totalFailed = libR.failed + intR.failed + (frontendSuite?.failed ?? 0);

const externalRuns = [
  {
    id: "fuzz-storage-set-get",
    categoryId: "libfuzzer",
    name: "storage_set_get",
    path: "contracts/basic-storage/fuzz/fuzz_targets/storage_set_get.rs",
    makeTarget: "make fuzz",
    cli: "cd contracts/basic-storage/fuzz && cargo fuzz run storage_set_get -- -runs=1000",
    description:
      "Decodes `u32`, `i64`, `u128`, `bool`, and bounded `Bytes` from random input; asserts round-trips on independent slots (same WASM as the repo contract).",
    note: "Not run by this script. Execute locally or in a job with `cargo-fuzz` and LLVM fuzzer deps installed.",
  },
  {
    id: "wallet-connect-qr-manual",
    categoryId: "frontend_wallet",
    name: "WalletConnect QR (manual)",
    path: "frontend/lib/stellar-wallets-kit-client.ts",
    makeTarget: "make dev",
    cli: "Connect wallet → WalletConnect → scan QR with a Stellar mobile wallet",
    description:
      "Browser-only: Reown modal shows a QR code on `stellar:testnet`. Vitest does not drive real wallet pairing.",
    note: "Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `frontend/.env.local`. Run `make test-frontend` for automated checks.",
  },
];

const pocContractId = readNextPublicContractIdFromEnvLocal();

const payload = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  success: overallOk,
  /** Testnet id from `frontend/.env.local` at export time (Home/Demo wallet flows); not used by `cargo test`. */
  pocContractId,
  testScopeNote:
    "Contract rows: `cargo test` in `contracts/basic-storage` (isolated Soroban `Env`). Frontend wallet rows: `vitest run` in `frontend/` (module catalog + WalletConnect config; no live wallet). `pocContractId` from `frontend/.env.local` at export time.",
  summary: {
    passed: totalPassed,
    failed: totalFailed,
    ignored: libR.ignored + intR.ignored,
  },
  categories: CATEGORIES,
  externalRuns,
  suites: [
    {
      id: "lib",
      name: "Library tests",
      path: "contracts/basic-storage/src/test.rs",
      description:
        "Unit, property sweep, Proptest random cases, and several invariant checks (per-slot last-write and cross-slot isolation) in the library test module.",
      passed: libR.passed,
      failed: libR.failed,
      ok: full.code === 0 && libR.ok && libBlock.length > 0,
      tail: sanitizeTail(libBlock),
      tests: libTests,
    },
    {
      id: "integration",
      name: "Integration tests",
      path: "contracts/basic-storage/tests/integration_contract.rs",
      description: "Multi-step flows in a separate test binary (conventional Rust layout).",
      passed: intR.passed,
      failed: intR.failed,
      ok: full.code === 0 && intR.ok && intBlock.length > 0,
      tail: sanitizeTail(intBlock),
      tests: integrationTests,
    },
    ...(frontendSuite ? [frontendSuite] : []),
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
if (!overallOk) {
  console.error("Some tests failed — JSON still written with success=false.");
  process.exit(1);
}
