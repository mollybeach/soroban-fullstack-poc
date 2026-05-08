#!/usr/bin/env node
/**
 * Runs `cargo test` for the basic-storage crate (lib + integration) and writes
 * frontend/public/test-results.json for the /tests page.
 *
 * Usage (repo root): node scripts/export-test-results.mjs
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
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

function runCargoTest(args) {
  const r = spawnSync("cargo", ["test", ...args], {
    cwd: contractDir,
    encoding: "utf8",
    shell: false,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  return { code: r.status ?? 1, out };
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

const lib = runCargoTest(["--lib"]);
const integration = runCargoTest(["--test", "integration_contract"]);

const libR = parseTestResultLine(lib.out);
const intR = parseTestResultLine(integration.out);

const overallOk = lib.code === 0 && integration.code === 0 && libR.ok && intR.ok;
const totalPassed = libR.passed + intR.passed;
const totalFailed = libR.failed + intR.failed;

const payload = {
  generatedAt: new Date().toISOString(),
  success: overallOk,
  summary: {
    passed: totalPassed,
    failed: totalFailed,
    ignored: libR.ignored + intR.ignored,
  },
  suites: [
    {
      id: "lib",
      name: "Library tests",
      path: "contracts/basic-storage/src/test.rs",
      description: "Unit, property, and proptest coverage for getters/setters.",
      passed: libR.passed,
      failed: libR.failed,
      ok: lib.code === 0 && libR.ok,
      tail: sanitizeTail(lib.out),
    },
    {
      id: "integration",
      name: "Integration tests",
      path: "contracts/basic-storage/tests/integration_contract.rs",
      description: "Multi-step flows in a separate test binary.",
      passed: intR.passed,
      failed: intR.failed,
      ok: integration.code === 0 && intR.ok,
      tail: sanitizeTail(integration.out),
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
