/* PricingTeaser.jsx — CTA-only pricing strip with reveal */

function PricingTeaser() {
  return (
    <section className="pricing-teaser">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title with-underline">Transparente Preise</h2>
        </ScrollReveal>
        <ScrollReveal as="p" className="lead" delay={120}>
          Von der Überarbeitung bis zur kompletten Website — modulare Pakete ab CHF 250.
        </ScrollReveal>
        <ScrollReveal delay={220}>
          <a className="btn btn-primary" href="#">Alle Preise ansehen</a>
        </ScrollReveal>
      </div>
    </section>
  );
}

window.PricingTeaser = PricingTeaser;
