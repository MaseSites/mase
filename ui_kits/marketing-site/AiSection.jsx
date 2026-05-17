/* AiSection.jsx — “KI-Integration” split section with chat demo + reveals */

function AiSection() {
  return (
    <section className="ai">
      <div className="container ai-grid">
        <ScrollReveal dir="left">
          <h2 className="section-title with-underline">KI-Integration · dein digitaler Mitarbeiter</h2>
          <p className="lead">
            Unser KI-Assistent arbeitet 24/7 für dich: beantwortet Kundenfragen,
            sammelt Leads und qualifiziert Anfragen.
          </p>
          <ul className="ai-list">
            <li>Automatische Kundenberatung in Echtzeit</li>
            <li>Lead-Qualifizierung mit Übergabe an dein Team</li>
            <li>Auf deine Leistungen und Tonalität trainiert</li>
          </ul>
          <div className="ai-trust-row" aria-label="KI-Nutzen">
            <span>Für KMU und Dienstleister</span>
            <span>Antworten in Sekunden</span>
            <span>Setup ab CHF 200</span>
          </div>
          <div className="button-group">
            <a className="btn btn-primary" href="#">KI-Assistent entdecken</a>
            <a className="btn btn-ghost" href="#">Kostenloses Erstgespräch</a>
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
