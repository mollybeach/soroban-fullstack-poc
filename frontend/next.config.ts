import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@stellar/stellar-sdk",
    "@stellar/freighter-api",
    "@walletconnect/universal-provider",
    "@reown/appkit",
  ],
};

export default nextConfig;
