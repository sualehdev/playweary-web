"use client";

import { useId, useState } from "react";
import { subscribe } from "@/lib/newsletter";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "done" } | { kind: "error"; message: string };

/**
 * One grown-up's email. Used in the footer and in the basket's checkout
 * message; `tone` only changes the colours it sits on.
 */
export default function Newsletter({ tone = "dark", button = "Pin it up" }: { tone?: "dark" | "light"; button?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "busy" });
    const r = await subscribe(email);
    setStatus(r.ok ? { kind: "done" } : { kind: "error", message: r.error });
  };

  if (status.kind === "done")
    return (
      <p className={"nlDone " + tone} role="status">
        Pinned up. We will write when something lands: about once a month, never more.
      </p>
    );

  return (
    <form className={"nl " + tone} onSubmit={submit} noValidate>
      <div className="row">
        <label htmlFor={id} className="srOnly">
          A grown-up&apos;s email
        </label>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="a grown-up's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status.kind === "error"}
          aria-describedby={status.kind === "error" ? id + "-err" : undefined}
        />
        <button className="btn pink sm" type="submit" disabled={status.kind === "busy"}>
          {status.kind === "busy" ? "…" : button}
        </button>
      </div>
      {status.kind === "error" ? (
        <p id={id + "-err"} className="nlErr" role="alert">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
