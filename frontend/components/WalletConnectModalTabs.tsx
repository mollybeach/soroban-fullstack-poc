"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { getWalletConnectProjectId } from "@/lib/stellar-walletconnect";

const VIEWS_WITH_TABS = new Set([
  "AllWallets",
  "ConnectingWalletConnectBasic",
]);

type Anchor = { centerX: number; headerTop: number; maxWidth: number };

function measureTabAnchor(): Anchor | null {
  const modal = document.querySelector("w3m-modal");
  const root = modal?.shadowRoot;
  if (!root) return null;

  const header = root.querySelector("w3m-header");
  const card =
    root.querySelector('[data-testid="w3m-modal-card"]') ??
    root.querySelector("wui-card");

  const hr = header?.getBoundingClientRect();
  const cr = card?.getBoundingClientRect();
  if (!hr || hr.width < 4) return null;

  const centerX =
    cr && cr.width > 0 ? cr.left + cr.width / 2 : hr.left + hr.width / 2;
  const maxWidth = Math.min(420, Math.max(220, (cr?.width ?? hr.width) - 20));

  return { centerX, headerTop: hr.top, maxWidth };
}

/**
 * Reown’s modal does not expose a built-in “Search vs QR” tab row. We layer a small
 * control that tracks `w3m-modal`’s shadow layout and sits **just above** `w3m-header`
 * (the row that shows “All Wallets” / “WalletConnect”), so it reads as part of the modal.
 */
export function WalletConnectModalTabs() {
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<string>("Connect");
  const [floatStyle, setFloatStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getWalletConnectProjectId()) return;

    let cancelled = false;
    let unsubOpen: (() => void) | undefined;
    let unsubView: (() => void) | undefined;

    void import("@reown/appkit-controllers").then((m) => {
      if (cancelled) return;
      const { ModalController, RouterController } = m;
      setModalOpen(ModalController.state.open);
      setView(RouterController.state.view);
      unsubOpen = ModalController.subscribeKey("open", (open) => {
        if (!cancelled) setModalOpen(Boolean(open));
      });
      unsubView = RouterController.subscribeKey("view", (v) => {
        if (!cancelled) setView(typeof v === "string" ? v : "Connect");
      });
    });

    return () => {
      cancelled = true;
      unsubOpen?.();
      unsubView?.();
    };
  }, []);

  const showChrome = modalOpen && VIEWS_WITH_TABS.has(view);

  const syncPosition = () => {
    if (!showChrome) return;
    const anchor = measureTabAnchor();
    const node = barRef.current;
    if (!anchor || !node) return;

    const barH = node.offsetHeight || 40;
    const gap = 6;
    const top = Math.max(8, anchor.headerTop - gap - barH);

    setFloatStyle({
      position: "fixed",
      left: anchor.centerX,
      top,
      transform: "translateX(-50%)",
      maxWidth: anchor.maxWidth,
      zIndex: 2147483646,
      visibility: "visible",
    });
  };

  useLayoutEffect(() => {
    if (!showChrome) {
      setFloatStyle({ visibility: "hidden" });
      return;
    }

    const modal = document.querySelector("w3m-modal");
    if (!modal) {
      requestAnimationFrame(syncPosition);
      return;
    }

    syncPosition();
    const ro = new ResizeObserver(() => syncPosition());
    ro.observe(modal);
    const root = modal.shadowRoot;
    const card =
      root?.querySelector('[data-testid="w3m-modal-card"]') ??
      root?.querySelector("wui-card");
    if (card) ro.observe(card);

    const header = root?.querySelector("w3m-header");
    if (header) ro.observe(header);

    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    let n = 0;
    const boot = window.setInterval(() => {
      syncPosition();
      if (++n > 25) window.clearInterval(boot);
    }, 40);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
      window.clearInterval(boot);
    };
  }, [showChrome, view]);

  if (!showChrome) return null;

  const searchActive = view === "AllWallets";
  const qrActive = view === "ConnectingWalletConnectBasic";

  const goSearch = () => {
    void import("@reown/appkit-controllers").then(({ RouterController }) => {
      RouterController.reset("AllWallets");
    });
  };

  const goQr = () => {
    void import("@reown/appkit-controllers").then(({ RouterController }) => {
      RouterController.reset("ConnectingWalletConnectBasic");
    });
  };

  return (
    <div
      ref={barRef}
      style={floatStyle}
      className="pointer-events-auto flex justify-center gap-0.5 rounded-full border border-white/15 bg-zinc-900/95 p-0.5 shadow-xl backdrop-blur-sm"
      role="tablist"
      aria-label="WalletConnect"
    >
      <button
        type="button"
        role="tab"
        aria-selected={searchActive}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          searchActive
            ? "bg-white/20 text-white"
            : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
        }`}
        onClick={goSearch}
      >
        Search wallets
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={qrActive}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          qrActive
            ? "bg-white/20 text-white"
            : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
        }`}
        onClick={goQr}
      >
        QR code
      </button>
    </div>
  );
}
