/* Hero.jsx — homepage hero with animated entrance + tilt benefit card */

function Hero({ onCta = () => {} }) {
  return (
    <section className="hero">
      <HeroMesh />
      <div className="container hero-grid">
        <div>
          <ScrollReveal as="p" className="eyebrow">
            Matteo &amp; Severin · MASESites AG
          </ScrollReveal>

          <h1 style={{ marginBottom: "1.25rem" }}>
            <WordReveal text="Websites, die verkaufen." baseDelay={120} step={90} />
          </h1>

          <ScrollReveal as="p" className="lead" delay={550}>
            Professionelle Weblösungen und KI-Integration für moderne Unternehmen.
          </ScrollReveal>

          <ScrollReveal className="button-group" delay={650}>
            <a className="btn btn-primary" href="#" onClick={(e) => { e.preventDefault(); onCta("project"); }}>
              Projekt starten
            </a>
            <a className="btn btn-ghost" href="#" onClick={(e) => { e.preventDefault(); onCta("pricing"); }}>
              Preise ansehen
            </a>
          </ScrollReveal>

          <ScrollReveal className="hero-badges" delay={720}>
            <span className="badge">Mobile-first</span>
            <span className="badge">SEO-optimiert</span>
            <span className="badge">KI-Integration</span>
          </ScrollReveal>
        </div>

        <ScrollReveal dir="right" delay={300} style={{ display: "flex", justifyContent: "center" }}>
          <TiltCard max={9}>
            <HeroBenefitCard onCta={() => onCta("project")} />
          </TiltCard>
        </ScrollReveal>
      </div>
    </section>
  );
}

function HeroBenefitCard({ onCta }) {
  return (
    <article className="benefit-card">
      <span className="benefit-badge">Für Unternehmen, die online Kunden gewinnen wollen</span>
      <h3 className="benefit-title">Deine Website arbeitet für dich</h3>
      <p className="benefit-subtitle">Klar aufgebaut. Schnell geladen. Auf mehr Anfragen optimiert.</p>
      <ul className="benefit-list">
        <li className="benefit-item"><span className="benefit-check">✓</span>Mehr Vertrauen bei neuen Kunden</li>
        <li className="benefit-item"><span className="benefit-check">✓</span>Mehr Anfragen über deine Website</li>
        <li className="benefit-item"><span className="benefit-check">✓</span>Modern auf jedem Gerät</li>
      </ul>
      <div className="benefit-trust">
        <span>Mobile-first</span><span>SEO-optimiert</span><span>Schnelle Ladezeit</span>
      </div>
      <div className="benefit-footer">
        <p className="benefit-price">Ab CHF 750</p>
        <a className="benefit-cta" href="#" onClick={(e) => { e.preventDefault(); onCta(); }}>
          Projekt starten
        </a>
      </div>
    </article>
  );
}

window.Hero = Hero;
window.HeroBenefitCard = HeroBenefitCard;
