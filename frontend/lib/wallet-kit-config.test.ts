import { describe, expect, it } from "vitest";
import {
  SWK_DEFAULT_WALLET_MODULES,
  WALLET_CONNECT_MODULE,
  WALLET_CONNECT_PRODUCT_ID,
  buildWalletConnectModuleOptions,
  findPocWalletById,
  resolvePocWalletPickerIds,
} from "./wallet-kit-config";
import { getWalletConnectProjectId } from "./wallet-kit-utils";

describe("Stellar Wallets Kit default module catalog", () => {
  it("lists every wallet from defaultModules() (11 extension/hot wallets)", () => {
    expect(SWK_DEFAULT_WALLET_MODULES).toHaveLength(11);
  });

  it.each(SWK_DEFAULT_WALLET_MODULES.map((w) => [w.id, w.name] as const))(
    "catalog includes %s (%s)",
    (id, name) => {
      const found = findPocWalletById(id);
      expect(found).toBeDefined();
      expect(found?.name).toBe(name);
    },
  );

  it("uses unique product ids across the full picker list", () => {
    const withWc = resolvePocWalletPickerIds("demo-project-id");
    expect(new Set(withWc).size).toBe(withWc.length);
  });
});

describe("resolvePocWalletPickerIds (WalletConnect gating)", () => {
  it("omits wallet_connect when project id is missing", () => {
    expect(resolvePocWalletPickerIds(null)).toEqual(
      SWK_DEFAULT_WALLET_MODULES.map((m) => m.id),
    );
    expect(resolvePocWalletPickerIds("")).not.toContain(WALLET_CONNECT_PRODUCT_ID);
    expect(resolvePocWalletPickerIds("   ")).not.toContain(WALLET_CONNECT_PRODUCT_ID);
  });

  it("appends wallet_connect when project id is set", () => {
    const ids = resolvePocWalletPickerIds("abc123");
    expect(ids).toHaveLength(SWK_DEFAULT_WALLET_MODULES.length + 1);
    expect(ids.at(-1)).toBe(WALLET_CONNECT_PRODUCT_ID);
  });

  it("includes all default wallets plus WalletConnect when env is configured", () => {
    const envId = getWalletConnectProjectId();
    if (!envId) return;
    const ids = resolvePocWalletPickerIds(envId);
    for (const m of SWK_DEFAULT_WALLET_MODULES) {
      expect(ids).toContain(m.id);
    }
    expect(ids).toContain(WALLET_CONNECT_MODULE.id);
  });
});

describe("buildWalletConnectModuleOptions", () => {
  it("builds testnet metadata and silent logger for QR / Reown modal", () => {
    const opts = buildWalletConnectModuleOptions("  proj-1  ", "http://localhost:3000/");
    expect(opts.projectId).toBe("proj-1");
    expect(opts.allowedChains).toEqual(["stellar:testnet"]);
    expect(opts.metadata.url).toBe("http://localhost:3000");
    expect(opts.metadata.icons[0]).toBe("http://localhost:3000/favicon.ico");
    expect(opts.signClientOptions.logger).toBe("silent");
  });

  it("rejects empty project id", () => {
    expect(() => buildWalletConnectModuleOptions("", "http://localhost:3000")).toThrow(
      /projectId/i,
    );
  });
});
