import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@stellar/stellar-sdk",
    "@creit-tech/stellar-wallets-kit",
  ],
};

export default nextConfig;
