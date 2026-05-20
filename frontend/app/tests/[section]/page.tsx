import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TestsPage from "../page";
import {
  isTestSectionSlug,
  TEST_SECTION_ROUTES,
  TEST_SECTION_SLUGS,
  type TestSectionSlug,
} from "@/lib/test-section-routes";

type PageProps = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return TEST_SECTION_SLUGS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!isTestSectionSlug(section)) {
    return { title: "Tests | Soroban Fullstack POC" };
  }
  const route = TEST_SECTION_ROUTES[section];
  return {
    title: `${route.title} | Tests | Soroban Fullstack POC`,
    description: route.description,
  };
}

export default async function TestsSectionPage({ params }: PageProps) {
  const { section } = await params;
  if (!isTestSectionSlug(section)) {
    notFound();
  }
  return <TestsPage initialScrollSection={section as TestSectionSlug} />;
}
