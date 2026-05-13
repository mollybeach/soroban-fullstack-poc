import { Networks, Address } from "@stellar/stellar-sdk";
import {
  Client,
  type AssembledTransaction,
} from "@stellar/stellar-sdk/contract";
import type { SorobanTransactionSigner } from "./wallet-types";

export type { SorobanTransactionSigner };

/** Soroban RPC for public Stellar testnet. */
export const SOROBAN_TESTNET_RPC = "https://soroban-testnet.stellar.org";

/** Contract client with methods from on-chain spec (not in static Client typings). */
type BasicStorageClient = Client & {
  get: () => Promise<AssembledTransaction<number>>;
  set: (args: { value: number }) => Promise<AssembledTransaction<unknown>>;
  get_signed: () => Promise<AssembledTransaction<number>>;
  set_signed: (args: { v: number }) => Promise<AssembledTransaction<unknown>>;
  get_tag: () => Promise<AssembledTransaction<string>>;
  set_tag: (args: { label: string }) => Promise<AssembledTransaction<unknown>>;
  get_counter: () => Promise<AssembledTransaction<bigint | number>>;
  set_counter: (args: { n: bigint | number }) => Promise<AssembledTransaction<unknown>>;
  get_flag: () => Promise<AssembledTransaction<boolean>>;
  set_flag: (args: { on: boolean }) => Promise<AssembledTransaction<unknown>>;
  get_i64: () => Promise<AssembledTransaction<bigint | number>>;
  set_i64: (args: { v: bigint | number }) => Promise<AssembledTransaction<unknown>>;
  get_blob: () => Promise<AssembledTransaction<Uint8Array>>;
  set_blob: (args: { data: Uint8Array }) => Promise<AssembledTransaction<unknown>>;
  get_u128: () => Promise<AssembledTransaction<bigint | number | string>>;
  set_u128: (args: { v: bigint | number | string }) => Promise<AssembledTransaction<unknown>>;
  get_symbol: () => Promise<AssembledTransaction<string>>;
  set_symbol: (args: { label: string }) => Promise<AssembledTransaction<unknown>>;
  get_pointer: () => Promise<AssembledTransaction<string | null>>;
  set_pointer: (args: { who: string | null }) => Promise<AssembledTransaction<unknown>>;
  get_i128: () => Promise<AssembledTransaction<bigint | number | string>>;
  set_i128: (args: { v: bigint | number | string }) => Promise<AssembledTransaction<unknown>>;
};

export function getConfiguredContractId(): string {
  const id = process.env.NEXT_PUBLIC_CONTRACT_ID?.trim();
  if (!id) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONTRACT_ID. Copy frontend/.env.example to frontend/.env.local and set your deployed contract id.",
    );
  }
  return id;
}

/** Returns contract id from env when set; otherwise null (for optional UI like explorer links). */
export function getOptionalContractId(): string | null {
  const id = process.env.NEXT_PUBLIC_CONTRACT_ID?.trim();
  return id || null;
}

/** Stellar Expert (testnet) page for a contract. */
export function stellarExpertContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

function baseClientOptions() {
  return {
    contractId: getConfiguredContractId(),
    rpcUrl: SOROBAN_TESTNET_RPC,
    networkPassphrase: Networks.TESTNET,
    allowHttp: false,
  } as const;
}

/** Read-only client (simulation only; no wallet). */
export async function createReadClient(): Promise<BasicStorageClient> {
  const client = await Client.from(baseClientOptions());
  return client as BasicStorageClient;
}

function isClientFn(
  client: BasicStorageClient,
  name: keyof BasicStorageClient | string,
): boolean {
  const v = (client as unknown as Record<string, unknown>)[name as string];
  return typeof v === "function";
}

function bytesResultToBase64(result: unknown): string {
  if (result instanceof Uint8Array) {
    let bin = "";
    result.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }
  return "";
}

function bigintishToBigInt(v: bigint | number | string): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "string") return BigInt(v);
  return BigInt(v as number);
}

export type ContractSnapshot = {
  u32: number;
  signed: number | null;
  tag: string | null;
  counter: bigint | null;
  flag: boolean | null;
  i64Val: bigint | null;
  blobB64: string | null;
  u128Val: bigint | null;
  /** Short symbol string (default slot reads as `"_"` before first set). */
  symbolStr: string | null;
  /** Strkey when set; `null` when cleared. */
  pointerStr: string | null;
  i128Wide: bigint | null;
  hasExtendedApi: boolean;
  /** True when wasm includes bool / i64 / Bytes / u128 slots (`get_flag` present). */
  hasWideTypesApi: boolean;
  /** True when wasm includes Symbol / optional Address / i128 (`get_symbol` present). */
  hasFullTypesApi: boolean;
};

/**
 * Simulates all getters present on the **deployed** contract (spec comes from chain).
 * Older deployments only have `get`; extended fields are null and `hasExtendedApi` is false.
 */
export async function readContractSnapshot(): Promise<ContractSnapshot> {
  const client = await createReadClient();
  const getTx = await client.get();
  if (getTx.result === undefined) {
    throw new Error("Simulation returned no result for get()");
  }
  const u32 = getTx.result as number;

  if (
    !isClientFn(client, "get_signed") ||
    !isClientFn(client, "get_tag") ||
    !isClientFn(client, "get_counter")
  ) {
    return {
      u32,
      signed: null,
      tag: null,
      counter: null,
      flag: null,
      i64Val: null,
      blobB64: null,
      u128Val: null,
      symbolStr: null,
      pointerStr: null,
      i128Wide: null,
      hasExtendedApi: false,
      hasWideTypesApi: false,
      hasFullTypesApi: false,
    };
  }

  const [sTx, tTx, cTx] = await Promise.all([
    client.get_signed(),
    client.get_tag(),
    client.get_counter(),
  ]);

  if (sTx.result === undefined || tTx.result === undefined || cTx.result === undefined) {
    throw new Error("Simulation returned no result for extended getters");
  }

  const cr = cTx.result;
  const counter = typeof cr === "bigint" ? cr : BigInt(cr as number);

  const base = {
    u32,
    signed: sTx.result as number,
    tag: tTx.result as string,
    counter,
    hasExtendedApi: true as boolean,
  };

  if (!isClientFn(client, "get_flag")) {
    return {
      ...base,
      flag: null,
      i64Val: null,
      blobB64: null,
      u128Val: null,
      symbolStr: null,
      pointerStr: null,
      i128Wide: null,
      hasWideTypesApi: false,
      hasFullTypesApi: false,
    };
  }

  const [fTx, iTx, bTx, uTx] = await Promise.all([
    client.get_flag(),
    client.get_i64(),
    client.get_blob(),
    client.get_u128(),
  ]);

  if (
    fTx.result === undefined ||
    iTx.result === undefined ||
    bTx.result === undefined ||
    uTx.result === undefined
  ) {
    throw new Error("Simulation returned no result for wide-type getters");
  }

  const i64Val = bigintishToBigInt(iTx.result as bigint | number | string);
  const u128Val = bigintishToBigInt(uTx.result as bigint | number | string);

  const wide8 = {
    ...base,
    flag: fTx.result as boolean,
    i64Val,
    blobB64: bytesResultToBase64(bTx.result),
    u128Val,
    hasWideTypesApi: true as const,
  };

  if (!isClientFn(client, "get_symbol")) {
    return {
      ...wide8,
      symbolStr: null,
      pointerStr: null,
      i128Wide: null,
      hasFullTypesApi: false,
    };
  }

  const [symTx, ptrTx, i128wTx] = await Promise.all([
    client.get_symbol(),
    client.get_pointer(),
    client.get_i128(),
  ]);

  if (
    symTx.result === undefined ||
    ptrTx.result === undefined ||
    i128wTx.result === undefined
  ) {
    throw new Error("Simulation returned no result for full-schema getters");
  }

  const sym = symTx.result as string;
  const ptrRaw = ptrTx.result as string | null | undefined;
  const pointerStr =
    ptrRaw === undefined || ptrRaw === null || ptrRaw === "" ? null : String(ptrRaw);
  const i128Wide = bigintishToBigInt(i128wTx.result as bigint | number | string);

  return {
    ...wide8,
    symbolStr: sym,
    pointerStr,
    i128Wide,
    hasFullTypesApi: true,
  };
}

/**
 * Simulates `get` on the contract and returns the stored u32 (default 0 on chain).
 */
export async function readStoredU32(): Promise<number> {
  const { u32 } = await readContractSnapshot();
  return u32;
}

async function writeClient(
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  return (await Client.from({
    ...baseClientOptions(),
    publicKey,
    signTransaction,
  })) as BasicStorageClient;
}

const MISSING_EXTENDED =
  "This contract id’s WASM does not include set_signed / set_tag / set_counter. Run `make deploy` from the repo with the latest contract, then set NEXT_PUBLIC_CONTRACT_ID to the new CONTRACT_ID and redeploy the frontend.";

const MISSING_WIDE_TYPES =
  "This WASM predates bool / i64 / Bytes / u128 storage. Redeploy the latest `basic-storage` from this repo and update NEXT_PUBLIC_CONTRACT_ID.";

const MISSING_FULL_TYPES =
  "This WASM predates Symbol / optional address / i128. Redeploy the latest `basic-storage` from this repo and update NEXT_PUBLIC_CONTRACT_ID.";

function requireExtendedWriter(
  client: BasicStorageClient,
  method: "set_signed" | "set_tag" | "set_counter",
): void {
  if (!isClientFn(client, method)) {
    throw new Error(MISSING_EXTENDED);
  }
}

function requireWideWriter(
  client: BasicStorageClient,
  method: "set_flag" | "set_i64" | "set_blob" | "set_u128",
): void {
  if (!isClientFn(client, method)) {
    throw new Error(MISSING_WIDE_TYPES);
  }
}

function requireFullWriter(
  client: BasicStorageClient,
  method: "set_symbol" | "set_pointer" | "set_i128",
): void {
  if (!isClientFn(client, method)) {
    throw new Error(MISSING_FULL_TYPES);
  }
}

export async function writeStoredU32(
  value: number,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error("value must be a u32 in range 0 .. 4294967295");
  }
  const client = await writeClient(publicKey, signTransaction);
  const assembled = await client.set({ value });
  return assembled.signAndSend();
}

const I32_MIN = -0x8000_0000;
const I32_MAX = 0x7fff_ffff;

export async function writeSigned(
  v: number,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (!Number.isInteger(v) || v < I32_MIN || v > I32_MAX) {
    throw new Error("v must be a signed 32-bit integer");
  }
  const client = await writeClient(publicKey, signTransaction);
  requireExtendedWriter(client, "set_signed");
  const assembled = await client.set_signed({ v });
  return assembled.signAndSend();
}

const MAX_TAG_LEN = 200;

export async function writeTag(
  label: string,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (label.length > MAX_TAG_LEN) {
    throw new Error(`label must be at most ${MAX_TAG_LEN} characters`);
  }
  const client = await writeClient(publicKey, signTransaction);
  requireExtendedWriter(client, "set_tag");
  const assembled = await client.set_tag({ label });
  return assembled.signAndSend();
}

const U64_MAX = BigInt("18446744073709551615");

export async function writeCounter(
  n: bigint,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (n < BigInt(0) || n > U64_MAX) {
    throw new Error("n must be a u64 in range 0 .. 2^64-1");
  }
  const client = await writeClient(publicKey, signTransaction);
  requireExtendedWriter(client, "set_counter");
  const assembled = await client.set_counter({ n });
  return assembled.signAndSend();
}

const I64_MIN = BigInt("-9223372036854775808");
const I64_MAX = BigInt("9223372036854775807");

export async function writeFlag(
  on: boolean,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  const client = await writeClient(publicKey, signTransaction);
  requireWideWriter(client, "set_flag");
  const assembled = await client.set_flag({ on });
  return assembled.signAndSend();
}

export async function writeI64(
  v: bigint,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (v < I64_MIN || v > I64_MAX) {
    throw new Error("v must fit in a signed 64-bit integer");
  }
  const client = await writeClient(publicKey, signTransaction);
  requireWideWriter(client, "set_i64");
  const assembled = await client.set_i64({ v });
  return assembled.signAndSend();
}

const MAX_BLOB_LEN = 64;

export async function writeBlob(
  data: Uint8Array,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (data.length > MAX_BLOB_LEN) {
    throw new Error(`blob must be at most ${MAX_BLOB_LEN} bytes`);
  }
  const client = await writeClient(publicKey, signTransaction);
  requireWideWriter(client, "set_blob");
  const assembled = await client.set_blob({ data });
  return assembled.signAndSend();
}

const U128_MAX = BigInt("340282366920938463463374607431768211455");

export async function writeU128(
  v: bigint,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (v < BigInt(0) || v > U128_MAX) {
    throw new Error("v must be a u128 in range 0 .. 2^128-1");
  }
  const client = await writeClient(publicKey, signTransaction);
  requireWideWriter(client, "set_u128");
  const assembled = await client.set_u128({ v });
  return assembled.signAndSend();
}

/** UTF-8 encode a string to bytes (bounded by caller). */
export function utf8ToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

const MAX_SYMBOL_LEN = 32;

export async function writeSymbol(
  code: string,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  const t = code.trim();
  if (t.length === 0 || t.length > MAX_SYMBOL_LEN) {
    throw new Error(`Symbol must be 1..${MAX_SYMBOL_LEN} characters after trim`);
  }
  const client = await writeClient(publicKey, signTransaction);
  requireFullWriter(client, "set_symbol");
  const assembled = await client.set_symbol({ label: t });
  return assembled.signAndSend();
}

export async function writePointer(
  who: string | null,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  const client = await writeClient(publicKey, signTransaction);
  requireFullWriter(client, "set_pointer");
  let whoArg: string | null = null;
  if (who !== null && who.trim() !== "") {
    whoArg = Address.fromString(who.trim()).toString();
  }
  const assembled = await client.set_pointer({ who: whoArg });
  return assembled.signAndSend();
}

const I128_MIN = BigInt("-170141183460469231731687303715884105728");
const I128_MAX = BigInt("170141183460469231731687303715884105727");

export async function writeI128Wide(
  v: bigint,
  publicKey: string,
  signTransaction: SorobanTransactionSigner,
) {
  if (v < I128_MIN || v > I128_MAX) {
    throw new Error("v must fit in a signed 128-bit integer");
  }
  const client = await writeClient(publicKey, signTransaction);
  requireFullWriter(client, "set_i128");
  const assembled = await client.set_i128({ v });
  return assembled.signAndSend();
}
