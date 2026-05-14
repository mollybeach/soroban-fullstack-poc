import type { Metadata } from "next";
import contractSpec from "@/contract-spec/basic-storage-interface.json";
import { BindingsExplorer } from "./bindings-explorer";

export const metadata: Metadata = {
  title: "Contract interface · Soroban POC",
  description:
    "basic-storage WASM contract spec: functions, events, and UDTs (from stellar contract info interface).",
};

type SpecEntry = Record<string, unknown>;

export default function BindingsPage() {
  return <BindingsExplorer spec={contractSpec as SpecEntry[]} />;
}
