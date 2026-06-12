/* PricingSection.jsx — i18n; React managed the price totally,
   counters in scroll-pack do not touch .price-big children. */

const { useState: usePricingState, useMemo } = React;

function PricingSection({ onChoose = () => {} }) {
  const { t, lang } = useT();

  const BASE_OPTIONS = [
    { id: "starter",  labelKey: "pricing_base_starter",  descKey: "pricing_base_starter_desc",  price: 750  },
    { id: "business", labelKey: "pricing_base_business", descKey: "pricing_base_business_desc", price: 1450 },
    { id: "premium",  labelKey: "pricing_base_premium",  descKey: "pricing_base_premium_desc",  price: 2500 },
  ];
  const ADDONS = [
    { id: "ai",   labelKey: "pricing_addon_ai",   descKey: "pricing_addon_ai_desc",   price: 300 },
    { id: "seo",  labelKey: "pricing_addon_seo",  descKey: "pricing_addon_seo_desc",  price: 350 },
    { id: "copy", labelKey: "pricing_addon_copy", descKey: "pricing_addon_copy_desc", price: 450 },
  ];

  const [base, setBase] = usePricingState("business");
  const [addons, setAddons] = usePricingState({ ai: true, seo: false, copy: false });

  const total = useMemo(() => {
    const b = BASE_OPTIONS.find((o) => o.id === base)?.price || 0;
    const a = ADDONS.filter((o) => addons[o.id]).reduce((s, o) => s + o.price, 0);
    return b + a;
  }, [base, addons]);

  const localeStr = lang === "de" ? "de-CH" : "en-CH";

  return (
    <section className="pricing-section">
      <div className="container">
        <ScrollReveal as="h2" className="section-title with-underline">
          {t("pricing_section_title")}
        </ScrollReveal>
        <ScrollReveal as="p" className="lead process-lead" delay={120}>
          {t("pricing_section_lead")}
        </ScrollReveal>

        <div className="pricing-grid">
          <div className="pricing-groups">
            <PricingGroup
              title={t("pricing_group_base")}
              items={BASE_OPTIONS}
              kind="radio"
              value={base}
              onChange={setBase}
              t={t}
              locale={localeStr}
            />
            <PricingGroup
              title={t("pricing_group_addons")}
              items={ADDONS}
              kind="check"
              value={addons}
              onChange={(id) => setAddons({ ...addons, [id]: !addons[id] })}
              t={t}
              locale={localeStr}
            />
          </div>

          <aside className="pricing-summary">
            <p className="eyebrow">{t("pricing_summary_eyebrow")}</p>
            <p className="price-big">
              CHF <Counter value={total} duration={520} format={(v) => Math.round(v).toLocaleString(localeStr)} />
            </p>
            <p className="pricing-summary-note">{t("pricing_summary_note")}</p>
            <button
              type="button"
              className="btn btn-primary pricing-summary-cta"
              onClick={() => onChoose({ base, addons, total })}
            >
              {t("pricing_cta_send")}
            </button>
            <p className="pricing-summary-final">{t("pricing_final_note")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PricingGroup({ title, items, kind, value, onChange, t, locale }) {
  return (
    <div className="pricing-group">
      <h3 className="pricing-group-title">{title}</h3>
      <div className="pricing-group-list">
        {items.map((it) => {
          const checked = kind === "radio" ? value === it.id : !!value[it.id];
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className={`pricing-option ${checked ? "is-selected" : ""}`}
            >
              <span className={`pricing-option-mark ${kind === "radio" ? "is-radio" : "is-check"}`}>
                {checked && <span className="pricing-option-mark-inner" />}
              </span>
              <span className="pricing-option-text">
                <span className="pricing-option-label">{t(it.labelKey)}</span>
                <span className="pricing-option-desc">{t(it.descKey)}</span>
              </span>
              <span className="pricing-option-price">CHF {it.price.toLocaleString(locale)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.PricingSection = PricingSection;
