import type { Metadata } from "next";
import { Film } from "lucide-react";

export const metadata: Metadata = {
  title: "Demo | Soroban Fullstack POC",
  description: "Screen recording of the Soroban testnet POC in action",
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
          Screen recording of the app (contract reads, Freighter writes, and
          transaction log). Add your file as{" "}
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-900">
            frontend/public/demo/recording.mp4
          </code>{" "}
          — then refresh this page.
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
    </div>
  );
}
