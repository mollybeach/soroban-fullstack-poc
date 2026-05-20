import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

function WcScreenshotCard({
  src,
  alt,
  caption,
  wide,
}: {
  src: string;
  alt: string;
  caption: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex min-h-[9rem] items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-2 sm:min-h-[10rem]">
        <Image
          src={src}
          alt={alt}
          width={360}
          height={480}
          className="max-h-36 w-auto max-w-full object-contain sm:max-h-40"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        />
      </div>
      <figcaption className="border-t border-slate-100 px-2 py-1.5 text-[10px] leading-snug text-slate-600 sm:text-xs">
        {caption}
      </figcaption>
    </figure>
  );
}

function WcScreenshotDock({
  title,
  children,
  columns = 3,
}: {
  title: string;
  children: ReactNode;
  columns?: 2 | 3;
}) {
  const gridClass =
    columns === 2
      ? "grid grid-cols-2 gap-2 sm:gap-3"
      : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3";
  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <div className={`${gridClass} mt-2`}>{children}</div>
    </div>
  );
}

/** Manual QA: WalletConnect → LOBSTR / Freighter mobile (screenshots + testnet tx links). */
export function WalletConnectMobileVerification() {
  return (
    <section
      id="walletconnect-mobile-verified"
      className="scroll-mt-24 rounded-3xl border border-teal-200/80 bg-white p-6 shadow-md sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
        Manual QA ·{" "}
        <Link
          href="/tests/mobilewallet"
          className="font-mono normal-case text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950"
        >
          /tests/mobilewallet
        </Link>
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
        WalletConnect mobile (verified)
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        We verified <strong className="text-slate-900">mobile WalletConnect</strong> sessions to this POC:{" "}
        <strong className="text-slate-900">WalletConnect QR</strong> on{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">soroban-fullstack-poc.vercel.app</code> →{" "}
        <strong className="text-slate-900">Freighter</strong> or <strong className="text-slate-900">LOBSTR</strong> on
        a phone. Scan with each wallet&apos;s <strong>in-app</strong> WalletConnect flow (not the iPhone Camera — that
        often opens MetaMask). Repo log:{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">docs/WalletConnect-Mobile-Success-Log.md</code>.
      </p>

      <h3 className="mt-6 text-base font-semibold text-slate-900">WalletConnect → LOBSTR mobile</h3>
      <p className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-xs text-teal-950 sm:text-sm">
        <strong>Path:</strong> WalletConnect QR (browser) → <strong>LOBSTR</strong> — connection request, then success
        toast. LOBSTR: <strong>Settings → WalletConnect</strong>; enable <strong>Testnet</strong> before writes.
      </p>
      <WcScreenshotDock title="WalletConnect → LOBSTR: connect" columns={2}>
        <WcScreenshotCard
          src="/Lobstrconnectionrequestwith walletconnectlobstrSorobanfullstackpoc.PNG"
          alt="LOBSTR WalletConnect connection request for soroban-fullstack-poc.vercel.app"
          caption={
            <>
              <span className="font-medium text-teal-800">1. Request</span> — approve Soroban Fullstack POC.
            </>
          }
        />
        <WcScreenshotCard
          src="/Lobstrwalletconnectionsorobanfullstack walletconnectsuccessful .PNG"
          alt="LOBSTR WalletConnect connection successful"
          caption={
            <>
              <span className="font-medium text-teal-800">2. Connected</span> — return to browser.
            </>
          }
        />
      </WcScreenshotDock>
      <p className="mt-3 text-sm text-slate-600">
        LOBSTR account{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">GDYQKAEPG3RUUQOEDRARAXSGP6BQASATLOZHQTDARQ2YX4J6QYN52LXW</code>
        : connect can succeed while writes fail with{" "}
        <code className="rounded bg-slate-100 px-1">Account not found</code> until the same{" "}
        <code className="rounded bg-slate-100 px-1">G…</code> exists on{" "}
        <strong>testnet</strong> —{" "}
        <a
          href="https://friendbot.stellar.org/?addr=GDYQKAEPG3RUUQOEDRARAXSGP6BQASATLOZHQTDARQ2YX4J6QYN52LXW"
          className="font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950"
        >
          Friendbot
        </a>{" "}
        (mainnet XLM does not count).
      </p>

      <h3 className="mt-8 text-base font-semibold text-slate-900">WalletConnect → Freighter mobile</h3>
      <p className="text-sm text-slate-600">
        <strong>Connected testnet account (writes + explorer):</strong>{" "}
        <code className="break-all rounded bg-slate-100 px-1 text-xs">
          GBOE2WOJGWZATO2PXEBF7R74T5QOE7XFGNL55I4AIWEESWNC347YYNRI
        </code>
      </p>
      <p>
        <a
          href="https://stellar.expert/explorer/testnet/account/GBOE2WOJGWZATO2PXEBF7R74T5QOE7XFGNL55I4AIWEESWNC347YYNRI"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
        >
          View account on Stellar Expert (testnet)
        </a>
      </p>
      <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-xs text-violet-900 sm:text-sm">
        <strong>Path:</strong> WalletConnect (browser) → <strong>Freighter</strong> — scan QR in Freighter, not Camera.
      </p>

      <WcScreenshotDock title="WalletConnect → Freighter: pair & sign" columns={3}>
        <WcScreenshotCard
          src="/scanningwalletconnectonphone.jpg"
          alt="Freighter scanning desktop WalletConnect QR"
          caption={
            <>
              <span className="font-medium text-violet-800">1. Scan</span>
            </>
          }
        />
        <WcScreenshotCard
          src="/successfulSorobanfullstackpocconnectiononphone.jpg"
          alt="Freighter connection successful"
          caption={
            <>
              <span className="font-medium text-violet-800">2. Connected</span>
            </>
          }
        />
        <WcScreenshotCard
          src="/mobilescreenshotyoucanseetransactionset()withmobilewallet.PNG"
          alt="Freighter confirm set()"
          caption={
            <>
              <span className="font-medium text-violet-800">3. Confirm</span>{" "}
              <code className="rounded bg-slate-100 px-0.5">set()</code>
            </>
          }
        />
        <WcScreenshotCard
          src="/transactionsuccessfullysignmobiledwallet.PNG"
          alt="Freighter transaction signed"
          caption={
            <>
              <span className="font-medium text-violet-800">4. Signed</span>
            </>
          }
        />
      </WcScreenshotDock>

      <WcScreenshotDock title="After Freighter sign — Stellar Expert (desktop)" columns={2}>
        <WcScreenshotCard
          src="/blockexploererondesktopyoucanseethatthemobilewallettransactionyaddressucessfullyinvolkedset()ontheblockexploreryoucanseethistranasctioncontractinteraction.png"
          alt="Stellar Expert contract invokes from mobile wallet"
          wide
          caption={
            <>
              <span className="font-medium text-violet-800">Explorer</span> —{" "}
              <code className="rounded bg-slate-100 px-0.5">set(0)</code> /{" "}
              <code className="rounded bg-slate-100 px-0.5">set(42)</code>; click row for tx URL.
            </>
          }
        />
      </WcScreenshotDock>

      <p className="mt-4 text-sm text-slate-600">
        On Stellar Expert (testnet), filter by contract (<code className="rounded bg-slate-100 px-1">CBGX…6O2R</code>
        ), click the invoke row, copy{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">https://stellar.expert/explorer/testnet/tx/&lt;hash&gt;</code>
        .
      </p>

      <h3 className="mt-6 text-base font-semibold text-slate-900">Verified transaction links</h3>
      <ul className="list-inside list-disc space-y-2 text-sm text-slate-600 marker:text-teal-600">
        <li>
          <code className="rounded bg-slate-100 px-1 text-xs">set(42 u32)</code> —{" "}
          <a
            href="https://stellar.expert/explorer/testnet/tx/a9a96caf69334fb937b4ce144d03a0996749d896a4acdd7b95b32eaf8c82f29b"
            className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
          >
            Stellar Expert tx
          </a>{" "}
          (2026-05-20 15:00:38 UTC)
        </li>
        <li>
          <code className="rounded bg-slate-100 px-1 text-xs">set(0 u32)</code> —{" "}
          <a
            href="https://stellar.expert/explorer/testnet/tx/2833e7300a51d2ec713b0e411fa6f2854537b8161d0afaab53fe007e109eac2f"
            className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
          >
            Stellar Expert tx
          </a>{" "}
          (2026-05-20 15:00:03 UTC)
        </li>
      </ul>
      <p className="mt-4 text-sm text-slate-600">
        Vitest wallet rows above are automated config checks; this section is{" "}
        <strong className="text-slate-800">live QR pairing</strong> on testnet. More detail in{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">docs/WalletConnect-Mobile-Success-Log.md</code> or{" "}
        <Link
          href="/docs"
          className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
        >
          /docs
        </Link>{" "}
        (troubleshooting).
      </p>
    </section>
  );
}
