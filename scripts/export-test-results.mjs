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
const outPath = join(repoRoot, "frontend", "public", "test-results.json");

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
];

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

const overallOk =
  full.code === 0 && libBlock.length > 0 && intBlock.length > 0 && libR.ok && intR.ok;
const totalPassed = libR.passed + intR.passed;
const totalFailed = libR.failed + intR.failed;

const libTests = buildSuiteTests("lib", libBlock);
const integrationTests = buildSuiteTests("integration", intBlock);

const externalRuns = [
  {
    id: "fuzz-storage-set-get",
    categoryId: "libfuzzer",
    name: "storage_set_get",
    path: "contracts/basic-storage/fuzz/fuzz_targets/storage_set_get.rs",
    makeTarget: "make fuzz",
    cli: "cd contracts/basic-storage/fuzz && cargo fuzz run storage_set_get -- -runs=1000",
    description:
      "Interprets random bytes as a little-endian `u32`, calls `set`/`get`, asserts equality. Exercises the same contract invariants under arbitrary bytes.",
    note: "Not run by this script. Execute locally or in a job with `cargo-fuzz` and LLVM fuzzer deps installed.",
  },
];

const payload = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  success: overallOk,
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
  ],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
if (!overallOk) {
  console.error("Some tests failed — JSON still written with success=false.");
  process.exit(1);
}
