/* SiteFooter.jsx — i18n, simplified sticky CTA */

function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-brand">MASE</p>
            <p className="footer-desc">{t("footer_desc")}</p>
          </div>
          <div>
            <p className="footer-title">{t("footer_nav")}</p>
            <a href="#">{t("nav_home")}</a>
            <a href="#">{t("nav_services")}</a>
            <a href="#">{t("nav_prices")}</a>
            <a href="#">{t("nav_ai")}</a>
          </div>
          <div>
            <p className="footer-title">{t("footer_contact")}</p>
            <a href="#">{t("footer_form")}</a>
            <a href="#">{t("nav_about")}</a>
          </div>
          <div>
            <p className="footer-title">{t("footer_legal")}</p>
            <a href="#">{t("footer_impressum")}</a>
            <a href="#">{t("footer_privacy")}</a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} MASESites AG. {t("footer_copy")}
        </div>
      </div>
    </footer>
  );
}

function StickyCTA({ onClick }) {
  const { t } = useT();
  return (
    <a className="sticky-cta" href="#" onClick={(e) => { e.preventDefault(); onClick && onClick(); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      {t("sticky_cta")}
    </a>
  );
}

window.SiteFooter = SiteFooter;
window.StickyCTA = StickyCTA;
