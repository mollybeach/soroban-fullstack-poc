#!/usr/bin/env node
/**
 * Reads cargo-llvm-cov JSON (from `cargo llvm-cov report --json --output-path ...`)
 * and writes frontend/public/coverage-summary.json with aggregated % for lines/functions/branches.
 *
 * Usage: node scripts/export-coverage-summary.mjs <path-to-llvm-cov-report.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const outPath = join(repoRoot, "frontend", "public", "coverage-summary.json");

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("usage: node scripts/export-coverage-summary.mjs <llvm-cov-report.json>");
  process.exit(2);
}

const j = JSON.parse(readFileSync(jsonPath, "utf8"));
const files = j.data?.[0]?.files ?? [];

function agg(kind) {
  let count = 0;
  let covered = 0;
  for (const f of files) {
    const s = f.summary?.[kind];
    if (!s || typeof s.count !== "number") continue;
    count += s.count;
    covered += s.covered ?? 0;
  }
  const percent = count > 0 ? (100 * covered) / count : null;
  return { count, covered, percent };
}

const lines = agg("lines");
const functions = agg("functions");
const branches = agg("branches");

const fileRows = files.map((f) => {
  const lp = f.summary?.lines?.percent;
  const fp = f.summary?.functions?.percent;
  return {
    file: f.filename.replace(/.*\/contracts\/basic-storage\//, ""),
    linesPercent: lp != null ? Number(lp.toFixed(2)) : null,
    functionsPercent: fp != null ? Number(fp.toFixed(2)) : null,
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  tool: "cargo-llvm-cov",
  totals: {
    lines: {
      covered: lines.covered,
      count: lines.count,
      percent: lines.percent != null ? Number(lines.percent.toFixed(2)) : null,
    },
    functions: {
      covered: functions.covered,
      count: functions.count,
      percent:
        functions.percent != null ? Number(functions.percent.toFixed(2)) : null,
    },
    branches: {
      covered: branches.covered,
      count: branches.count,
      percent:
        branches.count > 0 && branches.percent != null
          ? Number(branches.percent.toFixed(2))
          : null,
    },
  },
  files: fileRows,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

const lp = payload.totals.lines.percent ?? "n/a";
const fp = payload.totals.functions.percent ?? "n/a";
console.log(`Coverage summary → ${outPath}`);
console.log(`  Lines: ${lines.covered}/${lines.count} (${lp}%)  Functions: ${functions.covered}/${functions.count} (${fp}%)`);
