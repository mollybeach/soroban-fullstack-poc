/** Scroll to manual WalletConnect mobile QA on `/tests` (id: walletconnect-mobile-verified). */
export function scrollToMobileWalletVerification(): void {
  document.getElementById("walletconnect-mobile-verified")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** Run scroll after layout; returns cleanup for delayed retry. */
export function scheduleScrollToMobileWalletVerification(): () => void {
  scrollToMobileWalletVerification();
  const raf = requestAnimationFrame(scrollToMobileWalletVerification);
  const t1 = window.setTimeout(scrollToMobileWalletVerification, 150);
  const t2 = window.setTimeout(scrollToMobileWalletVerification, 500);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t1);
    clearTimeout(t2);
  };
}
