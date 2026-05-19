#!/usr/bin/env node
/**
 * Runs frontend Vitest and merges the `frontend-wallet` suite into
 * `frontend/public/test-results.json` without re-running `cargo test`.
 *
 * Usage (repo root): node scripts/export-frontend-wallet-results.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const FRONTEND_DIR = join(repoRoot, "frontend");
const outPath = join(FRONTEND_DIR, "public", "test-results.json");
const envLocalPath = join(FRONTEND_DIR, ".env.local");

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

function sanitizeTail(text) {
  const lines = text.split("\n").slice(-5);
  return lines.join("\n").trim();
}

function readWalletConnectProjectId() {
  if (!existsSync(envLocalPath)) return null;
  const text = readFileSync(envLocalPath, "utf8");
  const m = text.match(/^\s*NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\s*=\s*(\S+)/m);
  if (!m) return null;
  const id = m[1].trim().replace(/^["']|["']$/g, "");
  return id.length > 0 ? id : null;
}

function runFrontendVitest() {
  const vitestOut = join(FRONTEND_DIR, "target", "vitest-results.json");
  mkdirSync(join(FRONTEND_DIR, "target"), { recursive: true });
  try {
    const out = execSync(
      "npx vitest run --reporter=json --outputFile=target/vitest-results.json 2>&1",
      { cwd: FRONTEND_DIR, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    );
    const report = existsSync(vitestOut) ? JSON.parse(readFileSync(vitestOut, "utf8")) : null;
    return { code: 0, report, out };
  } catch (e) {
    const status = typeof e.status === "number" ? e.status : 1;
    const out = String(e.stdout ?? "") + String(e.stderr ?? "");
    let report = null;
    if (existsSync(join(FRONTEND_DIR, "target", "vitest-results.json"))) {
      try {
        report = JSON.parse(readFileSync(join(FRONTEND_DIR, "target", "vitest-results.json"), "utf8"));
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
        tests.push({
          id: `frontend-wallet:${ar.fullName}`,
          name: ar.fullName,
          shortName: ar.title,
          kind: "frontend_wallet",
          kindLabel: "Frontend wallet",
          outcome,
          detail:
            FRONTEND_TEST_DETAILS[ar.title] ??
            FRONTEND_TEST_DETAILS[ar.fullName] ??
            "Vitest wallet / WalletConnect helper test.",
        });
      }
    }
  }

  const wcProjectId = readWalletConnectProjectId();
  return {
    id: "frontend-wallet",
    name: "Frontend wallet tests (Vitest)",
    path: "frontend/lib/wallet-kit-config.test.ts, wallet-kit-utils, stellar-wallets-kit-client",
    description: `Vitest: Stellar Wallets Kit module catalog (11 default wallets + optional WalletConnect), env gating, and WalletConnect QR/Reown options. WalletConnect in .env.local: ${wcProjectId ? "configured" : "not set"}.`,
    passed,
    failed,
    ok: vitestRun.code === 0 && failed === 0 && passed > 0,
    tail: sanitizeTail(vitestRun.out),
    tests,
  };
}

const vitestRun = runFrontendVitest();
const frontendSuite = buildFrontendWalletSuite(vitestRun);

let payload = existsSync(outPath)
  ? JSON.parse(readFileSync(outPath, "utf8"))
  : {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      success: true,
      summary: { passed: 0, failed: 0, ignored: 0 },
      categories: [],
      externalRuns: [],
      suites: [],
    };

const otherSuites = (payload.suites ?? []).filter((s) => s.id !== "frontend-wallet");
const contractPassed = otherSuites.reduce((n, s) => n + (s.passed ?? 0), 0);
const contractFailed = otherSuites.reduce((n, s) => n + (s.failed ?? 0), 0);

payload.generatedAt = new Date().toISOString();
payload.suites = [...otherSuites, frontendSuite];
payload.summary = {
  passed: contractPassed + frontendSuite.passed,
  failed: contractFailed + frontendSuite.failed,
  ignored: payload.summary?.ignored ?? 0,
};
payload.success =
  (contractFailed + frontendSuite.failed) === 0 &&
  frontendSuite.ok &&
  vitestRun.code === 0;

writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Merged frontend-wallet suite into ${outPath} (${frontendSuite.passed} passed)`);
process.exit(vitestRun.code === 0 && frontendSuite.ok ? 0 : 1);
