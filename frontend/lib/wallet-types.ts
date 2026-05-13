/**
 * Soroban `Client` signing hook — same shape for Freighter extension and WalletConnect
 * (`stellar_signXDR`), normalized to `signedTxXdr` for the Stellar SDK contract client.
 */
export type SorobanTransactionSigner = (
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
