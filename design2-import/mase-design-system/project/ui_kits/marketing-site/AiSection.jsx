/* AiSection.jsx — i18n */

function AiSection() {
  const { t } = useT();
  return (
    <section className="ai">
      <div className="container ai-grid">
        <ScrollReveal dir="left">
          <h2 className="section-title with-underline">{t("ai_title")}</h2>
          <p className="lead">{t("ai_lead")}</p>
          <ul className="ai-list">
            <li>{t("ai_feature_1")}</li>
            <li>{t("ai_feature_2")}</li>
            <li>{t("ai_feature_3")}</li>
          </ul>
          <div className="ai-trust-row">
            <span>{t("ai_trust_1")}</span>
            <span>{t("ai_trust_2")}</span>
            <span>{t("ai_trust_3")}</span>
          </div>
          <div className="button-group">
            <a className="btn btn-primary" href="#">{t("ai_cta_primary")}</a>
            <a className="btn btn-ghost" href="#">{t("ai_cta_secondary")}</a>
          </div>
        </ScrollReveal>

        <ScrollReveal dir="right" delay={120}>
          <ChatWidget />
        </ScrollReveal>
      </div>
    </section>
  );
}

window.AiSection = AiSection;
