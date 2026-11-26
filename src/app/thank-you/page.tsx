import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ThankYou from "@/components/ThankYou";

export const metadata: Metadata = {
  title: "Thank you for your order",
  description: "Your Playweary order is in. Here is your order number and when to expect your kit.",
  alternates: { canonical: "/thank-you" },
};

export default async function ThankYouPage({ searchParams }: PageProps<"/thank-you">) {
  const { code } = await searchParams;
  return (
    <PageShell>
      <div className="wrap coMain">
        <ThankYou code={typeof code === "string" ? code : undefined} />
      </div>
    </PageShell>
  );
}
