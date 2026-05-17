/* TrustGrid.jsx — “Warum MASE” section with stagger reveal */

const TRUST_ITEMS = [
  { title: "Schnell",        desc: "Klare Prozesse, kurze Wege, schnelle Live-Schaltung." },
  { title: "Sauberer Code",  desc: "Minimal, wartbar und für Performance optimiert." },
  { title: "Mobile-first",   desc: "UX die auf jedem Screen sitzt. Keine Kompromisse." },
  { title: "KI-Integration", desc: "Assistenz, die Leads qualifiziert und Fragen klärt." },
];

function TrustGrid() {
  return (
    <section className="trust">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">Warum MASE</h2>
        </ScrollReveal>
        <StaggerGrid className="trust-grid">
          {TRUST_ITEMS.map((it) => (
            <article key={it.title} className="trust-card">
              <h3>{it.title}</h3>
              <p>{it.desc}</p>
            </article>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

window.TrustGrid = TrustGrid;
