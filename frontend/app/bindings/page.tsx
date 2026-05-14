import type { Metadata } from "next";
import contractSpec from "@/contract-spec/basic-storage-interface.json";
import interfaceMeta from "@/contract-spec/basic-storage-interface.meta.json";
import { BindingsExplorer } from "./bindings-explorer";

export const metadata: Metadata = {
  title: "Contract interface · Soroban POC",
  description:
    "basic-storage WASM contract spec: functions, events, and UDTs (from stellar contract info interface).",
};

type SpecEntry = Record<string, unknown>;

type InterfaceMeta = { generatedAt: string; wasmRelative?: string };

export default function BindingsPage() {
  const generatedAt =
    typeof (interfaceMeta as InterfaceMeta).generatedAt === "string"
      ? (interfaceMeta as InterfaceMeta).generatedAt
      : new Date(0).toISOString();
  return <BindingsExplorer spec={contractSpec as SpecEntry[]} interfaceGeneratedAt={generatedAt} />;
}
