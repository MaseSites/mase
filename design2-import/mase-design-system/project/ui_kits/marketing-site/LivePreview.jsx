/* LivePreview.jsx — 4 Branchen-Karten als Live-Preview-Beispiele
   Subtile SVG-Illustrationen pro Branche. */

function LivePreview() {
  const { t } = useT();
  const cards = [
    {
      id: "bowling",
      domain: t("lp_bowling_domain"),
      title: t("lp_bowling_title"),
      desc:  t("lp_bowling_desc"),
      bg: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 100%)",
      illus: (
        <svg viewBox="0 0 120 80" fill="none" aria-hidden="true">
          <circle cx="60" cy="40" r="28" fill="rgba(255,255,255,0.08)" />
          <circle cx="52" cy="32" r="3" fill="rgba(255,255,255,0.5)" />
          <circle cx="63" cy="30" r="3" fill="rgba(255,255,255,0.5)" />
          <circle cx="56" cy="42" r="3" fill="rgba(255,255,255,0.5)" />
          <path d="M 14 60 L 28 50 M 30 62 L 22 50" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "praxis",
      domain: t("lp_praxis_domain"),
      title: t("lp_praxis_title"),
      desc:  t("lp_praxis_desc"),
      bg: "linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)",
      illus: (
        <svg viewBox="0 0 120 80" fill="none" aria-hidden="true">
          <path d="M 60 18 L 60 62 M 38 40 L 82 40" stroke="#0066cc" strokeWidth="6" strokeLinecap="round" />
          <circle cx="60" cy="40" r="26" stroke="#0066cc" strokeWidth="2" opacity="0.4" />
        </svg>
      ),
    },
    {
      id: "gastro",
      domain: t("lp_gastro_domain"),
      title: t("lp_gastro_title"),
      desc:  t("lp_gastro_desc"),
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      illus: (
        <svg viewBox="0 0 120 80" fill="none" aria-hidden="true">
          <circle cx="60" cy="40" r="22" fill="#d97706" />
          <circle cx="60" cy="40" r="14" fill="#fed7aa" />
          <path d="M 38 40 Q 60 56 82 40" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      ),
    },
    {
      id: "beauty",
      domain: t("lp_beauty_domain"),
      title: t("lp_beauty_title"),
      desc:  t("lp_beauty_desc"),
      bg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
      illus: (
        <svg viewBox="0 0 120 80" fill="none" aria-hidden="true">
          <path d="M 50 22 Q 60 16 70 22 L 76 56 Q 60 64 44 56 Z" fill="#ec4899" opacity="0.85" />
          <path d="M 56 28 L 64 28" stroke="#fdf2f8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="lp-section">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">{t("lp_title")}</h2>
        </ScrollReveal>
        <ScrollReveal as="p" className="lead process-lead" delay={120}>
          {t("lp_lead")}
        </ScrollReveal>

        <StaggerGrid className="lp-grid">
          {cards.map((c) => (
            <article key={c.id} className="lp-card">
              <div className="lp-card-illus" style={{ background: c.bg }}>
                {c.illus}
              </div>
              <div className="lp-card-body">
                <p className="lp-card-domain">{c.domain}</p>
                <h3 className="lp-card-title">{c.title}</h3>
                <p className="lp-card-desc">{c.desc}</p>
              </div>
            </article>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

window.LivePreview = LivePreview;
