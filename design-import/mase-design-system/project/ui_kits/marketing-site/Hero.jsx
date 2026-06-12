/* Hero.jsx — i18n, dezente Reveals */

function Hero({ onCta = () => {} }) {
  const { t } = useT();
  return (
    <section className="hero">
      <HeroMesh />
      <div className="container hero-grid">
        <div>
          <ScrollReveal as="p" className="eyebrow">{t("hero_eyebrow")}</ScrollReveal>

          <ScrollReveal as="h1" delay={80} style={{ marginBottom: "1.25rem" }}>
            {t("hero_title")}
          </ScrollReveal>

          <ScrollReveal as="p" className="lead" delay={180}>{t("hero_lead")}</ScrollReveal>

          <ScrollReveal className="button-group" delay={260}>
            <a className="btn btn-primary" href="#" onClick={(e) => { e.preventDefault(); onCta("project"); }}>
              {t("hero_cta_primary")}
            </a>
            <a className="btn btn-ghost" href="#" onClick={(e) => { e.preventDefault(); onCta("pricing"); }}>
              {t("hero_cta_secondary")}
            </a>
          </ScrollReveal>

          <ScrollReveal className="hero-badges" delay={340}>
            <span className="badge">{t("badge_mobile")}</span>
            <span className="badge">{t("badge_seo")}</span>
            <span className="badge">{t("badge_ai")}</span>
          </ScrollReveal>
        </div>

        <ScrollReveal dir="right" delay={200} style={{ display: "flex", justifyContent: "center" }}>
          <TiltCard max={7}>
            <HeroBenefitCard onCta={() => onCta("project")} />
          </TiltCard>
        </ScrollReveal>
      </div>
    </section>
  );
}

function HeroBenefitCard({ onCta }) {
  const { t } = useT();
  return (
    <article className="benefit-card">
      <span className="benefit-badge">{t("benefit_badge")}</span>
      <h3 className="benefit-title">{t("benefit_title")}</h3>
      <p className="benefit-subtitle">{t("benefit_subtitle")}</p>
      <ul className="benefit-list">
        <li className="benefit-item"><span className="benefit-check">✓</span>{t("benefit_item_1")}</li>
        <li className="benefit-item"><span className="benefit-check">✓</span>{t("benefit_item_2")}</li>
        <li className="benefit-item"><span className="benefit-check">✓</span>{t("benefit_item_3")}</li>
      </ul>
      <div className="benefit-trust">
        <span>{t("benefit_trust_1")}</span>
        <span>{t("benefit_trust_2")}</span>
        <span>{t("benefit_trust_3")}</span>
      </div>
      <div className="benefit-footer">
        <p className="benefit-price">{t("benefit_price")}</p>
        <a className="benefit-cta" href="#" onClick={(e) => { e.preventDefault(); onCta(); }}>
          {t("benefit_cta")}
        </a>
      </div>
    </article>
  );
}

window.Hero = Hero;
window.HeroBenefitCard = HeroBenefitCard;
