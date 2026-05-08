"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          Soroban fullstack POC
        </Link>
        <nav className="site-nav" aria-label="Main">
          {nav.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname === ""
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`site-nav-link${active ? " site-nav-link--active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
