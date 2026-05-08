import { Networks } from "@stellar/stellar-sdk";
import {
  Client,
  type AssembledTransaction,
} from "@stellar/stellar-sdk/contract";
import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";

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

export type ContractSnapshot = {
  u32: number;
  signed: number | null;
  tag: string | null;
  counter: bigint | null;
  hasExtendedApi: boolean;
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
      hasExtendedApi: false,
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

  return {
    u32,
    signed: sTx.result as number,
    tag: tTx.result as string,
    counter,
    hasExtendedApi: true,
  };
}

/**
 * Simulates `get` on the contract and returns the stored u32 (default 0 on chain).
 */
export async function readStoredU32(): Promise<number> {
  const { u32 } = await readContractSnapshot();
  return u32;
}

function freighterSigner(publicKey: string) {
  return async (
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string },
  ) => {
    const signed = await freighterSignTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? Networks.TESTNET,
      address: opts?.address ?? publicKey,
    });
    if (signed.error) {
      throw new Error(signed.error.message ?? "Freighter declined or failed");
    }
    return {
      signedTxXdr: signed.signedTxXdr,
      signerAddress: signed.signerAddress,
    };
  };
}

/**
 * Submits `set` using Freighter for signing. Caller should ensure the wallet is on testnet.
 */
async function writeClient(publicKey: string) {
  return (await Client.from({
    ...baseClientOptions(),
    publicKey,
    signTransaction: freighterSigner(publicKey),
  })) as BasicStorageClient;
}

const MISSING_EXTENDED =
  "This contract id’s WASM does not include set_signed / set_tag / set_counter. Run `make deploy` from the repo with the latest contract, then set NEXT_PUBLIC_CONTRACT_ID to the new CONTRACT_ID and redeploy the frontend.";

function requireExtendedWriter(
  client: BasicStorageClient,
  method: "set_signed" | "set_tag" | "set_counter",
): void {
  if (!isClientFn(client, method)) {
    throw new Error(MISSING_EXTENDED);
  }
}

export async function writeStoredU32(value: number, publicKey: string) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error("value must be a u32 in range 0 .. 4294967295");
  }
  const client = await writeClient(publicKey);
  const assembled = await client.set({ value });
  return assembled.signAndSend();
}

const I32_MIN = -0x8000_0000;
const I32_MAX = 0x7fff_ffff;

export async function writeSigned(v: number, publicKey: string) {
  if (!Number.isInteger(v) || v < I32_MIN || v > I32_MAX) {
    throw new Error("v must be a signed 32-bit integer");
  }
  const client = await writeClient(publicKey);
  requireExtendedWriter(client, "set_signed");
  const assembled = await client.set_signed({ v });
  return assembled.signAndSend();
}

const MAX_TAG_LEN = 200;

export async function writeTag(label: string, publicKey: string) {
  if (label.length > MAX_TAG_LEN) {
    throw new Error(`label must be at most ${MAX_TAG_LEN} characters`);
  }
  const client = await writeClient(publicKey);
  requireExtendedWriter(client, "set_tag");
  const assembled = await client.set_tag({ label });
  return assembled.signAndSend();
}

const U64_MAX = BigInt("18446744073709551615");

export async function writeCounter(n: bigint, publicKey: string) {
  if (n < BigInt(0) || n > U64_MAX) {
    throw new Error("n must be a u64 in range 0 .. 2^64-1");
  }
  const client = await writeClient(publicKey);
  requireExtendedWriter(client, "set_counter");
  const assembled = await client.set_counter({ n });
  return assembled.signAndSend();
}
