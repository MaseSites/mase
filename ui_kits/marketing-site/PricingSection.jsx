/* PricingSection.jsx — modular pricing calculator (simplified) */

const { useState: usePricingState, useMemo } = React;

const BASE_OPTIONS = [
  { id: "starter",  label: "Starter",      desc: "1-3 Seiten · 1 CTA",            price: 750 },
  { id: "business", label: "Business",     desc: "5-8 Seiten · Kontaktformular",  price: 1450 },
  { id: "premium",  label: "Premium",      desc: "10+ Seiten · CMS · SEO",        price: 2500 },
];

const ADDONS = [
  { id: "ai",       label: "KI-Assistent",      desc: "Setup + 1. Monat",          price: 300 },
  { id: "seo",      label: "SEO-Optimierung",   desc: "On-Page + Audit",           price: 350 },
  { id: "copy",     label: "Copywriting",       desc: "DE / EN für alle Seiten",   price: 450 },
];

function PricingSection({ onChoose = () => {} }) {
  const [base, setBase] = usePricingState("business");
  const [addons, setAddons] = usePricingState({ ai: true, seo: false, copy: false });

  const total = useMemo(() => {
    const b = BASE_OPTIONS.find((o) => o.id === base)?.price || 0;
    const a = ADDONS.filter((o) => addons[o.id]).reduce((s, o) => s + o.price, 0);
    return b + a;
  }, [base, addons]);

  return (
    <section style={{ background: "#fff", padding: "80px 0" }}>
      <div className="container">
        <h2 className="section-title">Modular zusammenstellen</h2>
        <p className="lead process-lead">
          Wähle ein Paket und kombiniere die Bausteine. Preise in CHF, ohne MWST.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, marginTop: 24 }}>
          <div style={{ display: "grid", gap: 24 }}>
            <PricingGroup title="Basis" items={BASE_OPTIONS} kind="radio" value={base} onChange={setBase} />
            <PricingGroup
              title="Erweiterungen"
              items={ADDONS}
              kind="check"
              value={addons}
              onChange={(id) => setAddons({ ...addons, [id]: !addons[id] })}
            />
          </div>

          <aside style={{
            position: "sticky", top: 90, alignSelf: "start",
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 18, padding: 22,
            boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
          }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Dein Setup</p>
            <p className="price-big" style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 6px" }}>
              CHF <Counter value={total} duration={520} />
            </p>
            <p style={{ color: "var(--fg-3)", fontSize: ".88rem", margin: "0 0 18px" }}>
              einmaliger Setup-Preis. KI-Assistent zzgl. CHF 40 / Monat.
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onChoose({ base, addons, total })}>
              Anfrage senden
            </button>
            <p style={{ color: "var(--fg-3)", fontSize: ".82rem", margin: "12px 0 0", textAlign: "center" }}>
              Finale Offerte nach kurzem Call.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PricingGroup({ title, items, kind, value, onChange }) {
  return (
    <div>
      <h3 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", margin: "0 0 12px" }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => {
          const checked = kind === "radio" ? value === it.id : !!value[it.id];
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => kind === "radio" ? onChange(it.id) : onChange(it.id)}
              style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                textAlign: "left", padding: "14px 16px",
                border: `1px solid ${checked ? "#0f766e" : "var(--line)"}`,
                borderRadius: 14, background: checked ? "#ecfdf5" : "#fff",
                cursor: "pointer", font: "inherit", color: "var(--fg-1)",
                transition: "border-color .2s ease, background .2s ease",
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: kind === "radio" ? "50%" : 6,
                border: `2px solid ${checked ? "#0f766e" : "var(--line)"}`,
                background: checked ? "#0f766e" : "#fff",
                display: "grid", placeItems: "center",
              }}>
                {checked && <span style={{ width: 8, height: 8, background: "#fff", borderRadius: kind === "radio" ? "50%" : 1 }} />}
              </span>
              <span>
                <span style={{ display: "block", fontWeight: 700 }}>{it.label}</span>
                <span style={{ display: "block", fontSize: ".85rem", color: "var(--fg-3)" }}>{it.desc}</span>
              </span>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>
                CHF {it.price}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.PricingSection = PricingSection;
