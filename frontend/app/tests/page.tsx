"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Beaker,
  Bug,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  FlaskConical,
  Layers,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import { formatUnknownError } from "@/lib/format-unknown-error";
import { stellarExpertContractUrl } from "@/lib/stellar";

type TestCaseRow = {
  id: string;
  name: string;
  shortName: string;
  kind: string;
  kindLabel: string;
  outcome: string;
  detail: string;
};

type TestCategory = {
  id: string;
  title: string;
  tool: string;
  description: string;
};

type ExternalRun = {
  id: string;
  categoryId: string;
  name: string;
  path: string;
  makeTarget: string;
  cli: string;
  description: string;
  note: string;
};

type TestSuiteResult = {
  id: string;
  name: string;
  path: string;
  description: string;
  passed: number;
  failed: number;
  ok: boolean;
  tail: string;
  tests?: TestCaseRow[];
};

type TestResultsPayload = {
  schemaVersion?: number;
  generatedAt: string;
  success: boolean;
  /** From `frontend/.env.local` when `export-test-results.mjs` runs; demo / wallet target on testnet. */
  pocContractId?: string | null;
  testScopeNote?: string;
  summary: { passed: number; failed: number; ignored: number };
  categories?: TestCategory[];
  externalRuns?: ExternalRun[];
  suites: TestSuiteResult[];
};

/** Payload after `normalizePayload` — categories and externalRuns are always set. */
type NormalizedTestResults = Omit<TestResultsPayload, "categories" | "externalRuns"> & {
  categories: TestCategory[];
  externalRuns: ExternalRun[];
};

type CoverageTotals = {
  covered: number;
  count: number;
  percent: number | null;
};

type CoverageSummaryPayload = {
  generatedAt: string;
  tool: string;
  totals: {
    lines: CoverageTotals;
    functions: CoverageTotals;
    branches: CoverageTotals;
  };
  files: { file: string; linesPercent: number | null; functionsPercent: number | null }[];
};

const DEFAULT_CATEGORIES: TestCategory[] = [
  {
    id: "unit",
    title: "Unit tests",
    tool: "cargo test --lib",
    description: "Isolated Soroban Env per test.",
  },
  {
    id: "integration",
    title: "Integration tests",
    tool: "cargo test --test …",
    description: "Separate integration binary.",
  },
  {
    id: "property",
    title: "Property (sweep)",
    tool: "cargo test",
    description: "Many fixed cases in one test.",
  },
  {
    id: "proptest_random",
    title: "Proptest (random)",
    tool: "proptest",
    description: "Randomized inputs with shrinking.",
  },
  {
    id: "invariant",
    title: "Invariant",
    tool: "proptest",
    description: "Last-write wins per slot; cross-slot writes must not clobber other keys.",
  },
  {
    id: "libfuzzer",
    title: "libFuzzer",
    tool: "cargo fuzz",
    description: "Byte stream fuzzing (separate harness).",
  },
  {
    id: "llvm_coverage",
    title: "LLVM coverage",
    tool: "cargo llvm-cov",
    description: "Line/function reports.",
  },
];

const FALLBACK: TestResultsPayload = {
  schemaVersion: 2,
  generatedAt: new Date(0).toISOString(),
  success: true,
  pocContractId: null,
  summary: { passed: 38, failed: 0, ignored: 0 },
  categories: DEFAULT_CATEGORIES,
  externalRuns: [
    {
      id: "fuzz-storage-set-get",
      categoryId: "libfuzzer",
      name: "storage_set_get",
      path: "contracts/basic-storage/fuzz/fuzz_targets/storage_set_get.rs",
      makeTarget: "make fuzz",
      cli: "cargo fuzz run storage_set_get -- -runs=1000",
      description: "Run `make sync-tests` and reload for live cargo test rows.",
      note: "",
    },
  ],
  suites: [
    {
      id: "lib",
      name: "Library tests",
      path: "contracts/basic-storage/src/test.rs",
      description: "Export test results to populate each row.",
      passed: 35,
      failed: 0,
      ok: true,
      tail: "",
      tests: [],
    },
    {
      id: "integration",
      name: "Integration tests",
      path: "contracts/basic-storage/tests/integration_contract.rs",
      description: "Multi-step flows.",
      passed: 3,
      failed: 0,
      ok: true,
      tail: "",
      tests: [],
    },
  ],
};

function normalizePayload(raw: TestResultsPayload): NormalizedTestResults {
  return {
    ...raw,
    categories: raw.categories?.length ? raw.categories : DEFAULT_CATEGORIES,
    externalRuns: raw.externalRuns ?? [],
    suites: raw.suites.map((s) => ({
      ...s,
      tests: s.tests ?? [],
    })),
  };
}

const KIND_BADGE: Record<string, string> = {
  unit: "bg-slate-100 text-slate-800 ring-slate-200",
  integration: "bg-violet-100 text-violet-900 ring-violet-200",
  property: "bg-sky-100 text-sky-900 ring-sky-200",
  proptest_random: "bg-amber-100 text-amber-950 ring-amber-200",
  invariant: "bg-fuchsia-100 text-fuchsia-950 ring-fuchsia-200",
};

export default function TestsPage() {
  const [data, setData] = useState<TestResultsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cov, setCov] = useState<CoverageSummaryPayload | null>(null);
  const [covError, setCovError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/test-results.json", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(`No test-results.json (${res.status})`);
            setData(FALLBACK);
          }
          return;
        }
        const json = (await res.json()) as TestResultsPayload;
        if (!cancelled) {
          setData(json);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(formatUnknownError(e));
          setData(FALLBACK);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/coverage-summary.json", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setCovError(`No coverage-summary.json (${res.status})`);
            setCov(null);
          }
          return;
        }
        const json = (await res.json()) as CoverageSummaryPayload;
        if (!cancelled) {
          setCov(json);
          setCovError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCovError(formatUnknownError(e));
          setCov(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const d = useMemo(() => normalizePayload(data ?? FALLBACK), [data]);
  const generated = new Date(d.generatedAt);
  const timeLabel = Number.isNaN(generated.getTime())
    ? "—"
    : generated.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const kindCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of d.suites) {
      for (const t of s.tests ?? []) {
        m.set(t.kind, (m.get(t.kind) ?? 0) + 1);
      }
    }
    return m;
  }, [d.suites]);

  const invariantRows = useMemo(() => {
    const rows: (TestCaseRow & { sourceSuite: string })[] = [];
    for (const s of d.suites) {
      for (const t of s.tests ?? []) {
        if (t.kind === "invariant") {
          rows.push({ ...t, sourceSuite: s.name });
        }
      }
    }
    return rows;
  }, [d.suites]);

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Soroban POC
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/80">
                <FlaskConical className="h-7 w-7" aria-hidden />
              </span>
              Contract tests
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                cargo test
              </code>
              ,{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                proptest
              </code>
              ,{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                cargo fuzz
              </code>
              , and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                cargo llvm-cov
              </code>{" "}
              for <strong className="font-semibold text-slate-900">basic-storage</strong>.{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                make test-all-contract
              </code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                make test-all
              </code>{" "}
              are the same target (all contract-side test types, no JSON). Run{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200/80">
                make sync-tests
              </code>{" "}
              to run that plus refresh this page’s JSON.
            </p>
            {(() => {
              const cid =
                (d.pocContractId && d.pocContractId.trim()) ||
                (typeof process.env.NEXT_PUBLIC_CONTRACT_ID === "string"
                  ? process.env.NEXT_PUBLIC_CONTRACT_ID.trim()
                  : "");
              if (!cid) return null;
              return (
                <div className="mt-4 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 sm:text-lg">
                      <FileCode
                        className="h-5 w-5 shrink-0 text-violet-600 sm:h-6 sm:w-6"
                        aria-hidden
                      />
                      Contract
                    </span>
                    <a
                      href={stellarExpertContractUrl(cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1.5 font-mono text-xs text-violet-900 transition hover:border-violet-300 hover:bg-violet-100"
                    >
                      <span className="truncate">{cid}</span>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-violet-600 group-hover:text-violet-800"
                        aria-hidden
                      />
                    </a>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-slate-500">
                    Demo testnet id from export snapshot.
                  </p>
                  {d.testScopeNote ? (
                    <p className="mt-2 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600">
                      {d.testScopeNote}
                    </p>
                  ) : null}
                </div>
              );
            })()}
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
              d.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {d.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {d.success ? "All green" : "Failures"}
          </div>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Note:</strong> {loadError}. Showing placeholders — run{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">make sync-tests</code> or{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">make export-test-results</code> to refresh JSON (or{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">make test-all-contract</code> /{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">make test-all</code> to run tests only).
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Passed (cargo test)
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-emerald-900">
            {d.summary.passed}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <XCircle className="h-4 w-4" aria-hidden />
            Failed
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
            {d.summary.failed}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 shadow-md">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
            <Clock className="h-4 w-4" aria-hidden />
            Captured
          </p>
          <p className="mt-2 text-lg font-semibold text-violet-950">{timeLabel}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <Terminal className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-violet-950">Run from the repository root</p>
            <p className="mt-1 text-xs leading-relaxed text-violet-900/80">
              Executes every contract-side test type, then updates the JSON this page reads. Run this before demos or
              after changing Rust tests.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Full gate + this page
                </p>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 font-mono text-sm font-medium tracking-tight text-emerald-300 shadow-inner">
                  make sync-tests
                </pre>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  All test types only (alias: <span className="font-mono normal-case">make test-all</span>)
                </p>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 font-mono text-sm font-medium tracking-tight text-sky-200 shadow-inner">
                  make test-all-contract
                </pre>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">make sync-tests</code> runs{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">make test-all-contract</code> first (full{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">cargo test</code> + optional libFuzzer), then writes{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">frontend/public/test-results.json</code>.{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">make test-all</code> is the same Makefile recipe as{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">make test-all-contract</code>. Reload this page after{" "}
              <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px] text-slate-800 ring-1 ring-slate-200">make sync-tests</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Layers className="h-5 w-5 text-violet-600" aria-hidden />
          Test types in this POC
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          The contract is validated several different ways. Counts on badges reflect how many{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">cargo test</code> cases fall in each bucket
          (libFuzzer runs outside <code className="rounded bg-slate-100 px-1 font-mono text-xs">cargo test</code>).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {d.categories.map((c) => {
            const n = kindCounts.get(c.id);
            let countLabel: string | null = null;
            if (c.id === "llvm_coverage") {
              countLabel = cov ? `lines ${cov.totals.lines.percent}%` : "run make coverage";
            } else if (c.id === "libfuzzer") {
              countLabel = `${d.externalRuns.length} harness`;
            } else if (n != null && n > 0) {
              countLabel = `${n} case${n === 1 ? "" : "s"}`;
            }
            return (
              <article
                key={c.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{c.title}</h3>
                  {countLabel ? (
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                      {countLabel}
                    </span>
                  ) : null}
                </div>
                <code className="mt-2 block text-xs text-violet-700">{c.tool}</code>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <PieChart className="h-5 w-5 text-violet-600" aria-hidden />
          LLVM line coverage
        </h2>
        {covError ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Coverage summary not loaded ({covError}). Run{" "}
            <code className="rounded bg-violet-100 px-1 font-mono">make coverage</code> from repo root,
            then reload.
          </p>
        ) : null}
        {cov ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Lines
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-indigo-950">
                {cov.totals.lines.percent != null ? `${cov.totals.lines.percent}%` : "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {cov.totals.lines.covered} / {cov.totals.lines.count} instrumented
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Functions
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-sky-950">
                {cov.totals.functions.percent != null
                  ? `${cov.totals.functions.percent}%`
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {cov.totals.functions.covered} / {cov.totals.functions.count} hit
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Branches
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {cov.totals.branches.count > 0 && cov.totals.branches.percent != null
                  ? `${cov.totals.branches.percent}%`
                  : "n/a"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {cov.totals.branches.count === 0 ? (
                  <>
                    <strong className="font-medium text-slate-600">Why n/a:</strong> the LLVM JSON export
                    aggregated for this page has{" "}
                    <span className="tabular-nums">branches.count = 0</span>. That is common for Rust (and this
                    Soroban crate): <code className="rounded bg-slate-100 px-1">cargo-llvm-cov</code> still gives
                    meaningful line and function coverage, but branch buckets are often empty in the summary. Use the
                    line % above and the HTML report from{" "}
                    <code className="rounded bg-slate-100 px-1">make coverage</code> for drill-down.
                  </>
                ) : (
                  <>
                    Branch totals come from the same LLVM export as lines/functions. For per-line coloring, open the
                    HTML report from <code className="rounded bg-slate-100 px-1">make coverage</code>.
                  </>
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Captured {new Date(cov.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
        {cov && cov.files.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2 font-semibold text-slate-800">File</th>
                  <th className="px-4 py-2 font-semibold text-slate-800">Lines</th>
                  <th className="px-4 py-2 font-semibold text-slate-800">Functions</th>
                </tr>
              </thead>
              <tbody>
                {cov.files.map((f) => (
                  <tr key={f.file} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-violet-900">{f.file}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {f.linesPercent != null ? `${f.linesPercent}%` : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {f.functionsPercent != null ? `${f.functionsPercent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Bug className="h-5 w-5 text-amber-600" aria-hidden />
          libFuzzer (outside cargo test)
        </h2>
        <div className="grid gap-4 lg:grid-cols-1">
          {d.externalRuns.map((run) => (
            <article
              key={run.id}
              className="rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{run.name}</h3>
                  <code className="mt-1 block text-xs text-violet-800">{run.path}</code>
                </div>
                <span className="rounded-full bg-amber-200/90 px-3 py-1 text-xs font-bold text-amber-950 ring ring-amber-300/60">
                  cargo-fuzz
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{run.description}</p>
              <dl className="mt-4 grid gap-3 border-t border-amber-100 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-amber-800/90">Makefile</dt>
                  <dd>
                    <code className="mt-1 block rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-300">
                      {run.makeTarget}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-amber-800/90">CLI</dt>
                  <dd>
                    <code className="mt-1 block rounded-lg bg-slate-900 px-3 py-2 font-mono text-[10px] leading-relaxed text-sky-200">
                      {run.cli}
                    </code>
                  </dd>
                </div>
              </dl>
              {run.note ? (
                <p className="mt-3 text-xs leading-relaxed text-amber-900/80">{run.note}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <ShieldCheck className="h-5 w-5 text-fuchsia-600" aria-hidden />
          Invariant tests (at a glance)
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          These cases are a subset of the library suite: randomized sequences with a predicate that must always hold
          (last-write visibility or cross-slot isolation). They also appear in the full tables below.
        </p>
        {invariantRows.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border-2 border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50/40 to-white shadow-sm">
            <table className="w-full min-w-[min(100%,40rem)] text-left text-sm">
              <thead>
                <tr className="border-b border-fuchsia-100 bg-fuchsia-50/90">
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-900">
                    Result
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-900">
                    Test
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-900">
                    Suite
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-900">
                    What it proves
                  </th>
                </tr>
              </thead>
              <tbody>
                {invariantRows.map((t) => (
                  <tr key={t.id} className="border-b border-fuchsia-50/90 bg-white last:border-0">
                    <td className="px-3 py-3 align-top">
                      {t.outcome === "passed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="passed" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600" aria-label="failed" />
                      )}
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-xs font-semibold text-violet-950">
                      {t.shortName}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-slate-600">{t.sourceSuite}</td>
                    <td className="px-3 py-3 align-top text-sm leading-relaxed text-slate-700">{t.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-fuchsia-200 bg-fuchsia-50/30 px-4 py-3 text-sm text-slate-600">
            No invariant rows in the loaded JSON yet. Run{" "}
            <code className="rounded bg-white px-1 font-mono text-xs">make sync-tests</code> after pulling the latest
            contract tests.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Beaker className="h-5 w-5 text-violet-600" aria-hidden />
          Cargo test suites — each case
        </h2>
        <div className="grid gap-6">
          {d.suites.map((suite) => (
            <article
              key={suite.id}
              className={`rounded-2xl border-2 p-6 shadow-sm transition ${
                suite.ok && suite.failed === 0
                  ? "border-emerald-200/90 bg-white"
                  : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{suite.name}</h3>
                  <code className="mt-1 block text-xs text-violet-700">{suite.path}</code>
                </div>
                {suite.ok ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    OK
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
                    <XCircle className="h-3.5 w-3.5" aria-hidden />
                    Issue
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{suite.description}</p>
              <dl className="mt-3 flex flex-wrap gap-6 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Passed</dt>
                  <dd className="text-xl font-bold tabular-nums text-emerald-700">{suite.passed}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Failed</dt>
                  <dd className="text-xl font-bold tabular-nums text-rose-700">{suite.failed}</dd>
                </div>
              </dl>

              {suite.tests && suite.tests.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                  <table className="w-full min-w-[min(100%,48rem)] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/80">
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Result
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Type
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Test
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          What it proves
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {suite.tests.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 bg-white last:border-0">
                          <td className="px-3 py-3 align-top">
                            {t.outcome === "passed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="passed" />
                            ) : t.outcome === "ignored" ? (
                              <span className="text-xs font-medium text-slate-500">skipped</span>
                            ) : (
                              <XCircle className="h-5 w-5 text-rose-600" aria-label="failed" />
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${KIND_BADGE[t.kind] ?? "bg-slate-100 text-slate-800 ring-slate-200"}`}
                            >
                              {t.kindLabel}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top font-mono text-xs text-violet-950">
                            {t.shortName}
                          </td>
                          <td className="px-3 py-3 align-top text-sm leading-relaxed text-slate-700">
                            {t.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No per-test rows in JSON (older export). Run{" "}
                  <code className="rounded bg-white px-1 font-mono text-xs">make sync-tests</code>{" "}
                  to regenerate with <code className="rounded bg-white px-1 font-mono text-xs">schemaVersion</code>{" "}
                  2.
                </p>
              )}

              {suite.tail ? (
                <pre className="mt-4 max-h-28 overflow-auto rounded-xl bg-slate-900/95 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
                  {suite.tail}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-md sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Terminal className="h-5 w-5 text-violet-600" aria-hidden />
          Refresh results
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          From repo root, or from <code className="rounded bg-violet-100 px-1">frontend/</code>:
        </p>
        <div className="mt-4 space-y-3">
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
            make sync-tests
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-sky-300">
            make test-all-contract
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-sky-300">
            make test-all
          </pre>
          <p className="text-xs text-slate-500">
            Runs <code className="rounded bg-slate-100 px-1">make test-all-contract</code> first (full{" "}
            <code className="rounded bg-slate-100 px-1">cargo test</code> + optional libFuzzer), then writes{" "}
            <code className="rounded bg-slate-100 px-1">test-results.json</code> from the teed log — no second{" "}
            <code className="rounded bg-slate-100 px-1">cargo test</code>. Same target as{" "}
            <code className="rounded bg-slate-100 px-1">make export-test-results</code>. To export only (runs{" "}
            <code className="rounded bg-slate-100 px-1">cargo test</code> inside the script), run{" "}
            <code className="rounded bg-slate-100 px-1">node scripts/export-test-results.mjs</code> without the log env vars.
          </p>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
            cd frontend && npm run export-test-results
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-sky-300">
            make coverage
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-amber-300">
            make fuzz
          </pre>
          <p className="text-xs text-slate-500">
            Coverage updates <code className="rounded bg-slate-100 px-1">coverage-summary.json</code> (needs{" "}
            <code className="rounded bg-slate-100 px-1">cargo-llvm-cov</code>). Fuzz is a separate harness.
          </p>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
          Reload after exports. Standard gate:{" "}
          <code className="rounded bg-violet-100 px-1.5 text-xs">make ci</code>. With coverage:{" "}
          <code className="rounded bg-violet-100 px-1.5 text-xs">make ci-coverage</code>.
        </p>
      </div>
    </div>
  );
}
