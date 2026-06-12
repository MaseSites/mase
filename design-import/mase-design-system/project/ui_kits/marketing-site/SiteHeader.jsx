/* SiteHeader.jsx — i18n + dark/lang als kontrollierte Props */

function SiteHeader({ active = "home", onNav = () => {}, dark = false, onToggleDark = () => {} }) {
  const { t, lang, setLang } = useT();

  const links = [
    { id: "home",     label: t("nav_home")     },
    { id: "services", label: t("nav_services") },
    { id: "pricing",  label: t("nav_prices")   },
    { id: "ai",       label: t("nav_ai")       },
    { id: "about",    label: t("nav_about")    },
    { id: "contact",  label: t("nav_contact")  },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNav("home"); }}>MASE</a>

        <nav className="site-nav">
          {links.map((l) => (
            <a
              key={l.id}
              href="#"
              className={l.id === active ? "active" : ""}
              onClick={(e) => { e.preventDefault(); onNav(l.id); }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="header-controls">
          <button
            className="lang-btn"
            type="button"
            aria-label={lang === "de" ? "Switch language to English" : "Sprache auf Deutsch wechseln"}
            onClick={() => setLang(lang === "de" ? "en" : "de")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {lang.toUpperCase()}
          </button>
          <button
            type="button"
            className={`dark-toggle ${dark ? "on" : ""}`}
            aria-label={t("header_dark_label")}
            aria-pressed={dark}
            onClick={onToggleDark}
          >
            <span className="thumb" />
          </button>
          <a
            className="btn btn-primary btn-small"
            href="#"
            onClick={(e) => { e.preventDefault(); onNav("contact"); }}
          >
            {t("nav_cta_short")}
          </a>
        </div>
      </div>
    </header>
  );
}

window.SiteHeader = SiteHeader;
