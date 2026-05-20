"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  scheduleScrollToTestSection,
  TEST_SECTION_NAV_ORDER,
  TEST_SECTION_ROUTES,
  testsSectionPath,
  type TestSectionSlug,
} from "@/lib/test-section-routes";

function sectionNavClass(slug: TestSectionSlug): string {
  const base =
    "block rounded-lg border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2";
  if (slug === "mobilewallet") {
    return `${base} border-teal-200/90 bg-teal-50/80 hover:border-teal-300 hover:bg-teal-50`;
  }
  return `${base} border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40`;
}

export function TestsSectionNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Jump to test sections">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        Jump to section
      </p>
      <ul className="flex flex-col gap-1.5">
        {TEST_SECTION_NAV_ORDER.map((slug) => {
          const route = TEST_SECTION_ROUTES[slug];
          const href = testsSectionPath(slug);
          const onTestsPage = pathname === "/tests" || pathname.startsWith("/tests/");

          return (
            <li key={slug}>
              <Link
                href={href}
                className={sectionNavClass(slug)}
                onClick={(e) => {
                  if (!onTestsPage) return;
                  e.preventDefault();
                  window.history.pushState(null, "", href);
                  scheduleScrollToTestSection(slug);
                }}
              >
                <span
                  className={`block text-sm font-semibold leading-snug ${
                    slug === "mobilewallet" ? "text-teal-950" : "text-slate-900"
                  }`}
                >
                  {route.title}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] leading-tight text-slate-500">
                  {href}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
