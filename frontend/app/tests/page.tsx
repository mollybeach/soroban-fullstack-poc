"use client";

import { useEffect, useState } from "react";
import {
  Beaker,
  CheckCircle2,
  Clock,
  FlaskConical,
  RefreshCw,
  Terminal,
  XCircle,
} from "lucide-react";

type TestSuiteResult = {
  id: string;
  name: string;
  path: string;
  description: string;
  passed: number;
  failed: number;
  ok: boolean;
  tail: string;
};

type TestResultsPayload = {
  generatedAt: string;
  success: boolean;
  summary: { passed: number; failed: number; ignored: number };
  suites: TestSuiteResult[];
};

const FALLBACK: TestResultsPayload = {
  generatedAt: new Date(0).toISOString(),
  success: true,
  summary: { passed: 12, failed: 0, ignored: 0 },
  suites: [
    {
      id: "lib",
      name: "Library tests",
      path: "contracts/basic-storage/src/test.rs",
      description: "Unit, property, and proptest coverage for getters/setters.",
      passed: 10,
      failed: 0,
      ok: true,
      tail: "Run `npm run export-test-results` from `frontend/` (or `make export-test-results` from repo root) to refresh live numbers.",
    },
    {
      id: "integration",
      name: "Integration tests",
      path: "contracts/basic-storage/tests/integration_contract.rs",
      description: "Multi-step flows in a separate test binary.",
      passed: 2,
      failed: 0,
      ok: true,
      tail: "",
    },
  ],
};

export default function TestsPage() {
  const [data, setData] = useState<TestResultsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
          setLoadError(e instanceof Error ? e.message : String(e));
          setData(FALLBACK);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const d = data ?? FALLBACK;
  const generated = new Date(d.generatedAt);
  const timeLabel = Number.isNaN(generated.getTime())
    ? "—"
    : generated.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-8 text-white shadow-xl shadow-violet-300/40 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Soroban POC
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <FlaskConical className="h-7 w-7" aria-hidden />
              </span>
              Contract tests
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              Latest <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-xs">cargo test</code>{" "}
              snapshot for <strong>basic-storage</strong>. Refresh the JSON after you change tests
              or before demos.
            </p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
              d.success
                ? "bg-emerald-400/90 text-emerald-950"
                : "bg-rose-400/95 text-rose-950"
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
          <strong>Note:</strong> {loadError}. Showing placeholder totals — run{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">npm run export-test-results</code> in{" "}
          <code className="rounded bg-amber-100 px-1 font-mono">frontend/</code>.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Passed
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

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
          <Beaker className="h-5 w-5 text-violet-600" aria-hidden />
          Suites
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {d.suites.map((suite) => (
            <article
              key={suite.id}
              className={`flex flex-col rounded-2xl border-2 p-6 shadow-sm transition ${
                suite.ok && suite.failed === 0
                  ? "border-emerald-200/90 bg-white"
                  : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
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
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{suite.description}</p>
              <dl className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Passed</dt>
                  <dd className="text-2xl font-bold tabular-nums text-emerald-700">{suite.passed}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Failed</dt>
                  <dd className="text-2xl font-bold tabular-nums text-rose-700">{suite.failed}</dd>
                </div>
              </dl>
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
            make export-test-results
          </pre>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
            cd frontend && npm run export-test-results
          </pre>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
          Then reload this page. Full gate including frontend build:{" "}
          <code className="rounded bg-violet-100 px-1.5 text-xs">make ci</code>.
        </p>
      </div>
    </div>
  );
}
