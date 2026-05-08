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

/**
 * Simulates `get` on the contract and returns the stored u32 (default 0 on chain).
 */
export async function readStoredU32(): Promise<number> {
  const client = await createReadClient();
  const tx = await client.get();
  const { result } = tx;
  if (result === undefined) {
    throw new Error("Simulation returned no result for get()");
  }
  return result as number;
}

export async function readSigned(): Promise<number> {
  const client = await createReadClient();
  const tx = await client.get_signed();
  const { result } = tx;
  if (result === undefined) {
    throw new Error("Simulation returned no result for get_signed()");
  }
  return result as number;
}

export async function readTag(): Promise<string> {
  const client = await createReadClient();
  const tx = await client.get_tag();
  const { result } = tx;
  if (result === undefined) {
    throw new Error("Simulation returned no result for get_tag()");
  }
  return result as string;
}

export async function readCounter(): Promise<bigint> {
  const client = await createReadClient();
  const tx = await client.get_counter();
  const { result } = tx;
  if (result === undefined) {
    throw new Error("Simulation returned no result for get_counter()");
  }
  return typeof result === "bigint" ? result : BigInt(result as number);
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
  const assembled = await client.set_signed({ v });
  return assembled.signAndSend();
}

const MAX_TAG_LEN = 200;

export async function writeTag(label: string, publicKey: string) {
  if (label.length > MAX_TAG_LEN) {
    throw new Error(`label must be at most ${MAX_TAG_LEN} characters`);
  }
  const client = await writeClient(publicKey);
  const assembled = await client.set_tag({ label });
  return assembled.signAndSend();
}

const U64_MAX = BigInt("18446744073709551615");

export async function writeCounter(n: bigint, publicKey: string) {
  if (n < BigInt(0) || n > U64_MAX) {
    throw new Error("n must be a u64 in range 0 .. 2^64-1");
  }
  const client = await writeClient(publicKey);
  const assembled = await client.set_counter({ n });
  return assembled.signAndSend();
}
