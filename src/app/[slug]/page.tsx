import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PolicyView from "@/components/PolicyView";
import { POLICIES, POLICY_BY_SLUG, policiesFor } from "@/content/policies";
import { getShipping } from "@/lib/settings.server";

/** Only the pages in POLICIES exist; anything else under /<slug> is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = POLICY_BY_SLUG[slug];
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/${page.slug}` } };
}

export default async function InfoPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  if (!POLICY_BY_SLUG[slug]) notFound();
  const page = policiesFor((await getShipping()).standardCents).find((p) => p.slug === slug)!;
  return (
    <PageShell>
      <PolicyView page={page} />
    </PageShell>
  );
}
