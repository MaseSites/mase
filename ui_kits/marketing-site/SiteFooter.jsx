/* SiteFooter.jsx — dark footer */

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-brand">MASE</p>
            <p className="footer-desc">Professionelle Websites &amp; KI-Integration aus der Schweiz.</p>
          </div>
          <div>
            <p className="footer-title">Navigation</p>
            <a href="#">Home</a>
            <a href="#">Leistungen</a>
            <a href="#">Preise</a>
            <a href="#">KI Assistent</a>
          </div>
          <div>
            <p className="footer-title">Kontakt</p>
            <a href="#">Kontaktformular</a>
            <a href="#">Über uns</a>
          </div>
          <div>
            <p className="footer-title">Rechtliches</p>
            <a href="#">Impressum</a>
            <a href="#">Datenschutz</a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} MASESites AG. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}

function StickyCTA({ onClick }) {
  return (
    <a className="sticky-cta" href="#" onClick={(e) => { e.preventDefault(); onClick && onClick(); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      Projekt starten
    </a>
  );
}

window.SiteFooter = SiteFooter;
window.StickyCTA = StickyCTA;
