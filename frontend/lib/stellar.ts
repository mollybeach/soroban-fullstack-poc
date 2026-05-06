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
export async function writeStoredU32(value: number, publicKey: string) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error("value must be a u32 in range 0 .. 4294967295");
  }
  const client = (await Client.from({
    ...baseClientOptions(),
    publicKey,
    signTransaction: freighterSigner(publicKey),
  })) as BasicStorageClient;
  const assembled = await client.set({ value });
  return assembled.signAndSend();
}
