"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Clock,
  FileJson2,
  RadioTower,
  TableProperties,
  Wrench,
} from "lucide-react";
import { formatSpecType } from "@/lib/contract-spec-format";

type SpecEntry = Record<string, unknown>;

function entryKind(e: SpecEntry): string | null {
  const k = Object.keys(e)[0];
  return k ?? null;
}

function partitionSpec(entries: SpecEntry[]) {
  const functions: { key: string; data: Record<string, unknown> }[] = [];
  const events: { key: string; data: Record<string, unknown> }[] = [];
  const udts: { key: string; data: Record<string, unknown> }[] = [];
  const other: { key: string; data: Record<string, unknown> }[] = [];

  for (const e of entries) {
    const key = entryKind(e);
    if (!key) continue;
    const data = e[key] as Record<string, unknown>;
    if (key === "function_v0") functions.push({ key, data });
    else if (key === "event_v0") events.push({ key, data });
    else if (key.startsWith("udt_")) udts.push({ key, data });
    else other.push({ key, data });
  }

  const byName = <T extends { data: { name?: unknown } }>(arr: T[]) =>
    [...arr].sort((a, b) =>
      String(a.data.name ?? "").localeCompare(String(b.data.name ?? "")),
    );

  return {
    functions: byName(functions),
    events: byName(events),
    udts: byName(udts),
    other,
  };
}

function Section({
  title,
  icon: Icon,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  icon: typeof Wrench;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white/95 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/40 px-4 py-3 text-left transition hover:from-violet-50 hover:to-fuchsia-50/60"
      >
        <span className="flex min-w-0 items-center gap-2 font-semibold text-violet-950">
          <Icon className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
          <span className="truncate">{title}</span>
          <span className="shrink-0 rounded-full border border-violet-200 bg-white/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-violet-800">
            {count}
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
        )}
      </button>
      {open ? <div className="divide-y divide-violet-100/80">{children}</div> : null}
    </section>
  );
}

function Row({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  const hasDetail = Boolean(children);
  return (
    <div
      className={
        hasDetail
          ? "grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-0 sm:items-start"
          : "px-4 py-4"
      }
    >
      <div className={hasDetail ? "min-w-0" : "min-w-0 sm:col-span-2"}>
        <h3 className="font-mono text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {hasDetail ? (
        <div className="min-w-0 rounded-xl border border-slate-200/90 bg-slate-50/95 px-4 py-3 shadow-inner sm:min-h-[3.5rem]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function BindingsExplorer({
  spec,
  interfaceGeneratedAt,
}: {
  spec: SpecEntry[];
  interfaceGeneratedAt: string;
}) {
  const part = useMemo(() => partitionSpec(spec), [spec]);
  const [copied, setCopied] = useState(false);

  const generated = new Date(interfaceGeneratedAt);
  const timeLabel = Number.isNaN(generated.getTime())
    ? "—"
    : generated.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const rawJson = useMemo(() => JSON.stringify(spec, null, 2), [spec]);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/50 p-6 shadow-md sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">basic-storage</p>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl">
              <Braces className="h-8 w-8 shrink-0 text-violet-600" aria-hidden />
              Contract interface
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              This page shows the spec for the <strong>wasm built from this repo</strong> (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                stellar contract info interface --output json-formatted
              </code>
              ). TypeScript bindings live in{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                frontend/lib/basic-storage-bindings/
              </code>{" "}
              (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                stellar contract bindings typescript
              </code>
              ). Refresh both with{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                make contract-bindings
              </code>
              . Testnet txs use whatever contract id is in{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                NEXT_PUBLIC_CONTRACT_ID
              </code>{" "}
              after you run <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">make deploy</code>.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 shadow-sm sm:min-w-[11rem]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              Spec captured
            </p>
            <p className="mt-1.5 text-sm font-semibold text-violet-950">{timeLabel}</p>
            <p className="mt-2 text-[11px] leading-snug text-violet-900/75">
              From{" "}
              <code className="rounded bg-white/70 px-1 font-mono text-[10px]">basic-storage-interface.meta.json</code>{" "}
              (written by{" "}
              <code className="rounded bg-white/70 px-1 font-mono text-[10px]">make contract-interface-json</code>).
            </p>
          </div>
        </div>
      </div>

      <section
        className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white/95 shadow-sm"
        aria-labelledby="interface-json-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/40 px-4 py-3">
          <h2
            id="interface-json-heading"
            className="flex min-w-0 items-center gap-2 text-base font-semibold text-violet-950"
          >
            <FileJson2 className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
            <span className="truncate">Full interface JSON</span>
          </h2>
          <button
            type="button"
            onClick={() => void copyJson()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50"
          >
            <ClipboardCopy className="h-4 w-4 shrink-0" aria-hidden />
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
        <div className="border-t border-slate-800/20 bg-slate-950">
          <pre
            className="max-h-[min(70vh,42rem)] overflow-auto overscroll-contain p-4 font-mono text-[12px] leading-relaxed text-emerald-100/95 [tab-size:2] sm:p-5 sm:text-[13px]"
            tabIndex={0}
          >
            {rawJson}
          </pre>
        </div>
      </section>

      <Section title="Contract functions" icon={Wrench} count={part.functions.length}>
        {part.functions.map(({ data }) => {
          const name = String(data.name ?? "?");
          const doc = typeof data.doc === "string" && data.doc.trim() ? data.doc.trim() : null;
          const inputs = (data.inputs as { name?: string; type_?: unknown; doc?: string }[]) ?? [];
          const outputs = (data.outputs as unknown[]) ?? [];
          return (
            <Row key={name} title={`${name}()`} subtitle={doc}>
              <dl className="space-y-3 text-sm text-slate-700">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Inputs
                  </dt>
                  <dd className="mt-1.5 text-left font-mono text-[13px] leading-snug text-slate-900">
                    {inputs.length ? (
                      <ul className="list-none space-y-1.5 pl-0">
                        {inputs.map((i, idx) => (
                          <li key={`${i.name ?? idx}`} className="break-words">
                            <span className="text-violet-700/90">{i.name ?? "?"}</span>
                            <span className="text-slate-400">: </span>
                            <span>{formatSpecType(i.type_)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500">(none)</span>
                    )}
                  </dd>
                </div>
                <div className="border-t border-slate-200/80 pt-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Returns
                  </dt>
                  <dd className="mt-1.5 break-words text-left font-mono text-[13px] leading-snug text-slate-900">
                    {outputs.length ? outputs.map((o) => formatSpecType(o)).join(" | ") : "()"}
                  </dd>
                </div>
              </dl>
            </Row>
          );
        })}
      </Section>

      <Section title="Contract events" icon={RadioTower} count={part.events.length} defaultOpen>
        {part.events.map(({ data }) => {
          const name = String(data.name ?? "?");
          const topics = (data.prefix_topics as string[]) ?? [];
          const params =
            (data.params as { name?: string; type_?: unknown; location?: string }[]) ?? [];
          const fmt = data.data_format != null ? String(data.data_format) : null;
          return (
            <Row
              key={name}
              title={name}
              subtitle={topics.length ? `topics: ${topics.map((t) => `"${t}"`).join(", ")}` : null}
            >
              <dl className="space-y-3 text-sm text-slate-700">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Payload
                  </dt>
                  <dd className="mt-1.5 text-left font-mono text-[13px] leading-snug text-slate-900">
                    {params.length ? (
                      <ul className="list-none space-y-1.5 pl-0">
                        {params.map((p, idx) => (
                          <li key={`${p.name ?? idx}`} className="break-words">
                            <span className="text-violet-700/90">{p.name ?? "?"}</span>
                            <span className="text-slate-400"> ({p.location ?? "?"}): </span>
                            <span>{formatSpecType(p.type_)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </dd>
                </div>
                {fmt ? (
                  <div className="border-t border-slate-200/80 pt-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Data format
                    </dt>
                    <dd className="mt-1.5 font-mono text-[13px] text-slate-900">{fmt}</dd>
                  </div>
                ) : null}
              </dl>
            </Row>
          );
        })}
      </Section>

      <Section title="Types (UDTs)" icon={TableProperties} count={part.udts.length} defaultOpen={false}>
        {part.udts.map(({ key, data }) => {
          const name = String(data.name ?? key);
          const doc = typeof data.doc === "string" && data.doc.trim() ? data.doc.trim() : null;
          const cases = (data as { cases?: { void_v0?: { name?: string; doc?: string } }[] }).cases;
          return (
            <Row
              key={`${key}-${name}`}
              title={`${name} (${key.replace("_v0", "")})`}
              subtitle={doc}
            >
              {cases && cases.length ? (
                <ul className="list-inside list-disc space-y-1 font-mono text-xs text-slate-800">
                  {cases.map((c, i) => {
                    const vn = c.void_v0?.name ?? "?";
                    const vd = c.void_v0?.doc?.trim();
                    return (
                      <li key={i}>
                        {vn}
                        {vd ? <span className="text-slate-500"> — {vd}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] leading-snug text-emerald-100">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </Row>
          );
        })}
      </Section>

      {part.other.length ? (
        <Section title="Other spec entries" icon={Braces} count={part.other.length} defaultOpen={false}>
          {part.other.map(({ key, data }, i) => (
            <Row key={`${key}-${i}`} title={key}>
              <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900/90 p-3 text-[11px] leading-snug text-sky-100">
                {JSON.stringify(data, null, 2)}
              </pre>
            </Row>
          ))}
        </Section>
      ) : null}
    </div>
  );
}
