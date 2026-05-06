import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stellar/stellar-sdk", "@stellar/freighter-api"],
};

export default nextConfig;
