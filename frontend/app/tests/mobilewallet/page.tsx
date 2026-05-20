import type { Metadata } from "next";
import TestsPage from "../page";

export const metadata: Metadata = {
  title: "Mobile wallet (WalletConnect) | Tests | Soroban Fullstack POC",
  description:
    "Manual QA: WalletConnect pairing with Freighter and LOBSTR mobile wallets on Stellar testnet, with screenshots and verified transaction links.",
};

/** Same contract tests page, scrolled to WalletConnect mobile verification. */
export default function MobileWalletTestsPage() {
  return <TestsPage scrollToMobileWalletOnMount />;
}
