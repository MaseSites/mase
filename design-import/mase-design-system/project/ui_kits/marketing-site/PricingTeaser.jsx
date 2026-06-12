/* PricingTeaser.jsx — i18n */

function PricingTeaser() {
  const { t } = useT();
  return (
    <section className="pricing-teaser">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">{t("pricing_teaser_title")}</h2>
        </ScrollReveal>
        <ScrollReveal as="p" className="lead" delay={120}>
          {t("pricing_teaser_lead")}
        </ScrollReveal>
        <ScrollReveal delay={220}>
          <a className="btn btn-primary" href="#">{t("pricing_teaser_cta")}</a>
        </ScrollReveal>
      </div>
    </section>
  );
}

window.PricingTeaser = PricingTeaser;
