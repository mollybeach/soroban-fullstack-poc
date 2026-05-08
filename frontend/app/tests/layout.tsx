import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tests | Soroban Fullstack POC",
  description:
    "Contract test results snapshot for basic-storage (cargo test via export script).",
};

export default function TestsLayout({ children }: { children: ReactNode }) {
  return children;
}
