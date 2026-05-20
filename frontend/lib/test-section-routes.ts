/** URL slugs for `/tests/[section]` — each maps to a scroll target on the tests page. */
export const TEST_SECTION_SLUGS = [
  "unit",
  "integration",
  "property",
  "proptest",
  "invariant",
  "libfuzzer",
  "coverage",
  "frontend-wallet",
  "mobilewallet",
] as const;

export type TestSectionSlug = (typeof TEST_SECTION_SLUGS)[number];

/** Display order for in-page jump nav (hero card, sidebars). */
export const TEST_SECTION_NAV_ORDER: TestSectionSlug[] = [
  "mobilewallet",
  "unit",
  "integration",
  "property",
  "proptest",
  "invariant",
  "libfuzzer",
  "coverage",
  "frontend-wallet",
];

export type TestSectionRoute = {
  title: string;
  description: string;
  /** Primary DOM id to scroll to. */
  elementId: string;
  /** Used when primary id is missing (e.g. unit rows not exported yet). */
  fallbackElementId?: string;
};

export const TEST_SECTION_ROUTES: Record<TestSectionSlug, TestSectionRoute> = {
  unit: {
    title: "Unit tests",
    description: "Isolated Soroban Env per test (`cargo test --lib`).",
    elementId: "test-kind-unit",
    fallbackElementId: "test-kind-lib",
  },
  integration: {
    title: "Integration tests",
    description: "Separate integration binary (`cargo test --test …`).",
    elementId: "test-kind-integration",
  },
  property: {
    title: "Property (sweep)",
    description: "Many fixed cases in one test.",
    elementId: "test-kind-property",
    fallbackElementId: "test-kind-lib",
  },
  proptest: {
    title: "Proptest (random)",
    description: "Randomized inputs with shrinking.",
    elementId: "test-kind-proptest_random",
    fallbackElementId: "test-kind-lib",
  },
  invariant: {
    title: "Invariant tests",
    description: "Last-write wins and cross-slot isolation.",
    elementId: "test-kind-invariant",
  },
  libfuzzer: {
    title: "libFuzzer",
    description: "Byte stream fuzzing harness (outside `cargo test`).",
    elementId: "test-kind-libfuzzer",
  },
  coverage: {
    title: "LLVM line coverage",
    description: "`cargo llvm-cov` line and function reports.",
    elementId: "test-kind-llvm_coverage",
  },
  "frontend-wallet": {
    title: "Frontend wallet (Vitest)",
    description: "Stellar Wallets Kit catalog and WalletConnect config tests.",
    elementId: "test-kind-frontend_wallet",
  },
  mobilewallet: {
    title: "WalletConnect mobile (verified)",
    description: "Manual QA: WalletConnect → Freighter / LOBSTR on testnet.",
    elementId: "walletconnect-mobile-verified",
  },
};

/** Category ids from `test-results.json` → URL slug. */
export const CATEGORY_ID_TO_SLUG: Record<string, TestSectionSlug> = {
  unit: "unit",
  integration: "integration",
  property: "property",
  proptest_random: "proptest",
  invariant: "invariant",
  libfuzzer: "libfuzzer",
  llvm_coverage: "coverage",
  frontend_wallet: "mobilewallet",
};

export function isTestSectionSlug(value: string): value is TestSectionSlug {
  return (TEST_SECTION_SLUGS as readonly string[]).includes(value);
}

export function categoryIdToSlug(categoryId: string): TestSectionSlug | undefined {
  return CATEGORY_ID_TO_SLUG[categoryId];
}

export function testsSectionPath(slug: TestSectionSlug): string {
  return `/tests/${slug}`;
}

export function resolveScrollElementId(slug: TestSectionSlug): string {
  const route = TEST_SECTION_ROUTES[slug];
  if (document.getElementById(route.elementId)) return route.elementId;
  if (route.fallbackElementId && document.getElementById(route.fallbackElementId)) {
    return route.fallbackElementId;
  }
  return route.elementId;
}

export function scrollToTestSection(slug: TestSectionSlug): void {
  const id = resolveScrollElementId(slug);
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Retry scroll after layout / async JSON (images, tables). */
export function scheduleScrollToTestSection(slug: TestSectionSlug): () => void {
  scrollToTestSection(slug);
  const raf = requestAnimationFrame(() => scrollToTestSection(slug));
  const t1 = window.setTimeout(() => scrollToTestSection(slug), 150);
  const t2 = window.setTimeout(() => scrollToTestSection(slug), 500);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t1);
    clearTimeout(t2);
  };
}

/** @deprecated Use scheduleScrollToTestSection("mobilewallet") */
export function scrollToMobileWalletVerification(): void {
  scrollToTestSection("mobilewallet");
}

/** @deprecated Use scheduleScrollToTestSection("mobilewallet") */
export function scheduleScrollToMobileWalletVerification(): () => void {
  return scheduleScrollToTestSection("mobilewallet");
}
