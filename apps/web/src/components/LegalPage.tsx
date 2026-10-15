import type { LegalDoc } from '@/content/legal';

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <section className="section">
      <article className="container article stack">
        <h1>{doc.title}</h1>
        <p className="muted">{doc.updated}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} id={s.id}>
            <h2>{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </article>
    </section>
  );
}
