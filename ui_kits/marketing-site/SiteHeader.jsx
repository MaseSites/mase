/* SiteHeader.jsx — MASE sticky header (dark state lifted to parent) */

const { useState: useHeaderState } = React;

function SiteHeader({ active = "Home", onNav = () => {}, dark = false, onToggleDark = () => {} }) {
  const [lang, setLang] = useHeaderState("DE");

  const links = [
    "Home", "Leistungen", "Preise", "KI Assistent", "Über uns", "Kontakt"
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNav("Home"); }}>MASE</a>

        <nav className="site-nav">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className={l === active ? "active" : ""}
              onClick={(e) => { e.preventDefault(); onNav(l); }}
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="header-controls">
          <button className="lang-btn" onClick={() => setLang(lang === "DE" ? "EN" : "DE")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {lang}
          </button>
          <button
            className={`dark-toggle ${dark ? "on" : ""}`}
            aria-label="Dark mode umschalten"
            aria-pressed={dark}
            onClick={onToggleDark}
          >
            <span className="thumb" />
          </button>
          <a
            className="btn btn-primary btn-small"
            href="#"
            onClick={(e) => { e.preventDefault(); onNav("Kontakt"); }}
          >
            Kostenloses Erstgespräch
          </a>
        </div>
      </div>
    </header>
  );
}

window.SiteHeader = SiteHeader;
