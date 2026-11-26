import Link from "next/link";
import PolicyToc from "@/components/PolicyToc";
import { BUSINESS, hasTodos } from "@/content/business";
import { POLICY_BY_SLUG, visibleSections, type PolicyPage } from "@/content/policies";
import { SIZES } from "@/content/products";

const KIND_LABEL = { legal: "Legal", commerce: "Orders and delivery", reference: "Guide", faq: "Help", editorial: "Playweary" } as const;

const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The shared layout for every info and policy page; the page's `kind` picks the details. */
export default function PolicyView({ page }: { page: PolicyPage }) {
  const sections = visibleSections(page);
  const used = new Set<string>();
  const withIds = sections.map((s, i) => {
    let id = s.h ? slugify(s.h) : `intro-${i}`;
    while (used.has(id)) id += "-x";
    used.add(id);
    return { ...s, id };
  });
  const toc = withIds.filter((s) => s.h).map((s) => ({ id: s.id, title: s.h! }));
  const numbered = page.kind === "legal" || page.kind === "commerce";
  const showDate = page.legal && !hasTodos(BUSINESS.effective);
  const related = (page.related ?? []).map((s) => POLICY_BY_SLUG[s]).filter(Boolean);

  return (
    <div className={`pol pol-${page.kind}`}>
      <header className="polHero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{page.title}</span>
          </nav>
          <span className="polKind">{KIND_LABEL[page.kind]}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          {showDate ? <span className="policyDate">Last updated {BUSINESS.effective}</span> : null}
        </div>
      </header>

      {page.facts ? (
        <ul className="wrap polFacts" aria-label="Key facts">
          {page.facts.map((f) => (
            <li key={f.label}>
              <b>{f.value}</b>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {page.steps ? (
        <section className="wrap polSteps" aria-label="How a return works">
          <ol>
            {page.steps.map((st) => (
              <li key={st.h}>
                <h2>{st.h}</h2>
                <p>{st.p}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="wrap polBody">
        <aside className="polSide" aria-label="Page navigation">
          <PolicyToc items={toc} />
        </aside>

        <article className="polMain">
          {page.summary ? (
            <div className="polSummary">
              <h2>The short version</h2>
              <ul>
                {page.summary.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <small>This is a summary. The full text below is what applies.</small>
            </div>
          ) : null}

          {withIds.map((s) => {
            const body = (
              <>
                {s.p?.map((t, j) =>
                  t.startsWith("WARNING") ? (
                    <p key={j} className="polWarn" role="note">
                      <b>{t.split(".")[0]}.</b>
                      {t.slice(t.indexOf(".") + 1)}
                    </p>
                  ) : (
                    <p key={j}>{t}</p>
                  ),
                )}
                {s.table === "sizes" ? (
                  <table className="polTable">
                    <thead>
                      <tr>
                        <th scope="col">Size</th>
                        <th scope="col">Height</th>
                        <th scope="col">In centimetres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZES.map((z) => (
                        <tr key={z.id}>
                          <th scope="row">{z.id}</th>
                          <td>{z.inches}</td>
                          <td>{z.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
                {s.ul ? (
                  <ul>
                    {s.ul.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            );
            if (page.kind === "faq" && s.h) {
              return (
                <details key={s.id} id={s.id} className="polQ">
                  <summary>{s.h}</summary>
                  {body}
                </details>
              );
            }
            return (
              <section key={s.id} id={s.id} className="polSec">
                {s.h ? (
                  <h2>
                    {numbered ? <span className="polNum">{String(toc.findIndex((t) => t.id === s.id) + 1).padStart(2, "0")}</span> : null}
                    {s.h}
                  </h2>
                ) : null}
                {body}
              </section>
            );
          })}
        </article>

        <aside className="polHelp" aria-label="Help">
          <h2>Need a hand?</h2>
          <p>
            Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. We reply within {BUSINESS.replyTime}.
          </p>
          <Link className="btn sm" href="/contact">
            Contact us
          </Link>
        </aside>
      </div>

      {related.length ? (
        <section className="polRelated" aria-labelledby="pol-rel">
          <div className="wrap">
            <h2 id="pol-rel">Related</h2>
            <ul>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}`}>
                    <b>{r.title}</b>
                    <span>{r.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
