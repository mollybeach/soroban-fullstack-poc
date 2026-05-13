import { UniversalProvider } from "@walletconnect/universal-provider";

/** Runtime instance returned by `UniversalProvider.init` (used for session + signing). */
export type WalletConnectProviderInstance = Awaited<
  ReturnType<typeof UniversalProvider.init>
>;
