"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

export const TOPICS = ["Order or delivery", "Returns or refunds", "Sizing help", "Product question", "Wholesale or press", "Something else"];

type Status = "idle" | "sending" | "sent";

export default function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const alertRef = useRef<HTMLParagraphElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError("");
    setStatus("sending");
    try {
      await api("/v1/contact", {
        method: "POST",
        body: {
          name: String(f.get("name") ?? ""),
          email: String(f.get("email") ?? ""),
          topic: String(f.get("topic") ?? ""),
          orderNumber: String(f.get("order") ?? ""),
          message: String(f.get("message") ?? ""),
          website: String(f.get("pw_hp_ref") ?? ""),
        },
      });
      setSentTo(String(f.get("email") ?? ""));
      setStatus("sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  if (status === "sent") {
    return (
      <div className="ctSent" role="status">
        <span className="ctSentIcon" aria-hidden="true">✓</span>
        <h2>Message sent</h2>
        <p>
          Thanks! We emailed a copy to <b>{sentTo}</b>. A real person will reply within one business day.
        </p>
        <button className="btn sm" type="button" onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="ctForm" onSubmit={onSubmit}>
      <div className="ctRow">
        <label className="ctField">
          <span>Your name</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="ctField">
          <span>Email</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <div className="ctRow">
        <label className="ctField">
          <span>What is it about?</span>
          <select name="topic" defaultValue={initialTopic && TOPICS.includes(initialTopic) ? initialTopic : TOPICS[0]}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="ctField">
          <span>Order number (optional)</span>
          <input name="order" maxLength={40} placeholder="PW-1042" autoComplete="off" />
        </label>
      </div>
      <label className="ctField">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={3000} rows={6} placeholder="How can we help?" />
      </label>
      <div className="coHp" aria-hidden="true">
        <label htmlFor="ct-hp-ref">Leave this empty</label>
        <input id="ct-hp-ref" name="pw_hp_ref" type="text" tabIndex={-1} autoComplete="off" data-1p-ignore="" data-lpignore="true" data-bwignore="" data-form-type="other" />
      </div>
      {error ? (
        <p className="coAlert" role="alert" tabIndex={-1} ref={alertRef}>
          {error}
        </p>
      ) : null}
      <button className="btn wide" type="submit" disabled={status === "sending"} aria-busy={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <p className="ctFine">
        We only use your details to answer you. See our <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </form>
  );
}
