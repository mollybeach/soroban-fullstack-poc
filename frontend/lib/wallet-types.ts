/**
 * Soroban `Client` signing hook — implemented by Stellar Wallets Kit (`signTransaction`),
 * normalized to `signedTxXdr` for the Stellar SDK contract client.
 */
export type SorobanTransactionSigner = (
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
