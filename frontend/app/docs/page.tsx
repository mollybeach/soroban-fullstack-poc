import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation | Soroban Fullstack POC",
  description:
    "How the Soroban testnet POC works: contract storage, events, reads, writes, Freighter, and the home page UI.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="border-b border-violet-200 pb-2 text-xl font-bold text-violet-950">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="space-y-10 pb-12">
      <div className="rounded-3xl border border-violet-100 bg-white/90 p-6 shadow-lg shadow-violet-100/50 backdrop-blur-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          Soroban fullstack POC
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-violet-950">
          Documentation
        </h1>
        <p className="mt-4 text-slate-600">
          This page describes what the project is for, how the pieces fit together, and what each
          part of the <strong>Home</strong> screen means. For install and Makefile commands, see
          the repository <code className="rounded bg-violet-100 px-1.5 py-0.5 text-sm">README.md</code>.
        </p>
        <p className="mt-3">
          <Link
            href="/"
            className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
          >
            ← Back to the app
          </Link>
        </p>
      </div>

      <Section id="overview" title="What this project is">
        <p>
          This repository is a <strong>minimal end-to-end proof of concept</strong> on{" "}
          <strong>Stellar testnet</strong>: a small <strong>Soroban</strong> contract written in
          Rust, deployed with the <strong>Stellar CLI</strong>, and a <strong>Next.js</strong>{" "}
          frontend that <strong>reads</strong> contract state via Soroban RPC (simulation) and{" "}
          <strong>writes</strong> by asking <strong>Freighter</strong> to sign transactions.
        </p>
        <p>
          The goal is the <strong>developer lifecycle</strong>—build, test, deploy, invoke from a
          browser—not product features. The contract stays tiny on purpose but touches several
          Soroban types (unsigned and signed integers, string, u64) and emits one{" "}
          <strong>contract event</strong> per write so you can practice an observability story later.
        </p>
      </Section>

      <Section id="architecture" title="How the pieces fit together">
        <ul className="list-inside list-disc space-y-2 marker:text-violet-500">
          <li>
            <code className="rounded bg-slate-100 px-1">contracts/basic-storage/</code> — Soroban
            contract source. <code className="rounded bg-slate-100 px-1">set*</code> functions
            write persistent storage and publish events; <code className="rounded bg-slate-100 px-1">get*</code>{" "}
            functions read it back.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">frontend/lib/stellar.ts</code> — Creates
            the Stellar SDK <strong>contract client</strong> pointed at your{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code>, uses public{" "}
            <strong>Soroban testnet RPC</strong>, and wires <strong>Freighter</strong> as the signer
            for <code className="rounded bg-slate-100 px-1">signAndSend</code>.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">frontend/app/page.tsx</code> — Home UI:
            snapshot reads, four write forms, transaction log, and wallet state from{" "}
            <code className="rounded bg-slate-100 px-1">FreighterProvider</code> (header).
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code> in{" "}
            <code className="rounded bg-slate-100 px-1">frontend/.env.local</code> — The{" "}
            <strong>C…</strong> contract address returned after <code className="rounded bg-slate-100 px-1">make deploy</code>
            . Next.js only reads this at <strong>build time</strong> for production hosts; local dev
            picks it up when the dev server starts.
          </li>
        </ul>
      </Section>

      <Section id="contract" title="The contract: storage, entrypoints, and events">
        <p>
          The contract keeps <strong>four independent values</strong> in persistent storage. Each
          has a setter that emits a typed event (good for indexers and dashboards later).
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/80">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-3 py-2 font-semibold text-slate-800">Area</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Write</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Read</th>
                <th className="px-3 py-2 font-semibold text-slate-800">Event</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2">Unsigned 32-bit</td>
                <td className="px-3 py-2 font-mono text-xs">set(value: u32)</td>
                <td className="px-3 py-2 font-mono text-xs">get() -&gt; u32</td>
                <td className="px-3 py-2 font-mono text-xs">ValueSet</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2">Signed 32-bit</td>
                <td className="px-3 py-2 font-mono text-xs">set_signed(v: i32)</td>
                <td className="px-3 py-2 font-mono text-xs">get_signed() -&gt; i32</td>
                <td className="px-3 py-2 font-mono text-xs">SignedSet</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2">Short text</td>
                <td className="px-3 py-2 font-mono text-xs">set_tag(label: String)</td>
                <td className="px-3 py-2 font-mono text-xs">get_tag() -&gt; String</td>
                <td className="px-3 py-2 font-mono text-xs">TagSet</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Unsigned 64-bit</td>
                <td className="px-3 py-2 font-mono text-xs">set_counter(n: u64)</td>
                <td className="px-3 py-2 font-mono text-xs">get_counter() -&gt; u64</td>
                <td className="px-3 py-2 font-mono text-xs">CounterSet</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          If your deployed WASM is <strong>older</strong> and only exposed <code className="rounded bg-slate-100 px-1">get</code> /{" "}
          <code className="rounded bg-slate-100 px-1">set</code>, the app detects missing{" "}
          <code className="rounded bg-slate-100 px-1">get_signed</code> (etc.) on the client built from
          chain spec and <strong>disables</strong> the extended forms until you redeploy and update the env id.
        </p>
      </Section>

      <Section id="home-ui" title="Home page: what each block does">
        <h3 className="text-base font-semibold text-violet-900">Intro line</h3>
        <p>
          The sentence under the title summarizes the flow: <strong>simulate</strong> the getters (
          <code className="rounded bg-slate-100 px-1">get*</code>) over RPC, then <strong>submit</strong>{" "}
          writes through Freighter. Each successful write path on chain emits one of the four events
          listed above.
        </p>

        <h3 className="mt-6 text-base font-semibold text-violet-900">Contract</h3>
        <p>
          Shows the configured <strong>contract id</strong> from{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code>. When set, it
          is usually a link to <strong>Stellar Expert</strong> (testnet contract page) so you can
          inspect transactions and events in a block explorer. If the variable is missing, the UI
          shows <code className="rounded bg-slate-100 px-1">(not configured)</code>.
        </p>

        <h3 className="mt-6 text-base font-semibold text-violet-900">Stored values</h3>
        <p>
          After the app runs <strong>read simulations</strong> against your contract, it prints the
          latest <strong>u32</strong>, <strong>i32</strong>, <strong>tag</strong>, and{" "}
          <strong>u64</strong> from chain. Only <code className="rounded bg-slate-100 px-1">set()</code>{" "}
          changes the first column; the other three columns change only when you submit their
          matching buttons. Defaults on a fresh contract are <code className="rounded bg-slate-100 px-1">0</code>,{" "}
          <code className="rounded bg-slate-100 px-1">0</code>, empty string, and{" "}
          <code className="rounded bg-slate-100 px-1">0</code>.
        </p>

        <h3 className="mt-6 text-base font-semibold text-violet-900">Refresh read</h3>
        <p>
          Runs the same snapshot logic again (without Freighter). Use it after a write to confirm
          state, or any time you want to pull the latest values from testnet.
        </p>

        <h3 className="mt-6 text-base font-semibold text-violet-900">Writes (testnet)</h3>
        <p>
          Four forms map one-to-one to the contract setters. You must <strong>Connect Freighter</strong>{" "}
          (header, top right) first: writes are <strong>signed transactions</strong> paid by your
          testnet account, so it needs a small XLM balance for fees.
        </p>
        <p>
          <strong>Fill demo values</strong> only fills the input boxes with the same numbers/strings
          used in <code className="rounded bg-slate-100 px-1">contracts/basic-storage/src/test.rs</code>{" "}
          (for example <code className="rounded bg-slate-100 px-1">42</code>,{" "}
          <code className="rounded bg-slate-100 px-1">-17</code>, <code className="rounded bg-slate-100 px-1">hello-events</code>,{" "}
          <code className="rounded bg-slate-100 px-1">99</code>). It does <strong>not</strong> send
          transactions—you still press each <strong>set…</strong> button and approve in Freighter.
        </p>
        <p>
          The note about <code className="rounded bg-slate-100 px-1">txBadSeq</code> means Stellar
          rejected a transaction because the <strong>source account sequence number</strong> did not
          match the ledger—often from <strong>double-submitting</strong> (two overlapping Freighter
          flows) or another tab spending from the same account. The app blocks overlapping submits
          while one write is in flight to reduce this.
        </p>

        <h3 className="mt-6 text-base font-semibold text-violet-900">Transaction log</h3>
        <p>
          A local, append-only trace of what the UI did: timestamps, read summaries, Freighter
          prompts, successes, errors, and hints. <strong>Copy log</strong> copies all lines as plain
          text. <strong>Clear log</strong> wipes the in-memory list (it is not stored on the server).
        </p>
        <p className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 font-mono text-xs text-slate-200 sm:text-sm">
          <span className="text-emerald-400">[10:23:27]</span> reads → u32=42, i32=-17,
          tag=&quot;hello-events&quot;, u64=99
        </p>
        <p className="text-sm text-slate-600">
          A line like this is the output of a successful <strong>read snapshot</strong>: all four
          getters were simulated and those are the values stored on the contract <em>at that
          moment</em>. Seeing it twice back-to-back can happen after two refreshes or in development
          when effects run more than once; the content should match your chain state.
        </p>
        <p>
          <span className="text-emerald-600">Wallet connected: G…</span> means Freighter returned a
          public key; writes will use that account as the transaction source (payer/signer per SDK
          rules).
        </p>
        <p>
          <strong>Result: null</strong> (or the UI text about no return value) on a write is normal
          for these setters: they do not return a meaningful value to the client the way{" "}
          <code className="rounded bg-slate-100 px-1">get</code> returns a number. Trust the following{" "}
          <code className="rounded bg-slate-100 px-1">reads →</code> line to confirm the write landed.
        </p>
      </Section>

      <Section id="demo-route" title="Demo page">
        <p>
          <Link href="/demo" className="font-semibold text-violet-700 hover:text-violet-900">
            /demo
          </Link>{" "}
          is a placeholder for a screen recording (drop{" "}
          <code className="rounded bg-slate-100 px-1">frontend/public/demo/recording.mp4</code>). It
          does not change chain state.
        </p>
      </Section>

      <Section id="troubleshooting" title="Quick troubleshooting">
        <ul className="list-inside list-disc space-y-2 marker:text-violet-500">
          <li>
            <strong>Extended buttons disabled</strong> — Redeploy the contract from this repo and
            set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CONTRACT_ID</code> to the new id.
          </li>
          <li>
            <strong>Submits fail immediately</strong> — Fund the Freighter account on testnet; “connected”
            only means the extension returned an address.
          </li>
          <li>
            <strong>Hosted build shows not configured</strong> — Set the same env var in Vercel (or
            your host) and redeploy; local <code className="rounded bg-slate-100 px-1">.env.local</code>{" "}
            does not affect the server build.
          </li>
        </ul>
      </Section>
    </div>
  );
}
