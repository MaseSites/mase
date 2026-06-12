/* ContactSection.jsx — i18n; eigenes CSS in styles.css statt inline */

const { useState: useContactState } = React;

function ContactSection({ initialProject }) {
  const { t } = useT();
  const [form, setForm] = useContactState({
    name: "", email: "", company: "",
    projectType: initialProject || "",
    message: "", privacy: false,
  });
  const [status, setStatus] = useContactState(null);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message || !form.privacy) {
      setStatus("error");
      return;
    }
    setStatus("ok");
  };

  return (
    <section className="contact-section">
      <div className="container contact-container">
        <ScrollReveal as="h1" className="contact-title">{t("contact_title")}</ScrollReveal>
        <ScrollReveal as="p" className="lead" delay={100}>{t("contact_lead")}</ScrollReveal>

        <ScrollReveal delay={180}>
          <form onSubmit={submit} className="contact-form" noValidate>
            <label className="contact-field">
              <span>{t("contact_field_name")}</span>
              <input type="text" required value={form.name} onChange={set("name")} />
            </label>
            <label className="contact-field">
              <span>{t("contact_field_email")}</span>
              <input type="email" required value={form.email} onChange={set("email")} />
            </label>
            <label className="contact-field">
              <span>{t("contact_field_company")}</span>
              <input type="text" value={form.company} onChange={set("company")} />
            </label>
            <label className="contact-field">
              <span>{t("contact_field_project")}</span>
              <select value={form.projectType} onChange={set("projectType")}>
                <option value="">{t("contact_field_select")}</option>
                <option value="Neue Website">{t("contact_field_new")}</option>
                <option value="Überarbeitung">{t("contact_field_revision")}</option>
                <option value="KI-Assistent">{t("contact_field_ai_addon")}</option>
              </select>
            </label>
            <label className="contact-field">
              <span>{t("contact_field_message")}</span>
              <textarea rows={5} required value={form.message} onChange={set("message")} />
            </label>

            <label className="contact-privacy">
              <input
                type="checkbox"
                required
                checked={form.privacy}
                onChange={set("privacy")}
              />
              <span>
                {t("contact_privacy_prefix")}
                <a href="#">{t("contact_privacy_link")}</a>
                {t("contact_privacy_suffix")}
              </span>
            </label>

            <button type="submit" className="btn btn-primary contact-submit">
              {t("contact_submit")}
            </button>

            {status === "ok" && (
              <div role="status" className="contact-status contact-status-ok">
                {t("contact_success")}
              </div>
            )}
            {status === "error" && (
              <div role="alert" className="contact-status contact-status-error">
                {t("contact_error")}
              </div>
            )}
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}

window.ContactSection = ContactSection;
