import { Networks } from "@stellar/stellar-sdk";
import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import type { WalletConnectProviderInstance } from "./walletconnect-instance-type";
import type { SorobanTransactionSigner } from "./wallet-types";

export function createFreighterSigner(publicKey: string): SorobanTransactionSigner {
  return async (xdr, opts) => {
    const signed = await freighterSignTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? Networks.TESTNET,
      address: opts?.address ?? publicKey,
    });
    if (signed.error) {
      throw new Error(signed.error.message ?? "Wallet declined or failed");
    }
    return {
      signedTxXdr: signed.signedTxXdr,
      signerAddress: signed.signerAddress,
    };
  };
}

const STELLAR_TESTNET = "stellar:testnet" as const;

type WcSignResult = {
  signedXDR?: string;
  signedTxXdr?: string;
};

export function createWalletConnectSigner(
  provider: WalletConnectProviderInstance,
  publicKey: string,
  chainId: string = STELLAR_TESTNET,
): SorobanTransactionSigner {
  return async (xdr) => {
    const raw = await provider.request(
      {
        method: "stellar_signXDR",
        params: { xdr },
      },
      chainId,
    );
    const result = raw as WcSignResult;
    const signed =
      typeof result === "object" && result !== null
        ? (result.signedXDR ?? result.signedTxXdr)
        : undefined;
    if (!signed || typeof signed !== "string") {
      throw new Error("Wallet did not return signed transaction XDR");
    }
    return { signedTxXdr: signed, signerAddress: publicKey };
  };
}
