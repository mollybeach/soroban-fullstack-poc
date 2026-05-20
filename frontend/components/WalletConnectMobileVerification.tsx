import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { testsSectionPath } from "@/lib/test-section-routes";

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
      className={`group relative z-0 flex cursor-zoom-in flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-[transform,box-shadow] duration-300 ease-out hover:z-50 hover:scale-[1.45] hover:overflow-visible hover:shadow-2xl hover:ring-2 hover:ring-slate-300/90 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex min-h-[9rem] items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 p-2 transition-[min-height,padding] duration-300 ease-out group-hover:min-h-[18rem] group-hover:p-4 sm:min-h-[10rem] sm:group-hover:min-h-[22rem]">
        <Image
          src={src}
          alt={alt}
          width={360}
          height={480}
          className="max-h-36 w-auto max-w-full origin-center object-contain transition-transform duration-300 ease-out will-change-transform group-hover:max-h-[min(70vh,28rem)] group-hover:scale-110 sm:max-h-40 sm:group-hover:max-h-[min(75vh,32rem)]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
        />
      </div>
      <figcaption className="border-t border-slate-100 bg-slate-50 px-2 py-1.5 text-[10px] leading-snug text-slate-600 sm:text-xs">
        {caption}
      </figcaption>
    </figure>
  );
}

function WalletSectionHeading({
  wallet,
  title,
  subtitle,
  first,
}: {
  wallet: "freighter" | "lobstr";
  title: string;
  subtitle?: string;
  first?: boolean;
}) {
  const isFreighter = wallet === "freighter";
  return (
    <div
      className={`scroll-mt-24 ${first ? "mt-6" : "mt-10 border-t-4 pt-6"} ${
        first ? "" : isFreighter ? "border-violet-400" : "border-teal-500"
      }`}
    >
      <div
        className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${
          isFreighter
            ? "border border-violet-200 bg-gradient-to-r from-violet-50 to-white"
            : "border border-teal-200 bg-gradient-to-r from-teal-50 to-white"
        }`}
      >
        <p
          className={`text-sm font-bold uppercase tracking-widest sm:text-base ${
            isFreighter ? "text-violet-600" : "text-teal-700"
          }`}
        >
          Mobile WalletConnect
        </p>
        <h3
          className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
            isFreighter ? "text-violet-950" : "text-teal-950"
          }`}
        >
          {title}
        </h3>
        {subtitle ? (
          <p className={`mt-1 text-sm sm:text-base ${isFreighter ? "text-violet-800/90" : "text-teal-900/90"}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
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
      ? "grid grid-cols-2 items-start gap-3 overflow-visible sm:gap-4"
      : "grid grid-cols-2 items-start gap-3 overflow-visible sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";
  return (
    <div className="mt-5 overflow-visible">
      <h4 className="text-base font-semibold text-slate-800 sm:text-lg">{title}</h4>
      <div className={`${gridClass} mt-2`}>{children}</div>
    </div>
  );
}

/** Manual QA: WalletConnect → LOBSTR / Freighter mobile (screenshots + testnet tx links). */
export function WalletConnectMobileVerification() {
  return (
    <section
      id="walletconnect-mobile-verified"
      className="scroll-mt-24 overflow-visible rounded-3xl border border-teal-200/80 bg-white p-6 shadow-md sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
        Manual QA ·{" "}
        <Link
          href={testsSectionPath("mobilewallet")}
          className="font-mono normal-case text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950"
        >
          {testsSectionPath("mobilewallet")}
        </Link>
      </p>
      <h2 className="mt-2 font-bold tracking-tight text-slate-900">
        <span className="block text-3xl text-teal-800 sm:text-4xl">WalletConnect</span>
        <span className="mt-0.5 block text-xl font-semibold text-slate-700 sm:text-2xl">
          mobile (verified)
        </span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        We verified <strong className="text-slate-900">mobile WalletConnect</strong> sessions to this POC:{" "}
        <strong className="text-slate-900">WalletConnect QR</strong> on{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">soroban-fullstack-poc.vercel.app</code> →{" "}
        <strong className="text-slate-900">Freighter</strong> and <strong className="text-slate-900">LOBSTR</strong> on
        a phone (Freighter first below). Scan with each wallet&apos;s <strong>in-app</strong> WalletConnect flow (not the iPhone Camera — that
        often opens MetaMask). Repo log:{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">docs/WalletConnect-Mobile-Success-Log.md</code>.
      </p>

      <WalletSectionHeading
        wallet="freighter"
        first
        title="Freighter"
        subtitle="WalletConnect on testnet — scan QR in the Freighter app, then sign Soroban writes."
      />
      <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-xs text-violet-900 sm:text-sm">
        <strong>Order:</strong> Freighter <strong>Settings → Network → Test Net</strong>, then WalletConnect scan in
        Freighter (not the iPhone Camera). Writes use testnet account{" "}
        <code className="rounded bg-slate-100 px-0.5 text-[10px] sm:text-xs">GBOE2WOJ…YNRI</code>.
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
      <WcScreenshotDock title="Freighter: enable Test Net" columns={2}>
        <WcScreenshotCard
          src="/howtofreighterwalletchangenetworktostellartestnetgotosettingsprofilenetworkstellartestnet.jpg"
          alt="Freighter Network screen with Test Net selected"
          wide
          caption={
            <>
              <span className="font-medium text-violet-800">1. Test Net</span> — Settings → Network → select{" "}
              <strong>Test Net</strong>.
            </>
          }
        />
      </WcScreenshotDock>

      <WcScreenshotDock title="WalletConnect → Freighter: scan & connect" columns={2}>
        <WcScreenshotCard
          src="/freighterscanQRcode.jpg"
          alt="Freighter scan QR code — WalletConnect scanner in Freighter app"
          caption={
            <>
              <span className="font-medium text-violet-800">2. Scan QR</span> — Freighter WalletConnect scanner
              (not iPhone Camera).
            </>
          }
        />
        <WcScreenshotCard
          src="/freighterwalletconnectionrequestafterscanningQRcode.PNG"
          alt="Freighter wallet connection request after scanning QR — Soroban Fullstack POC on Test Net"
          caption={
            <>
              <span className="font-medium text-violet-800">3. Connection request</span> — after scanning QR;
              Soroban Fullstack POC connection request on <strong>Test Net</strong>.
            </>
          }
        />
        <WcScreenshotCard
          src="/freighterwalletconnectionsuccessafterconnectionrequest.PNG"
          alt="Freighter wallet connection success after connection request — connected to Soroban Fullstack POC"
          caption={
            <>
              <span className="font-medium text-violet-800">4. Connection successful</span> — Freighter shows
              connected; return to browser.
            </>
          }
        />
      </WcScreenshotDock>
      <WcScreenshotDock title="Freighter: sign Soroban write (testnet)" columns={2}>
        <WcScreenshotCard
          src="/mobilescreenshotyoucanseetransactionset()withmobilewallet.PNG"
          alt="Freighter confirm set() — Soroban Fullstack POC transaction"
          caption={
            <>
              <span className="font-medium text-violet-800">5. Signature request</span> — Soroban Fullstack POC
              wants you to approve <code className="rounded bg-slate-100 px-0.5">set()</code> on testnet.
            </>
          }
        />
        <WcScreenshotCard
          src="/transactionsuccessfullysignmobiledwallet.PNG"
          alt="Freighter transaction signed successfully"
          caption={
            <>
              <span className="font-medium text-violet-800">6. Transaction confirmed</span> — Freighter confirms
              the Soroban write after you approve.
            </>
          }
        />
      </WcScreenshotDock>
      <WcScreenshotDock title="Freighter writes on Stellar Expert (desktop)" columns={2}>
        <WcScreenshotCard
          src="/blockexploererondesktopyoucanseethatthemobilewallettransactionyaddressucessfullyinvolkedset()ontheblockexploreryoucanseethistranasctioncontractinteraction.png"
          alt="Stellar Expert testnet showing Freighter wallet GBOE invoked set on contract CBGX"
          wide
          caption={
            <>
              <span className="font-medium text-violet-800">7. Block explorer</span> —{" "}
              <code className="rounded bg-slate-100 px-0.5">GBOE…YNRI</code> invoked{" "}
              <code className="rounded bg-slate-100 px-0.5">set</code> on contract{" "}
              <code className="rounded bg-slate-100 px-0.5">CBGX…6O2R</code> (e.g.{" "}
              <code className="rounded bg-slate-100 px-0.5">set(0 u32)</code>,{" "}
              <code className="rounded bg-slate-100 px-0.5">set(42 u32)</code>). Click a row for the tx URL.
            </>
          }
        />
      </WcScreenshotDock>
      <p className="mt-3 text-sm text-slate-600">
        Freighter account{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">GBOE2WOJGWZATO2PXEBF7R74T5QOE7XFGNL55I4AIWEESWNC347YYNRI</code>
        : use <strong>Test Net</strong> in Freighter before connecting. On Stellar Expert (testnet), filter by contract, click
        the invoke row, copy{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">https://stellar.expert/explorer/testnet/tx/&lt;hash&gt;</code>.
      </p>

      <WalletSectionHeading
        wallet="lobstr"
        title="LOBSTR"
        subtitle="WalletConnect on testnet — Profile → Testnet, then Settings → WalletConnect to scan the desktop QR."
      />
      <p className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-xs text-teal-950 sm:text-sm">
        <strong>Order:</strong> LOBSTR <strong>Settings → Profile → Network → Testnet</strong> (and Friendbot-fund your{" "}
        <code className="rounded bg-slate-100 px-0.5">G…</code> on testnet), then{" "}
        <strong>Settings → WalletConnect</strong> to scan the desktop QR — not the iPhone Camera.
      </p>
      <WcScreenshotDock title="LOBSTR: enable Stellar Testnet" columns={2}>
        <WcScreenshotCard
          src="/howtolobstrchangenetworktostellartestnetgotosettingsprofilenetworkstellartestnet.JPG"
          alt="LOBSTR Profile settings with Network set to Testnet"
          wide
          caption={
            <>
              <span className="font-medium text-teal-800">1. Testnet</span> — Profile → Network →{" "}
              <strong>Testnet</strong> (required before Soroban writes on this POC).
            </>
          }
        />
      </WcScreenshotDock>
      <WcScreenshotDock title="WalletConnect → LOBSTR: scan & connect" columns={2}>
        <WcScreenshotCard
          src="/lobstrwalletscanQRcodescreenshot.jpg"
          alt="LOBSTR wallet scan QR codes screenshot — WalletConnect scanner in LOBSTR app"
          caption={
            <>
              <span className="font-medium text-teal-800">2. Scan QR</span> — LOBSTR Settings → WalletConnect;
              scan desktop QR (not iPhone Camera).
            </>
          }
        />
        <WcScreenshotCard
          src="/lobstrwalletconnectionrequestafterscanningQRcode.PNG"
          alt="LOBSTR wallet connection request after scanning QR — Soroban Fullstack POC wants to connect"
          caption={
            <>
              <span className="font-medium text-teal-800">3. Connection request</span> — after scanning QR;
              Soroban Fullstack POC wants to connect (<code className="rounded bg-slate-100 px-0.5">soroban-fullstack-poc.vercel.app</code>).
            </>
          }
        />
        <WcScreenshotCard
          src="/Lobstrwalletconnectionsorobanfullstack walletconnectsuccessful .PNG"
          alt="LOBSTR wallet connection successful — Soroban Fullstack POC connection successful"
          caption={
            <>
              <span className="font-medium text-teal-800">4. Connection successful</span> — “Soroban Fullstack POC
              connection successful” — return to browser.
            </>
          }
        />
      </WcScreenshotDock>
      <WcScreenshotDock title="LOBSTR: sign Soroban write (testnet)" columns={2}>
        <WcScreenshotCard
          src="/LobstrwalletmobiletransactionscreenshotSoroban FullstackPOCwantsyoutosigntheInvokeHostFunction transaction.SorobanFullstackPOCwants you to sign the Invoke Host Function transaction..PNG"
          alt="LOBSTR signature request — Soroban Fullstack POC wants you to sign the Invoke Host Function transaction"
          caption={
            <>
              <span className="font-medium text-teal-800">5. Signature request</span> — Soroban Fullstack POC wants
              you to sign the <strong>Invoke Host Function</strong> transaction (smart contract).
            </>
          }
        />
        <WcScreenshotCard
          src="/lobstrtransactionsuccessfulconfirmedsorobanfullstackpocmobileqrcodescreenshotmobile.PNG"
          alt="LOBSTR transaction confirmed for Soroban Fullstack POC"
          caption={
            <>
              <span className="font-medium text-teal-800">6. Transaction confirmed</span> — LOBSTR confirms the
              Soroban write after you tap <strong>Confirm</strong>.
            </>
          }
        />
      </WcScreenshotDock>
      <WcScreenshotDock title="LOBSTR writes on Stellar Expert (desktop)" columns={2}>
        <WcScreenshotCard
          src="/lobstrblockexploererondesktopyoucanseethatthelobstrmobilewallettransactionyaddressucessfullyinvolkedsignsetfunctionontheblockexploreryoucanseethistranasctioncontractinteraction.png"
          alt="Stellar Expert testnet showing LOBSTR wallet GDYQ invoked set_signed on contract CBGX"
          wide
          caption={
            <>
              <span className="font-medium text-teal-800">7. Block explorer</span> —{" "}
              <code className="rounded bg-slate-100 px-0.5">GDYQ…2LXW</code> invoked{" "}
              <code className="rounded bg-slate-100 px-0.5">set_signed</code> on contract{" "}
              <code className="rounded bg-slate-100 px-0.5">CBGX…6O2R</code> (e.g.{" "}
              <code className="rounded bg-slate-100 px-0.5">set_signed(0 i32)</code>,{" "}
              <code className="rounded bg-slate-100 px-0.5">set_signed(-404 i32)</code>). Click a row for the tx URL.
            </>
          }
        />
      </WcScreenshotDock>
      <p className="mt-3 text-sm text-slate-600">
        LOBSTR account{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">GDYQKAEPG3RUUQOEDRARAXSGP6BQASATLOZHQTDARQ2YX4J6QYN52LXW</code>
        : enable <strong>testnet</strong> and fund via{" "}
        <a
          href="https://friendbot.stellar.org/?addr=GDYQKAEPG3RUUQOEDRARAXSGP6BQASATLOZHQTDARQ2YX4J6QYN52LXW"
          className="font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-950"
        >
          Friendbot
        </a>{" "}
        before writes.
      </p>

      <h3 className="mt-6 text-base font-semibold text-slate-900">Verified transaction links (Freighter)</h3>
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
