import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getWalletConnectProjectId,
  isSwkAuthModalDismissed,
} from "./wallet-kit-utils";

describe("getWalletConnectProjectId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "");
    expect(getWalletConnectProjectId()).toBeNull();
  });

  it("returns null for whitespace-only", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "   ");
    expect(getWalletConnectProjectId()).toBeNull();
  });

  it("returns trimmed project id", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "  abc123-test  ");
    expect(getWalletConnectProjectId()).toBe("abc123-test");
  });
});

describe("isSwkAuthModalDismissed", () => {
  it("returns false for non-objects", () => {
    expect(isSwkAuthModalDismissed(null)).toBe(false);
    expect(isSwkAuthModalDismissed("closed")).toBe(false);
  });

  it("returns false when code is not -1", () => {
    expect(
      isSwkAuthModalDismissed({ code: 0, message: "The user closed the modal." }),
    ).toBe(false);
  });

  it("returns true for kit dismiss shape", () => {
    expect(
      isSwkAuthModalDismissed({ code: -1, message: "The user closed the modal." }),
    ).toBe(true);
    expect(
      isSwkAuthModalDismissed({ code: -1, message: "User closed the modal early" }),
    ).toBe(true);
  });

  it("returns false for real errors with different copy", () => {
    expect(isSwkAuthModalDismissed({ code: -1, message: "Network error" })).toBe(false);
  });
});
