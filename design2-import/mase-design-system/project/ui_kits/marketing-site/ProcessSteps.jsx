/* ProcessSteps.jsx — i18n */

const PROCESS_ICONS = [
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="6" /><line x1="16" y1="16" x2="21" y2="21" />
  </svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M8 7h8" /><path d="M8 12h8" /><path d="M8 17h5" />
  </svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 15l8-8 5 5-8 8H4v-5z" /><path d="M14 7l3 3" />
  </svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" />
  </svg>),
  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 19c2-4 6-8 10-10 0 0 2 4 0 8-2 4-6 6-10 7z" />
    <path d="M9 15l-3 3" />
  </svg>),
];

function ProcessSteps() {
  const { t } = useT();
  const steps = [1, 2, 3, 4, 5].map((n, i) => ({
    num: "0" + n,
    title: t(`process_${n}_title`),
    desc: t(`process_${n}_desc`),
    icon: PROCESS_ICONS[i],
  }));

  return (
    <section className="process">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">{t("process_title")}</h2>
        </ScrollReveal>
        <ScrollReveal as="p" className="lead process-lead" delay={120}>
          {t("process_lead")}
        </ScrollReveal>
        <StaggerGrid className="process-grid process-grid-5">
          {steps.map((s) => (
            <div key={s.num} className="process-step">
              <div className="process-step-icon" aria-hidden="true">{s.icon}</div>
              <span className="num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </StaggerGrid>
        <ScrollReveal delay={200} style={{ marginTop: "2.5rem", textAlign: "center" }}>
          <a className="btn btn-primary" href="#">{t("process_cta")}</a>
        </ScrollReveal>
      </div>
    </section>
  );
}

window.ProcessSteps = ProcessSteps;
