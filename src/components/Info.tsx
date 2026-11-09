"use client";

import { useEffect, useState } from "react";
import { INFO } from "@/content/info";

/**
 * Sizing, delivery, fabric, safety, contact: one accordion above the footer.
 * The footer links point at `#info-<id>`; following one opens that panel.
 */
export default function Info() {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const id = location.hash.replace("#info-", "");
      if (INFO.some((e) => e.id === id)) setOpen(id);
    };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);

  return (
    <section id="info" aria-label="Information">
      <div className="wrap infoWrap">
        {INFO.map((e) => (
          <details
            key={e.id}
            id={"info-" + e.id}
            className="card"
            open={open === e.id}
            onToggle={(ev) => {
              const isOpen = (ev.currentTarget as HTMLDetailsElement).open;
              setOpen((cur) => (isOpen ? e.id : cur === e.id ? null : cur));
            }}
          >
            <summary>{e.title}</summary>
            {e.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </details>
        ))}
      </div>
    </section>
  );
}
