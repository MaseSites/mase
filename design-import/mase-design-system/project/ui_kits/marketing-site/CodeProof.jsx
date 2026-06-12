/* CodeProof.jsx — "Technische Qualität, die man sieht"
   Code-Fenster-Grafik mit Traffic-Lights + Snippet — passt zur Brand
   (echte Komponente aus production styles.css adaptiert). */

function CodeProof() {
  const { t } = useT();
  return (
    <section className="code-proof">
      <div className="container code-proof-grid">
        <ScrollReveal className="code-proof-copy">
          <h2 className="section-title with-underline">{t("codeproof_title")}</h2>
          <p className="lead">{t("codeproof_lead")}</p>
          <ul className="code-proof-points">
            <li>{t("codeproof_p1")}</li>
            <li>{t("codeproof_p2")}</li>
            <li>{t("codeproof_p3")}</li>
          </ul>
        </ScrollReveal>

        <ScrollReveal className="code-proof-panel" dir="right" delay={120}>
          <div className="code-proof-header" aria-hidden="true">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
            <p>mase-project/src/contact/submit-handler.js</p>
          </div>
          <pre className="code-proof-snippet"><code>{
`const payload = sanitizeContactForm(formData);
const validationError = validateContactPayload(payload);

if (validationError) {
  return showFormError(validationError);
}

const response = await postContactRequest(payload);
return response.ok ? showSuccess() : showFormError(response.message);`
          }</code></pre>
        </ScrollReveal>
      </div>
    </section>
  );
}

window.CodeProof = CodeProof;
