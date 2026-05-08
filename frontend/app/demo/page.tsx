import type { Metadata } from "next";
import { Download, Film } from "lucide-react";

export const metadata: Metadata = {
  title: "Demo | Soroban Fullstack POC",
  description:
    "Screen recording: testnet reads, Stellar Expert, Freighter writes, and transaction log for the Soroban POC.",
};

/** Place your exported file at `public/demo/recording.mp4` (or webm). */
const DEMO_VIDEO_SRC = "/demo/recording.mp4";

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-lg shadow-violet-100/50 backdrop-blur-sm sm:p-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
            <Film className="h-5 w-5" aria-hidden />
          </span>
          Demo
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          This is a screen recording of the live app on Stellar testnet: simulated reads
          refreshing the four stored fields, opening the contract on Stellar Expert, connecting
          Freighter, then walking each write (<code className="rounded bg-violet-100 px-1 text-sm">set</code>,{" "}
          <code className="rounded bg-violet-100 px-1 text-sm">set_signed</code>,{" "}
          <code className="rounded bg-violet-100 px-1 text-sm">set_tag</code>,{" "}
          <code className="rounded bg-violet-100 px-1 text-sm">set_counter</code>) so you can follow
          the transaction log and on-chain events side by side with the UI.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-violet-200 bg-slate-950 shadow-2xl shadow-violet-200/40 ring-1 ring-white/10">
        <video
          className="aspect-video w-full object-contain"
          controls
          playsInline
          preload="metadata"
          aria-label="POC screen recording"
        >
          <source src={DEMO_VIDEO_SRC} type="video/mp4" />
          <source src="/demo/recording.webm" type="video/webm" />
          Your browser does not support embedded video. Use a modern browser or
          download the file from{" "}
          <code className="rounded bg-slate-800 px-1 text-violet-200">
            public/demo/
          </code>
          .
        </video>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={DEMO_VIDEO_SRC}
          download="soroban-poc-demo-recording.mp4"
          className="inline-flex items-center gap-2 rounded-full border-2 border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50 hover:shadow-md"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Download MP4
        </a>
        <a
          href="/demo/recording.webm"
          download="soroban-poc-demo-recording.webm"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/80 hover:text-violet-900"
        >
          <Download className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          Download WebM
        </a>
      </div>
    </div>
  );
}
