import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import PageShell from "@/components/PageShell";
import { BUSINESS } from "@/content/business";
import "@/styles/contact.css";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Email Playweary or send us a message. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

const QUICK = [
  { href: "/track", title: "Where is my order?", text: "Track it with your order code." },
  { href: "/returns-refunds", title: "Returns and refunds", text: "30 days, free return shipping." },
  { href: "/shipping-policy", title: "Shipping", text: "Delivery times and costs." },
  { href: "/faq", title: "FAQ", text: "Quick answers to common questions." },
];

export default function ContactPage() {
  return (
    <PageShell>
      <header className="ctHero">
        <div className="wrap">
          <span className="eyebrow">We are happy to help</span>
          <h1>Say hello to the Playweary team</h1>
          <p>Questions about an order, sizing or a kit? Send us a note and a real person will write back.</p>
        </div>
      </header>

      <div className="wrap ctBody">
        <section className="card ctFormCard" aria-labelledby="ct-form-h">
          <h2 id="ct-form-h">Send us a message</h2>
          <ContactForm />
        </section>

        <aside className="ctSide">
          <div className="ctInfo ctInfoEmail">
            <span className="ctInfoLabel">Email us</span>
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            <small>We reply within {BUSINESS.replyTime}.</small>
          </div>
          <div className="ctInfo ctInfoHours">
            <span className="ctInfoLabel">Support hours</span>
            <b>{BUSINESS.hours}</b>
            <small>Messages sent outside these hours are answered next business day.</small>
          </div>
        </aside>
      </div>

      <section className="wrap ctQuick" aria-labelledby="ct-quick-h">
        <h2 id="ct-quick-h">Looking for a quick answer?</h2>
        <ul>
          {QUICK.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="card">
                <b>{q.title}</b>
                <span>{q.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
