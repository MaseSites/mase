/* ContactSection.jsx — page-hero + contact form */

const { useState: useContactState } = React;

function ContactSection({ initialProject }) {
  const [form, setForm] = useContactState({
    name: "", email: "", company: "",
    projectType: initialProject || "",
    message: "", privacy: false,
  });
  const [status, setStatus] = useContactState(null); // null | "ok" | "error"

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
    <section style={{ background: "var(--surface)", padding: "80px 0" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 700, margin: "0 0 1rem", lineHeight: 1.12 }}>
          Lass uns dein Projekt starten
        </h1>
        <p className="lead">
          Beschreibe uns kurz dein Ziel. Wir melden uns mit einer klaren Empfehlung und den nächsten Schritten.
        </p>

        <form
          onSubmit={submit}
          style={{
            display: "grid", gap: "1rem",
            background: "#fff", padding: "24px",
            border: "1px solid var(--line)", borderRadius: "18px",
            boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
            marginTop: "1.5rem",
          }}
        >
          <Field label="Name *">
            <input type="text" required value={form.name} onChange={set("name")} />
          </Field>
          <Field label="E-Mail *">
            <input type="email" required value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Firma (optional)">
            <input type="text" value={form.company} onChange={set("company")} />
          </Field>
          <Field label="Projektart">
            <select value={form.projectType} onChange={set("projectType")}>
              <option value="">Bitte wählen...</option>
              <option value="Neue Website">Neue Website</option>
              <option value="Überarbeitung">Überarbeitung</option>
              <option value="KI-Assistent">+ KI-Assistent</option>
            </select>
          </Field>
          <Field label="Nachricht *">
            <textarea rows={5} required value={form.message} onChange={set("message")} />
          </Field>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: ".92rem" }}>
            <input type="checkbox" required checked={form.privacy} onChange={set("privacy")} style={{ marginTop: 4, accentColor: "#0f766e" }} />
            <span>Ich habe die <a href="#" style={{ color: "var(--accent-strong)", textDecoration: "underline" }}>Datenschutzerklärung</a> gelesen und akzeptiere sie. *</span>
          </label>

          <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }}>
            Anfrage senden
          </button>

          {status === "ok" && (
            <div role="status" style={{
              padding: "12px 14px", borderRadius: 12,
              background: "#dcfce7", color: "#166534", fontWeight: 600, fontSize: ".9rem"
            }}>
              ✓ Danke, deine Anfrage ist eingegangen. Wir melden uns innerhalb von 24h.
            </div>
          )}
          {status === "error" && (
            <div role="alert" style={{
              padding: "12px 14px", borderRadius: 12,
              background: "#fee2e2", color: "#7f1d1d", fontWeight: 600, fontSize: ".9rem"
            }}>
              Bitte fülle die mit * markierten Felder aus.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: ".88rem", fontWeight: 600 }}>
      {label}
      <FieldStyle>{children}</FieldStyle>
    </label>
  );
}

function FieldStyle({ children }) {
  const style = {
    minHeight: 44, borderRadius: 10, border: "1px solid var(--line)",
    background: "#f9f9f9", padding: "10px 14px",
    font: "inherit", color: "var(--fg-1)", width: "100%",
  };
  return React.cloneElement(children, {
    style: { ...style, ...(children.props.style || {}) },
  });
}

window.ContactSection = ContactSection;
