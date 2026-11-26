"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; title: string };

/** Sticky "On this page" list (desktop) and a "Jump to" menu (mobile). Highlights the section being read. */
export default function PolicyToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <>
      <nav className="polToc" aria-label="On this page">
        <h2>On this page</h2>
        <ol>
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} aria-current={active === i.id ? "true" : undefined}>
                {i.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <label className="polJump">
        <span>Jump to</span>
        <select
          value={active}
          onChange={(e) => {
            document.getElementById(e.target.value)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
