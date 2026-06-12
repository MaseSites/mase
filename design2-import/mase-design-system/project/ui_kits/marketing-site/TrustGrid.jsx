/* TrustGrid.jsx — mit Icons */

const TRUST_ICONS = [
  // Schnell — Blitz
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>),
  // Sauberer Code — geschweifte Klammern
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2" />
  </svg>),
  // Mobile-first — Smartphone
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>),
  // KI-Integration — Sparkles
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
  </svg>),
];

function TrustGrid() {
  const { t } = useT();
  const items = [
    { id: 1, title: t("trust_1_title"), desc: t("trust_1_desc"), icon: TRUST_ICONS[0] },
    { id: 2, title: t("trust_2_title"), desc: t("trust_2_desc"), icon: TRUST_ICONS[1] },
    { id: 3, title: t("trust_3_title"), desc: t("trust_3_desc"), icon: TRUST_ICONS[2] },
    { id: 4, title: t("trust_4_title"), desc: t("trust_4_desc"), icon: TRUST_ICONS[3] },
  ];
  return (
    <section className="trust">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">{t("trust_title")}</h2>
        </ScrollReveal>
        <StaggerGrid className="trust-grid">
          {items.map((it) => (
            <article key={it.id} className="trust-card">
              <div className="trust-card-icon" aria-hidden="true">{it.icon}</div>
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
